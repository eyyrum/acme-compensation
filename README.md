# ACME Compensation

Salary management and pay analytics for ACME's HR team — a directory of
~10,000 employees across multiple countries and currencies, plus a dashboard
that answers org-wide pay questions (spend, medians, distribution, outliers)
without an afternoon of pivot tables.

See [`docs/requirements.md`](docs/requirements.md) for the product brief and
[`docs/architecture.md`](docs/architecture.md) / [`docs/adr/`](docs/adr/) for
design rationale. This README covers what's actually built and how to run it.

## Stack

- **`apps/api`** — NestJS 12, Prisma 6, PostgreSQL 16. Raw SQL for analytics
  aggregates ([ADR-003](docs/adr/003-prisma-for-crud-raw-sql-for-analytics.md)),
  Prisma for everything else.
- **`apps/web`** — Next.js 16 (App Router, Server Components, Turbopack),
  React 19, Tailwind v4, Recharts.
- **`packages/shared`** — Zod schemas and DTOs shared by both: API request
  validation and web form validation come from the same source, so a field
  can't drift between them.

pnpm workspace monorepo.

## Prerequisites

- **Node ≥24.9** — pinned in [`.nvmrc`](.nvmrc) (`24.20.0`). Run `nvm use` in
  each new terminal. Required for Jest's native ESM support (`@nestjs/common`
  ships pure ESM); anything older fails with `Must use import to load ES
  Module`.
- **pnpm 10.12.2** — see `packageManager` in `package.json`. `corepack enable`
  will pick it up automatically.
- **Docker** — for PostgreSQL locally, or the full stack (see below).

## Setup

```bash
nvm use
pnpm install

cp apps/api/.env.example apps/api/.env
# apps/web needs no .env for local dev — it defaults to http://localhost:3001/api

pnpm db:up                              # starts Postgres via docker compose
pnpm --filter api exec prisma migrate deploy
pnpm --filter api db:seed               # seeds 10,000 employees (SEED_COUNT to override)

pnpm dev:api                            # http://localhost:3001/api
pnpm dev:web                            # http://localhost:3000
```

If port 5432 is already taken by a local Postgres install (Postgres.app,
Homebrew, another project), stop that service first — `db:up` won't share
the port.

## Common commands

| Command | Does |
|---|---|
| `pnpm dev:api` / `pnpm dev:web` | Run one app in watch mode |
| `pnpm dev:shared` | Watch-build `packages/shared` (needed if editing shared types while `dev:api`/`dev:web` are running, since they consume the built `dist/`) |
| `pnpm db:up` / `pnpm db:down` | Start/stop the Postgres container |
| `pnpm --filter api db:seed` | Reseed employee data (`SEED_COUNT=n` env var to change row count) |
| `pnpm --filter api db:reset` | Drop and recreate the dev database |
| `pnpm test` | Unit tests, both apps |
| `pnpm test:int` | API integration tests, against a dedicated `compensation_test` database (see below) |

## Testing

- **Unit** (`pnpm test`, or `pnpm --filter api test` / `pnpm --filter web
  test`) — no external dependencies.
- **Integration** (`pnpm test:int`) — spins up against `compensation_test`
  (separate from your dev database, so this never touches your seeded dev
  data). Reads `apps/api/.env.test`; create the database once if it doesn't
  exist:

  ```bash
  docker exec acme-compensation-postgres-1 psql -U acme -d compensation \
    -c "CREATE DATABASE compensation_test"
  ```

  The suite migrates and seeds `compensation_test` itself on each run
  (`apps/api/test/global-setup.ts`).

All API test scripts run with `NODE_OPTIONS=--experimental-vm-modules` —
required for Jest to load `@nestjs/common`'s ESM build on Node ≥24.9. Don't
strip this when editing scripts; without it every API test suite fails with
`Must use import to load ES Module`.

## Docker (full stack)

```bash
docker compose up --build
```

Builds and runs Postgres, `api`, and `web` together. Two things worth
knowing if you touch the Dockerfiles or compose file:

- `pnpm deploy --prod` (used to produce the API's slim runtime image)
  re-materialises `node_modules` from the lockfile/store — it does **not**
  carry over Prisma Client, which has to be regenerated a second time,
  scoped to the deployed directory, after the deploy step. See the comment
  in `apps/api/Dockerfile`.
- `NEXT_PUBLIC_API_URL` (build arg for the web image) must resolve **inside
  the web container**, not just the browser — every API call in `apps/web`
  happens in a Server Component, so it's the web container's own server
  process making the request. In compose that means the service name
  (`http://api:3001/api`), never `localhost`.
- Requires `inject-workspace-packages=true` in `.npmrc` (pnpm v10 default
  changed) for `pnpm deploy` to bundle `@acme/shared` as real files instead
  of a symlink that wouldn't exist in the runtime image.

## Known gaps

- **No salary history** — the schema stores current salary only, not an
  effective-dated history table. Deliberate, deferred scope; see
  [ADR-005](docs/adr/005-store-current-salary-only-defer-history.md).
  `docs/architecture.md`'s data model (`compensation_record`, `pay_band`,
  `audit_log`) describes the original, larger design — treat it as
  aspirational/rationale, not the current schema.
- **Single fixed persona, no auth** — the UI shows a hardcoded "Priya Raman ·
  HR Manager" in the nav; there's no login.
- **Employee-not-found returns HTTP 200** — `apps/web/src/app/employees/[id]/`
  correctly renders the 404 UI (with a `noindex` meta tag) via `notFound()`,
  but the HTTP status stays 200. This Next.js version's Cache Components
  streaming sends the response shell before the existence check resolves, so
  the status can't flip after the fact. Low-stakes for an internal tool;
  would need the check moved to `proxy` for a true 404 status.
- Prisma warns that `package.json#prisma` (the seed config) is deprecated in
  favor of a `prisma.config.ts` file, removed in Prisma 7. Harmless on the
  current 6.19.3, not yet migrated.
