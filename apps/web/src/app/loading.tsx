export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 h-6 w-56 rounded bg-stone-200" />
      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-80 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]" />
        ))}
      </div>
    </div>
  );
}
