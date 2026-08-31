import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import type { Env } from './config/env.validation';
import * as bigintSerializer from './common/bigint-serializer';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<Env, true>);
bigintSerializer.patchBigIntJson();
  app.setGlobalPrefix('api');
  app.enableCors({ origin: config.get('CORS_ORIGIN', { infer: true }) });
  app.enableShutdownHooks();

  const port = config.get('PORT', { infer: true });
  await app.listen(port);

  new Logger('Bootstrap').log(`API listening on http://localhost:${port}/api`);
}

void bootstrap();
