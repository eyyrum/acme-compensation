'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import type { AnalyticsFilter } from '@acme/shared';
import { buildDashboardHref } from '@/lib/analytics-params';

interface Option { value: string; label: string }

export function DashboardFilters({
  filter, departments, countries,
}: {
  filter: AnalyticsFilter;
  departments: Option[];
  countries: Option[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function apply(patch: Partial<AnalyticsFilter>) {
    startTransition(() => router.push(buildDashboardHref({ ...filter, ...patch })));
  }

  const scoped = Boolean(filter.departmentId || filter.countryCode);

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <select
        aria-label="Department"
        value={filter.departmentId ? String(filter.departmentId) : ''}
        onChange={(e) => apply({ departmentId: e.target.value ? Number(e.target.value) : undefined })}
        className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-sm"
      >
        <option value="">All departments</option>
        {departments.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
      </select>

      <select
        aria-label="Country"
        value={filter.countryCode ?? ''}
        onChange={(e) => apply({ countryCode: e.target.value || undefined })}
        className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-sm"
      >
        <option value="">All countries</option>
        {countries.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>

      <select
        aria-label="Status"
        value={filter.status}
        onChange={(e) => apply({ status: e.target.value as AnalyticsFilter['status'] })}
        className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-sm"
      >
        <option value="ACTIVE">Active employees</option>
        <option value="INACTIVE">Inactive employees</option>
      </select>

      {scoped && (
        <button
          onClick={() => startTransition(() => router.push('/'))}
          className="text-sm text-[var(--color-accent)] hover:underline"
        >
          Reset
        </button>
      )}

      <span aria-live="polite" className="ml-auto text-sm text-[var(--color-ink-muted)]">
        {isPending ? 'Updating…' : 'Figures in USD at current rates'}
      </span>
    </div>
  );
}
