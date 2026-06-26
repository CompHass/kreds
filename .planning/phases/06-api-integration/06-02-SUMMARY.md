---
phase: 06-api-integration
plan: 02
subsystem: api
tags: [task-crud, route-handlers, server-actions, zod, drizzle, next-auth, typescript]

# Dependency graph
requires:
  - phase: 06-01
    provides: ledger domain modules + getCurrentCycleStart
  - phase: 05-parent-panel
    provides: ParentTask type in parent-seed.ts + taskTemplates Drizzle schema
provides:
  - ParentTask interface + Category type in src/types/task.ts (single source of truth)
  - CreateTaskSchema and UpdateTaskSchema Zod validators
  - GET /api/family/[familyId]/tasks — list isActive tasks with familyId isolation
  - POST /api/family/[familyId]/tasks — create task, returns 201 with persisted row
  - PATCH /api/family/[familyId]/tasks/[taskId] — partial update, returns updated row
  - DELETE /api/family/[familyId]/tasks/[taskId] — soft-delete, returns {ok:true}
  - createTask Server Action (returns real DB UUID — prevents fake-id desync)
  - updateTask Server Action (partial update with revalidatePath)
  - toggleTaskActive Server Action (toggle isActive flag)
  - deactivateTask Server Action (soft-delete with deactivatedAt)
affects: [06-03, 06-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "await params before destructuring in all Next.js 15+ Route Handlers"
    - "familyId isolation via eq(taskTemplates.familyId, familyId) on every WHERE clause"
    - "Soft-delete pattern: isActive=false + deactivatedAt=now() preserves audit history"
    - "Server Actions return real DB row from .returning() to prevent optimistic UUID desync"
    - "revalidatePath uses concrete path /family/${familyId}/tasks (not pattern)"
    - "auth.ts at project root imported via relative path (not @/auth — outside src/)"

key-files:
  created:
    - src/types/task.ts
    - src/app/api/family/[familyId]/tasks/route.ts
    - src/app/api/family/[familyId]/tasks/[taskId]/route.ts
    - src/app/actions/tasks.ts
  modified:
    - src/lib/seed/parent-seed.ts
    - src/components/parent/parent-panel-view.tsx

key-decisions:
  - "06-02: auth.ts is at project root (not in src/), so @/auth alias fails — use relative import path"
  - "06-02: parent-seed.ts uses import+re-export pattern for ParentTask/Category (not just export type) so the names are available for use within the same file"
  - "06-02: Server Actions import CreateTaskSchema from @/types/task (not redefined locally) — DRY"

patterns-established:
  - "Type extraction: interface defined once in src/types/*.ts; re-exported from seed files via import+re-export"
  - "Route Handler auth pattern: await auth() → 401 if !session → proceed"
  - "Server Action auth pattern: await auth() → throw Error('Unauthorized') if !session → proceed"

requirements-completed: [API-01, API-02]

# Metrics
duration: 15min
completed: 2026-06-26
---

# Phase 06 Plan 02: Task CRUD Layer Summary

**Task Route Handlers (GET/POST/PATCH/DELETE) + Server Actions (createTask/updateTask/toggleTaskActive/deactivateTask) + ParentTask type extracted to src/types/task.ts with Zod validators**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-06-26T23:36:00Z
- **Completed:** 2026-06-26T23:51:16Z
- **Tasks:** 3
- **Files created:** 4
- **Files modified:** 2

## Accomplishments

- Extracted `ParentTask` interface and `Category` type from `src/lib/seed/parent-seed.ts` to `src/types/task.ts` — single source of truth for both API and UI layers
- Added `CreateTaskSchema` and `UpdateTaskSchema` Zod validators for Route Handler request body validation (title required, kredsValue > 0, days array 0-6, assignedChildId UUID)
- Created `GET /api/family/[familyId]/tasks` — returns all isActive tasks for a family, auth-guarded
- Created `POST /api/family/[familyId]/tasks` — creates task with Zod validation, returns 201 with persisted row
- Created `PATCH /api/family/[familyId]/tasks/[taskId]` — partial update with UpdateTaskSchema, returns updated row or 404
- Created `DELETE /api/family/[familyId]/tasks/[taskId]` — soft-delete (isActive=false + deactivatedAt), returns {ok:true}
- Created four Server Actions for ParentPanelView: `createTask`, `updateTask`, `toggleTaskActive`, `deactivateTask`
- All handlers/actions call `auth()` before DB access and use `familyId` in every WHERE clause
- TypeScript clean: zero errors in `src/` (`pnpm tsc --noEmit`)

## Task Commits

1. **Task 1: Extract ParentTask type + Zod schemas** — `ee4943f`
2. **Task 2: Route Handlers GET/POST + PATCH/DELETE** — `6045487`
3. **Task 3: Server Actions for ParentPanelView** — `cd0973b`

## Files Created/Modified

- `src/types/task.ts` — `ParentTask` interface, `Category` type, `VALID_CATEGORIES`, `CreateTaskSchema`, `UpdateTaskSchema`
- `src/app/api/family/[familyId]/tasks/route.ts` — GET (list) + POST (create) with auth + familyId isolation
- `src/app/api/family/[familyId]/tasks/[taskId]/route.ts` — PATCH (update) + DELETE (soft-delete)
- `src/app/actions/tasks.ts` — `createTask`, `updateTask`, `toggleTaskActive`, `deactivateTask`
- `src/lib/seed/parent-seed.ts` — now re-exports ParentTask/Category from `@/types/task`
- `src/components/parent/parent-panel-view.tsx` — updated import to `@/types/task`

## Decisions Made

- `auth.ts` lives at the project root (not inside `src/`), so the `@/auth` alias (which maps to `./src/`) fails with TS2307. Fixed by using relative paths: `../../../../../../auth` for tasks/route.ts and `../../../../../../../auth` for tasks/[taskId]/route.ts. This matches the pattern used in `src/app/family/access/[familyId]/page.tsx` and `src/app/api/auth/[...nextauth]/route.ts`.
- `parent-seed.ts` uses `import type { ParentTask, Category } from '@/types/task'` plus `export type { ParentTask, Category }` (import-then-re-export pattern) because TypeScript `export type { ... } from` creates a re-export-only declaration — names are not available for use within the same file. The seed file still references `Category` in `CATEGORY_META: Record<Category, ...>` and `ParentTask` in `MOCK_PARENT_TASKS: ParentTask[]`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed @/auth alias resolution in Route Handlers**
- **Found during:** Task 2
- **Issue:** Plan specified `import { auth } from '@/auth'` but `@/` maps to `./src/*` in tsconfig — `auth.ts` is at project root, not in `src/`, causing TS2307 error
- **Fix:** Used relative import path matching existing project patterns (`../../../../../../auth`)
- **Files modified:** `src/app/api/family/[familyId]/tasks/route.ts`, `src/app/api/family/[familyId]/tasks/[taskId]/route.ts`
- **Commit:** `6045487`

**2. [Rule 1 - Bug] Fixed TypeScript error in parent-seed.ts after type extraction**
- **Found during:** Task 1
- **Issue:** `export type { ParentTask, Category } from '@/types/task'` alone does not make those names available for use within the same file — TypeScript reported "Cannot find name 'Category'" and "Cannot find name 'ParentTask'" on lines referencing `CATEGORY_META: Record<Category, ...>` and `MOCK_PARENT_TASKS: ParentTask[]`
- **Fix:** Added `import type { ParentTask, Category } from '@/types/task'` before the re-export declaration
- **Files modified:** `src/lib/seed/parent-seed.ts`
- **Commit:** `ee4943f`

## Threat Surface Scan

New network endpoints introduced in this plan:

| Flag | File | Description |
|------|------|-------------|
| GET endpoint | `src/app/api/family/[familyId]/tasks/route.ts` | Returns task list — auth() guard present (T-06-04 mitigated) |
| POST endpoint | `src/app/api/family/[familyId]/tasks/route.ts` | Creates task — auth() + Zod validation (T-06-05, T-06-06, T-06-07 mitigated) |
| PATCH endpoint | `src/app/api/family/[familyId]/tasks/[taskId]/route.ts` | Updates task — auth() + familyId isolation (T-06-05 mitigated) |
| DELETE endpoint | `src/app/api/family/[familyId]/tasks/[taskId]/route.ts` | Soft-deletes task — auth() + familyId isolation (T-06-05 mitigated) |

All threat mitigations from the plan's STRIDE register (T-06-04 through T-06-08) are implemented as specified.

## Known Stubs

None — no UI wiring in this plan. The Route Handlers and Server Actions are complete backend implementations. Plan 06-04 will wire ParentPanelView to these Server Actions.

## Next Phase Readiness

- Route Handlers ready for external REST client testing
- Server Actions (`createTask`, `updateTask`, `toggleTaskActive`, `deactivateTask`) ready for Plan 06-04 to import and wire to ParentPanelView
- `CreateTaskSchema` and `UpdateTaskSchema` available in `@/types/task` for any additional validation needs

---
*Phase: 06-api-integration*
*Completed: 2026-06-26*
