import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface EmployeeRow {
  id: number;
  employeeCode: string;
  fullName: string;
  email: string;
  jobTitle: string;
  status: 'ACTIVE' | 'INACTIVE';
  joinedOn: Date;
  department: string;
  departmentId: number;
  country: string;
  countryCode: string;
  baseSalaryMinor: number;
  currencyCode: string;
  /// Normalised to USD minor units at query time using the current rate table.
  salaryUsdMinor: number;
}

@Injectable()
export class EmployeesRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Shared SQL fragment: every employee-facing query needs the same
   * USD normalisation, so it is defined once rather than per endpoint.
   *
   * Conversion is (minor / 10^minorUnits) * rateToUsd * 100, i.e. convert to
   * major units, apply the rate, then re-express in USD cents.
   */
  static readonly SALARY_USD_SQL = `
    ROUND(
      (e.base_salary_minor::numeric / POWER(10, c.minor_units))
      * c.rate_to_usd * 100
    )::bigint
  `;
}