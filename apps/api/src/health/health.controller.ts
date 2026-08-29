import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async check() {
    const dbReachable = await this.prisma.ping();

    return {
      status: dbReachable ? 'ok' : 'degraded',
      database: dbReachable ? 'up' : 'down',
      timestamp: new Date().toISOString(),
    };
  }
}
