import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { EmployeeQuery, EmployeeSortField } from '@acme/shared';
import { PrismaService } from '../prisma/prisma.service';

export interface EmployeeRow {
  id: number;
  employeeCode: string;
  fullName: string;
  email: string;
  jobTitle: string;
  status: 'ACTIVE' | 'INACTIVE';
  joinedOn: Date;
  department: string;
  departmentId: number;
  country: string;
  countryCode: string;
  baseSalaryMinor: bigint;
  currencyCode: string;
  salaryUsdMinor: bigint;
}

/**
 * Whitelist mapping sort keys to SQL expressions.
 *
 * Sort direction and column cannot be parameterised in Postgres, so they are
 * interpolated. Safety comes from the enum in the shared schema plus this
 * lookup: a value that is not a known key never reaches the query.
 */
const SORT_COLUMNS: Record<EmployeeSortField, string> = {
  fullName: 'e.last_name, e.first_name',
  department: 'd.name',
  country: 'co.name',
  jobTitle: 'e.job_title',
  salaryUsd: '"salaryUsdMinor"',
  joinedOn: 'e.joined_on',
};

@Injectable()
export class EmployeesRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Local salary normalised to USD minor units, using the current rate table.
   * Defined once because the directory and the dashboard must never disagree
   * about what an employee costs. See ADR-004.
   */
  private static readonly SALARY_USD = Prisma.sql`
    ROUND(
      (e.base_salary_minor::numeric / POWER(10, cu.minor_units))
      * cu.rate_to_usd * 100
    )::bigint
  `;

  /** Filter predicates shared by the page query and its count. */
  private buildFilters(query: EmployeeQuery): Prisma.Sql {
    const clauses: Prisma.Sql[] = [Prisma.sql`TRUE`];

    if (query.search) {
      // Trigram-friendly: matches across name, code, title, and email.
      const term = `%${query.search}%`;
      clauses.push(Prisma.sql`(
        e.first_name ILIKE ${term}
        OR e.last_name ILIKE ${term}
        OR (e.first_name || ' ' || e.last_name) ILIKE ${term}
        OR e.employee_code ILIKE ${term}
        OR e.job_title ILIKE ${term}
        OR e.email ILIKE ${term}
      )`);
    }

    if (query.departmentId) {
      clauses.push(Prisma.sql`e.department_id = ${query.departmentId}`);
    }
    if (query.countryCode) {
      clauses.push(Prisma.sql`e.country_code = ${query.countryCode}`);
    }
    if (query.status) {
      clauses.push(Prisma.sql`e.status = ${query.status}::"EmployeeStatus"`);
    }

    return Prisma.join(clauses, ' AND ');
  }

  async findPage(query: EmployeeQuery): Promise<{ rows: EmployeeRow[]; total: number }> {
    const where = this.buildFilters(query);
    const orderBy = Prisma.raw(`${SORT_COLUMNS[query.sortBy]} ${query.sortDir.toUpperCase()}`);
    const offset = (query.page - 1) * query.pageSize;

    const rows = await this.prisma.$queryRaw<EmployeeRow[]>(Prisma.sql`
      SELECT
        e.id,
        e.employee_code                       AS "employeeCode",
        e.first_name || ' ' || e.last_name    AS "fullName",
        e.email,
        e.job_title                           AS "jobTitle",
        e.status,
        e.joined_on                           AS "joinedOn",
        d.name                                AS department,
        e.department_id                       AS "departmentId",
        co.name                               AS country,
        e.country_code                        AS "countryCode",
        e.base_salary_minor                   AS "baseSalaryMinor",
        e.currency_code                       AS "currencyCode",
        ${EmployeesRepository.SALARY_USD}     AS "salaryUsdMinor"
      FROM employee e
      JOIN department d  ON d.id   = e.department_id
      JOIN country co    ON co.code = e.country_code
      JOIN currency cu   ON cu.code = e.currency_code
      WHERE ${where}
      ORDER BY ${orderBy}, e.id ASC
      LIMIT ${query.pageSize} OFFSET ${offset}
    `);

    const [{ count }] = await this.prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
      SELECT COUNT(*) AS count
      FROM employee e
      WHERE ${where}
    `);

    return { rows, total: Number(count) };
  }

  async findById(id: number): Promise<EmployeeRow | null> {
    const rows = await this.prisma.$queryRaw<EmployeeRow[]>(Prisma.sql`
      SELECT
        e.id,
        e.employee_code                       AS "employeeCode",
        e.first_name || ' ' || e.last_name    AS "fullName",
        e.email,
        e.job_title                           AS "jobTitle",
        e.status,
        e.joined_on                           AS "joinedOn",
        d.name                                AS department,
        e.department_id                       AS "departmentId",
        co.name                               AS country,
        e.country_code                        AS "countryCode",
        e.base_salary_minor                   AS "baseSalaryMinor",
        e.currency_code                       AS "currencyCode",
        ${EmployeesRepository.SALARY_USD}     AS "salaryUsdMinor"
      FROM employee e
      JOIN department d  ON d.id   = e.department_id
      JOIN country co    ON co.code = e.country_code
      JOIN currency cu   ON cu.code = e.currency_code
      WHERE e.id = ${id}
    `);

    return rows[0] ?? null;
  }

  async updateSalary(id: number, baseSalaryMinor: bigint): Promise<void> {
    await this.prisma.employee.update({
      where: { id },
      data: { baseSalaryMinor },
    });
  }
}