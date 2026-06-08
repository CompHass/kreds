---
phase: 04-weekly-task-templates-and-activity-cycles
plan: "02"
subsystem: task-templates
tags:
  - drizzle-schema
  - api-route
  - ssr-page
  - task-templates
  - family-scoping

dependency_graph:
  requires:
    - "04-01"  # getCycleForDate, taskTemplateSchema (wave 0)
    - "03-xx"  # Kreds engine (families, child_profiles, identities schema)
  provides:
    - task_templates table in PostgreSQL
    - createTaskTemplate, updateTaskTemplate, deactivateTaskTemplate, reactivateTaskTemplate
    - getActiveTasksForFamily, getAllTasksForFamily
    - GET /api/families/tasks, POST /api/families/tasks
    - /family/tasks SSR page
    - /family/tasks/current SSR page with getCycleForDate
  affects:
    - "04-03"  # will consume getCycleForDate and /family/tasks/current (D-05)
    - "05-xx"  # Phase 5 will import createTaskTemplate and getCycleForDate

tech_stack:
  added: []
  patterns:
    - drizzle pgTable with index + check constraint
    - Next.js App Router GET/POST route handlers with Zod validation
    - SSR server component with auth guard + family membership lookup
    - Content-Type application/json CSRF guard on POST
    - FAM-05 family_id scoping on all DB queries
    - T-04-03 assignedChildId ownership validation before insert

key_files:
  created:
    - src/lib/db/schema/index.ts (extended with taskTemplates table)
    - src/lib/db/tasks/commands.ts
    - src/lib/db/tasks/queries.ts
    - src/app/api/families/tasks/route.ts
    - src/app/family/tasks/page.tsx
    - src/app/family/tasks/current/page.tsx
    - drizzle/0004_flimsy_norman_osborn.sql
  modified:
    - drizzle/meta/_journal.json
    - drizzle/meta/0004_snapshot.json

decisions:
  - "T-04-03: createTaskTemplate validates assignedChildId belongs to familyId via SELECT before insert — prevents cross-family child forgery"
  - "T-04-07: POST /api/families/tasks rejects requests without Content-Type application/json with 415 — CSRF guard"
  - "D-07: GET ?showInactive=true returns getAllTasksForFamily for audit; default returns getActiveTasksForFamily"
  - "Migration applied directly via pg client (drizzle-kit migrate stalled); migration file 0004_flimsy_norman_osborn.sql is the canonical artifact"
  - "/family/tasks/current uses getCycleForDate with family.timezone from DB — server-authoritative cycle computation"
  - "TaskCreationForm uses inline script for JSON POST — avoids server action complexity while maintaining CSRF guard"

metrics:
  duration: "~15 minutes"
  completed_date: "2026-06-08"
  tasks: 2
  files: 7
---

# Phase 04 Plan 02: Task Templates CRUD — Schema, API and SSR Pages Summary

**One-liner:** Drizzle task_templates schema with integer kreds_value CHECK + FAM-05 scoped CRUD commands/queries, GET/POST /api/families/tasks routes with CSRF guard, and SSR guardian pages at /family/tasks and /family/tasks/current.

## What Was Built

### Task 1: Drizzle Schema + Commands + Queries + Migration

**src/lib/db/schema/index.ts** extended with `taskTemplates`:
- UUID primary key, `family_id` FK, `assigned_child_id` FK
- `kreds_value` INTEGER with `CHECK (kreds_value > 0)` at DB level
- `is_active` BOOLEAN DEFAULT true, `deactivated_at` TIMESTAMP nullable (D-06)
- Two indexes: `task_templates_family_id_idx`, `task_templates_child_id_idx`

**src/lib/db/tasks/commands.ts** exports:
- `createTaskTemplate`: validates `assignedChildId` belongs to `familyId` before insert (T-04-03)
- `updateTaskTemplate`: partial update with family_id scoped WHERE (D-01, FAM-05)
- `deactivateTaskTemplate`: sets `is_active=false` + `deactivated_at` (D-06, D-08)
- `reactivateTaskTemplate`: sets `is_active=true` + clears `deactivated_at` (D-06)

**src/lib/db/tasks/queries.ts** exports:
- `getActiveTasksForFamily`: inner join with `childProfiles` for `childName`/`childAvatarPreset`, filters `is_active=true` AND `childProfiles.active=true`
- `getAllTasksForFamily`: all templates by family (for D-07 audit toggle)

**Migration**: `drizzle/0004_flimsy_norman_osborn.sql` — applied to k3s PostgreSQL cluster.

### Task 2: API Route + SSR Pages

**src/app/api/families/tasks/route.ts**:
- `GET`: derives `familyId` from session, `?showInactive=true` switches to `getAllTasksForFamily` (D-07)
- `POST`: 415 guard for non-`application/json` Content-Type (T-04-07), Zod validates body (T-04-05), `familyId` from session only (T-04-04), returns `201 + { id }` on success

**src/app/family/tasks/page.tsx**:
- SSR with `export const dynamic = 'force-dynamic'`
- Auth guard → redirect to `/api/auth/signin` or `/family/onboarding`
- Shows active/inactive toggle links (D-07)
- Inline task list with "Inativa" badge for deactivated templates
- TaskCreationForm with JSON fetch submit (CSRF guard maintained client-side)
- Link to `/family/tasks/current` (D-05)

**src/app/family/tasks/current/page.tsx**:
- Calls `getCycleForDate(new Date(), family.timezone)` — server-authoritative cycle (D-03, D-04)
- Displays cycle boundaries formatted with family timezone (`Intl.DateTimeFormat`)
- Groups active tasks by child with Kreds badge
- Biblical verse (Colossenses 3:23) — stewardship framing

## Acceptance Criteria Verification

| Criterion | Status |
|-----------|--------|
| POST /api/families/tasks with valid input returns 201 + { id } | IMPLEMENTED |
| POST with kredsValue float returns 400 (Zod rejects before DB) | IMPLEMENTED |
| POST with non-JSON Content-Type returns 415 (T-04-07) | IMPLEMENTED |
| GET returns only templates of authenticated family | IMPLEMENTED |
| assignedChildId from another family returns 400 (T-04-03) | IMPLEMENTED |
| /family/tasks loads with list and creation form | IMPLEMENTED |
| Toggle showInactive (D-07) switches between active-only and all | IMPLEMENTED |
| /family/tasks/current renders with getCycleForDate | IMPLEMENTED |
| npx tsc --noEmit clean | PASSED |
| All unit tests pass | PASSED (188 passing, 10 todo stubs) |

## Deviations from Plan

### Auto-fixed Issues

None — plan executed as written with one process deviation:

**1. [Rule 3 - Blocking] drizzle-kit migrate stalled in worktree context**
- **Found during:** Task 1 migration step
- **Issue:** `pnpm db:generate` ran correctly from worktree but `pnpm db:migrate` stalled indefinitely (exit code 1, no error message). Root cause: `drizzle-kit migrate` uses async PG connection that timed out silently in the worktree subprocess context.
- **Fix:** Applied migration SQL directly using Node.js `pg` client with explicit `statement-breakpoint` parsing. Migration applied successfully; table `task_templates` confirmed via `to_regclass` query.
- **Files:** `drizzle/0004_flimsy_norman_osborn.sql` remains the canonical migration artifact.

## Known Stubs

None — all form fields, queries, and API handlers are fully wired to real data.

## Threat Flags

No new threat surface beyond what is already documented in the plan's threat model. Both `/api/families/tasks` and `/family/tasks/current` were anticipated in the STRIDE register.

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| src/lib/db/schema/index.ts exports taskTemplates | FOUND |
| src/lib/db/tasks/commands.ts exports createTaskTemplate, updateTaskTemplate | FOUND |
| src/lib/db/tasks/queries.ts exports getActiveTasksForFamily, getAllTasksForFamily | FOUND |
| src/app/api/families/tasks/route.ts exports GET, POST | FOUND |
| src/app/family/tasks/page.tsx exports FamilyTasksPage | FOUND |
| src/app/family/tasks/current/page.tsx exists | FOUND |
| drizzle/0004_flimsy_norman_osborn.sql exists | FOUND |
| Commit 295ca76 (Task 1) | FOUND |
| Commit 62868b0 (Task 2) | FOUND |
| npx tsc --noEmit | PASSED (exit 0) |
| Unit tests (188 passing) | PASSED |
