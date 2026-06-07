# Phase 4: Weekly Task Templates and Activity Cycles - Context

**Gathered:** 2026-06-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 04 delivers two things: (1) the task template CRUD that lets guardians define weekly responsibilities for a specific child, and (2) the Sunday-Saturday activity cycle computation that determines which cycle a given date belongs to, plus a page showing the current week's active tasks.

Phase 04 does NOT include task completion submission (child submits), approval workflow (guardian approves/rejects), or Kreds posting — those belong to Phase 5, which calls the Kreds Engine built in Phase 3.

</domain>

<decisions>
## Implementation Decisions

### Task Template Lifecycle

- **D-01:** Guardian can freely edit a task template (title, description, kreds_value) after creation. There is no immutability constraint and no versioning in Phase 4. Historical integrity is preserved because the Kreds value snapshot is taken at approval time (Phase 5 responsibility — the ledger records the kreds_value at the moment of posting, not the current template value).
- **D-02:** Each task template is assigned to one specific child (`assigned_child_id` FK). Siblings with the same responsibility require separate templates. No shared-template mechanic in v1.

### Activity Cycles

- **D-03:** Activity cycles are computed dynamically from a given date and the family's IANA timezone (stored in `families.timezone`). No `activity_cycle` table or proactively generated cycle records. A pure function `getCycleForDate(date, timezone)` returns `{ cycleStart: Date, cycleEnd: Date }` representing Sunday 00:00 through Saturday 23:59:59.999 in the family timezone.
- **D-04:** Sunday is always Day 0 of the cycle regardless of locale or regional calendar conventions. This reflects the biblical stewardship week framing from PROJECT.md.
- **D-05:** Phase 4 exposes a page showing the current cycle's active tasks for the guardian. The `getCycleForDate` function is also exported as an internal utility so Phase 5 can use it for completion validation and the 72-hour rule.

### Activation and Deactivation

- **D-06:** Task templates have `is_active` (boolean) and `deactivated_at` (timestamp nullable) columns. Deactivating a template sets `is_active = false` and records `deactivated_at`. Reactivating sets `is_active = true` and clears `deactivated_at`. This preserves deactivation history on the template row without a separate log table.
- **D-07:** The guardian's task list UI shows only active templates by default. A toggle/filter allows viewing inactive templates for audit purposes. Inactive tasks are not shown to children.
- **D-08:** Deactivation takes effect immediately. If a guardian deactivates a task mid-cycle (e.g., Wednesday), Phase 5 must check `is_active` before accepting new completion submissions. No mid-cycle snapshot — deactivation cuts off submissions at the moment it occurs.

### Claude's Discretion

- Exact table name (`task_templates` or `tasks`), column names, form layout, route structure, and copy wording.
- Drizzle schema pattern follows the same `pgTable + (table) => ({ index, check })` convention established in Phases 1–3.
- Cycle page URL structure (e.g., `/guardian/tasks/current` or `/dashboard/tasks`).
- How guardian navigates between task list and task creation form.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Scope and Requirements

- `.planning/ROADMAP.md` — Phase 04 goal, success criteria, MVP mode, requirement IDs ACT-01, ACT-02, ACT-03. Also Phase 5 boundary (ACT-04 through ACT-09) so template interface is forward-compatible.
- `.planning/REQUIREMENTS.md` — Full text of ACT-01, ACT-02, ACT-03. Also ACT-05 (72-hour rule — Phase 5 consumes `getCycleForDate`) and ACT-07 (Kreds posted only after approval — Phase 5 snapshots kreds_value from template).
- `.planning/PROJECT.md` — Sunday-Saturday cadence rationale, biblical stewardship framing, family isolation constraint, 72-hour rule.

### Phase 2 Decisions (upstream context)

- `.planning/phases/02-family-access-tenancy-roles-and-profiles/02-CONTEXT.md` — D-03 (families.timezone IANA), D-15 (guardian/child roles), D-16 (family_id scoping), D-09/D-10 (child profiles).

### Phase 3 Decisions (upstream context)

- `.planning/phases/03-kreds-engine-ledger-and-audit-foundation/03-CONTEXT.md` — D-05 (postEarning interface: command with kreds_value snapshot), D-07 (kreds_value must be integer). Phase 4 templates store kreds_value as integer; Phase 5 passes it to postEarning.

### Existing Implementation

- `src/lib/db/schema/index.ts` — Current Drizzle schema (families, child_profiles, identities, familyMemberships). Task template tables extend from this; must not conflict with existing patterns.
- `src/lib/db/index.ts` — Drizzle DB access pattern.
- `src/modules/glossary/terms.ts` — Canonical terms; add TASK, ACTIVITY_CYCLE, TASK_TEMPLATE constants.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `src/lib/db/schema/index.ts` — `pgTable + uuid + timestamp + boolean + integer + pgEnum + uniqueIndex + index + check` patterns directly reusable for `task_templates` table.
- `src/app/api/families/route.ts` — Route handler pattern (Zod validation + family_id scoping + NextResponse.json + 23505 idempotency handling) reusable for task template CRUD routes.
- `families.timezone` column — already stored as IANA string; `getCycleForDate` reads it directly without additional storage.

### Established Patterns

- `family_id` scoping on every query (Phase 2 discipline) — task templates must always filter by `family_id` in WHERE clause.
- Server-side authorization via Auth.js session (Phase 2) — all task template routes require authenticated guardian session.
- Drizzle `db.transaction()` not required for template CRUD (single table insert/update), but Phase 5 will use it when posting earnings.

### Integration Points

- Phase 5 will import `getCycleForDate` from Phase 4's cycle utility to compute the 72-hour backfill window.
- Phase 5 will read `task_templates.kreds_value` at approval time to pass to `postEarning(command)`.
- Phase 5 will check `task_templates.is_active` before accepting completion submissions.

</code_context>

<specifics>
## Specific Ideas

- `getCycleForDate(date: Date, timezone: string): { cycleStart: Date, cycleEnd: Date }` — pure function, no DB access, no side effects. Exported from `src/modules/activity/cycle.ts`.
- Task template page for guardian should show tasks grouped by child, with is_active toggle accessible inline.
- Kreds value field in the template form should validate as positive integer (matches ledger integer constraint from Phase 3).

</specifics>

<deferred>
## Deferred Ideas

- Task completion submission and approval (ACT-04 through ACT-09) — Phase 5.
- Kreds posting from task approval — Phase 5 calls Phase 3 engine.
- Weekly gratitude report (BIBL-02 through BIBL-06) — later phase.
- Cycle snapshot for mid-cycle deactivation (decided: deactivation is immediate, no snapshot) — can be revisited if fairness issues surface.
- Shared templates for multiple siblings — v1 has one template per child; future phase can add assignment groups.
- Task recurrence rules beyond weekly (daily, one-off) — out of scope for v1.

</deferred>

---

*Phase: 04-Weekly Task Templates and Activity Cycles*
*Context gathered: 2026-06-06*
