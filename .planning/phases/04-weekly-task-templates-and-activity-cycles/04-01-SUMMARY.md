---
phase: 04-weekly-task-templates-and-activity-cycles
plan: "01"
subsystem: activity-cycles
tags:
  - tdd
  - pure-function
  - intl-api
  - zod
  - timezone
dependency_graph:
  requires: []
  provides:
    - getCycleForDate
    - taskTemplateSchema
    - TaskTemplateInput
  affects:
    - src/modules/activity/cycle.ts
    - src/lib/db/tasks/schema.ts
tech_stack:
  added: []
  patterns:
    - Intl.DateTimeFormat.formatToParts for timezone-aware date arithmetic (zero dependencies)
    - z.coerce.number().int().positive() for integer-only Kreds validation
key_files:
  created:
    - src/modules/activity/__tests__/cycle.test.ts
    - src/modules/activity/__tests__/task-template-schema.test.ts
    - src/modules/activity/__tests__/task-templates.test.ts
    - src/modules/activity/cycle.ts
    - src/lib/db/tasks/schema.ts
  modified:
    - src/modules/glossary/terms.ts
decisions:
  - "ACTIVITY_CYCLE term added to glossary (TASK_TEMPLATE was already present)"
  - "cycle.ts has zero external imports — Intl API only (D-03, verified)"
  - "taskTemplateSchema uses z.coerce.number().int().positive() matching D-07"
metrics:
  duration: "2 minutes"
  completed_date: "2026-06-08"
  tasks_completed: 2
  files_created: 5
  files_modified: 1
---

# Phase 04 Plan 01: Wave 0 TDD — getCycleForDate and taskTemplateSchema Summary

**One-liner:** TDD cycle RED-GREEN for `getCycleForDate` (timezone-aware Sunday-Saturday computation via Intl API) and `taskTemplateSchema` (Zod integer-only Kreds validation), with 16 tests passing in under 1 second.

## What Was Built

### Task 1 — RED: Failing tests created (commit b0f8669)

Created `src/modules/activity/__tests__/` directory with three test files:

- **`cycle.test.ts`** — 9 unit tests for `getCycleForDate` covering:
  - America/Sao_Paulo (UTC-3): Wednesday input, Sunday midnight boundary, next cycle advancement
  - Asia/Kolkata (UTC+5:30): half-hour offset, confirms Sun/Sat day names
  - Year boundary: Thursday Jan 1 2026 → cycle starts Dec 28 2025
  - America/New_York (UTC-4 summer), UTC/GMT+0, Europe/Berlin (UTC+2)
  - Month boundary: Monday July 6 2026 SP → cycle starts July 5 2026

- **`task-template-schema.test.ts`** — 7 unit tests for `taskTemplateSchema` validating:
  - Valid complete input (title, assignedChildId, kredsValue, description)
  - Valid input without optional description
  - Float kredsValue (5.5) → rejected
  - Negative kredsValue (-1) → rejected
  - Zero kredsValue → rejected
  - Empty title → rejected
  - Invalid UUID assignedChildId → rejected

- **`task-templates.test.ts`** — 5 `it.todo` stubs for Wave 1 integration tests:
  - `createTaskTemplate` (ACT-01): valid creation, family isolation, kredsValue guard
  - `deactivateTaskTemplate` (ACT-03): is_active toggle, family isolation

RED state confirmed: "Cannot find module" errors for both implementation files.

### Task 2 — GREEN: Implementation files created (commit 9ec06a2)

- **`src/modules/activity/cycle.ts`** — exported `getCycleForDate(date, timezone)` pure function:
  - Step 1: `Intl.DateTimeFormat` with `weekday/year/month/day` → extract local date parts
  - Step 2: Map weekday string to `{Sun:0..Sat:6}` day-of-week index
  - Step 3: `Intl.DateTimeFormat` with `shortOffset` → regex `/GMT([+-])(\d+)(?::(\d+))?/` → `offsetMs`
  - Step 4: `Date.UTC(localYear, localMonth0, localDay - localDow) - offsetMs` (normalizes negative days)
  - Step 5: `cycleEnd = cycleStart + 7*24*60*60*1000 - 1`
  - Zero imports — pure Intl API, no external dependencies

- **`src/lib/db/tasks/schema.ts`** — `taskTemplateSchema` Zod schema:
  - `title: z.string().min(1).max(100)` with Portuguese error message
  - `description: z.string().max(500).optional()`
  - `assignedChildId: z.string().uuid()`
  - `kredsValue: z.coerce.number().int().positive()` — D-07 integer-only enforcement
  - Exports `taskTemplateSchema` and `TaskTemplateInput = z.infer<typeof taskTemplateSchema>`
  - Imports only `zod` — no drizzle-orm, no @/lib/db

- **`src/modules/glossary/terms.ts`** — Added `ACTIVITY_CYCLE: 'Activity Cycle'` term.

## Test Results

```
Test Files  2 passed | 1 skipped (3)
     Tests  16 passed | 5 todo (21)
  Duration  680ms
```

- 9/9 cycle tests pass (all timezone edge cases)
- 7/7 schema validation tests pass
- 5 todo stubs (Wave 1 integration targets)
- TypeScript: `npx tsc --noEmit` exits clean

## TDD Gate Compliance

- RED gate: commit `b0f8669` — `test(04-01): add failing tests...` — confirmed failing
- GREEN gate: commit `9ec06a2` — `feat(04-01): implement getCycleForDate and taskTemplateSchema...` — 16 tests pass
- REFACTOR: Not needed — implementation is already clean and documented

## Deviations from Plan

None — plan executed exactly as written.

**Note on task-templates.test.ts imports:** The plan specified importing `createTaskTemplate` and `deactivateTaskTemplate` from `'../../commands'`, but `commands.ts` does not exist yet (it is a Wave 1 artifact). The imports were commented out to prevent RED-phase crashes from blocking the todo stubs. The stubs themselves are correct and will be uncommented when Wave 1 creates `commands.ts`.

This is a minor clarification deviation (Rule 3 — prevents blocking import resolution error) that maintains the intent of the plan.

## Known Stubs

None — no stub patterns in production code. `it.todo` stubs in `task-templates.test.ts` are intentional placeholder tests for Wave 1 integration work.

## Threat Surface Scan

No new network endpoints, auth paths, or file access patterns introduced. `cycle.ts` is a pure function with no external surface. `schema.ts` is a Zod validation schema with no I/O. Threat T-04-01 (kredsValue tampering) mitigated by `z.coerce.number().int().positive()` as required.

## Self-Check

Files exist:
- `src/modules/activity/__tests__/cycle.test.ts` — FOUND
- `src/modules/activity/__tests__/task-template-schema.test.ts` — FOUND
- `src/modules/activity/__tests__/task-templates.test.ts` — FOUND
- `src/modules/activity/cycle.ts` — FOUND
- `src/lib/db/tasks/schema.ts` — FOUND
- `src/modules/glossary/terms.ts` — FOUND (modified)

Commits:
- `b0f8669` — test(04-01): RED state
- `9ec06a2` — feat(04-01): GREEN state

## Self-Check: PASSED
