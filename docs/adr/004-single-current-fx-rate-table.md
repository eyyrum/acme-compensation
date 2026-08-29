# ADR-004 — Single current FX rate table, applied at query time

**Status:** Accepted

**Context.** Comparing pay across countries requires a common currency. Two
options: snapshot a converted amount onto each record at write time, or convert
at read time from a rate table.

**Decision.** Convert at query time using one current rate per currency.
Reporting currency is USD.

**Consequences.** Every cohort is compared at the same rates, so "median
engineering salary, India vs US" is meaningful. The trade-off is that historical
totals shift as rates move — a report run today for last year will not match the
figure produced last year. This is the correct choice for *comparison*, which is
what the persona needs, and the wrong one for *financial reporting*, which is
explicitly out of scope. Point-in-time FX would invert both.
