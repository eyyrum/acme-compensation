import { formatCompactUsd, formatPercent, tenureYears } from './format';

describe('formatCompactUsd', () => {
  it('abbreviates millions to one decimal', () => {
    expect(formatCompactUsd(6_628_000_000)).toBe('$66.3M');
  });

  it('abbreviates thousands without decimals', () => {
    expect(formatCompactUsd(14_500_000)).toBe('$145K');
  });

  it('shows small amounts in full', () => {
    expect(formatCompactUsd(45_000)).toBe('$450');
  });

  it('handles zero without producing NaN', () => {
    expect(formatCompactUsd(0)).toBe('$0');
  });
});

describe('formatPercent', () => {
  it('renders a fraction as a percentage', () => {
    expect(formatPercent(0.3412)).toBe('34.1%');
  });
});

describe('tenureYears', () => {
  it('never returns negative years for a future hire date', () => {
    const future = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
    expect(tenureYears(future)).toBe(0);
  });
});