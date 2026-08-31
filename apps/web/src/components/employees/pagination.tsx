import Link from 'next/link';
import type { EmployeeQuery } from '@acme/shared';
import { buildEmployeeHref } from '@/lib/search-params';

interface PaginationProps {
  query: EmployeeQuery;
  page: number;
  totalPages: number;
  total: number;
}

export function Pagination({ query, page, totalPages, total }: PaginationProps) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * query.pageSize + 1;
  const to = Math.min(page * query.pageSize, total);

  return (
    <nav
      aria-label="Pagination"
      className="mt-4 flex items-center justify-between text-sm"
    >
      <p className="text-[var(--color-ink-muted)]">
        Showing <span className="numeric">{from.toLocaleString()}</span>–
        <span className="numeric">{to.toLocaleString()}</span> of{' '}
        <span className="numeric">{total.toLocaleString()}</span>
      </p>

      <div className="flex items-center gap-2">
        <PageLink query={query} page={page - 1} disabled={page === 1}>
          Previous
        </PageLink>

        <span className="numeric px-2 text-[var(--color-ink-muted)]">
          Page {page} of {totalPages.toLocaleString()}
        </span>

        <PageLink query={query} page={page + 1} disabled={page === totalPages}>
          Next
        </PageLink>
      </div>
    </nav>
  );
}

function PageLink({
  query, page, disabled, children,
}: {
  query: EmployeeQuery;
  page: number;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-[var(--color-ink-muted)] opacity-50">
        {children}
      </span>
    );
  }

  return (
    <Link
      href={buildEmployeeHref({ ...query, page })}
      className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
    >
      {children}
    </Link>
  );
}