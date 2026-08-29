# ADR-002 — Money as integer minor units

**Status:** Accepted

**Context.** Floating point cannot represent 0.1 exactly; salary arithmetic
accumulates error. `NUMERIC(14,2)` and integer minor units both avoid this.

**Decision.** `BIGINT` minor units with an explicit `currency_code` column. No
amount exists without its currency.

**Consequences.** Arithmetic is exact and JSON-safe end to end. Cost: every
display needs division by the currency's minor-unit exponent, and JPY (zero
decimal places) must not be assumed to be 100. Centralised in one formatter in
`packages/shared`.
