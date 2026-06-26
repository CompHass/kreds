---
phase: 05-parent-panel
plan: "01"
subsystem: schema-and-seed
tags: [drizzle, schema, seed, tdd, parent-panel]
dependency_graph:
  requires:
    - "04-child-tasks (taskTemplates table exists)"
  provides:
    - "taskTemplates.category, taskTemplates.days, taskTemplates.approval columns"
    - "ParentTask interface + MOCK_PARENT_TASKS + CATEGORY_META + rewardLabel"
    - "parent-panel.test.tsx RED suite (PTASK-01..10)"
  affects:
    - "05-02 (consumes ParentTask interface and MOCK_PARENT_TASKS)"
    - "05-03 (consumes CATEGORY_META, rewardLabel, WEEKDAY_LABELS)"
    - "06 (API integration will INSERT with these schema columns)"
tech_stack:
  added: []
  patterns:
    - "Typed seed mock (interface + MOCK_PARENT_TASKS + CATEGORY_META + helpers)"
    - "TDD RED — test suite for not-yet-implemented component"
    - "Drizzle schema nullable column addition without breaking change"
key_files:
  created:
    - src/lib/seed/parent-seed.ts
    - tests/unit/parent-panel.test.tsx
  modified:
    - src/lib/db/schema/index.ts
decisions:
  - "D-03 columns: category (text nullable), days (jsonb nullable), approval (boolean notNull default false)"
  - "kreds_value_positive constraint preserved — conflict with reward=0 deferred to Phase 6"
  - "Database kreds_dev created from scratch: role kreds + database + drizzle-kit push (PostgreSQL was not running at execution start)"
  - "10 RED tests one-per-PTASK; import failure is the expected RED signal"
metrics:
  duration: "30 minutes"
  completed_date: "2026-06-26"
  tasks_completed: 4
  files_changed: 3
---

# Phase 05 Plan 01: Schema Foundation and Seed Data Summary

Schema additions (`category`, `days`, `approval`) applied to `task_templates` in PostgreSQL dev; typed seed mock `parent-seed.ts` created with interface, helpers, and 6 mock tasks covering all 5 categories; RED test suite `parent-panel.test.tsx` established for PTASK-01..10.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Adicionar colunas category/days/approval ao schema taskTemplates | `2633af4` | src/lib/db/schema/index.ts |
| 2 | Criar seed mock tipado parent-seed.ts | `e06f3ac` | src/lib/seed/parent-seed.ts |
| 3 | Criar suite RED parent-panel.test.tsx | `2bcec09` | tests/unit/parent-panel.test.tsx |
| 4 | drizzle-kit push — aplicar colunas no banco | (no code commit — DB operation) | task_templates (PostgreSQL) |

---

## What Was Built

### Task 1 — Schema update

Three columns added to `taskTemplates` in `src/lib/db/schema/index.ts`:

```typescript
category: text('category'),                        // nullable
days: jsonb('days').$type<string[]>(),             // nullable
approval: boolean('approval').notNull().default(false),
```

The `kreds_value_positive` check constraint (`kredsValue > 0`) was preserved unchanged.

### Task 2 — Typed seed mock

`src/lib/seed/parent-seed.ts` exports:
- `interface ParentTask` — 8 fields (id, title, category, reward, days, assigned, active, approval)
- `type Category` — union of the 5 category values
- `const CATEGORY_META` — Record with label, color, softBg for each category (exact hex from UI-SPEC)
- `const WEEKDAY_LABELS` — `['D','S','T','Q','Q','S','S']`
- `const ALL_DAYS` — full week alias
- `function rewardLabel(reward: number): string` — 'Mordomia' when 0, 'R$ X' otherwise
- `const MOCK_PARENT_TASKS` — 6 tasks covering all 5 categories, reward=0, active=false, approval=true

### Task 3 — RED test suite

`tests/unit/parent-panel.test.tsx` contains 10 `it()` blocks each referencing one PTASK:
- PTASK-01: sidebar/main/form panel presence via testids
- PTASK-02: topbar breadcrumb (familyName) and user badge (currentUserName)
- PTASK-03: filter chips "Todas" + one per child
- PTASK-04: toggle (role=switch) + edit button; toggle does not open form
- PTASK-05: category colors rendered in DOM
- PTASK-06: "+ Nova tarefa" opens form with all required fields
- PTASK-07: stepper shows "Mordomia" at 0, "R$ 1" after increment
- PTASK-08: recurrence pills toggle; "Todos os dias" selects all 7
- PTASK-09: card receives kredsNew animation after task creation
- PTASK-10: "Excluir tarefa" hidden in create mode, visible in edit mode

Suite status: **RED** (fails with "Failed to resolve import parent-panel-view" — expected until Wave 2).

### Task 4 — Database push

Applied via `DATABASE_URL=postgresql://kreds:kreds_dev@localhost:5432/kreds_dev pnpm db:push`.

Verified via psql information_schema:
```
approval | false | NO
category |       | YES
days     |       | YES
```

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] PostgreSQL not running + kreds_dev database did not exist**

- **Found during:** Task 4 (drizzle-kit push attempt)
- **Issue:** `brew services start postgresql@16` returned status "none"; `psql` reported "Connection refused". The `kreds_dev` database and `kreds` role did not exist in the local PostgreSQL installation.
- **Fix:** Started the Homebrew postgresql@16 service; created `kreds` role and `kreds_dev` database; re-ran `pnpm db:push` successfully.
- **Files modified:** None (DB operation only)
- **Commit:** N/A (no code change)

---

## Known Stubs

None. This plan produces infrastructure only (schema, seed, RED tests) — no UI components with stub data paths.

---

## Threat Flags

No new security-relevant surface introduced. The schema columns are nullable/with default and apply no network endpoints or new trust boundaries. Threat T-05-01 (schema tampering) was mitigated: no DROP occurred, all 3 columns are nullable/with default, verified via information_schema.

---

## Self-Check: PASSED

- FOUND: src/lib/db/schema/index.ts (modified — 3 new columns)
- FOUND: src/lib/seed/parent-seed.ts (created)
- FOUND: tests/unit/parent-panel.test.tsx (created — RED)
- FOUND: .planning/phases/05-parent-panel/05-01-SUMMARY.md
- FOUND: commit 2633af4 (schema)
- FOUND: commit e06f3ac (parent-seed.ts)
- FOUND: commit 2bcec09 (RED tests)
