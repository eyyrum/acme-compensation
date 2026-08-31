import { api } from '@/lib/api';
import { parseAnalyticsFilter } from '@/lib/analytics-params';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { KpiCard } from '@/components/ui/kpi-card';
import { DashboardFilters } from '@/components/dashboard/dashboard-filters';
import { DistributionChart } from '@/components/dashboard/distribution-chart';
import { BreakdownTable } from '@/components/dashboard/breakdown-table';
import { OutlierTable } from '@/components/dashboard/outlier-table';
import { formatCompactUsd, formatMoney, formatNumber } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filter = parseAnalyticsFilter(await searchParams);

  // Parallel, not sequential — five round trips in series would be a
  // visible waterfall on first paint.
  const [summary, byDepartment, byCountry, distribution, outliers] = await Promise.all([
    api.analytics.summary(filter),
    api.analytics.byDepartment(filter),
    api.analytics.byCountry(filter),
    api.analytics.distribution(filter),
    api.analytics.outliers(filter),
  ]);

  const departmentOptions = byDepartment
    .map((d) => ({ value: d.key, label: d.label }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const countryOptions = byCountry
    .map((c) => ({ value: c.key, label: c.label }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Compensation overview</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          {formatNumber(summary.headcount)} employees across {summary.countryCount} countries
          and {summary.currencyCount} currencies, normalised to USD.
        </p>
      </div>

      <DashboardFilters
        filter={filter}
        departments={departmentOptions}
        countries={countryOptions}
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Annual payroll"
          value={formatCompactUsd(summary.totalAnnualSpendUsdMinor)}
          detail="Total base salary, annualised"
        />
        <KpiCard
          label="Headcount"
          value={formatNumber(summary.headcount)}
          detail={`${formatNumber(summary.activeHeadcount)} active · ${formatNumber(summary.inactiveHeadcount)} inactive`}
        />
        <KpiCard
          label="Median salary"
          value={formatMoney(summary.medianSalaryUsdMinor, 'USD')}
          detail={`Average ${formatMoney(summary.averageSalaryUsdMinor, 'USD')}`}
        />
        <KpiCard
          label="Middle 50%"
          value={`${formatCompactUsd(summary.p25SalaryUsdMinor)} – ${formatCompactUsd(summary.p75SalaryUsdMinor)}`}
          detail="25th to 75th percentile"
        />
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Salary distribution"
            description="How pay is spread across the organisation"
          />
          <CardBody>
            <DistributionChart buckets={distribution} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="By country"
            description="Where the payroll budget goes"
          />
          <CardBody>
            <BreakdownTable rows={byCountry} dimension="country" />
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="By department"
            description="Headcount and spend per team"
          />
          <CardBody>
            <BreakdownTable rows={byDepartment} dimension="department" />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Pay inconsistencies"
            description="More than two standard deviations from their peer group"
          />
          <CardBody>
            <OutlierTable outliers={outliers} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
