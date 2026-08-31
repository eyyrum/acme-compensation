import { formatMoney, toMajorUnits } from '@acme/shared';

export { formatMoney };

/**
 * Large USD figures are unreadable in full on a KPI card. $66,280,000
 * becomes $66.3M, which is what an HR manager actually reads off a dashboard.
 */
export function formatCompactUsd(minor: number): string {
  const major = toMajorUnits(minor, 'USD');

  if (Math.abs(major) >= 1_000_000_000) return `$${(major / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(major) >= 1_000_000) return `$${(major / 1_000_000).toFixed(1)}M`;
  if (Math.abs(major) >= 1_000) return `$${Math.round(major / 1_000)}K`;
  return `$${Math.round(major)}`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatPercent(fraction: number, digits = 1): string {
  return `${(fraction * 100).toFixed(digits)}%`;
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC',
  });
}

/** Years of service, for the directory and detail views. */
export function tenureYears(joinedOn: string): number {
  const joined = new Date(`${joinedOn}T00:00:00Z`).getTime();
  return Math.max(0, (Date.now() - joined) / (365.25 * 24 * 60 * 60 * 1000));
}