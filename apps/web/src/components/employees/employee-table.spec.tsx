import { render, screen } from '@testing-library/react';
import { EmployeeTable } from './employee-table';
import type { Employee } from '@/lib/api';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const query = { page: 1, pageSize: 25, sortBy: 'fullName', sortDir: 'asc' } as never;

const employee: Employee = {
  id: 1,
  employeeCode: 'ACME-000001',
  fullName: 'Asha Menon',
  email: 'asha.menon.1@acme.example',
  jobTitle: 'Senior Software Engineer',
  status: 'ACTIVE',
  joinedOn: '2021-03-15',
  department: 'Engineering',
  departmentId: 1,
  country: 'India',
  countryCode: 'IN',
  baseSalaryMinor: 480_000_000,
  currencyCode: 'INR',
  salaryUsdMinor: 5_760_000,
};

describe('EmployeeTable', () => {
  it('shows local currency and USD equivalent side by side', () => {
    render(<EmployeeTable employees={[employee]} query={query} />);

    // The whole point of the multi-currency model: both figures visible.
    expect(screen.getByText('₹4,800,000')).toBeInTheDocument();
    expect(screen.getByText('$57,600')).toBeInTheDocument();
  });

  it('links each employee to their detail page', () => {
    render(<EmployeeTable employees={[employee]} query={query} />);
    expect(screen.getByRole('link', { name: 'Asha Menon' }))
      .toHaveAttribute('href', '/employees/1');
  });

  it('marks the active sort column for screen readers', () => {
    render(<EmployeeTable employees={[employee]} query={query} />);
    expect(screen.getByRole('columnheader', { name: /Employee/ }))
      .toHaveAttribute('aria-sort', 'ascending');
  });

  it('explains an empty result rather than showing a blank table', () => {
    render(<EmployeeTable employees={[]} query={query} />);
    expect(screen.getByText(/No employees match these filters/)).toBeInTheDocument();
  });
});