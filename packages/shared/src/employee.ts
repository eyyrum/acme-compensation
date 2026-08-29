import { z } from 'zod';

export const EmployeeStatus = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
} as const;
export type EmployeeStatus = (typeof EmployeeStatus)[keyof typeof EmployeeStatus];

export const REPORTING_CURRENCY = 'USD';

export const employeeSortFields = [
  'fullName',
  'department',
  'country',
  'jobTitle',
  'salaryUsd',
  'joinedOn',
] as const;
export type EmployeeSortField = (typeof employeeSortFields)[number];

/**
 * Query contract for the directory. Shared so the API's validation pipe and
 * the web app's filter state cannot drift apart.
 */
export const employeeQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().max(120).optional(),
  departmentId: z.coerce.number().int().positive().optional(),
  countryCode: z.string().length(2).toUpperCase().optional(),
  status: z.nativeEnum(EmployeeStatus).optional(),
  sortBy: z.enum(employeeSortFields).default('fullName'),
  sortDir: z.enum(['asc', 'desc']).default('asc'),
});

export type EmployeeQuery = z.infer<typeof employeeQuerySchema>;

export const updateSalarySchema = z.object({
  /** Minor units, in the employee's existing currency. See ADR-002. */
  baseSalaryMinor: z.number().int().nonnegative().max(1_000_000_000_00),
});

export type UpdateSalaryInput = z.infer<typeof updateSalarySchema>;

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
