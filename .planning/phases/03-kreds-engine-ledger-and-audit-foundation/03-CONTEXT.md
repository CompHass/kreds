# Phase 03: Kreds Engine Ledger and Audit Foundation - Context

**Gathered:** 2026-06-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 03 builds the Kreds Engine ledger backend: append-only integer-based transaction posting, automatic firstfruits withholding (10%), negative adjustments with reasons, idempotent command handling, correction via reversal/adjustment entries (no historical edits), and differentiated audit history views for guardians and children.

Phase 03 does NOT define task values, task templates, or the task approval flow — those belong to Phases 4 and 5. The engine receives a command (type + amount + child_id + command_id) and posts it correctly.

</domain>

<decisions>
## Implementation Decisions

### Rounding Policy (LEDG-03)

- **D-01:** The single documented rounding policy for all 10% calculations is **ceiling (Math.ceil)**. 10% of 7 Kreds = 1 firstfruits (0.7 → 1). The same ceiling rule applies to the 10% voluntary donation matching bonus. One policy for the entire engine, documented in code constants and tests.
- **D-02:** Rationale: ceiling honors the firstfruits principle even on small amounts — giving the first (highest) portion aligns with the biblical stewardship intent.

### Balance Computation

- **D-03:** Available balance is computed **on-the-fly via SUM** of ledger lines for a given `child_id` and `account_type`. No separate balance column is maintained. This preserves true append-only semantics and eliminates balance drift risk. Acceptable for v1 data volumes.
- **D-04:** The Firstfruits Treasury is **not a separate table or ledger**. It is represented as ledger lines with `account_type: firstfruits` (or equivalent). The treasury balance = SUM of all firstfruits-type lines for that child. One ledger, multiple account types.

### Ledger Structure

- **D-05:** One command approval generates **one ledger transaction header with 2+ lines**. For a task approval of +10 Kreds: transaction header (type: `task_earning`, command_id: UUID) + line 1 (+9 available) + line 2 (+1 firstfruits). This groups cause and consequences in one auditable unit.
- **D-06:** Idempotency (LEDG-06) is enforced via **UNIQUE constraint on `command_id`** in the ledger transaction table. Each generating action (task approval, adjustment, donation) carries a UUID command_id. Safe retry by design — duplicate command_id is rejected at the DB constraint level.
- **D-07:** Negative adjustments (LEDG-05) use guardian-supplied **free value + required reason text**. No presets or value limits in Phase 3. The engine validates only that the debit amount is a positive integer. The reason field is mandatory and stored as plain text for audit display.

### Corrections (LEDG-08)

- **D-08:** Ledger mistakes are corrected through **reversal entries** (negative counterpart to the original line) + new correct entries if needed. Historical transaction lines are never edited or deleted. The correction entries carry a `corrects_transaction_id` reference and a guardian-supplied correction note.

### Audit History Views (LEDG-07)

- **D-09:** Guardian and child see **differentiated audit views**:
  - **Guardian view**: full detail — transaction type, all lines (available + firstfruits), command_id, adjustment reasons, correction notes, `corrects_transaction_id` references.
  - **Child view**: simplified — human-readable label (e.g., "You earned 9 Kreds for [task]" / "1 Kreds went to your Firstfruits"), correction entries shown with label "Correction applied" but without internal reasons or technical references.
- **D-10:** Reversal/correction entries ARE visible to children, but labeled simply as "Correction applied" without exposing the guardian's internal correction reason or the original error detail.

### Claude's Discretion

- Exact column names, table names, Drizzle schema syntax, and API route structure are implementation details for downstream agents.
- The specific `account_type` enum values (e.g., `available`, `firstfruits`) and `transaction_type` enum values (e.g., `task_earning`, `negative_adjustment`, `reversal`) can be chosen by the planner to match the Phase 4/5 command vocabulary once that is clearer.
- UI design of the audit timeline (layout, icons, colors) follows Sylvan Growth visual direction from Phase 2 design references.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Scope and Requirements

- `.planning/ROADMAP.md` — Phase 03 goal, success criteria, MVP mode, requirement IDs LEDG-01 through LEDG-08. Also shows Phase 4–5 boundaries so ledger engine interface is forward-compatible.
- `.planning/REQUIREMENTS.md` — LEDG-01 through LEDG-08 full requirement text. Also ACT-07 (earnings posted only after parent approval) and GOAL-06 (10% matching on voluntary giving) which feed into the engine.
- `.planning/PROJECT.md` — Core stewardship framing, firstfruits principle, 10% withholding, negative adjustment policy, weekly cadence, family isolation constraint.

### Phase 2 Decisions (upstream context)

- `.planning/phases/02-family-access-tenancy-roles-and-profiles/02-CONTEXT.md` — D-14 through D-16 (roles: guardian/child/system_owner, family_id isolation), D-17/D-18 (audit visibility rules), schema extension patterns.

### Existing Implementation

- `src/lib/db/schema/index.ts` — Current Drizzle schema (families table). Ledger tables extend from this foundation; must not conflict with existing column patterns.
- `src/lib/db/index.ts` — Drizzle DB access pattern to follow for new ledger queries.
- `src/modules/glossary/terms.ts` — Canonical terms (GUARDIAN, CHILD, FAMILY) — ledger terminology (FIRSTFRUITS, KREDS, TREASURY) should be added here.

### Privacy and Child Data

- `docs/PRIVACY-INVENTORY.md` — Must note that ledger lines contain child financial history and set retention policy for audit records.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `src/lib/db/index.ts` — Drizzle DB access pattern; all ledger queries follow the same `db.select().from()` pattern already established.
- `src/lib/db/schema/index.ts` — Existing `families` table has `id` (UUID primary key pattern) and `createdAt`/`updatedAt` timestamps; replicate this pattern for ledger tables.
- `src/modules/glossary/terms.ts` — Existing terminology constants; extend with FIRSTFRUITS, KREDS, TREASURY, LEDGER.

### Established Patterns

- App Router Route Handlers under `src/app/api/*/route.ts` for server-side ledger posting API.
- Server-side authorization (family_id scoped) established in Phase 2 — ledger reads/writes must continue this pattern.
- PostgreSQL + Drizzle is the only data layer; no ORM switching.

### Integration Points

- Ledger transaction inserts must be atomic with firstfruits line creation — a single Drizzle transaction wraps both inserts.
- `command_id` UNIQUE constraint must be enforced at the DB level (not just application level) to guarantee LEDG-06.
- Phase 4 task approval will call the ledger engine's `postEarning(command)` interface — design the interface to accept a typed command rather than raw values.

</code_context>

<specifics>
## Specific Ideas

- The ceiling rounding rule should be extracted as a named constant/function (e.g., `calculateFirstfruits(amount: number): number`) and tested with edge cases (1 Kred → 1 firstfruits, 10 Kreds → 1 firstfruits, 11 Kreds → 2 firstfruits).
- The ledger UI for children should use warm, encouraging language ("Your Firstfruits" not "Treasury deduction") aligned with Sylvan Growth tone from Phase 2 design references.
- Correction entries should carry a `corrects_transaction_id` foreign key so guardian audit view can render a clear before/after diff.

</specifics>

<deferred>
## Deferred Ideas

- Task value configuration (how much a specific task is worth) — belongs in Phase 4 task templates.
- Preset/configurable negative adjustment values — belongs in Phase 4 task templates.
- Kreds do Bem (giving) matching engine integration — the matching bonus (GOAL-06) will use the same ledger engine, but the giving flow itself belongs to Phase 7.
- Wishlist goal allocation against ledger balance — Phase 6.

</deferred>

---

*Phase: 03-Kreds Engine Ledger and Audit Foundation*
*Context gathered: 2026-06-07*
