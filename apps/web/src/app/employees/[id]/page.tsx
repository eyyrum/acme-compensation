import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { SalaryEditor } from '@/components/employees/salary-editor';
import { formatMoney, formatDate, tenureYears } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const employeeId = Number(id);

  if (!Number.isInteger(employeeId) || employeeId < 1) notFound();

  let employee;
  try {
    employee = await api.employees.getById(employeeId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  // Peer context makes the salary figure meaningful rather than just a number.
  const peers = await api.analytics.byDepartment({
    countryCode: employee.countryCode,
    status: 'ACTIVE',
  });
  const cohort = peers.find((p) => p.key === String(employee.departmentId));

  return (
    <div>
      <Link href="/employees" className="text-sm text-[var(--color-accent)] hover:underline">
        ← Employees
      </Link>

      <div className="mt-3 mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">{employee.fullName}</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            {employee.jobTitle} · {employee.department} · {employee.country}
          </p>
        </div>
        <StatusBadge status={employee.status} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Compensation"
            description="Stored in local currency; USD shown for cross-country comparison."
          />
          <CardBody>
            <div className="flex flex-wrap gap-8">
              <Figure
                label="Base salary"
                value={formatMoney(employee.baseSalaryMinor, employee.currencyCode)}
                detail={employee.currencyCode}
              />
              <Figure
                label="USD equivalent"
                value={formatMoney(employee.salaryUsdMinor, 'USD')}
                detail="at current rates"
              />
              {cohort && (
                <Figure
                  label="Department median"
                  value={formatMoney(cohort.medianSalaryUsdMinor, 'USD')}
                  detail={`${employee.department} in ${employee.country}`}
                />
              )}
            </div>

            {cohort && (
              <p className="mt-4 text-sm text-[var(--color-ink-muted)]">
                {employee.salaryUsdMinor >= cohort.medianSalaryUsdMinor
                  ? 'Paid at or above'
                  : 'Paid below'}{' '}
                the median for this department in {employee.country}.
              </p>
            )}

            <div className="mt-5 border-t border-[var(--color-border)] pt-4">
              <SalaryEditor employee={employee} />
            </div>

            {/* Honest about the deferred scope rather than hiding it. */}
            <p className="mt-4 text-xs text-[var(--color-ink-muted)]">
              Salary revision history is planned for a future phase; changes
              currently update the record in place.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Details" />
          <CardBody className="space-y-3 text-sm">
            <Row label="Employee ID" value={employee.employeeCode} mono />
            <Row label="Email" value={employee.email} />
            <Row label="Department" value={employee.department} />
            <Row label="Job title" value={employee.jobTitle} />
            <Row label="Country" value={employee.country} />
            <Row label="Joined" value={formatDate(employee.joinedOn)} />
            <Row
              label="Tenure"
              value={`${tenureYears(employee.joinedOn).toFixed(1)} years`}
            />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Figure({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">
        {label}
      </p>
      <p className="numeric mt-1 text-xl font-semibold">{value}</p>
      {detail && <p className="text-xs text-[var(--color-ink-muted)]">{detail}</p>}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-[var(--color-ink-muted)]">{label}</span>
      <span className={mono ? 'font-mono text-xs' : 'text-right'}>{value}</span>
    </div>
  );
}
