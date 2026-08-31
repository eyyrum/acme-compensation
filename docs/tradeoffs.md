# Trade-offs and Performance

## Decisions and their costs

| Decision | Gained | Gave up |
|---|---|---|
| Current salary only (ADR-005) | Simple schema, flat queries | Cannot answer "who hasn't had a raise?" Migration path in ADR-005. |
| Integer minor units (ADR-002) | Exact arithmetic, JSON-safe | Every display needs an exponent lookup; JPY is not ×100 |
| Raw SQL for analytics (ADR-003) | Aggregation in Postgres, flat scaling | Two query styles; enforced by a repository boundary |
| Query-time FX (ADR-004) | Cohorts always comparable | Historical totals shift as rates move |
| URL-driven filter state | Shareable, bookmarkable, back button works | A round trip per filter change; search debounced 300ms |
| Server Components | No client fetch waterfall, no keys in browser | Filter interactivity needs explicit client boundaries |
| No component library | Small dependency surface, full control | Hand-written table, select, card |
| Offset pagination | Simple, jump to any page | Degrades past ~100k rows; cursor pagination is the fix |

## Measured performance

Against the 10,000-employee seed, `db.t4g.micro`-equivalent local Postgres 16.

> **Replace with your own `EXPLAIN ANALYZE` output before submitting.**

| Query | Time | Plan |
|---|---|---|
| Directory page (25 rows, filtered) | _TBD_ | Index scan on `(department_id, status)` |
| Directory count | _TBD_ | |
| Analytics summary | _TBD_ | Sequential scan + sort for percentiles |
| By department | _TBD_ | HashAggregate |
| Distribution histogram | _TBD_ | |
| Outlier detection | _TBD_ | Window aggregate over partition |

### Notes on the plans

The analytics queries sequential-scan by design. At 10,000 rows the table is
a few megabytes and fits in shared buffers; an index would add write cost for
no read benefit. This changes at roughly 500k rows, where a materialised view
refreshed on write becomes worthwhile.

The directory's composite indexes on `(department_id, status)` and
`(country_code, status)` exist because filter-plus-status is the dominant
query shape from both the directory and the dashboard.

The count query is the most expensive part of pagination — it scans the full
filtered set on every page. An approximate count from `pg_class.reltuples`
for unfiltered views would remove it, but exact counts matter to an HR
manager reconciling headcount, so the cost is accepted.

## Where this breaks

**100,000 employees.** Offset pagination degrades; deep pages get slow.
Switch to keyset pagination on `(sort_key, id)`.

**Concurrent editors.** No optimistic locking. Two managers editing one
salary means last-write-wins silently. A `version` column with a conditional
update is the fix.

**Analytics under load.** Every dashboard load runs five aggregations. A
30-second cache or a materialised view refreshed on salary change would
remove nearly all of it.

## What I would build next, in order

1. **Salary revision history** (ADR-005 migration) — unlocks the retention
   questions the current schema cannot answer
2. **CSV import** — the actual migration path off spreadsheets, which is the
   stated problem; needs column mapping, dry-run preview, per-row errors
3. **Authentication and RBAC** — required before this touches real salary data
4. **Optimistic locking** — before more than one person uses it