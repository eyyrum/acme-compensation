'use client';

import { useState, useTransition } from 'react';
import { formatMoney, formatPercent } from '@/lib/format';
import { parseSalaryInput, toInputValue, computeDelta } from '@/lib/salary-input';
import { updateSalaryAction, type SalaryActionState } from '@/app/employees/[id]/actions';
import type { Employee } from '@/lib/api';

export function SalaryEditor({ employee }: { employee: Employee }) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(() =>
    toInputValue(employee.baseSalaryMinor, employee.currencyCode),
  );
  const [state, setState] = useState<SalaryActionState>({ status: 'idle' });
  const [isPending, startTransition] = useTransition();

  const parsed = parseSalaryInput(draft, employee.currencyCode);
  const delta = parsed.ok ? computeDelta(employee.baseSalaryMinor, parsed.minor) : null;
  const canSubmit = parsed.ok && delta?.direction !== 'unchanged' && !isPending;

  function handleSubmit() {
    if (!parsed.ok) return;

    startTransition(async () => {
      const result = await updateSalaryAction(employee.id, parsed.minor);
      setState(result);
      if (result.status === 'success') setIsOpen(false);
    });
  }

  function handleCancel() {
    setDraft(toInputValue(employee.baseSalaryMinor, employee.currencyCode));
    setState({ status: 'idle' });
    setIsOpen(false);
  }

  if (!isOpen) {
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsOpen(true)}
          className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
        >
          Adjust salary
        </button>

        {state.status === 'success' && (
          <span role="status" className="text-sm text-[var(--color-positive)]">
            {state.message}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <label htmlFor="salary" className="block text-sm font-medium">
        New base salary ({employee.currencyCode})
      </label>

      <input
        id="salary"
        type="text"
        inputMode="decimal"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        autoFocus
        aria-invalid={!parsed.ok}
        aria-describedby="salary-feedback"
        className="numeric mt-2 h-10 w-56 rounded-md border border-[var(--color-border)] px-3 text-sm outline-none focus:border-[var(--color-accent)]"
      />

      <div id="salary-feedback" className="mt-3 min-h-[3rem] text-sm">
        {!parsed.ok && <p className="text-[var(--color-negative)]">{parsed.error}</p>}

        {/* Preview before commit: a raise is irreversible in this phase
            (no salary history — ADR-005), so the change is shown in full
            before the write happens. */}
        {parsed.ok && delta && delta.direction !== 'unchanged' && (
          <div className="space-y-1">
            <p>
              <span className="text-[var(--color-ink-muted)]">Change: </span>
              <span
                className={`numeric font-medium ${
                  delta.direction === 'increase'
                    ? 'text-[var(--color-positive)]'
                    : 'text-[var(--color-negative)]'
                }`}
              >
                {delta.direction === 'increase' ? '+' : ''}
                {formatMoney(delta.absoluteMinor, employee.currencyCode)}
                {' · '}
                {delta.direction === 'increase' ? '+' : ''}
                {formatPercent(delta.percent)}
              </span>
            </p>
            <p className="text-xs text-[var(--color-ink-muted)]">
              {formatMoney(employee.baseSalaryMinor, employee.currencyCode)} →{' '}
              {formatMoney(parsed.minor, employee.currencyCode)}
            </p>
          </div>
        )}

        {parsed.ok && delta?.direction === 'unchanged' && (
          <p className="text-[var(--color-ink-muted)]">No change from the current salary.</p>
        )}

        {state.status === 'error' && (
          <p role="alert" className="mt-1 text-[var(--color-negative)]">{state.message}</p>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
        >
          {isPending ? 'Saving…' : 'Save change'}
        </button>
        <button
          onClick={handleCancel}
          disabled={isPending}
          className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
