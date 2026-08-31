import { Controller, Get, Query } from '@nestjs/common';
import { analyticsFilterSchema } from '@acme/shared';
import type { AnalyticsFilter } from '@acme/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AnalyticsService } from './analytics.service';

const filterPipe = new ZodValidationPipe(analyticsFilterSchema);

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('summary')
  summary(@Query(filterPipe) filter: AnalyticsFilter) {
    return this.analytics.summary(filter);
  }

  @Get('by-department')
  byDepartment(@Query(filterPipe) filter: AnalyticsFilter) {
    return this.analytics.byDepartment(filter);
  }

  @Get('by-country')
  byCountry(@Query(filterPipe) filter: AnalyticsFilter) {
    return this.analytics.byCountry(filter);
  }

  @Get('distribution')
  distribution(@Query(filterPipe) filter: AnalyticsFilter) {
    return this.analytics.distribution(filter);
  }

  @Get('outliers')
  outliers(@Query(filterPipe) filter: AnalyticsFilter) {
    return this.analytics.outliers(filter);
  }
}