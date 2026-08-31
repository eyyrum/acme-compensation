import { Injectable } from '@nestjs/common';
import type {
  AnalyticsFilter,
  SummaryKpis,
  GroupBreakdown,
  DistributionBucket,
  SalaryOutlier,
} from '@acme/shared';
import { AnalyticsRepository } from './analytics.repository';

/** Postgres returns numeric aggregates as strings or nulls; normalise once. */
const num = (value: unknown): number => (value == null ? 0 : Math.round(Number(value)));

@Injectable()
export class AnalyticsService {
  constructor(private readonly repository: AnalyticsRepository) {}

  async summary(filter: AnalyticsFilter): Promise<SummaryKpis> {
    const { metrics, counts } = await this.repository.summary(filter);

    return {
      headcount: Number(metrics.headcount),
      activeHeadcount: Number(counts.active),
      inactiveHeadcount: Number(counts.inactive),
      totalAnnualSpendUsdMinor: num(metrics.total_spend),
      averageSalaryUsdMinor: num(metrics.average),
      medianSalaryUsdMinor: num(metrics.median),
      p25SalaryUsdMinor: num(metrics.p25),
      p75SalaryUsdMinor: num(metrics.p75),
      currencyCount: Number(metrics.currencies),
      countryCount: Number(metrics.countries),
    };
  }

  async byDepartment(filter: AnalyticsFilter): Promise<GroupBreakdown[]> {
    return this.toBreakdown(await this.repository.breakdownByDepartment(filter));
  }

  async byCountry(filter: AnalyticsFilter): Promise<GroupBreakdown[]> {
    return this.toBreakdown(await this.repository.breakdownByCountry(filter));
  }

  async distribution(filter: AnalyticsFilter): Promise<DistributionBucket[]> {
    const rows = await this.repository.distribution(filter);

    return rows.map((r) => ({
      lowerUsd: Math.round(Number(r.lower_usd)),
      upperUsd: Math.round(Number(r.upper_usd)),
      count: Number(r.count),
    }));
  }

  async outliers(filter: AnalyticsFilter): Promise<SalaryOutlier[]> {
    const rows = await this.repository.outliers(filter);

    return rows.map((r) => ({
      id: r.id,
      employeeCode: r.employee_code,
      fullName: r.full_name,
      jobTitle: r.job_title,
      department: r.department,
      country: r.country,
      salaryUsdMinor: num(r.salary_usd),
      cohortMedianUsdMinor: num(r.cohort_median),
      zScore: Number(Number(r.z_score).toFixed(2)),
    }));
  }

  /** Spend share is computed here rather than in SQL to avoid a second pass. */
  private toBreakdown(
    rows: Array<{ key: string; label: string; headcount: bigint; total_spend: number; median: number; average: number }>,
  ): GroupBreakdown[] {
    const totalSpend = rows.reduce((sum, r) => sum + Number(r.total_spend ?? 0), 0);

    return rows.map((r) => ({
      key: r.key,
      label: r.label,
      headcount: Number(r.headcount),
      totalSpendUsdMinor: num(r.total_spend),
      medianSalaryUsdMinor: num(r.median),
      averageSalaryUsdMinor: num(r.average),
      spendShare: totalSpend > 0 ? Number(r.total_spend ?? 0) / totalSpend : 0,
    }));
  }
}