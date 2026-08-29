# ADR-005 — Store current salary only; defer history

**Status:** Accepted

**Context.** ADR-001 modelled compensation as an append-only, effective-dated
history. Requirements clarification then confirmed that current salary alone is
sufficient for this phase, and that history, effective dates, and audit logs are
explicitly deferred. Base salary plus currency is the required scope; bonus,
equity, and allowances are optional.

**Decision.** `base_salary_minor` and `currency_code` live on the `employee`
row. `compensation_record`, `pay_band`, and `audit_log` are dropped from this
phase. A salary change is an UPDATE.

**Consequences.** The schema is materially simpler and every "current salary"
read is a column read rather than a windowed query, which makes the analytics
queries flatter and faster. The cost is that a raise overwrites its predecessor:
"who hasn't had a raise in 18 months?" is unanswerable until history exists.

Building the history model anyway would have been over-engineering against a
stated requirement. The migration path is additive and non-destructive, and is
recorded here so it is a planned phase rather than a rewrite:

1. Create `compensation_record (employee_id, effective_from, currency_code,
   base_salary_minor, change_reason, created_by)`.
2. Backfill one row per employee from the current column, `effective_from =
   hire_date`.
3. Switch reads to `DISTINCT ON (employee_id) ... ORDER BY effective_from DESC`.
4. Drop the column.

Compa-ratio and pay-band analytics are removed from scope with the pay_band
table; the retention signals that survive are distribution spread and outlier
detection within a cohort.
