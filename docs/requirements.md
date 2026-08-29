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

**Employee records**
- Employee ID, full name, department, job title, country, base salary, currency,
  status (active/inactive), joining date
- Current base salary in the employee's local currency
- Server-paginated, filterable directory (department, country, status, search)

**Multi-currency**
- Salaries stored in native local currency
- Seeded FX rate table normalises to USD for all aggregate views

**Dashboard**
| KPI / view | Answers |
|---|---|
| Total annualised payroll spend (USD) | What do we spend? |
| Headcount, active vs inactive | How many people? |
| Average and median pay | What is typical? |
| Salary distribution histogram | How is pay spread? |
| Spend and median by department | Which teams cost what? |
| Spend and median by country | How does geography compare? |
| Outliers beyond 2σ within a cohort | Where are we inconsistent? |
| Interactive filters across all of the above | Slice without exporting |

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
Priya can answer any question in the dashboard table above in under 30 seconds,
without opening Excel.
