# AI Usage

AI tools were used throughout. This documents how, and — more usefully —
where their output was wrong or rejected.

## Tools
- Claude (Opus) for architecture discussion, code generation, and review
- Editor-integrated completion for boilerplate

## How work was structured

Each commit began as a conversation about the *decision*, not the code.
The pattern was: state the constraint, ask for the trade-offs, argue, then
generate. Generating first and reasoning after produces code that works and
architecture that doesn't.

The requirements and ADRs were written before any schema existed
(commits 2–3). This was deliberate: it meant every later prompt could
reference a decision already made, rather than re-litigating the data model
in each conversation.

## Where AI output was rejected

**Effective-dated salary history.** The initial model had an append-only
`compensation_record` table with pay bands and compa-ratio. Correct
engineering, wrong scope — the clarifications confirmed current salary was
sufficient. Kept the reasoning as a superseded ADR (001 → 005) with the
migration path, and deleted the implementation. Building it anyway would
have been over-engineering against a stated requirement.

**Uniform random salary seeding.** The first seed script used
`faker.number.int({ min, max })`. It runs and produces 10,000 rows, and it
is useless: a flat histogram, median equal to mean, no outliers. Replaced
with a log-normal model (`salary-model.ts`) because the analytics can only
demonstrate anything against realistically-shaped data.

**Prisma for analytics.** The suggested approach loaded rows and computed
medians in JavaScript. Works at 10,000, degrades linearly, and the ORM
cannot express `percentile_cont`. Moved aggregation into Postgres (ADR-003).

**`(prisma as any)` casts.** Generated to silence type errors that were
actually "the client hasn't been regenerated". The casts hid a real bug —
`prisma.employeeStatus` instead of the imported `EmployeeStatus` enum —
which would have thrown at runtime. Removed all of them.

**Component library.** Suggested repeatedly. Declined: this app needs a
table, a card, a select, and a chart. Recharts is the one dependency that
earns its place, because axis math is genuinely wasted effort.

## Where AI was most useful

- SQL for `width_bucket` histograms and window-function outlier detection —
  correct on the first attempt and faster than writing it by hand
- Test case enumeration; several edge cases in `salary-input.spec.ts`
  (zero-decimal currencies, round-tripping) came from asking "what would
  break this?"
- Multi-stage Dockerfiles and Terraform boilerplate

## What this suggests about using these tools

They are excellent at the *how* and unreliable at the *what*. Every
rejection above was a scope or correctness judgment, not a syntax
correction. The value came from having decided what to build first.