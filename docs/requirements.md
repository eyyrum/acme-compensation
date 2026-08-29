# ACME Compensation — Requirements

## Goal
Replace ACME HR's spreadsheet-based salary management with web software that
lets one HR Manager maintain compensation for ~10,000 employees across multiple
countries, and answer questions about how the organisation pays people.

## Persona
**Priya, HR Manager.** Owns comp data for the whole org. Not technical. Today
she maintains ~12 country spreadsheets, reconciles them by hand each quarter,
and cannot answer "what is our median engineering salary in India vs the US?"
without an afternoon of pivot tables.

## Jobs to be done
1. **Find** — locate an employee and see their current and historical pay.
2. **Change** — record a raise, promotion, or correction, with a reason and a
   date it takes effect, without destroying what came before.
3. **Understand** — answer questions about org-wide pay without exporting data.

The third job is the reason this product exists. Spreadsheets already do (1)
and (2) badly but adequately; they fail completely at (3).

## In scope

**Compensation records**
- Effective-dated compensation history per employee (base, bonus, allowances)
- Multi-currency, with normalisation to a reporting currency for comparison
- Every change captured with effective date, reason, and actor

**Employee directory**
- Server-paginated, filterable list (department, country, level, title)
- Employee detail with a compensation timeline

**Analytics — the questions Priya actually asks**
| Question | Surfaced as |
|---|---|
| What do we spend on payroll? | Total annualised cost, sliced by country / department |
| Are we paying market rate for this role here? | Median + p25/p75 by title × location |
| Who is a retention risk? | Compa-ratio < 0.9, i.e. below their pay band midpoint |
| Who has been overlooked? | No compensation change in > 18 months |
| What does a raise cost? | Cost simulation for an uplift applied to a filtered cohort |
| Where are we inconsistent? | Outliers > 2σ within a title × location cohort |

## Out of scope — and why

| Excluded | Reasoning |
|---|---|
| Authentication & RBAC | Single-persona brief. A real deployment uses org SSO with an HR-admin role; building a bespoke login demonstrates nothing about compensation modelling. A fixed session user is stubbed so the audit trail still has an actor. |
| Payroll execution, tax, payslips | This is compensation *management*, not payroll *processing*. Payroll is a jurisdiction-heavy regulated domain and a separate system in every org this size. |
| Approval workflows | Multi-step approval chains are org-specific configuration. Modelling one adds state machine complexity without demonstrating better judgment. |
| Employee self-service | Different persona, different threat model, different UI. |
| Excel/CSV import | The seed script demonstrates bulk ingestion at 10k scale. A production importer needs column mapping, dry-run preview, and per-row error reporting — that is a feature in its own right, and the highest-value thing to build next. |
| Historical FX rates | Conversion uses one current rate table applied uniformly, so cohorts stay comparable. Point-in-time FX would make historical totals accurate but cross-period comparisons misleading. Documented in ADR-004. |
| Equity / stock compensation | Vesting schedules and valuation are a modelling problem of similar size to everything above combined. |

## Non-functional targets
- Employee list responds < 300ms at 10,000 rows (server-side pagination, indexed filters)
- Analytics queries < 500ms (aggregation in Postgres, never in application code)
- Compensation history is append-only; corrections are new records, not edits
- Unit tests cover compensation calculation and currency normalisation with no DB dependency

## Success criteria
Priya can answer any question in the analytics table above in under 30 seconds,
without opening Excel.
