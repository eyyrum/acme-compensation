import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
      <h2 className="text-sm font-semibold">Employee not found</h2>
      <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
        This record may have been removed.
      </p>
      <Link href="/employees" className="mt-4 inline-block text-sm text-[var(--color-accent)] hover:underline">
        Back to employees
      </Link>
    </div>
  );
}
