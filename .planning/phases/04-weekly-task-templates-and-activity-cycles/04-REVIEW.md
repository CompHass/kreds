---
phase: 04-weekly-task-templates-and-activity-cycles
reviewed: 2026-06-08T00:00:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - drizzle/0004_flimsy_norman_osborn.sql
  - drizzle/meta/0004_snapshot.json
  - drizzle/meta/_journal.json
  - src/app/api/families/tasks/[id]/route.ts
  - src/app/api/families/tasks/route.ts
  - src/app/family/tasks/current/page.tsx
  - src/app/family/tasks/page.tsx
  - src/lib/db/schema/index.ts
  - src/lib/db/tasks/commands.ts
  - src/lib/db/tasks/queries.ts
  - src/lib/db/tasks/schema.ts
  - src/modules/activity/__tests__/cycle.test.ts
  - src/modules/activity/__tests__/task-template-schema.test.ts
  - src/modules/activity/__tests__/task-templates.test.ts
  - src/modules/activity/cycle.ts
  - src/modules/glossary/terms.ts
findings:
  critical: 3
  warning: 4
  info: 2
  total: 9
status: issues_found
---

# Phase 04: Code Review Report

**Reviewed:** 2026-06-08T00:00:00Z
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

This phase implements weekly task templates (`task_templates` table), the `getCycleForDate` pure function for computing Sunday–Saturday activity cycles, and the guardian-facing task management UI. The auth scaffolding (family-scoped writes, guardian role checks) is consistent across both API routes. The Zod validation layer and the child-ownership cross-check in `createTaskTemplate` are correctly placed.

Three blockers were found: (1) the PATCH route is missing the `Content-Type: application/json` guard that the POST route carries for CSRF protection; (2) `getCycleForDate` throws an unhandled `RangeError` when the database contains an invalid timezone string, crashing the current-cycle page with an unrecoverable 500; (3) `createTaskTemplate` performs a child-ownership check and the insert as two separate, non-atomic queries (TOCTOU), meaning a child deactivated in between the two queries can receive a template that references a deactivated profile, violating the D-06 invariant without any error signal.

---

## Critical Issues

### CR-01: PATCH `/api/families/tasks/:id` missing Content-Type CSRF guard

**File:** `src/app/api/families/tasks/[id]/route.ts:36`
**Issue:** The `POST /api/families/tasks` route correctly rejects requests whose `Content-Type` is not `application/json` (T-04-07, status 415). The `PATCH /api/families/tasks/:id` route — which can deactivate, reactivate, or update templates — has no equivalent guard. A cross-origin HTML form with `method="post"` and `action` pointing at a PATCH-capable endpoint can be issued via a browser; while PATCH is not directly triggerable via a plain HTML form, the absence of the guard is a defense-in-depth failure documented as a project requirement (T-04-07) and should be applied uniformly to all mutating routes.

**Fix:**
```typescript
// Add at the top of the PATCH handler, before auth checks:
if (!request.headers.get('content-type')?.includes('application/json')) {
  return NextResponse.json(
    { error: 'Content-Type must be application/json' },
    { status: 415 },
  )
}
```

---

### CR-02: `getCycleForDate` throws uncaught `RangeError` on invalid timezone — crashes current-cycle page

**File:** `src/modules/activity/cycle.ts:16` and `src/app/family/tasks/current/page.tsx:57`
**Issue:** `getCycleForDate` constructs an `Intl.DateTimeFormat` with the caller-supplied `timezone`. When that string is not a valid IANA timezone identifier (e.g., a corrupted DB row), the `Intl` constructor throws `RangeError: Invalid time zone specified: …`. This error is not caught by the caller in `current/page.tsx`, so the entire page crashes with an unhandled exception and renders a 500 to the user with no recovery path. The timezone value comes from `families.timezone` which is a freeform `varchar(64)` with no runtime validation beyond what was checked at family-creation time; a data migration or manual DB edit could introduce an invalid value.

**Fix — option A (guard in cycle.ts):**
```typescript
export function getCycleForDate(
  date: Date,
  timezone: string
): { cycleStart: Date; cycleEnd: Date } {
  // Validate timezone before use; throw a descriptive error early.
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone })
  } catch {
    throw new RangeError(`Invalid timezone: "${timezone}"`)
  }
  // … rest of function unchanged
}
```

**Fix — option B (guard in the page, preferred for resilience):**
```typescript
// In current/page.tsx, wrap the getCycleForDate call:
let cycleStart: Date, cycleEnd: Date
try {
  ;({ cycleStart, cycleEnd } = getCycleForDate(new Date(), timezone))
} catch {
  // Fall back to UTC so the page remains functional.
  ;({ cycleStart, cycleEnd } = getCycleForDate(new Date(), 'UTC'))
}
```

---

### CR-03: `createTaskTemplate` child-ownership check is not atomic (TOCTOU)

**File:** `src/lib/db/tasks/commands.ts:30-57`
**Issue:** `createTaskTemplate` first queries `child_profiles` to confirm the child belongs to the family and is active (lines 30–44), then issues a separate `INSERT` (lines 46–57). These are two independent database round-trips with no transaction wrapping them. Between the two queries a concurrent request could deactivate the child (`active = false`). The insert would then succeed, creating a task template for a deactivated child — violating the constraint the code claims to enforce and leaving an orphaned active template that `getActiveTasksForFamily` hides (because it filters `childProfiles.active = true`) but never removes. The template persists indefinitely in the "invisible" state with no cleanup path.

**Fix:**
```typescript
export async function createTaskTemplate(input: { … }): Promise<{ id: string }> {
  return db.transaction(async (tx) => {
    const [child] = await tx
      .select({ id: schema.childProfiles.id })
      .from(schema.childProfiles)
      .where(
        and(
          eq(schema.childProfiles.id, input.assignedChildId),
          eq(schema.childProfiles.familyId, input.familyId),
          eq(schema.childProfiles.active, true),
        ),
      )
      .limit(1)

    if (!child) {
      throw new Error('Child not found in this family')
    }

    const [row] = await tx
      .insert(schema.taskTemplates)
      .values({ … })
      .returning({ id: schema.taskTemplates.id })

    return row
  })
}
```

---

## Warnings

### WR-01: PATCH route returns `{ success: true }` when template does not exist (silent 0-row update)

**File:** `src/app/api/families/tasks/[id]/route.ts:93-115`
**Issue:** `deactivateTaskTemplate`, `reactivateTaskTemplate`, and `updateTaskTemplate` all issue a `UPDATE … WHERE id = ? AND family_id = ?` without checking the number of affected rows. None return a value the PATCH handler uses to distinguish "0 rows matched" from "1 row updated". The route unconditionally returns `{ success: true }` with HTTP 200 for all three actions. A client that sends a request for a non-existent or already-deleted template ID receives a successful response — making it impossible to detect template-not-found errors and creating misleading feedback for guardian UIs.

**Fix:**
```typescript
// In commands.ts, use .returning() to detect absence:
export async function deactivateTaskTemplate(
  templateId: string,
  familyId: string,
): Promise<boolean> {
  const rows = await db
    .update(schema.taskTemplates)
    .set({ isActive: false, deactivatedAt: new Date(), updatedAt: new Date() })
    .where(and(
      eq(schema.taskTemplates.id, templateId),
      eq(schema.taskTemplates.familyId, familyId),
    ))
    .returning({ id: schema.taskTemplates.id })
  return rows.length > 0
}

// In route.ts, check the return value:
const found = await deactivateTaskTemplate(templateId, membership.familyId)
if (!found) {
  return NextResponse.json({ error: 'Template not found' }, { status: 404 })
}
```

---

### WR-02: `kredsValue` has no upper-bound validation — arbitrary large integers accepted

**File:** `src/lib/db/tasks/schema.ts:16-21` and `drizzle/0004_flimsy_norman_osborn.sql:12`
**Issue:** The Zod schema validates `kredsValue` as `int().positive()` with no maximum. The DB CHECK constraint is also `> 0` only. A guardian could create a task with `kredsValue = 2147483647` (PostgreSQL `integer` max). While the DB column type caps physical overflow, there is no business-logic upper bound. Combined with the fact that Phase 5 will credit this value to a child's ledger on completion, an unbounded `kredsValue` is a data integrity risk that is easier to fix at the schema layer than after the fact.

**Fix:**
```typescript
// In src/lib/db/tasks/schema.ts:
kredsValue: z
  .coerce
  .number()
  .int('Valor deve ser número inteiro')
  .positive('Valor deve ser positivo')
  .max(10000, 'Valor máximo é 10.000 Kreds'),
```
Add a matching DB CHECK constraint in the next migration:
```sql
CONSTRAINT "kreds_value_max" CHECK ("task_templates"."kreds_value" <= 10000)
```

---

### WR-03: PATCH `action='update'` accepts empty payload — silently no-ops with only `updatedAt` changed

**File:** `src/app/api/families/tasks/[id]/route.ts:19-23` and `src/lib/db/tasks/commands.ts:73-85`
**Issue:** The `patchBodySchema` allows `{ action: 'update' }` with no `title`, `description`, or `kredsValue` fields — all three are `.optional()`. When all are absent, `updateTaskTemplate` builds an `updates` object containing only `updatedAt: new Date()` and fires an `UPDATE` that sets only the timestamp. The record is "updated" with no meaningful change. No validation enforces that at least one editable field must be present for `action='update'`.

**Fix:**
```typescript
// Apply a Zod superRefine to the update action:
const patchBodySchema = z
  .object({
    action: z.enum(['deactivate', 'reactivate', 'update']),
    title: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    kredsValue: z.coerce.number().int().positive().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.action === 'update' &&
      data.title === undefined &&
      data.description === undefined &&
      data.kredsValue === undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one field (title, description, kredsValue) must be provided for action=update',
      })
    }
  })
```

---

### WR-04: `templateId` URL parameter is never validated as a UUID — invalid format may produce a DB error

**File:** `src/app/api/families/tasks/[id]/route.ts:91`
**Issue:** The route extracts `templateId` from `await params` as a raw string and passes it directly to `deactivateTaskTemplate`, `reactivateTaskTemplate`, and `updateTaskTemplate`, which embed it in a Drizzle `eq(schema.taskTemplates.id, templateId)` WHERE clause. PostgreSQL `uuid` columns reject non-UUID strings and throw `invalid input syntax for type uuid`. Drizzle does not pre-validate UUID format before sending the query. A request to `PATCH /api/families/tasks/not-a-uuid` will hit the DB and raise an unhandled exception that the generic `catch` block converts to a `400` — but the root cause is missing input validation, not a bad request body.

**Fix:**
```typescript
// Validate templateId before any DB call:
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const { id: templateId } = await params
if (!UUID_RE.test(templateId)) {
  return NextResponse.json({ error: 'Invalid template id' }, { status: 400 })
}
```
Or equivalently: `z.string().uuid().safeParse(templateId)`.

---

## Info

### IN-01: `task-templates.test.ts` — all test cases are `.todo` with commented-out imports

**File:** `src/modules/activity/__tests__/task-templates.test.ts:1-17`
**Issue:** The integration tests for `createTaskTemplate` and `deactivateTaskTemplate` are entirely placeholder `it.todo(...)` calls and the import lines are commented out. Five critical behaviors (cross-family child forgery, `kredsValue <= 0` rejection, multi-family isolation) have no automated coverage. This is acknowledged as "Wave 1" scaffolding but ships as-is.

**Fix:** Implement the test cases before Phase 5 ships, using Drizzle's in-memory or test-DB setup. At minimum, un-comment the imports and add one integration test each for the happy path and the cross-family forgery guard.

---

### IN-02: `TaskCreationForm` is not a `'use client'` component but relies on inline script for all interactivity

**File:** `src/app/family/tasks/page.tsx:324-503`
**Issue:** `TaskCreationForm` is defined as a plain function inside a server-component file with no `'use client'` directive. The form's interactivity is wired entirely through a `dangerouslySetInnerHTML` inline `<script>` tag that attaches a `submit` event listener after page load. This works at runtime but is architecturally fragile: the pattern bypasses React's event model and does not support CSP policies that block inline scripts (`script-src 'nonce-...'`). If a CSP header is added in a future phase, the form will silently break.

**Fix:** Extract `TaskCreationForm` into a dedicated `'use client'` component (e.g., `src/app/family/tasks/TaskCreationForm.client.tsx`) and use a standard React `onSubmit` handler with `useState` for loading/error state. This eliminates the inline script and makes the component testable.

---

_Reviewed: 2026-06-08T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
