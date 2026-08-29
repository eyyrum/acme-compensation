# ADR-003 — Prisma for CRUD, raw SQL for analytics

**Status:** Accepted

**Context.** The analytics requirements are percentile, stddev, and
window-function queries. Prisma's query builder cannot express
`percentile_cont ... WITHIN GROUP`.

**Decision.** Prisma owns schema, migrations, and record-level access. Analytics
endpoints use `$queryRaw` with parameterised SQL, each in a dedicated repository
class with an explicit return type.

**Consequences.** Two query styles in one codebase, which needs a convention to
stay navigable — hence the repository boundary. In exchange, aggregation runs in
Postgres where it belongs, and the analytics layer stays flat as the org grows.
Raw SQL is parameterised without exception; no string interpolation of user input.
