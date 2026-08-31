import { render, screen, within } from '@testing-library/react';
import { BreakdownTable } from './breakdown-table';
import type { GroupBreakdown } from '@acme/shared';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const rows: GroupBreakdown[] = [
  {
    key: '1', label: 'Engineering', headcount: 3400,
    totalSpendUsdMinor: 40_000_000_000, medianSalaryUsdMinor: 14_500_000,
    averageSalaryUsdMinor: 15_200_000, spendShare: 0.6,
  },
  {
    key: '2', label: 'Sales', headcount: 1600,
    totalSpendUsdMinor: 20_000_000_000, medianSalaryUsdMinor: 11_000_000,
    averageSalaryUsdMinor: 11_800_000, spendShare: 0.3,
  },
];

describe('BreakdownTable', () => {
  it('abbreviates large spend figures for readability', () => {
    render(<BreakdownTable rows={rows} dimension="department" />);
    expect(screen.getByText('$400.0M')).toBeInTheDocument();
  });

  it('shows median in full, since it is a comparable figure', () => {
    render(<BreakdownTable rows={rows} dimension="department" />);
    expect(screen.getByText('$145,000')).toBeInTheDocument();
  });

  it('links each department through to a filtered employee list', () => {
    render(<BreakdownTable rows={rows} dimension="department" />);
    expect(screen.getByRole('link', { name: 'Engineering' }))
      .toHaveAttribute('href', '/employees?departmentId=1');
  });

  it('links countries by code rather than id', () => {
    const countries = [{ ...rows[0], key: 'IN', label: 'India' }];
    render(<BreakdownTable rows={countries} dimension="country" />);
    expect(screen.getByRole('link', { name: 'India' }))
      .toHaveAttribute('href', '/employees?countryCode=IN');
  });

  it('renders share percentages alongside the bars', () => {
    render(<BreakdownTable rows={rows} dimension="department" />);
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();
  });
});
