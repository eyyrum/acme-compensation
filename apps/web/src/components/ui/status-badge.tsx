export function StatusBadge({ status }: { status: 'ACTIVE' | 'INACTIVE' }) {
  const active = status === 'ACTIVE';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
        active
          ? 'bg-green-50 text-[--color-positive]'
          : 'bg-stone-100 text-[--color-ink-muted]'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-[--color-positive]' : 'bg-stone-400'}`}
        aria-hidden
      />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}