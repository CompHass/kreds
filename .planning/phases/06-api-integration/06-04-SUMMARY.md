---
phase: 06-api-integration
plan: "04"
subsystem: ui-api-wiring
tags: [api-integration, parent-panel, child-garden, server-actions, harvest]
dependency_graph:
  requires: ["06-02", "06-03"]
  provides: ["API-01", "API-02", "API-03"]
  affects: ["src/app/family/[familyId]/tasks/page.tsx", "src/app/(child)/child/[childId]/garden/page.tsx", "src/components/parent/parent-panel-view.tsx", "src/components/garden/garden-view.tsx"]
tech_stack:
  added: []
  patterns: ["SSR-DB-query", "optimistic-mutation", "server-action-wiring", "fetch-with-idempotency-key"]
key_files:
  created: []
  modified:
    - src/app/family/[familyId]/tasks/page.tsx
    - src/app/(child)/child/[childId]/garden/page.tsx
    - src/components/parent/parent-panel-view.tsx
    - src/components/garden/garden-view.tsx
    - src/lib/seed/garden-seed.ts
decisions:
  - "handleSave (create) uses real DB UUID from createTask().id — no local crypto.randomUUID() (Pitfall 6, T-06-19)"
  - "handleToggle is fire-and-forget — optimistic UI sufficient for toggle, server confirmed async"
  - "handleSave (edit) applies optimistic update first, then awaits updateTask in try/catch"
  - "handleHarvest 409 treated as idempotent success — overlay shows regardless (not an error)"
  - "harvest body.familyId passes empty string — server reads familyId from signed JWT (T-06-13)"
  - "harvestCommandId uses useState(() => crypto.randomUUID()) for stable UUID across re-renders"
  - "pnpm build: TypeScript compiled + type-checked successfully; page-data collection fails only on missing env vars (pre-existing CI constraint)"
metrics:
  duration: "8min"
  completed_date: "2026-06-27"
  tasks: 2
  files: 5
---

# Phase 06 Plan 04: UI-to-API Wiring Summary

**One-liner:** Replaced mock seeds with real Drizzle queries in SSR pages; wired Server Actions into ParentPanelView mutations and POST /harvest into GardenView with stable commandId idempotency.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Replace MOCK_PARENT_TASKS + wire Server Actions | 960279b | tasks/page.tsx, parent-panel-view.tsx |
| 2 | Replace SEED_STAGE_C + wire harvest POST | e3204dc | garden/page.tsx, garden-view.tsx, garden-seed.ts |

## What Was Built

### Task 1: Parent Panel — Real DB Queries + Server Actions (API-01, API-02)

**`src/app/family/[familyId]/tasks/page.tsx`**
- Removed `MOCK_PARENT_TASKS` import from `@/lib/seed/parent-seed`
- Added `taskTemplates` to schema imports
- Replaced sequential queries with `Promise.all([childProfiles, taskTemplates, families])`
- Maps DB rows to `ParentTask` shape: `id`, `category` (nullable → 'quarto' fallback), `reward` (kredsValue), `days` (jsonb nullable → []), `assigned` ([assignedChildId]), `active`, `approval`
- T-06-15 enforced: all queries scoped by `familyId` from URL params

**`src/components/parent/parent-panel-view.tsx`**
- Added imports: `createTask`, `updateTask`, `deactivateTask`, `toggleTaskActive` from `@/app/actions/tasks`
- `handleSave` (create mode): calls `createTask()` → uses `saved.id` (real UUID from server, not `crypto.randomUUID()`)
- `handleSave` (edit mode): optimistic UI update first → `await updateTask()` in background try/catch
- `handleDelete`: optimistic remove → `await deactivateTask()` in try/catch
- `handleToggle`: optimistic toggle → fire-and-forget `toggleTaskActive()` (`.catch(console.error)`)

### Task 2: Child Garden — Real DB Queries + Harvest POST (API-02, API-03)

**`src/app/(child)/child/[childId]/garden/page.tsx`**
- Removed `SEED_STAGE_C` import from `@/lib/seed/garden-seed`
- Added imports: `taskTemplates`, `taskCompletions`, `childProfiles`, `wishlistGoals` from schema; `getCurrentCycleStart` from cycles
- `Promise.all([taskTemplates, taskCompletions, childProfiles, wishlistGoals, bibleVerses])`
- Filters: `assignedChildId = childId`, `cycleStart = getCurrentCycleStart()` (ISO date string)
- Builds `completedIds` Set from `taskCompletions.status === 'completed'`
- Maps `GardenTask[]` with `kredsValue` for harvest sum
- T-06-16 enforced: assignedChildId filter prevents cross-child data leakage

**`src/components/garden/garden-view.tsx`**
- Added `childId` destructuring to component signature (was already in props interface)
- Added `harvestCommandId` state: `useState(() => crypto.randomUUID())` — stable across re-renders
- Added `harvestPending` guard to prevent double-submit
- `handleHarvest`: calls `POST /api/child/${childId}/harvest` with `{commandId, totalAmount, familyId: ''}`
- `totalAmount` = sum of `t.kredsValue ?? 0` for completed tasks
- 409 response = already harvested this cycle → shows overlay (idempotent success)
- Other errors = logged to console, no crash

**`src/lib/seed/garden-seed.ts`**
- Added `kredsValue?: number` to `GardenTask` interface (backward-compatible — existing seed constants omit it, defaulting to 0 in reduce)

## Verification

```
pnpm tsc --noEmit: 0 errors in modified files
pnpm test (17 tests): 3/3 test files passed
grep MOCK_PARENT_TASKS src/app: 0 import occurrences (only in comment)
grep SEED_STAGE_C src/app: 0 import occurrences (only in comment)
pnpm build: compiled + TypeScript passed; page-data collection fails on missing env vars (pre-existing CI constraint — not a code error)
```

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

| Stub | File | Notes |
|------|------|-------|
| `coins: 0` | garden/page.tsx | Balance not yet calculated from ledger (deferred — ledger queries in future phase) |
| `season: 'primavera'` | garden/page.tsx | Season derived from date/family settings in future phase |
| `titheDone: false` | garden/page.tsx | Tithe status tracked in future phase |
| `harvested: false` | garden/page.tsx | Harvest state from ledger not read back yet (harvest write works, read deferred) |
| `familyId: ''` in harvest body | garden-view.tsx | Server reads familyId from JWT session; body field intentionally empty per Phase 6 security decision |

These stubs do not prevent the plan's goal: real tasks load, mutations persist, harvest writes to ledger.

## Threat Flags

No new security surfaces beyond what was planned in the threat model.

## Self-Check: PASSED

- [x] `src/app/family/[familyId]/tasks/page.tsx` exists and modified
- [x] `src/app/(child)/child/[childId]/garden/page.tsx` exists and modified
- [x] `src/components/parent/parent-panel-view.tsx` exists and modified
- [x] `src/components/garden/garden-view.tsx` exists and modified
- [x] `src/lib/seed/garden-seed.ts` exists and modified
- [x] Commit 960279b exists (Task 1)
- [x] Commit e3204dc exists (Task 2)
- [x] No MOCK_PARENT_TASKS import in src/app
- [x] No SEED_STAGE_C import in src/app
