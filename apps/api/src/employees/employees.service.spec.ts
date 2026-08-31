import { NotFoundException } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import type { EmployeeRow } from './employees.repository';
import type { EmployeesRepository } from './employees.repository';

const row: EmployeeRow = {
  id: 1,
  employeeCode: 'ACME-000001',
  fullName: 'Asha Menon',
  email: 'asha.menon.1@acme.example',
  jobTitle: 'Senior Software Engineer',
  status: 'ACTIVE',
  joinedOn: new Date('2021-03-15T00:00:00Z'),
  department: 'Engineering',
  departmentId: 1,
  country: 'India',
  countryCode: 'IN',
  baseSalaryMinor: 480_000_000n,
  currencyCode: 'INR',
  salaryUsdMinor: 5_760_000n,
};

function makeService(overrides: Partial<Record<keyof EmployeesRepository, jest.Mock>> = {}) {
  const repository = {
    findPage: jest.fn().mockResolvedValue({ rows: [row], total: 1 }),
    findById: jest.fn().mockResolvedValue(row),
    updateSalary: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  return { service: new EmployeesService(repository as never), repository };
}

const baseQuery = {
  page: 1, pageSize: 25, sortBy: 'fullName', sortDir: 'asc',
} as const;

describe('EmployeesService.list', () => {
  it('converts BigInt salaries to JSON-safe numbers', async () => {
    const { service } = makeService();
    const result = await service.list(baseQuery);

    expect(typeof result.items[0].baseSalaryMinor).toBe('number');
    expect(result.items[0].salaryUsdMinor).toBe(5_760_000);
  });

  it('formats joinedOn as a plain date without time', async () => {
    const { service } = makeService();
    const result = await service.list(baseQuery);
    expect(result.items[0].joinedOn).toBe('2021-03-15');
  });

  it('computes total pages from the filtered total', async () => {
    const { service } = makeService({
      findPage: jest.fn().mockResolvedValue({ rows: [], total: 101 }),
    });
    const result = await service.list({ ...baseQuery, pageSize: 25 });
    expect(result.totalPages).toBe(5);
  });

  it('reports one page when there are no results, not zero', async () => {
    const { service } = makeService({
      findPage: jest.fn().mockResolvedValue({ rows: [], total: 0 }),
    });
    const result = await service.list(baseQuery);
    expect(result.totalPages).toBe(1);
  });
});

describe('EmployeesService.getById', () => {
  it('throws NotFound for an unknown id', async () => {
    const { service } = makeService({ findById: jest.fn().mockResolvedValue(null) });
    await expect(service.getById(999)).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('EmployeesService.updateSalary', () => {
  it('rejects before writing when the employee does not exist', async () => {
    const { service, repository } = makeService({
      findById: jest.fn().mockResolvedValue(null),
    });

    await expect(service.updateSalary(999, { baseSalaryMinor: 100 }))
      .rejects.toBeInstanceOf(NotFoundException);
    expect(repository.updateSalary).not.toHaveBeenCalled();
  });

  it('passes the amount to the repository as BigInt', async () => {
    const { service, repository } = makeService();
    await service.updateSalary(1, { baseSalaryMinor: 520_000_000 });
    expect(repository.updateSalary).toHaveBeenCalledWith(1, 520_000_000n);
  });
});