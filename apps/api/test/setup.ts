import { execSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

/**
 * Integration tests run against a dedicated database, seeded once for the
 * whole suite. A smaller seed keeps the run fast while preserving the
 * distribution properties the assertions depend on.
 */
export const TEST_SEED_COUNT = 2_000;

const prisma = new PrismaClient();

export async function ensureSeeded(): Promise<void> {
  execSync('pnpm exec prisma migrate deploy', { stdio: 'inherit' });

  const count = await prisma.employee.count();
  if (count === TEST_SEED_COUNT) return;

  execSync('pnpm exec tsx prisma/seed/index.ts', {
    stdio: 'inherit',
    env: { ...process.env, SEED_COUNT: String(TEST_SEED_COUNT) },
  });
}

export async function disconnect(): Promise<void> {
  await prisma.$disconnect();
}