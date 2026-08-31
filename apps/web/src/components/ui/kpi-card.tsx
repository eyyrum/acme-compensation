interface KpiCardProps {
  label: string;
  value: string;
  /** Secondary context — a comparison, a share, a subcount. */
  detail?: string;
}

export function KpiCard({ label, value, detail }: KpiCardProps) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">
        {label}
      </p>
      <p className="numeric mt-2 text-2xl font-semibold">{value}</p>
      {detail && <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{detail}</p>}
    </div>
  );
}