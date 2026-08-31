import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AnalyticsFilter } from '@acme/shared';
import { PrismaService } from '../prisma/prisma.service';

/**
 * All analytics run as Postgres aggregations. At 10,000 rows we could pull
 * everything into Node and compute in JavaScript — which is exactly why we
 * don't. percentile_cont has no ORM equivalent (ADR-003), and the cost of
 * doing this in application code grows linearly with headcount.
 */
@Injectable()
export class AnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** USD normalisation, identical to the directory's. Defined once (ADR-004). */
  private static readonly SALARY_USD = Prisma.sql`
    (e.base_salary_minor::numeric / POWER(10, cu.minor_units)) * cu.rate_to_usd * 100
  `;

  private static readonly FROM_EMPLOYEES = Prisma.sql`
    FROM employee e
    JOIN department d ON d.id = e.department_id
    JOIN country co ON co.code = e.country_code
    JOIN currency cu ON cu.code = e.currency_code
  `;

  private buildFilters(filter: AnalyticsFilter): Prisma.Sql {
    const clauses: Prisma.Sql[] = [Prisma.sql`TRUE`];

    if (filter.departmentId) {
      clauses.push(Prisma.sql`e.department_id = ${filter.departmentId}`);
    }
    if (filter.countryCode) {
      clauses.push(Prisma.sql`e.country_code = ${filter.countryCode}`);
    }
    if (filter.status) {
      clauses.push(Prisma.sql`e.status = ${filter.status}::"EmployeeStatus"`);
    }

    return Prisma.join(clauses, ' AND ');
  }

  async summary(filter: AnalyticsFilter) {
    const where = this.buildFilters(filter);

    // Headcount ignores the status filter so the active/inactive split is
    // always meaningful; spend metrics respect it.
    const statusFree = this.buildFilters({ ...filter, status: undefined as never });

    const [rows, [counts]] = await Promise.all([
      this.prisma.$queryRaw<
        Array<{
          headcount: bigint;
          total_spend: number | null;
          average: number | null;
          median: number | null;
          p25: number | null;
          p75: number | null;
          currencies: bigint;
          countries: bigint;
        }>
      >(Prisma.sql`
        SELECT
          COUNT(*)                                                     AS headcount,
          SUM(${AnalyticsRepository.SALARY_USD})                       AS total_spend,
          AVG(${AnalyticsRepository.SALARY_USD})                       AS average,
          percentile_cont(0.5) WITHIN GROUP (
            ORDER BY ${AnalyticsRepository.SALARY_USD})                AS median,
          percentile_cont(0.25) WITHIN GROUP (
            ORDER BY ${AnalyticsRepository.SALARY_USD})                AS p25,
          percentile_cont(0.75) WITHIN GROUP (
            ORDER BY ${AnalyticsRepository.SALARY_USD})                AS p75,
          COUNT(DISTINCT e.currency_code)                              AS currencies,
          COUNT(DISTINCT e.country_code)                               AS countries
        ${AnalyticsRepository.FROM_EMPLOYEES}
        WHERE ${where}
      `),
      this.prisma.$queryRaw<Array<{ active: bigint; inactive: bigint }>>(Prisma.sql`
        SELECT
          COUNT(*) FILTER (WHERE e.status = 'ACTIVE')   AS active,
          COUNT(*) FILTER (WHERE e.status = 'INACTIVE') AS inactive
        ${AnalyticsRepository.FROM_EMPLOYEES}
        WHERE ${statusFree}
      `),
    ]);

    return { metrics: rows[0], counts };
  }

  async breakdownByDepartment(filter: AnalyticsFilter) {
    return this.groupBreakdown(filter, Prisma.sql`e.department_id::text`, Prisma.sql`d.name`);
  }

  async breakdownByCountry(filter: AnalyticsFilter) {
    return this.groupBreakdown(filter, Prisma.sql`e.country_code`, Prisma.sql`co.name`);
  }

  /**
   * Shared shape for any single-dimension grouping. Key and label are SQL
   * fragments chosen by the caller from a fixed set — never from user input.
   */
  private groupBreakdown(filter: AnalyticsFilter, key: Prisma.Sql, label: Prisma.Sql) {
    const where = this.buildFilters(filter);

    return this.prisma.$queryRaw<
      Array<{
        key: string;
        label: string;
        headcount: bigint;
        total_spend: number;
        median: number;
        average: number;
      }>
    >(Prisma.sql`
      SELECT
        ${key}                                                  AS key,
        ${label}                                                AS label,
        COUNT(*)                                                AS headcount,
        SUM(${AnalyticsRepository.SALARY_USD})                  AS total_spend,
        percentile_cont(0.5) WITHIN GROUP (
          ORDER BY ${AnalyticsRepository.SALARY_USD})           AS median,
        AVG(${AnalyticsRepository.SALARY_USD})                  AS average
      ${AnalyticsRepository.FROM_EMPLOYEES}
      WHERE ${where}
      GROUP BY ${key}, ${label}
      ORDER BY total_spend DESC
    `);
  }

  /**
   * Histogram with a fixed bucket count. width_bucket assigns each salary to
   * a bucket in one pass; generate_series backfills empty buckets so the
   * chart has no gaps.
   */
  async distribution(filter: AnalyticsFilter, buckets = 12) {
    const where = this.buildFilters(filter);

    return this.prisma.$queryRaw<
      Array<{ bucket: number; lower_usd: number; upper_usd: number; count: bigint }>
    >(Prisma.sql`
      WITH salaries AS (
        SELECT ${AnalyticsRepository.SALARY_USD} / 100 AS usd
        ${AnalyticsRepository.FROM_EMPLOYEES}
        WHERE ${where}
      ),
      bounds AS (
        SELECT
          MIN(usd) AS lo,
          -- Clamp the top of the range at p99 so a handful of executive
          -- salaries don't stretch every bucket flat.
          percentile_cont(0.99) WITHIN GROUP (ORDER BY usd) AS hi
        FROM salaries
      ),
      binned AS (
        SELECT width_bucket(s.usd, b.lo, b.hi, ${buckets}) AS bucket
        FROM salaries s CROSS JOIN bounds b
      )
      SELECT
        g.bucket::int                                             AS bucket,
        (b.lo + (b.hi - b.lo) * (g.bucket - 1) / ${buckets})::float AS lower_usd,
        (b.lo + (b.hi - b.lo) * g.bucket / ${buckets})::float       AS upper_usd,
        COUNT(binned.bucket)                                      AS count
      FROM generate_series(1, ${buckets}) AS g(bucket)
      CROSS JOIN bounds b
      LEFT JOIN binned ON binned.bucket = g.bucket
      GROUP BY g.bucket, b.lo, b.hi
      ORDER BY g.bucket
    `);
  }

  /**
   * Employees more than `threshold` standard deviations from the mean of
   * their (department x country x title) cohort. This is the "where are we
   * inconsistent?" question — an engineer paid far below peers doing the
   * same job in the same market is a retention risk.
   *
   * Cohorts smaller than 5 are excluded: a z-score over 3 people is noise.
   */
  async outliers(filter: AnalyticsFilter, threshold = 2, limit = 50) {
    const where = this.buildFilters(filter);

    return this.prisma.$queryRaw<
      Array<{
        id: number;
        employee_code: string;
        full_name: string;
        job_title: string;
        department: string;
        country: string;
        salary_usd: number;
        cohort_median: number;
        z_score: number;
      }>
    >(Prisma.sql`
      WITH scoped AS (
        SELECT
          e.id,
          e.employee_code,
          e.first_name || ' ' || e.last_name AS full_name,
          e.job_title,
          d.name AS department,
          co.name AS country,
          ${AnalyticsRepository.SALARY_USD} AS salary_usd,
          e.department_id,
          e.country_code
        ${AnalyticsRepository.FROM_EMPLOYEES}
        WHERE ${where}
      ),
      cohorts AS (
        SELECT
          s.*,
          COUNT(*)      OVER w AS cohort_size,
          AVG(salary_usd) OVER w AS cohort_mean,
          STDDEV_POP(salary_usd) OVER w AS cohort_stddev,
          percentile_cont(0.5) WITHIN GROUP (ORDER BY salary_usd) OVER w AS cohort_median
        FROM scoped s
        WINDOW w AS (PARTITION BY s.department_id, s.country_code, s.job_title)
      )
      SELECT
        id, employee_code, full_name, job_title, department, country,
        salary_usd::float,
        cohort_median::float,
        ((salary_usd - cohort_mean) / NULLIF(cohort_stddev, 0))::float AS z_score
      FROM cohorts
      WHERE cohort_size >= 5
        AND cohort_stddev > 0
        AND ABS((salary_usd - cohort_mean) / NULLIF(cohort_stddev, 0)) >= ${threshold}
      ORDER BY ABS((salary_usd - cohort_mean) / NULLIF(cohort_stddev, 0)) DESC
      LIMIT ${limit}
    `);
  }
}