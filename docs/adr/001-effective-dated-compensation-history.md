# ADR-001 — Effective-dated compensation history

**Status:** Accepted

**Context.** The obvious model puts `salary` on the employee row. A raise is an
UPDATE. This is what the spreadsheets do today, and it is why HR cannot answer
"who hasn't had a raise in 18 months?" — the answer was overwritten.

**Decision.** Compensation lives in an append-only `compensation_record` table
keyed by `(employee_id, effective_from)`. Current pay is derived with
`DISTINCT ON`. Corrections insert a new record; nothing is ever mutated.

**Consequences.** Every read of "current salary" is a windowed query rather than
a column read — mitigated by an index on `(employee_id, effective_from DESC)`.
In exchange we get raise history, future-dated increases, retroactive
corrections, and a full audit trail as properties of the schema rather than
features we have to build.
