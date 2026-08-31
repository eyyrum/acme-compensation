import { faker } from '@faker-js/faker';
import { PrismaClient, EmployeeStatus, Prisma } from '@prisma/client';
import { CURRENCIES, COUNTRIES, DEPARTMENTS } from './reference-data';
import { generateSalaryUsd, toLocalMinorUnits } from './salary-model';

const prisma = new PrismaClient();

const EMPLOYEE_COUNT = Number(process.env.SEED_COUNT ?? 10_000);
const BATCH_SIZE = 1_000;
const SEED = 20260831;
const INACTIVE_RATE = 0.07;

/** Pick an item by weight from a [item, weight] list. */
function weightedPick<T>(entries: Array<{ item: T; weight: number }>): T {
  const roll = faker.number.float({ min: 0, max: 1 });
  let cumulative = 0;
  for (const entry of entries) {
    cumulative += entry.weight;
    if (roll <= cumulative) return entry.item;
  }
  return entries[entries.length - 1].item;
}

async function seedReferenceData(): Promise<Map<string, number>> {
  await prisma.currency.createMany({ data: CURRENCIES, skipDuplicates: true });

  await prisma.country.createMany({
    data: COUNTRIES.map(({ code, name, currencyCode }) => ({ code, name, currencyCode })),
    skipDuplicates: true,
  });

  await prisma.department.createMany({
    data: DEPARTMENTS.map(({ name }) => ({ name })),
    skipDuplicates: true,
  });

  const departments = await prisma.department.findMany();
  return new Map(departments.map((d) => [d.name, d.id]));
}

function buildEmployee(index: number, departmentIds: Map<string, number>) {
  const department = weightedPick(
    DEPARTMENTS.map((d) => ({ item: d, weight: d.headcountWeight })),
  );
  const country = weightedPick(
    COUNTRIES.map((c) => ({ item: c, weight: c.headcountWeight })),
  );
  const currency = CURRENCIES.find((c) => c.code === country.currencyCode)!;

  const titleIndex = faker.number.int({ min: 0, max: department.titles.length - 1 });

  const salaryUsd = generateSalaryUsd({
    departmentMedianUsd: department.medianUsd,
    marketFactor: country.marketFactor,
    titleIndex,
    ladderSize: department.titles.length,
    rand: () => faker.number.float({ min: 0, max: 1 }),
  });

  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const employeeCode = `ACME-${String(index + 1).padStart(6, '0')}`;

  return {
    employeeCode,
    firstName,
    lastName,
    // Code in the local part guarantees uniqueness across 10k rows.
    email: `${firstName}.${lastName}.${index + 1}`
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, '') + '@acme.example',
    jobTitle: department.titles[titleIndex],
    status: faker.number.float({ min: 0, max: 1 }) < INACTIVE_RATE
      ? EmployeeStatus.INACTIVE
      : EmployeeStatus.ACTIVE,
    joinedOn: faker.date.between({ from: '2014-01-01', to: '2026-06-30' }),
    departmentId: departmentIds.get(department.name)!,
    countryCode: country.code,
    baseSalaryMinor: toLocalMinorUnits(salaryUsd, currency.rateToUsd, currency.minorUnits),
    currencyCode: currency.code,
  };
}

async function main(): Promise<void> {
  const startedAt = Date.now();

  // Deterministic: the same seed produces the same 10,000 employees on every
  // machine, so screenshots, tests, and demos all agree.
  faker.seed(SEED);

  console.log('Clearing existing data...');
  await prisma.employee.deleteMany();

  console.log('Seeding reference data...');
  const departmentIds = await seedReferenceData();

  console.log(`Seeding ${EMPLOYEE_COUNT.toLocaleString()} employees...`);
  let created = 0;

  for (let offset = 0; offset < EMPLOYEE_COUNT; offset += BATCH_SIZE) {
    const size = Math.min(BATCH_SIZE, EMPLOYEE_COUNT - offset);
    const batch = Array.from({ length: size }, (_, i) =>
      buildEmployee(offset + i, departmentIds),
    );

    // createMany batches into a single multi-row INSERT — roughly two orders
    // of magnitude faster than 10,000 individual round trips.
    const result = await prisma.employee.createMany({ data: batch });
    created += result.count;
    process.stdout.write(`\r  ${created.toLocaleString()} / ${EMPLOYEE_COUNT.toLocaleString()}`);
  }

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`\nDone in ${elapsed}s.`);

  await printSummary();
}

/** Sanity check: if the distribution is wrong, it shows up here. */
async function printSummary(): Promise<void> {
  const [stats] = await prisma.$queryRaw<
    Array<{ headcount: bigint; active: bigint; median_usd: number; mean_usd: number; p90_usd: number }>
  >(Prisma.sql`
    SELECT
      COUNT(*)                                                    AS headcount,
      COUNT(*) FILTER (WHERE e.status = 'ACTIVE')                 AS active,
      percentile_cont(0.5) WITHIN GROUP (ORDER BY usd.amount)     AS median_usd,
      AVG(usd.amount)                                             AS mean_usd,
      percentile_cont(0.9) WITHIN GROUP (ORDER BY usd.amount)     AS p90_usd
    FROM employee e
    JOIN currency c ON c.code = e.currency_code
    CROSS JOIN LATERAL (
      SELECT (e.base_salary_minor::numeric / POWER(10, c.minor_units)) * c.rate_to_usd AS amount
    ) usd
  `);

  console.log('\nDistribution check (USD):');
  console.log(`  Headcount:  ${stats.headcount} (${stats.active} active)`);
  console.log(`  Median:     $${Math.round(stats.median_usd).toLocaleString()}`);
  console.log(`  Mean:       $${Math.round(stats.mean_usd).toLocaleString()}`);
  console.log(`  P90:        $${Math.round(stats.p90_usd).toLocaleString()}`);
  console.log('  Expect mean > median (right-skewed), P90 well above median.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());