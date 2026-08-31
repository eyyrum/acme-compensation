import type {
  EmployeeQuery, Paginated, AnalyticsFilter,
  SummaryKpis, GroupBreakdown, DistributionBucket, SalaryOutlier,
} from '@acme/shared';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export interface Employee {
  id: number;
  employeeCode: string;
  fullName: string;
  email: string;
  jobTitle: string;
  status: 'ACTIVE' | 'INACTIVE';
  joinedOn: string;
  department: string;
  departmentId: number;
  country: string;
  countryCode: string;
  baseSalaryMinor: number;
  currencyCode: string;
  salaryUsdMinor: number;
}

export class ApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Undefined values are dropped rather than serialised as "undefined",
 * so an unset filter is absent from the URL rather than a literal string.
 */
function toQueryString(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

async function get<T>(path: string, params: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}${toQueryString(params)}`, {
    // Salary data changes on write, not on a timer. Revalidation is handled
    // explicitly after a mutation rather than by polling.
    cache: 'no-store',
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => ({ message: response.statusText }));
    throw new ApiError(response.status, detail.message ?? 'Request failed');
  }

  return response.json() as Promise<T>;
}

export const api = {
  employees: {
    list: (query: Partial<EmployeeQuery>) =>
      get<Paginated<Employee>>('/employees', query),
    getById: (id: number) => get<Employee>(`/employees/${id}`),

    async updateSalary(id: number, baseSalaryMinor: number): Promise<Employee> {
      const response = await fetch(`${BASE_URL}/employees/${id}/salary`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseSalaryMinor }),
      });

      if (!response.ok) {
        const detail = await response.json().catch(() => ({ message: response.statusText }));
        throw new ApiError(response.status, detail.message ?? 'Update failed');
      }

      return response.json();
    },
  },

  analytics: {
    summary: (f: Partial<AnalyticsFilter>) => get<SummaryKpis>('/analytics/summary', f),
    byDepartment: (f: Partial<AnalyticsFilter>) => get<GroupBreakdown[]>('/analytics/by-department', f),
    byCountry: (f: Partial<AnalyticsFilter>) => get<GroupBreakdown[]>('/analytics/by-country', f),
    distribution: (f: Partial<AnalyticsFilter>) => get<DistributionBucket[]>('/analytics/distribution', f),
    outliers: (f: Partial<AnalyticsFilter>) => get<SalaryOutlier[]>('/analytics/outliers', f),
  },
};