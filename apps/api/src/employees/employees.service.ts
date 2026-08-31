import { Injectable, NotFoundException } from '@nestjs/common';
import type { EmployeeQuery, Paginated, UpdateSalaryInput } from '@acme/shared';
import { EmployeesRepository, type EmployeeRow } from './employees.repository';

export interface EmployeeDto extends Omit<EmployeeRow, 'baseSalaryMinor' | 'salaryUsdMinor' | 'joinedOn'> {
  baseSalaryMinor: number;
  salaryUsdMinor: number;
  joinedOn: string;
}

@Injectable()
export class EmployeesService {
  constructor(private readonly repository: EmployeesRepository) {}

  async list(query: EmployeeQuery): Promise<Paginated<EmployeeDto>> {
    const { rows, total } = await this.repository.findPage(query);

    return {
      items: rows.map(toDto),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    };
  }

  async getById(id: number): Promise<EmployeeDto> {
    const row = await this.repository.findById(id);
    if (!row) throw new NotFoundException(`Employee ${id} not found`);
    return toDto(row);
  }

  async updateSalary(id: number, input: UpdateSalaryInput): Promise<EmployeeDto> {
    await this.getById(id); // 404 before mutating
    await this.repository.updateSalary(id, BigInt(input.baseSalaryMinor));
    return this.getById(id);
  }
}

/** BigInt and Date are not JSON-safe; narrow at the service boundary. */
function toDto(row: EmployeeRow): EmployeeDto {
  return {
    ...row,
    baseSalaryMinor: Number(row.baseSalaryMinor),
    salaryUsdMinor: Number(row.salaryUsdMinor),
    joinedOn: row.joinedOn.toISOString().slice(0, 10),
  };
}