import { Body, Controller, Get, Param, ParseIntPipe, Patch, Query } from '@nestjs/common';
import { employeeQuerySchema, updateSalarySchema } from '@acme/shared';
import type { EmployeeQuery, UpdateSalaryInput } from '@acme/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { EmployeesService } from './employees.service';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employees: EmployeesService) {}

  @Get()
  list(@Query(new ZodValidationPipe(employeeQuerySchema)) query: EmployeeQuery) {
    return this.employees.list(query);
  }

  @Get(':id')
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.employees.getById(id);
  }

  @Patch(':id/salary')
  updateSalary(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateSalarySchema)) body: UpdateSalaryInput,
  ) {
    return this.employees.updateSalary(id, body);
  }
}