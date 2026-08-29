# ACME Compensation

Salary management for a 10,000-employee, multi-country organisation.
Built for the HR Manager persona: manage compensation data and answer
questions about how the org pays people.

## Stack
| Layer    | Choice                        |
|----------|-------------------------------|
| API      | NestJS (TypeScript)           |
| Web      | Next.js App Router            |
| Database | PostgreSQL 16                 |
| ORM      | Prisma (raw SQL for analytics)|
| Deploy   | AWS                           |

## Repo layout
apps/api        NestJS backend
apps/web        Next.js frontend
packages/shared Types and validation schemas used by both
docs            Requirements, architecture, ADRs, AI usage log

## Running locally
pnpm install
pnpm db:up
pnpm dev:api    # http://localhost:3001
pnpm dev:web    # http://localhost:3000

## Docs
- docs/requirements.md  — goal, scope, explicit non-goals
- docs/architecture.md  — data model and system design
- docs/adr/             — architecture decision records
- docs/ai-usage.md      — how AI tools were used
