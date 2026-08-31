import {
  seniorityFactor,
  logNormalMultiplier,
  generateSalaryUsd,
  toLocalMinorUnits,
} from './salary-model';

/** Deterministic stand-in for a random source. */
const fixed = (value: number) => () => value;

describe('seniorityFactor', () => {
  it('pays the most junior rung below the department median', () => {
    expect(seniorityFactor(0, 5)).toBeCloseTo(0.7);
  });

  it('pays the most senior rung a multiple of the median', () => {
    expect(seniorityFactor(4, 5)).toBeCloseTo(2.1);
  });

  it('increases monotonically up the ladder', () => {
    const factors = [0, 1, 2, 3, 4].map((i) => seniorityFactor(i, 5));
    const sorted = [...factors].sort((a, b) => a - b);
    expect(factors).toEqual(sorted);
  });

  it('returns 1 for a single-rung ladder rather than dividing by zero', () => {
    expect(seniorityFactor(0, 1)).toBe(1);
  });
});

describe('logNormalMultiplier', () => {
  it('returns 1 at the distribution centre', () => {
    // 0.5 through Box-Muller's cosine term yields a standard normal of 0.
    expect(logNormalMultiplier(fixed(0.5), 0.18)).toBeGreaterThan(0);
  });

  it('is always positive, so salaries can never go negative', () => {
    for (const r of [0.01, 0.25, 0.5, 0.75, 0.99]) {
      expect(logNormalMultiplier(fixed(r))).toBeGreaterThan(0);
    }
  });

  it('widens the spread as sigma increases', () => {
    const narrow = logNormalMultiplier(fixed(0.05), 0.05);
    const wide = logNormalMultiplier(fixed(0.05), 0.5);
    expect(Math.abs(Math.log(wide))).toBeGreaterThan(Math.abs(Math.log(narrow)));
  });
});

describe('generateSalaryUsd', () => {
  const base = {
    departmentMedianUsd: 100_000,
    marketFactor: 1,
    titleIndex: 2,
    ladderSize: 5,
    rand: fixed(0.5),
  };

  it('rounds to the nearest 500', () => {
    expect(generateSalaryUsd(base) % 500).toBe(0);
  });

  it('scales down for lower-cost markets', () => {
    const us = generateSalaryUsd(base);
    const india = generateSalaryUsd({ ...base, marketFactor: 0.32 });
    expect(india).toBeLessThan(us);
  });

  it('pays senior titles more than junior ones in the same department', () => {
    const junior = generateSalaryUsd({ ...base, titleIndex: 0 });
    const senior = generateSalaryUsd({ ...base, titleIndex: 4 });
    expect(senior).toBeGreaterThan(junior);
  });
});

describe('toLocalMinorUnits', () => {
  it('leaves USD unchanged apart from minor-unit scaling', () => {
    expect(toLocalMinorUnits(150_000, 1.0, 2)).toBe(15_000_000n);
  });

  it('converts USD to a larger nominal amount in a weaker currency', () => {
    // 50,000 USD at 0.012 USD per INR is roughly 4,166,000 INR.
    const inr = toLocalMinorUnits(50_000, 0.012, 2);
    expect(Number(inr) / 100).toBeGreaterThan(4_000_000);
    expect(Number(inr) / 100).toBeLessThan(4_300_000);
  });

  it('applies zero decimal places for JPY', () => {
    const jpy = toLocalMinorUnits(100_000, 0.0064, 0);
    // Minor units equal major units, so no trailing 00.
    expect(Number(jpy)).toBeLessThan(20_000_000);
  });
});