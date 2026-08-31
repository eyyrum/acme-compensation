import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { patchBigIntJson } from '../src/common/bigint-serializer';
import { TEST_SEED_COUNT } from './setup';

describe('Employees API (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    patchBigIntJson();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('pagination', () => {
    it('reports the full population and a consistent page count', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/employees?pageSize=25')
        .expect(200);

      expect(body.total).toBe(TEST_SEED_COUNT);
      expect(body.items).toHaveLength(25);
      expect(body.totalPages).toBe(Math.ceil(TEST_SEED_COUNT / 25));
    });

    it('never repeats a row across adjacent pages', async () => {
      // The ORDER BY tiebreaker on e.id exists for exactly this reason:
      // employees sharing a surname would otherwise drift between pages.
      const [first, second] = await Promise.all([
        request(app.getHttpServer()).get('/api/employees?page=1&pageSize=100'),
        request(app.getHttpServer()).get('/api/employees?page=2&pageSize=100'),
      ]);

      const firstIds = new Set(first.body.items.map((e: { id: number }) => e.id));
      const overlap = second.body.items.filter((e: { id: number }) => firstIds.has(e.id));

      expect(overlap).toHaveLength(0);
    });

    it('caps page size to protect the server', async () => {
      await request(app.getHttpServer()).get('/api/employees?pageSize=5000').expect(400);
    });
  });

  describe('filtering', () => {
    it('returns only matching employees for a country filter', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/employees?countryCode=IN&pageSize=50')
        .expect(200);

      expect(body.items.length).toBeGreaterThan(0);
      expect(body.items.every((e: { countryCode: string }) => e.countryCode === 'IN')).toBe(true);
      expect(body.total).toBeLessThan(TEST_SEED_COUNT);
    });

    it('combines filters conjunctively', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/employees?countryCode=US&status=ACTIVE&pageSize=50')
        .expect(200);

      expect(body.items.every(
        (e: { countryCode: string; status: string }) =>
          e.countryCode === 'US' && e.status === 'ACTIVE',
      )).toBe(true);
    });

    it('searches across name and job title', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/employees?search=engineer&pageSize=20')
        .expect(200);

      expect(body.items.length).toBeGreaterThan(0);
      expect(body.items.every(
        (e: { jobTitle: string; fullName: string; email: string }) =>
          /engineer/i.test(e.jobTitle) || /engineer/i.test(e.fullName) || /engineer/i.test(e.email),
      )).toBe(true);
    });

    it('returns an empty page rather than an error when nothing matches', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/employees?search=zzzznomatchzzzz')
        .expect(200);

      expect(body.items).toHaveLength(0);
      expect(body.total).toBe(0);
      expect(body.totalPages).toBe(1);
    });
  });

  describe('sorting', () => {
    it('sorts by USD salary descending, comparing across currencies', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/employees?sortBy=salaryUsd&sortDir=desc&pageSize=50')
        .expect(200);

      const salaries = body.items.map((e: { salaryUsdMinor: number }) => e.salaryUsdMinor);
      expect(salaries).toEqual([...salaries].sort((a, b) => b - a));

      // Proves normalisation is real: raw local amounts would not be ordered,
      // since 4,000,000 INR is far less than 200,000 USD.
      const currencies = new Set(body.items.map((e: { currencyCode: string }) => e.currencyCode));
      expect(currencies.size).toBeGreaterThan(1);
    });

    it('rejects an unknown sort field instead of silently defaulting', async () => {
      await request(app.getHttpServer())
        .get('/api/employees?sortBy=salary;DROP TABLE employee')
        .expect(400);
    });
  });

  describe('salary update', () => {
    it('persists a raise and returns the recomputed USD value', async () => {
      const { body: page } = await request(app.getHttpServer()).get('/api/employees?pageSize=1');
      const employee = page.items[0];
      const raised = employee.baseSalaryMinor + 500_000;

      const { body: updated } = await request(app.getHttpServer())
        .patch(`/api/employees/${employee.id}/salary`)
        .send({ baseSalaryMinor: raised })
        .expect(200);

      expect(updated.baseSalaryMinor).toBe(raised);
      expect(updated.salaryUsdMinor).toBeGreaterThan(employee.salaryUsdMinor);

      // Restore so the suite stays order-independent.
      await request(app.getHttpServer())
        .patch(`/api/employees/${employee.id}/salary`)
        .send({ baseSalaryMinor: employee.baseSalaryMinor });
    });

    it('404s for an unknown employee', async () => {
      await request(app.getHttpServer())
        .patch('/api/employees/99999999/salary')
        .send({ baseSalaryMinor: 1_000_000 })
        .expect(404);
    });

    it('rejects a negative salary', async () => {
      await request(app.getHttpServer())
        .patch('/api/employees/1/salary')
        .send({ baseSalaryMinor: -100 })
        .expect(400);
    });
  });
});