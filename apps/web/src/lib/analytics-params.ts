import { analyticsFilterSchema } from '@acme/shared';
import type { AnalyticsFilter } from '@acme/shared';

export function parseAnalyticsFilter(
  params: Record<string, string | string[] | undefined>,
): AnalyticsFilter {
  const flat = Object.fromEntries(
    Object.entries(params).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );

  const result = analyticsFilterSchema.safeParse(flat);
  return result.success ? result.data : analyticsFilterSchema.parse({});
}

export function buildDashboardHref(filter: Partial<AnalyticsFilter>): string {
  const search = new URLSearchParams();

  if (filter.departmentId) search.set('departmentId', String(filter.departmentId));
  if (filter.countryCode) search.set('countryCode', filter.countryCode);
  // ACTIVE is the default — omitted to keep shared links short.
  if (filter.status && filter.status !== 'ACTIVE') search.set('status', filter.status);

  const qs = search.toString();
  return qs ? `/?${qs}` : '/';
}
