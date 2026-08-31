'use client';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-lg border border-[--color-border] bg-[--color-surface] p-8 text-center">
      <h2 className="text-sm font-semibold">Something went wrong</h2>
      <p className="mt-1 text-sm text-[--color-ink-muted]">
        The compensation service could not be reached.
      </p>
      <button
        onClick={reset}
        className="mt-4 rounded-md bg-[--color-accent] px-4 py-2 text-sm font-medium text-white"
      >
        Try again
      </button>
    </div>
  );
}