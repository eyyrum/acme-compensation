export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 h-6 w-40 rounded bg-stone-200" />
      <div className="mb-4 h-9 w-full rounded bg-stone-100" />
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="border-b border-[var(--color-border)] px-4 py-4 last:border-0">
            <div className="h-4 w-full rounded bg-stone-100" />
          </div>
        ))}
      </div>
    </div>
  );
}