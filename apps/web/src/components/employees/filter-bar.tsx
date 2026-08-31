'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import type { EmployeeQuery } from '@acme/shared';
import { buildEmployeeHref } from '@/lib/search-params';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  query: EmployeeQuery;
  departments: FilterOption[];
  countries: FilterOption[];
  total: number;
}

export function FilterBar({ query, departments, countries, total }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchDraft, setSearchDraft] = useState(query.search ?? '');

  /** Any filter change resets to page 1 — page 7 of the old result set is meaningless. */
  function applyFilter(patch: Partial<EmployeeQuery>) {
    startTransition(() => {
      router.push(buildEmployeeHref({ ...query, ...patch, page: 1 }));
    });
  }

  // Debounce search so typing doesn't fire a request per keystroke.
  useEffect(() => {
    if (searchDraft === (query.search ?? '')) return;

    const timer = setTimeout(() => {
      applyFilter({ search: searchDraft || undefined });
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft]);

  // Keep the input in sync when navigation changes the URL (back button, reset).
  useEffect(() => {
    setSearchDraft(searchParams.get('search') ?? '');
  }, [searchParams]);

  const hasFilters = Boolean(
    query.search || query.departmentId || query.countryCode || query.status,
  );

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <input
        type="search"
        value={searchDraft}
        onChange={(e) => setSearchDraft(e.target.value)}
        placeholder="Search name, code, or title"
        aria-label="Search employees"
        className="h-9 w-72 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm outline-none focus:border-[var(--color-accent)]"
      />

      <Select
        label="Department"
        value={query.departmentId ? String(query.departmentId) : ''}
        options={departments}
        placeholder="All departments"
        onChange={(v) => applyFilter({ departmentId: v ? Number(v) : undefined })}
      />

      <Select
        label="Country"
        value={query.countryCode ?? ''}
        options={countries}
        placeholder="All countries"
        onChange={(v) => applyFilter({ countryCode: v || undefined })}
      />

      <Select
        label="Status"
        value={query.status ?? ''}
        options={[
          { value: 'ACTIVE', label: 'Active' },
          { value: 'INACTIVE', label: 'Inactive' },
        ]}
        placeholder="Any status"
        onChange={(v) => applyFilter({ status: (v || undefined) as EmployeeQuery['status'] })}
      />

      {hasFilters && (
        <button
          onClick={() => startTransition(() => router.push('/employees'))}
          className="text-sm text-[var(--color-accent)] hover:underline"
        >
          Clear
        </button>
      )}

      <p
        className="ml-auto text-sm text-[var(--color-ink-muted)]"
        aria-live="polite"
      >
        {isPending ? 'Loading…' : `${total.toLocaleString()} employees`}
      </p>
    </div>
  );
}

function Select({
  label, value, options, placeholder, onChange,
}: {
  label: string;
  value: string;
  options: FilterOption[];
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-sm outline-none focus:border-[var(--color-accent)]"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}