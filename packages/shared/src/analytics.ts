import { z } from 'zod';
import { EmployeeStatus } from './employee.js';

/**
 * Analytics reuses the directory's filter vocabulary so a filter applied on
 * the dashboard means exactly what it means in the employee list.
 * Defaults to active employees only — inactive staff are not payroll spend.
 */
export const analyticsFilterSchema = z.object({
  departmentId: z.coerce.number().int().positive().optional(),
  countryCode: z.string().length(2).toUpperCase().optional(),
  status: z.nativeEnum(EmployeeStatus).default(EmployeeStatus.Active),
});

export type AnalyticsFilter = z.infer<typeof analyticsFilterSchema>;

export interface SummaryKpis {
  headcount: number;
  activeHeadcount: number;
  inactiveHeadcount: number;
  /** All figures normalised to USD minor units. */
  totalAnnualSpendUsdMinor: number;
  averageSalaryUsdMinor: number;
  medianSalaryUsdMinor: number;
  p25SalaryUsdMinor: number;
  p75SalaryUsdMinor: number;
  currencyCount: number;
  countryCount: number;
}

export interface GroupBreakdown {
  key: string;
  label: string;
  headcount: number;
  totalSpendUsdMinor: number;
  medianSalaryUsdMinor: number;
  averageSalaryUsdMinor: number;
  /** Share of total spend, 0–1. */
  spendShare: number;
}

export interface DistributionBucket {
  /** Lower bound of the bucket in USD major units. */
  lowerUsd: number;
  upperUsd: number;
  count: number;
}

export interface SalaryOutlier {
  id: number;
  employeeCode: string;
  fullName: string;
  jobTitle: string;
  department: string;
  country: string;
  salaryUsdMinor: number;
  cohortMedianUsdMinor: number;
  /** Standard deviations from the cohort mean. Negative means underpaid. */
  zScore: number;
}