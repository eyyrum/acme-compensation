import { employeeQuerySchema } from '@acme/shared';
import type { EmployeeQuery } from '@acme/shared';

/**
 * Next passes search params as string | string[] | undefined. Parsing them
 * through the same Zod schema the API validates against means an invalid
 * URL falls back to defaults instead of throwing, and the UI can never
 * construct a query the API would reject.
 */
export function parseEmployeeQuery(
  params: Record<string, string | string[] | undefined>,
): EmployeeQuery {
  const flat = Object.fromEntries(
    Object.entries(params).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );

  const result = employeeQuerySchema.safeParse(flat);
  return result.success ? result.data : employeeQuerySchema.parse({});
}

/** Build a URL query string, omitting defaults so links stay readable. */
export function buildEmployeeHref(query: Partial<EmployeeQuery>): string {
  const search = new URLSearchParams();

  if (query.page && query.page > 1) search.set('page', String(query.page));
  if (query.pageSize && query.pageSize !== 25) search.set('pageSize', String(query.pageSize));
  if (query.search) search.set('search', query.search);
  if (query.departmentId) search.set('departmentId', String(query.departmentId));
  if (query.countryCode) search.set('countryCode', query.countryCode);
  if (query.status) search.set('status', query.status);
  if (query.sortBy && query.sortBy !== 'fullName') search.set('sortBy', query.sortBy);
  if (query.sortDir && query.sortDir !== 'asc') search.set('sortDir', query.sortDir);

  const qs = search.toString();
  return qs ? `/employees?${qs}` : '/employees';
}