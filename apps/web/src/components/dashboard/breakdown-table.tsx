import Link from 'next/link';
import type { GroupBreakdown } from '@acme/shared';
import { formatCompactUsd, formatMoney, formatNumber, formatPercent } from '@/lib/format';

/**
 * A table rather than a pie chart. Ten departments in a pie is unreadable,
 * and the HR manager needs the underlying numbers, not just the proportions.
 * The share bar gives the visual comparison a pie would have.
 */
export function BreakdownTable({
  rows, dimension,
}: {
  rows: GroupBreakdown[];
  dimension: 'department' | 'country';
}) {
  const maxShare = Math.max(...rows.map((r) => r.spendShare), 0.0001);

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-[var(--color-border)] text-left">
          <th scope="col" className="pb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">
            {dimension === 'department' ? 'Department' : 'Country'}
          </th>
          <th scope="col" className="pb-2 text-right text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">
            Headcount
          </th>
          <th scope="col" className="pb-2 text-right text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">
            Median
          </th>
          <th scope="col" className="pb-2 text-right text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">
            Spend
          </th>
          <th scope="col" className="w-28 pb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">
            Share
          </th>
        </tr>
      </thead>

      <tbody>
        {rows.map((row) => (
          <tr key={row.key} className="border-b border-[var(--color-border)] last:border-0">
            <td className="py-2.5">
              <Link
                href={
                  dimension === 'department'
                    ? `/employees?departmentId=${row.key}`
                    : `/employees?countryCode=${row.key}`
                }
                className="hover:text-[var(--color-accent)] hover:underline"
              >
                {row.label}
              </Link>
            </td>
            <td className="numeric py-2.5 text-right">{formatNumber(row.headcount)}</td>
            <td className="numeric py-2.5 text-right">
              {formatMoney(row.medianSalaryUsdMinor, 'USD')}
            </td>
            <td className="numeric py-2.5 text-right font-medium">
              {formatCompactUsd(row.totalSpendUsdMinor)}
            </td>
            <td className="py-2.5">
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 rounded-full bg-stone-100">
                  <div
                    className="h-1.5 rounded-full bg-[var(--color-accent)]"
                    style={{ width: `${(row.spendShare / maxShare) * 100}%` }}
                  />
                </div>
                <span className="numeric w-11 text-right text-xs text-[var(--color-ink-muted)]">
                  {formatPercent(row.spendShare, 0)}
                </span>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
