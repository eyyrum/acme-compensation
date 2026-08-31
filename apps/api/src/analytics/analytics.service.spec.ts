import { AnalyticsService } from './analytics.service';

function makeService(overrides: Record<string, jest.Mock> = {}) {
  const repository = {
    summary: jest.fn(),
    breakdownByDepartment: jest.fn(),
    breakdownByCountry: jest.fn(),
    distribution: jest.fn(),
    outliers: jest.fn(),
    ...overrides,
  };
  return { service: new AnalyticsService(repository as never), repository };
}

describe('AnalyticsService.summary', () => {
  it('coerces Postgres numeric strings and bigints to numbers', async () => {
    const { service } = makeService({
      summary: jest.fn().mockResolvedValue({
        metrics: {
          headcount: 9302n,
          total_spend: '66280000000.4',
          average: '7125000.9',
          median: '5850000.2',
          p25: '3100000',
          p75: '11400000',
          currencies: 10n,
          countries: 10n,
        },
        counts: { active: 9302n, inactive: 698n },
      }),
    });

    const result = await service.summary({ status: 'ACTIVE' } as never);

    expect(result.headcount).toBe(9302);
    expect(result.totalAnnualSpendUsdMinor).toBe(66_280_000_000);
    expect(result.medianSalaryUsdMinor).toBe(5_850_000);
    expect(result.inactiveHeadcount).toBe(698);
  });

  it('returns zeros rather than NaN when the filter matches nobody', async () => {
    const { service } = makeService({
      summary: jest.fn().mockResolvedValue({
        metrics: {
          headcount: 0n, total_spend: null, average: null, median: null,
          p25: null, p75: null, currencies: 0n, countries: 0n,
        },
        counts: { active: 0n, inactive: 0n },
      }),
    });

    const result = await service.summary({ status: 'ACTIVE' } as never);

    expect(result.medianSalaryUsdMinor).toBe(0);
    expect(result.totalAnnualSpendUsdMinor).toBe(0);
  });
});

describe('AnalyticsService breakdowns', () => {
  const rows = [
    { key: '1', label: 'Engineering', headcount: 3400n, total_spend: 6000, median: 1500, average: 1600 },
    { key: '2', label: 'Sales', headcount: 1600n, total_spend: 3000, median: 1200, average: 1300 },
    { key: '3', label: 'Design', headcount: 300n, total_spend: 1000, median: 1100, average: 1150 },
  ];

  it('computes spend share against the filtered total, summing to 1', async () => {
    const { service } = makeService({
      breakdownByDepartment: jest.fn().mockResolvedValue(rows),
    });

    const result = await service.byDepartment({} as never);
    const shares = result.map((r) => r.spendShare);

    expect(shares[0]).toBeCloseTo(0.6);
    expect(shares.reduce((a, b) => a + b, 0)).toBeCloseTo(1);
  });

  it('avoids dividing by zero when total spend is zero', async () => {
    const { service } = makeService({
      breakdownByCountry: jest.fn().mockResolvedValue([
        { key: 'US', label: 'United States', headcount: 0n, total_spend: 0, median: 0, average: 0 },
      ]),
    });

    const result = await service.byCountry({} as never);
    expect(result[0].spendShare).toBe(0);
  });
});

describe('AnalyticsService.outliers', () => {
  it('rounds z-scores to two decimals and preserves sign for underpayment', async () => {
    const { service } = makeService({
      outliers: jest.fn().mockResolvedValue([
        {
          id: 42, employee_code: 'ACME-000042', full_name: 'Rin Tanaka',
          job_title: 'Senior Software Engineer', department: 'Engineering',
          country: 'Japan', salary_usd: 4_200_000, cohort_median: 9_000_000,
          z_score: -2.4471,
        },
      ]),
    });

    const [outlier] = await service.outliers({} as never);

    expect(outlier.zScore).toBe(-2.45);
    expect(outlier.salaryUsdMinor).toBeLessThan(outlier.cohortMedianUsdMinor);
  });
});