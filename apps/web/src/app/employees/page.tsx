import { api } from '@/lib/api';
import { parseEmployeeQuery } from '@/lib/search-params';
import { FilterBar } from '@/components/employees/filter-bar';
import { EmployeeTable } from '@/components/employees/employee-table';
import { Pagination } from '@/components/employees/pagination';

export const dynamic = 'force-dynamic';

/**
 * Filter options come from the analytics breakdowns rather than a dedicated
 * endpoint — they already return every department and country with a label,
 * so this avoids two more routes for data we already expose.
 */
async function loadFilterOptions() {
  const [departments, countries] = await Promise.all([
    api.analytics.byDepartment({ status: undefined }),
    api.analytics.byCountry({ status: undefined }),
  ]);

  return {
    departments: departments
      .map((d) => ({ value: d.key, label: d.label }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    countries: countries
      .map((c) => ({ value: c.key, label: c.label }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  };
}

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = parseEmployeeQuery(await searchParams);

  const [page, options] = await Promise.all([
    api.employees.list(query),
    loadFilterOptions(),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Employees</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          Salaries shown in local currency with USD equivalents for comparison.
        </p>
      </div>

      <FilterBar
        query={query}
        departments={options.departments}
        countries={options.countries}
        total={page.total}
      />

      <EmployeeTable employees={page.items} query={query} />

      <Pagination
        query={query}
        page={page.page}
        totalPages={page.totalPages}
        total={page.total}
      />
    </div>
  );
}