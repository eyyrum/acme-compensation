import { minorUnitExponent } from '@acme/shared';

/**
 * Parse a user-typed salary into minor units.
 *
 * The HR manager types "4,800,000" or "4800000.50" — major units, possibly
 * with separators. Storage is minor units. Getting this wrong by a factor of
 * 100 is a catastrophic data error, so it lives here and is tested directly.
 */
export function parseSalaryInput(
  raw: string,
  currencyCode: string,
): { ok: true; minor: number } | { ok: false; error: string } {
  const cleaned = raw.replace(/[,\s]/g, '').trim();

  if (cleaned === '') return { ok: false, error: 'Enter an amount.' };
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
    return { ok: false, error: 'Enter a valid amount, digits only.' };
  }

  const major = Number(cleaned);
  if (!Number.isFinite(major)) return { ok: false, error: 'Enter a valid amount.' };
  if (major < 0) return { ok: false, error: 'Salary cannot be negative.' };

  const exponent = minorUnitExponent(currencyCode);

  // JPY has no minor unit, so decimals are meaningless there.
  if (exponent === 0 && cleaned.includes('.')) {
    return { ok: false, error: `${currencyCode} does not use decimal places.` };
  }

  return { ok: true, minor: Math.round(major * 10 ** exponent) };
}

/** Prefill the input with the current salary in major units, unformatted. */
export function toInputValue(minor: number, currencyCode: string): string {
  const exponent = minorUnitExponent(currencyCode);
  const major = minor / 10 ** exponent;
  return exponent === 0 ? String(major) : major.toFixed(2).replace(/\.00$/, '');
}

export interface SalaryDelta {
  absoluteMinor: number;
  /** Fractional change, e.g. 0.08 for an 8% raise. */
  percent: number;
  direction: 'increase' | 'decrease' | 'unchanged';
}

export function computeDelta(currentMinor: number, nextMinor: number): SalaryDelta {
  const absoluteMinor = nextMinor - currentMinor;

  return {
    absoluteMinor,
    percent: currentMinor === 0 ? 0 : absoluteMinor / currentMinor,
    direction:
      absoluteMinor > 0 ? 'increase' : absoluteMinor < 0 ? 'decrease' : 'unchanged',
  };
}
