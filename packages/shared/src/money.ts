/**
 * Money is stored as an integer count of a currency's minor unit
 * (cents, paise, yen) alongside an explicit currency code. See ADR-002.
 */

/** Currencies whose minor unit is not 1/100 of the major unit. */
const MINOR_UNIT_EXPONENT: Record<string, number> = {
  JPY: 0,
  KRW: 0,
  VND: 0,
  CLP: 0,
  ISK: 0,
};

export const DEFAULT_MINOR_UNIT_EXPONENT = 2;

export function minorUnitExponent(currencyCode: string): number {
  return MINOR_UNIT_EXPONENT[currencyCode] ?? DEFAULT_MINOR_UNIT_EXPONENT;
}

/** 125000.50 USD -> 12500050 */
export function toMinorUnits(major: number, currencyCode: string): number {
  const factor = 10 ** minorUnitExponent(currencyCode);
  return Math.round(major * factor);
}

/** 12500050 USD -> 125000.50 */
export function toMajorUnits(minor: number, currencyCode: string): number {
  const factor = 10 ** minorUnitExponent(currencyCode);
  return minor / factor;
}

export interface FormatMoneyOptions {
  /** Drop decimals — the default for salary figures and dashboard KPIs. */
  compactDecimals?: boolean;
  locale?: string;
}

export function formatMoney(
  minor: number,
  currencyCode: string,
  options: FormatMoneyOptions = {},
): string {
  const { compactDecimals = true, locale = 'en-US' } = options;
  const exponent = minorUnitExponent(currencyCode);
  const digits = compactDecimals ? 0 : exponent;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(toMajorUnits(minor, currencyCode));
}

/**
 * Convert between currencies using rates expressed against a common base.
 * Rates are `1 unit of currency = rateToUsd USD`.
 */
export function convertMinor(
  minor: number,
  from: { code: string; rateToUsd: number },
  to: { code: string; rateToUsd: number },
): number {
  if (from.code === to.code) return minor;

  const majorFrom = toMajorUnits(minor, from.code);
  const majorTo = (majorFrom * from.rateToUsd) / to.rateToUsd;
  return toMinorUnits(majorTo, to.code);
}
