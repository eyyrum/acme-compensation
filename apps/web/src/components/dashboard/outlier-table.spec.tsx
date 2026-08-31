import { render, screen } from '@testing-library/react';
import { OutlierTable } from './outlier-table';
import type { SalaryOutlier } from '@acme/shared';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const outlier: SalaryOutlier = {
  id: 42, employeeCode: 'ACME-000042', fullName: 'Rin Tanaka',
  jobTitle: 'Senior Software Engineer', department: 'Engineering', country: 'Japan',
  salaryUsdMinor: 4_200_000, cohortMedianUsdMinor: 9_000_000, zScore: -2.45,
};

describe('OutlierTable', () => {
  it('shows the deviation with its sign so underpayment is legible', () => {
    render(<OutlierTable outliers={[outlier]} />);
    expect(screen.getByText('-2.5σ')).toBeInTheDocument();
  });

  it('shows salary against the peer median for context', () => {
    render(<OutlierTable outliers={[outlier]} />);
    expect(screen.getByText('$42,000')).toBeInTheDocument();
    expect(screen.getByText('$90,000')).toBeInTheDocument();
  });

  it('explains an empty result rather than rendering a bare table', () => {
    render(<OutlierTable outliers={[]} />);
    expect(screen.getByText(/No employees fall more than two standard deviations/))
      .toBeInTheDocument();
  });

  it('caps the list at ten so the card stays scannable', () => {
    const many = Array.from({ length: 25 }, (_, i) => ({ ...outlier, id: i + 1 }));
    render(<OutlierTable outliers={many} />);
    expect(screen.getAllByRole('link')).toHaveLength(10);
  });
});
