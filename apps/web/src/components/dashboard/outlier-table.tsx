import Link from 'next/link';
import type { SalaryOutlier } from '@acme/shared';
import { formatMoney } from '@/lib/format';

/**
 * Pay inconsistency within a (department x country x job title) cohort.
 * Underpayment is the actionable signal — someone paid well below peers
 * doing the same job in the same market is a retention risk.
 */
export function OutlierTable({ outliers }: { outliers: SalaryOutlier[] }) {
  if (outliers.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-[var(--color-ink-muted)]">
        No employees fall more than two standard deviations from their peer group.
      </p>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-[var(--color-border)] text-left">
          <th scope="col" className="pb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">Employee</th>
          <th scope="col" className="pb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">Peer group</th>
          <th scope="col" className="pb-2 text-right text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">Salary</th>
          <th scope="col" className="pb-2 text-right text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">Peer median</th>
          <th scope="col" className="pb-2 text-right text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">Deviation</th>
        </tr>
      </thead>

      <tbody>
        {outliers.slice(0, 10).map((o) => {
          const underpaid = o.zScore < 0;

          return (
            <tr key={o.id} className="border-b border-[var(--color-border)] last:border-0">
              <td className="py-2.5">
                <Link href={`/employees/${o.id}`} className="text-[var(--color-accent)] hover:underline">
                  {o.fullName}
                </Link>
                <p className="text-xs text-[var(--color-ink-muted)]">{o.jobTitle}</p>
              </td>
              <td className="py-2.5 text-xs text-[var(--color-ink-muted)]">
                {o.department} · {o.country}
              </td>
              <td className="numeric py-2.5 text-right">
                {formatMoney(o.salaryUsdMinor, 'USD')}
              </td>
              <td className="numeric py-2.5 text-right text-[var(--color-ink-muted)]">
                {formatMoney(o.cohortMedianUsdMinor, 'USD')}
              </td>
              <td className="numeric py-2.5 text-right">
                <span className={underpaid ? 'text-[var(--color-warning)]' : 'text-[var(--color-ink-muted)]'}>
                  {o.zScore > 0 ? '+' : ''}{o.zScore.toFixed(1)}σ
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
