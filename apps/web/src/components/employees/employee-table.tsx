import Link from 'next/link';
import type { EmployeeQuery, EmployeeSortField } from '@acme/shared';
import type { Employee } from '@/lib/api';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatMoney, formatDate } from '@/lib/format';
import { buildEmployeeHref } from '@/lib/search-params';

interface Column {
  key: string;
  label: string;
  sortField?: EmployeeSortField;
  align?: 'right';
}

const COLUMNS: Column[] = [
  { key: 'name', label: 'Employee', sortField: 'fullName' },
  { key: 'title', label: 'Job title', sortField: 'jobTitle' },
  { key: 'department', label: 'Department', sortField: 'department' },
  { key: 'country', label: 'Country', sortField: 'country' },
  { key: 'local', label: 'Base salary', align: 'right' },
  { key: 'usd', label: 'USD equivalent', sortField: 'salaryUsd', align: 'right' },
  { key: 'joined', label: 'Joined', sortField: 'joinedOn' },
  { key: 'status', label: 'Status' },
];

export function EmployeeTable({
  employees, query,
}: {
  employees: Employee[];
  query: EmployeeQuery;
}) {
  if (employees.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-16 text-center">
        <p className="text-sm font-medium">No employees match these filters</p>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          Try widening the search or clearing a filter.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)] text-left">
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={`px-4 py-3 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)] ${
                  col.align === 'right' ? 'text-right' : ''
                }`}
              >
                {col.sortField ? (
                  <SortLink field={col.sortField} label={col.label} query={query} />
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {employees.map((employee) => (
            <tr
              key={employee.id}
              className="border-b border-[var(--color-border)] last:border-0 hover:bg-stone-50"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/employees/${employee.id}`}
                  className="font-medium text-[var(--color-accent)] hover:underline"
                >
                  {employee.fullName}
                </Link>
                <p className="text-xs text-[var(--color-ink-muted)]">{employee.employeeCode}</p>
              </td>
              <td className="px-4 py-3">{employee.jobTitle}</td>
              <td className="px-4 py-3">{employee.department}</td>
              <td className="px-4 py-3">{employee.country}</td>
              <td className="numeric px-4 py-3 text-right">
                {formatMoney(employee.baseSalaryMinor, employee.currencyCode)}
              </td>
              <td className="numeric px-4 py-3 text-right text-[var(--color-ink-muted)]">
                {formatMoney(employee.salaryUsdMinor, 'USD')}
              </td>
              <td className="px-4 py-3 text-[var(--color-ink-muted)]">
                {formatDate(employee.joinedOn)}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={employee.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Sorting is a link, not a click handler — it keeps sort state in the URL
 * alongside the filters, so a sorted view is as shareable as a filtered one.
 */
function SortLink({
  field, label, query,
}: {
  field: EmployeeSortField;
  label: string;
  query: EmployeeQuery;
}) {
  const isActive = query.sortBy === field;
  const nextDir = isActive && query.sortDir === 'asc' ? 'desc' : 'asc';

  return (
    <Link
      href={buildEmployeeHref({ ...query, sortBy: field, sortDir: nextDir, page: 1 })}
      aria-sort={isActive ? (query.sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={`inline-flex items-center gap-1 hover:text-[var(--color-ink)] ${
        isActive ? 'text-[var(--color-ink)]' : ''
      }`}
    >
      {label}
      <span aria-hidden className={isActive ? '' : 'opacity-0'}>
        {isActive && query.sortDir === 'desc' ? '↓' : '↑'}
      </span>
    </Link>
  );
}