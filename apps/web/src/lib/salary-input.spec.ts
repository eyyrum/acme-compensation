import { parseSalaryInput, toInputValue, computeDelta } from './salary-input';

describe('parseSalaryInput', () => {
  it('converts major units to minor units', () => {
    // The 100x error this guards against would be catastrophic in production.
    expect(parseSalaryInput('4800000', 'INR')).toEqual({ ok: true, minor: 480_000_000 });
  });

  it('accepts thousands separators as typed by a human', () => {
    expect(parseSalaryInput('4,800,000', 'INR')).toEqual({ ok: true, minor: 480_000_000 });
  });

  it('handles two decimal places without floating point drift', () => {
    expect(parseSalaryInput('125000.50', 'USD')).toEqual({ ok: true, minor: 12_500_050 });
  });

  it('treats JPY as having no minor unit', () => {
    expect(parseSalaryInput('9500000', 'JPY')).toEqual({ ok: true, minor: 9_500_000 });
  });

  it('rejects decimals for a zero-decimal currency', () => {
    const result = parseSalaryInput('9500000.50', 'JPY');
    expect(result.ok).toBe(false);
  });

  it('rejects letters and symbols', () => {
    expect(parseSalaryInput('120k', 'USD').ok).toBe(false);
    expect(parseSalaryInput('$120000', 'USD').ok).toBe(false);
  });

  it('rejects an empty input with a usable message', () => {
    const result = parseSalaryInput('  ', 'USD');
    expect(result).toEqual({ ok: false, error: 'Enter an amount.' });
  });

  it('rejects more than two decimal places', () => {
    expect(parseSalaryInput('1000.123', 'USD').ok).toBe(false);
  });
});

describe('toInputValue', () => {
  it('round-trips with parseSalaryInput', () => {
    const original = 480_000_000;
    const displayed = toInputValue(original, 'INR');
    expect(parseSalaryInput(displayed, 'INR')).toEqual({ ok: true, minor: original });
  });

  it('drops trailing zero decimals for readability', () => {
    expect(toInputValue(12_000_000, 'USD')).toBe('120000');
  });

  it('keeps meaningful decimals', () => {
    expect(toInputValue(12_500_050, 'USD')).toBe('125000.50');
  });
});

describe('computeDelta', () => {
  it('reports an increase with its percentage', () => {
    const delta = computeDelta(100_000, 108_000);
    expect(delta.direction).toBe('increase');
    expect(delta.percent).toBeCloseTo(0.08);
    expect(delta.absoluteMinor).toBe(8_000);
  });

  it('reports a decrease', () => {
    expect(computeDelta(100_000, 90_000).direction).toBe('decrease');
  });

  it('identifies no change so the save button can stay disabled', () => {
    expect(computeDelta(100_000, 100_000).direction).toBe('unchanged');
  });

  it('does not divide by zero for an unpaid record', () => {
    expect(computeDelta(0, 50_000).percent).toBe(0);
  });
});
