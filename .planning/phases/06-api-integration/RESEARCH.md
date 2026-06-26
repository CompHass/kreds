# Phase 6: API Integration - Research

**Researched:** 2026-06-26
**Domain:** Next.js 15+ Route Handlers, Server Actions, Drizzle ORM, Kreds Ledger Engine
**Confidence:** HIGH

## Summary

Phase 6 connects the Kreds UI to real database queries, replacing the MOCK_PARENT_TASKS and SEED_STAGE_C seed data with live Drizzle queries against PostgreSQL. It also introduces the Harvest endpoint — a POST Route Handler that writes immutable ledger events — and creates the domain modules that tests already reference but that do not yet exist on disk.

The codebase has a critical pre-existing technical debt: `tests/integration/ledger-engine.test.ts` imports `src/modules/ledger/engine` and `tests/unit/ledger-calculate.test.ts` imports `src/modules/ledger/calculate`, but neither file exists. Similarly `tests/unit/ledger-queries.test.ts` imports `src/modules/ledger/queries`. These modules must be created in Phase 6 before the harvest endpoint can be wired. The test suite currently fails 15 of 35 test files; 6 of those failures are directly caused by missing ledger and family module files.

The Harvest endpoint (POST /api/child/[childId]/harvest) is the most complex piece. It must use `db.transaction()` to atomically write a `ledger_transactions` header and two `ledger_lines` (available: 90%, firstfruits: 10%) and enforce idempotency via the unique `commandId` index that already exists in the schema. The 10% firstfruits split uses ceiling math (`Math.ceil(amount * 0.10)`) to ensure the firstfruits amount is never zero. A duplicate POST for the same `commandId` will throw PostgreSQL error code `23505` — the Route Handler must catch it and return 409 Conflict rather than 500.

**Primary recommendation:** Build the ledger domain module first (`src/modules/ledger/`), then wire the Task CRUD Route Handlers using Server Actions for parent panel mutations, and finally connect both pages by replacing seed data with real SSR queries.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Task CRUD (list, create, update, deactivate) | API / Backend (Server Actions) | Frontend Server (SSR page.tsx) | Mutations belong on the server; ParentPanelView is 'use client' so it must call Server Actions, not direct Drizzle queries |
| Harvest ledger write | API / Backend (Route Handler) | — | Child garden calls this via fetch; route handler enforces auth + idempotency server-side |
| Task list render (parent panel) | Frontend Server (SSR) | — | page.tsx already queries childProfiles; extend same pattern to also query taskTemplates |
| Garden task list render | Frontend Server (SSR) | — | garden/page.tsx replaces SEED_STAGE_C with db query for active taskTemplates for this child |
| Ledger calculation (firstfruits split) | API / Backend (server-only module) | — | Pure function — no DB access; imported by harvest route and ledger engine |
| Family isolation enforcement | API / Backend | Database (RLS) | familyId param on every query + auth session cross-check; RLS is defense-in-depth |
| Idempotency enforcement | Database (unique index) | API / Backend (catch 23505) | `commandId` unique index already in schema; API layer catches and converts to 409 |
| Cycle date computation | API / Backend (server-only util) | — | Sunday–Saturday cycle start is pure date math; computed server-side, never trusted from client |

## Standard Stack

### Core (already installed — no new dependencies needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `drizzle-orm` | 0.45.2 | Typed SQL queries and transactions | Project standard; `.returning()` and `.onConflictDoNothing()` used for insert patterns |
| `pg` | 8.21.0 | PostgreSQL driver (via Pool) | Project standard; `Pool` already exported from `src/lib/db/index.ts` |
| `next` | 16.2.7 | App Router, Route Handlers, Server Actions | Project standard; params is `Promise<{...}>` — must `await` |
| `zod` | 4.4.3 | Request body validation in Route Handlers | Project standard; validates harvest request body before writing to DB |
| `server-only` | 0.0.1 | Prevent ledger modules from leaking to client bundle | Already installed; used in child-pin.ts, child-session.ts — apply same pattern to ledger modules |
| `next-auth` | 5.0.0-beta.31 | `auth()` call for session check in Route Handlers | Project standard; import from root `auth.ts` |

**No new packages required for Phase 6.** All dependencies are already in `package.json`.

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `drizzle-kit` | 0.31.10 | `db:push` and `db:generate` | Use `pnpm db:push` after any schema changes — not needed for Phase 6 since schema is stable |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Server Actions for parent panel mutations | Route Handlers | Server Actions are simpler for 'use client' components calling mutations — no fetch() boilerplate, automatic CSRF protection, directly callable from onClick |
| Route Handler for harvest | Server Action | Harvest is called from child garden (different route group, potentially offline-resumable) — Route Handler gives explicit URL contract and standard HTTP status codes for idempotency |
| `onConflictDoNothing` for commandId | Catch `23505` error | Both work; `onConflictDoNothing` silently skips — for harvest we want 409 to signal to the client that harvest was already done. Use explicit catch of `23505` error code |

## Package Legitimacy Audit

No new packages are introduced in Phase 6. All packages are already installed and verified in prior phases.

| Package | Registry | Verdict | Disposition |
|---------|----------|---------|-------------|
| All existing packages | npm | OK (verified prior phases) | Approved — no new installs |

**Packages removed due to SLOP verdict:** none
**Packages flagged as suspicious:** none

## Architecture Patterns

### System Architecture Diagram

```
Parent Browser (use client)
  ParentPanelView
    |-- handleSave() -----> Server Action: createTask / updateTask
    |-- handleDelete() ---> Server Action: deactivateTask
    |-- handleToggle() ---> Server Action: toggleTaskActive
                              |
                              v
                         Drizzle (db.insert / db.update)
                         taskTemplates table
                              |
                    revalidatePath('/family/[familyId]/tasks')
                              |
                    page.tsx re-fetches (SSR)
                              |
                    ParentPanelView re-renders with real data

Child Browser (use client)
  GardenView
    HarvestButton.onClick
      |-- fetch POST /api/child/[childId]/harvest ---------> Route Handler
              body: { commandId, totalAmount }               |
                                                    auth() session check
                                                    familyId ownership check
                                                    db.transaction():
                                                      insert ledger_transactions
                                                      insert ledger_lines (available 90%)
                                                      insert ledger_lines (firstfruits 10%)
                                                    return 200 | 409 (duplicate) | 401 | 403

SSR pages (Server Components)
  /family/[familyId]/tasks/page.tsx
    await params  <-- CRITICAL: Next.js 15+ params is Promise
    auth() check
    db.select(taskTemplates).where(familyId + isActive)
    db.select(childProfiles).where(familyId)
    --> <ParentPanelView initialTasks={realTasks} />

  /child/[childId]/garden/page.tsx
    await params
    childId ownership check (via child session cookie)
    db.select(taskTemplates).where(assignedChildId + isActive)
    db.select(taskCompletions).where(childId + cycleStart)
    --> <GardenView initialTasks={realTasks} />
```

### Recommended Project Structure

```
src/
├── modules/
│   └── ledger/
│       ├── calculate.ts     # calculateFirstfruits() — server-only, pure function
│       ├── engine.ts        # postEarning(), postNegativeAdjustment(), postReversal()
│       └── queries.ts       # getBalance(), getChildLedgerHistory(), getGuardianLedgerHistory()
├── lib/
│   ├── cycles/
│   │   └── current-cycle.ts # getCurrentCycleStart() — returns 'YYYY-MM-DD' Sunday ISO date
│   └── seed/                # keep for dev reference; pages.tsx no longer imports from here
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/
│   │   ├── family/[familyId]/
│   │   │   └── tasks/
│   │   │       ├── route.ts          # GET list + POST create
│   │   │       └── [taskId]/
│   │   │           └── route.ts      # PATCH update + DELETE deactivate
│   │   └── child/[childId]/
│   │       └── harvest/
│   │           └── route.ts          # POST — ledger write + idempotency
│   └── actions/
│       └── tasks.ts          # Server Actions: createTask, updateTask, toggleTaskActive, deleteTask
```

### Pattern 1: Next.js 15 Route Handler with Dynamic Params

**What:** All route handlers receiving dynamic segments must await params before use.
**When to use:** Every `route.ts` under a `[param]` directory.

```typescript
// Source: https://github.com/vercel/next.js/blob/canary/docs/01-app/03-api-reference/03-file-conventions/route.mdx
// [VERIFIED: Context7 / Next.js official docs]

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../auth'
import { db } from '@/lib/db'
import { taskTemplates } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

// GET /api/family/[familyId]/tasks
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ familyId: string }> }
) {
  const { familyId } = await params   // CRITICAL: await in Next.js 15+

  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tasks = await db
    .select()
    .from(taskTemplates)
    .where(and(eq(taskTemplates.familyId, familyId), eq(taskTemplates.isActive, true)))

  return NextResponse.json(tasks)
}

// POST /api/family/[familyId]/tasks
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ familyId: string }> }
) {
  const { familyId } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  // validate with Zod here

  const [created] = await db
    .insert(taskTemplates)
    .values({ ...body, familyId })
    .returning()   // CRITICAL: use .returning() to get created row back

  return NextResponse.json(created, { status: 201 })
}
```

### Pattern 2: Drizzle `.returning()` for Created/Updated Rows

**What:** PostgreSQL supports `INSERT ... RETURNING` — Drizzle exposes this via `.returning()`.
**When to use:** Any insert or update where the caller needs the persisted row (including DB-generated id, createdAt, updatedAt).

```typescript
// Source: https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/insert.mdx
// [VERIFIED: Context7 / Drizzle ORM official docs]

// Full row return
const [newTask] = await db
  .insert(taskTemplates)
  .values({ title: 'Clean room', kredsValue: 5, familyId, assignedChildId })
  .returning()

// Partial return (only id)
const [{ id }] = await db
  .insert(taskTemplates)
  .values({ title: 'Clean room', kredsValue: 5, familyId, assignedChildId })
  .returning({ id: taskTemplates.id })
```

### Pattern 3: Server Actions for Parent Panel CRUD

**What:** `'use server'` functions that can be called directly from 'use client' components — no fetch() needed.
**When to use:** Parent panel mutations (create, update, toggle, delete) triggered by button clicks.

```typescript
// Source: https://github.com/vercel/next.js/blob/canary/docs/01-app/02-guides/forms.mdx
// [VERIFIED: Context7 / Next.js official docs]

// src/app/actions/tasks.ts
'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '../../auth'
import { db } from '@/lib/db'
import { taskTemplates } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const CreateTaskSchema = z.object({
  title: z.string().min(1),
  familyId: z.string().uuid(),
  assignedChildId: z.string().uuid(),
  kredsValue: z.number().int().positive(),
  days: z.array(z.number().int().min(0).max(6)),
  category: z.string().optional(),
  approval: z.boolean(),
})

export async function createTask(data: z.infer<typeof CreateTaskSchema>) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  // Validate that the familyId belongs to this session user before writing
  // (family ownership check — see Pattern 5)

  const [task] = await db
    .insert(taskTemplates)
    .values(CreateTaskSchema.parse(data))
    .returning()

  revalidatePath(`/family/${data.familyId}/tasks`)
  return task
}

export async function deactivateTask(taskId: string, familyId: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  await db
    .update(taskTemplates)
    .set({ isActive: false, deactivatedAt: new Date() })
    .where(and(eq(taskTemplates.id, taskId), eq(taskTemplates.familyId, familyId)))

  revalidatePath(`/family/${familyId}/tasks`)
}
```

### Pattern 4: Harvest Route Handler with Idempotency

**What:** POST handler that writes a ledger transaction atomically and returns 409 on duplicate commandId.
**When to use:** Child clicks Harvest button — must be safe to retry.

```typescript
// [ASSUMED] — pattern synthesized from Drizzle docs + existing schema
// Source for db.transaction(): https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/transactions.mdx

// src/app/api/child/[childId]/harvest/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ledgerTransactions, ledgerLines } from '@/lib/db/schema'
import { calculateFirstfruits } from '@/modules/ledger/calculate'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ childId: string }> }
) {
  const { childId } = await params

  // Auth: verify child session cookie owns this childId
  // (use verifyChildSession from child-session.ts — existing pattern from Phase 2)

  let body: { commandId: string; totalAmount: number; familyId: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const firstfruits = calculateFirstfruits(body.totalAmount)
  const available = body.totalAmount - firstfruits

  try {
    const result = await db.transaction(async (tx) => {
      const [txn] = await tx
        .insert(ledgerTransactions)
        .values({
          commandId: body.commandId,
          familyId: body.familyId,
          childProfileId: childId,
          transactionType: 'task_earning',
        })
        .returning()

      await tx.insert(ledgerLines).values([
        { transactionId: txn.id, childProfileId: childId, accountType: 'available', amount: available },
        { transactionId: txn.id, childProfileId: childId, accountType: 'firstfruits', amount: firstfruits },
      ])

      return txn
    })

    return NextResponse.json(result, { status: 201 })
  } catch (err: unknown) {
    // PostgreSQL unique constraint violation — same commandId already processed
    if (
      err &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code: string }).code === '23505'
    ) {
      return NextResponse.json({ error: 'Already harvested' }, { status: 409 })
    }
    throw err  // re-throw unexpected errors
  }
}
```

### Pattern 5: Cycle Start Computation (Sunday–Saturday)

**What:** Get the ISO date string (`'YYYY-MM-DD'`) for the Sunday that started the current weekly cycle.
**When to use:** Populating `cycleStart` on `taskCompletions` records.

```typescript
// [ASSUMED] — pure date math, no external dependency

// src/lib/cycles/current-cycle.ts
import 'server-only'

/**
 * Returns the ISO date string for the most recent Sunday (inclusive of today if today is Sunday).
 * The Kreds weekly cycle runs Sunday through Saturday.
 * Uses the family timezone — for v1 default to UTC; Phase N extends to family.timezone.
 */
export function getCurrentCycleStart(): string {
  const now = new Date()
  const dayOfWeek = now.getUTCDay() // 0 = Sunday
  const daysBack = dayOfWeek       // 0 if Sunday, 1 if Monday, ..., 6 if Saturday
  const sunday = new Date(now)
  sunday.setUTCDate(now.getUTCDate() - daysBack)
  const yyyy = sunday.getUTCFullYear()
  const mm = String(sunday.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(sunday.getUTCDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}
```

### Pattern 6: Ledger Engine Modules (src/modules/ledger/)

**What:** Server-only domain modules for ledger writes. Tests already exist — the modules must be created.
**When to use:** Phase 6 must create these so failing tests pass.

```typescript
// src/modules/ledger/calculate.ts
// [VERIFIED: tests/unit/ledger-calculate.test.ts shows expected behavior]
import 'server-only'

export const FIRSTFRUITS_RATE = 0.10

/**
 * Returns the firstfruits amount (ceiling of 10% of amount).
 * Throws if amount is not a positive integer.
 */
export function calculateFirstfruits(amount: number): number {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error('amount must be a positive integer')
  }
  return Math.ceil(amount * FIRSTFRUITS_RATE)
}
```

```typescript
// src/modules/ledger/engine.ts — skeleton showing postEarning signature
// [VERIFIED: tests/integration/ledger-engine.test.ts shows expected behavior]
import 'server-only'
import { db } from '@/lib/db'
import { ledgerTransactions, ledgerLines } from '@/lib/db/schema'
import { calculateFirstfruits } from './calculate'

interface EarningCommand {
  commandId: string
  familyId: string
  childProfileId: string
  guardianIdentityId: string
  amount: number
  note?: string
}

export async function postEarning(cmd: EarningCommand) {
  const firstfruits = calculateFirstfruits(cmd.amount)
  const available = cmd.amount - firstfruits

  return db.transaction(async (tx) => {
    const [txn] = await tx
      .insert(ledgerTransactions)
      .values({
        commandId: cmd.commandId,
        familyId: cmd.familyId,
        childProfileId: cmd.childProfileId,
        transactionType: 'task_earning',
        initiatedByIdentityId: cmd.guardianIdentityId,
        note: cmd.note,
      })
      .returning()

    await tx.insert(ledgerLines).values([
      { transactionId: txn.id, childProfileId: cmd.childProfileId, accountType: 'available', amount: available },
      { transactionId: txn.id, childProfileId: cmd.childProfileId, accountType: 'firstfruits', amount: firstfruits },
    ])

    return txn
  })
}
```

### Anti-Patterns to Avoid

- **Calling Drizzle directly from 'use client' components:** Client components cannot import `db` from `@/lib/db`. All DB access must go through Server Actions or Route Handlers.
- **Using `params.familyId` without `await` in Next.js 15+:** Results in a Promise object, not a string. Always `const { familyId } = await params`.
- **Returning floats from calculateFirstfruits:** Use `Math.ceil`, not `Math.round`. The schema has `kredsValue_positive` check — amount 0 would violate it.
- **Trusting `commandId` from client without validation:** The `commandId` must be a valid UUID string. Validate with Zod before inserting.
- **Calling `revalidatePath` inside a transaction callback:** `revalidatePath` is a Next.js cache operation, not a DB operation. Call it after the transaction resolves.
- **Importing from `src/lib/seed/` in production pages:** Seeds are dev-only constants. Phase 6 removes these imports from page.tsx files.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Idempotency for harvest | Custom "check before insert" logic | PostgreSQL unique index on `commandId` + catch `23505` | Check-then-insert has a TOCTOU race; unique index is atomic |
| Firstfruits calculation | Inline `Math.ceil(amount * 0.1)` in route handler | `calculateFirstfruits()` from `src/modules/ledger/calculate.ts` | Tests already exist for this function; centralizing avoids inconsistency |
| Atomic ledger write | Multiple separate inserts with try/catch | `db.transaction()` | Without a transaction, a crash between the header insert and line inserts leaves orphaned rows |
| Request validation | Manual `typeof body.commandId === 'string'` checks | Zod schema | Zod provides complete type narrowing and produces clean error messages |
| Auth check in Route Handlers | Reimplementing JWT decoding | `auth()` from root `auth.ts` | Next-Auth already configured for ZITADEL; use its session |
| Child ownership check | Querying DB to verify child belongs to session | `verifyChildSession()` from `child-session.ts` + `validateChildSessionScope()` from `child-guard.ts` | Phase 2 built these exact guards; reuse them |

**Key insight:** The ledger write is not a simple CRUD operation — it must be atomic, idempotent, and produce exactly two ledger lines in the correct amounts. Never inline this logic in a route handler body.

## Common Pitfalls

### Pitfall 1: Next.js 15 params Must Be Awaited

**What goes wrong:** `const { familyId } = params` gives a Promise, not the string. Subsequent DB queries silently use `[object Promise]` as the family ID, matching zero rows.
**Why it happens:** Breaking change in Next.js 15 — params became async to enable streaming.
**How to avoid:** Always `const { familyId } = await params`. The existing `tasks/page.tsx` already does this correctly — follow the same pattern in all new route.ts files.
**Warning signs:** Route handler returns empty array even when DB has data.

### Pitfall 2: Drizzle insert() Returns Array — Always Destructure

**What goes wrong:** `const created = await db.insert(...).returning()` — `created` is an array. Accessing `created.id` returns `undefined`.
**Why it happens:** PostgreSQL can return multiple rows from a single INSERT; Drizzle preserves this.
**How to avoid:** Always destructure: `const [created] = await db.insert(...).returning()`.
**Warning signs:** TypeScript error `Property 'id' does not exist on type 'InferSelectModel<...>[]'`.

### Pitfall 3: commandId 23505 Not Caught — Returns 500 to Client

**What goes wrong:** Duplicate harvest POST crashes with unhandled promise rejection instead of returning 409.
**Why it happens:** Drizzle propagates the pg `error.code === '23505'` as a plain Error — not caught by default.
**How to avoid:** Wrap `db.transaction()` in try/catch; check `(err as {code: string}).code === '23505'`.
**Warning signs:** Harvest button shows error toast on repeat click instead of "already harvested" message.

### Pitfall 4: revalidatePath Path Must Match Exact Route

**What goes wrong:** `revalidatePath('/family/tasks')` doesn't invalidate `/family/[familyId]/tasks` because the path includes the dynamic segment.
**Why it happens:** `revalidatePath` matches exact or layout paths.
**How to avoid:** Pass the concrete path: `revalidatePath(`/family/${familyId}/tasks`)`.
**Warning signs:** Parent panel doesn't show newly created tasks after save — user must manually refresh.

### Pitfall 5: Float Amount from Client Breaking Ledger Invariants

**What goes wrong:** Client sends `totalAmount: 9.5` — `calculateFirstfruits` throws `amount must be a positive integer`, and the harvest returns 500.
**Why it happens:** JavaScript fetch serializes numbers without type enforcement.
**How to avoid:** Zod schema with `z.number().int().positive()` validates before calling engine functions.
**Warning signs:** Harvest fails silently for certain task reward values.

### Pitfall 6: Optimistic UI Desync After Server Action Failure

**What goes wrong:** Parent panel shows a task in the list that wasn't actually saved to DB (network error mid-save).
**Why it happens:** Phase 5 used purely optimistic mutations — Phase 6 must decide: keep optimistic + reconcile on failure, or wait for server confirmation.
**How to avoid:** For Phase 6, use pending state via `useTransition` or return the created task from the Server Action and update `setTasks` with the real DB object (including real UUID from DB).
**Warning signs:** Task appears in UI with a fake `crypto.randomUUID()` id; subsequent edit/delete calls fail because the id doesn't exist in DB.

### Pitfall 7: Importing ledger modules without 'server-only'

**What goes wrong:** `src/modules/ledger/engine.ts` is accidentally imported in a Client Component — leaks DB credentials via bundler.
**Why it happens:** Next.js doesn't prevent client-side import unless `server-only` is at the top.
**How to avoid:** First line of every file in `src/modules/ledger/` and `src/lib/cycles/` must be `import 'server-only'`. Tests that import these modules must `vi.mock('server-only', () => ({}))` first.
**Warning signs:** `vitest` throws "Cannot import server-only" unless `vi.mock('server-only', () => ({}))` is at the top of test files.

## Code Examples

### getCurrentCycleStart — Week Boundary Math

```typescript
// src/lib/cycles/current-cycle.ts
// [ASSUMED] — pure date math; no library dependency
import 'server-only'

export function getCurrentCycleStart(): string {
  const now = new Date()
  const dayOfWeek = now.getUTCDay() // 0=Sun ... 6=Sat
  const sunday = new Date(now)
  sunday.setUTCDate(now.getUTCDate() - dayOfWeek)
  return sunday.toISOString().slice(0, 10) // 'YYYY-MM-DD'
}
```

### Replace SEED_STAGE_C in garden/page.tsx

```typescript
// src/app/(child)/child/[childId]/garden/page.tsx — after Phase 6
// [ASSUMED] — based on existing page.tsx pattern + schema analysis
import { db } from '@/lib/db'
import { taskTemplates, taskCompletions, childProfiles, wishlistGoals } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import { bibleVerses } from '@/lib/db/schema'
import { GardenView } from '@/components/garden/garden-view'
import { getCurrentCycleStart } from '@/lib/cycles/current-cycle'

export default async function GardenPage({
  params,
}: {
  params: Promise<{ childId: string }>
}) {
  const { childId } = await params

  // Verify child session owns this childId (Phase 2 pattern)
  // const session = verifyChildSession(cookies().get('child-session')?.value)
  // if (!session || session.childProfileId !== childId) redirect('/child/login')

  const cycleStart = getCurrentCycleStart()

  const [tasks, completions, child, goals, verse] = await Promise.all([
    db.select().from(taskTemplates)
      .where(and(eq(taskTemplates.assignedChildId, childId), eq(taskTemplates.isActive, true))),
    db.select().from(taskCompletions)
      .where(and(eq(taskCompletions.childProfileId, childId), eq(taskCompletions.cycleStart, cycleStart))),
    db.select().from(childProfiles).where(eq(childProfiles.id, childId)).limit(1),
    db.select().from(wishlistGoals)
      .where(and(eq(wishlistGoals.childProfileId, childId), eq(wishlistGoals.status, 'active')))
      .limit(1),
    db.select().from(bibleVerses).orderBy(sql`RANDOM()`).limit(1),
  ])

  // Build GardenSeed from real data
  const completedIds = new Set(completions.filter(c => c.status === 'completed').map(c => c.taskTemplateId))
  const gardenTasks = tasks.map(t => ({
    id: t.id,
    title: t.title,
    emoji: '✅', // Phase 6 placeholder; real emoji from category in later phase
    done: completedIds.has(t.id),
  }))

  return (
    <GardenView
      childId={childId}
      seed={{
        childName: child[0]?.displayName ?? 'Criança',
        initial: (child[0]?.displayName?.[0] ?? 'C').toUpperCase(),
        coins: 0, // Phase 6: compute from ledger balance in later phase
        tasks: gardenTasks,
        titheDone: false,
        harvested: false, // Phase 6: check ledger for current cycle harvest
        season: 'primavera',
        savings: goals[0]?.allocatedAmount ?? 0,
        goal: goals[0]?.targetAmount ?? 100,
      }}
      verse={verse[0] ?? null}
    />
  )
}
```

### Parent Panel — Replace MOCK_PARENT_TASKS with Real Query

```typescript
// src/app/family/[familyId]/tasks/page.tsx — after Phase 6
// [ASSUMED] — based on existing page.tsx + schema
import { redirect } from 'next/navigation'
import { auth } from '../../../../../auth'
import { db } from '@/lib/db'
import { childProfiles, families, taskTemplates } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { ParentPanelView } from '@/components/parent/parent-panel-view'

export default async function ParentTasksPage({
  params,
}: {
  params: Promise<{ familyId: string }>
}) {
  const { familyId } = await params
  const session = await auth()
  if (!session) redirect('/login')

  const [children, tasks, familyResult] = await Promise.all([
    db.select({
      id: childProfiles.id,
      displayName: childProfiles.displayName,
      accentColor: childProfiles.accentColor,
      avatarPreset: childProfiles.avatarPreset,
    }).from(childProfiles)
      .where(and(eq(childProfiles.familyId, familyId), eq(childProfiles.active, true))),

    db.select().from(taskTemplates)
      .where(and(eq(taskTemplates.familyId, familyId), eq(taskTemplates.isActive, true))),

    db.select({ name: families.name }).from(families).where(eq(families.id, familyId)),
  ])

  return (
    <ParentPanelView
      familyId={familyId}
      familyName={familyResult[0]?.name ?? 'Família'}
      currentUserName={session.user?.name ?? ''}
      familyChildren={children}
      initialTasks={tasks.map(t => ({
        id: t.id,
        title: t.title,
        category: (t.category ?? 'quarto') as ParentTask['category'],
        reward: t.kredsValue,
        days: (t.days ?? []) as number[],
        assigned: [t.assignedChildId],
        active: t.isActive,
        approval: t.approval,
      }))}
    />
  )
}
```

### Drizzle onConflictDoNothing (reference only)

```typescript
// Source: https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/insert.mdx
// [VERIFIED: Context7 / Drizzle ORM official docs]

// For harvest, prefer explicit catch(23505) instead of onConflictDoNothing
// because we need to return 409 to the client, not silently skip.
// onConflictDoNothing would return null from .returning():
const result = await db.insert(ledgerTransactions)
  .values({ commandId, ... })
  .onConflictDoNothing({ target: ledgerTransactions.commandId })
  .returning()
// result === [] if conflict — cannot distinguish "just inserted" from "already existed"
// Therefore: use try/catch on code '23505' instead.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `params.familyId` (sync) | `(await params).familyId` | Next.js 15 | All existing route.ts and page.tsx must await params |
| `insert().returning()` not supported | Drizzle `.returning()` | Drizzle 0.x | Can get created row without a second SELECT |
| Separate audit select after insert | `.returning()` in same statement | Drizzle 0.x | Eliminates TOCTOU window between insert and fetch |

**Deprecated / outdated:**
- **MOCK_PARENT_TASKS**: Dev-only seed in `src/lib/seed/parent-seed.ts` — Phase 6 removes its import from `tasks/page.tsx`. Keep the file for Storybook/unit tests but do not ship it as data.
- **SEED_STAGE_C**: Same as above — keep file, remove import from `garden/page.tsx`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Harvest splits: 90% available / 10% firstfruits using Math.ceil | Pattern 4, Code Examples | ledger-calculate.test.ts confirms Math.ceil behavior (amount 7 → 1 firstfruits, not 0) — LOW risk |
| A2 | getCurrentCycleStart uses UTC date arithmetic with no timezone library | Pattern 5 | Families in non-UTC timezones see wrong cycle start — document that family.timezone is a future enhancement |
| A3 | ParentTask type (from parent-seed.ts) is kept as the shared type contract in Phase 6 even after replacing MOCK data | Code Examples | If ParentTask type drifts from taskTemplates schema, mapping layer in page.tsx silently loses fields |
| A4 | Child garden page should use child session cookie auth (verifyChildSession) not ZITADEL session auth | Architecture Diagram | If wrong auth strategy used, child could access other children's garden data |
| A5 | Harvest commandId should be generated client-side (UUID) and sent in request body | Pattern 4 | Server-generated commandId would require a two-step protocol; client-generated is simpler for idempotency |

**If this table is empty:** There are 5 assumptions — user should confirm A2 (timezone handling) and A4 (child auth strategy) before implementation.

## Open Questions (RESOLVED)

1. **ParentTask type coupling** — RESOLVED: Create `src/types/task.ts` with `ParentTask` extracted from `parent-seed.ts`; `parent-seed.ts` re-exports from there for backward compat. Plan 06-02 implements this.

2. **Harvest: who generates commandId?** — RESOLVED: Client (GardenView) generates via `crypto.randomUUID()` on first click and stores in component state. On retry (network error), reuses same UUID. Plan 06-04 implements this.

3. **Harvest trigger: total amount calculation** — RESOLVED: SSR query passes `kredsValue` per task to GardenView. GardenView sums completed tasks' `kredsValue` before sending harvest POST. Plan 06-04 implements this.

4. **`src/modules/ledger/` vs `src/lib/ledger/` path convention** — RESOLVED: Use `src/modules/ledger/` as tests already import from that path. Renaming test imports would break existing contracts. Plan 06-01 implements this.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | Yes | v22.22.3 | — |
| pnpm | Package manager | Yes | 10.34.1 | — |
| PostgreSQL (dev) | DB queries | Configured via DATABASE_URL | — (runtime) | Use Testcontainers for integration tests |
| Docker (Testcontainers) | Integration tests | Not checked | — | Tests skip if container fails (existing pattern in `ledger-engine.test.ts`) |
| Drizzle migrations (drizzle/) | Schema in DB | Yes — 9 migration files confirmed | — | `pnpm db:push` as alternative |

**Missing dependencies with no fallback:** None — all phase work operates against the existing DB schema with existing dependencies.

**Notes on test environment:**
- Integration tests using Testcontainers silently skip if Docker is unavailable (`if (!db) return` pattern already used in `ledger-engine.test.ts`).
- `pnpm db:push` command exists in `package.json` — use for pushing schema changes during dev.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.8 |
| Config file | `vitest.config.ts` |
| Quick run command | `pnpm test` |
| Full suite command | `pnpm test` |

### Phase 6 Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| API-01 | `calculateFirstfruits` returns ceiling of 10% | unit | `pnpm test tests/unit/ledger-calculate.test.ts` | No — Wave 0 gap (module missing) |
| API-02 | `postEarning` writes header + 2 lines atomically | integration | `pnpm test tests/integration/ledger-engine.test.ts` | No — Wave 0 gap (module missing) |
| API-03 | Duplicate commandId returns 23505 | integration | `pnpm test tests/integration/ledger-engine.test.ts` | No — Wave 0 gap (module missing) |
| API-04 | `getBalance` sums ledger lines by accountType | unit | `pnpm test tests/unit/ledger-queries.test.ts` | No — Wave 0 gap (module missing) |
| API-05 | Task CRUD Server Actions persist to taskTemplates | unit | new file needed | No — Wave 0 gap |
| API-06 | Harvest Route Handler returns 409 on duplicate | unit (mock db) | new file needed | No — Wave 0 gap |
| API-07 | getCurrentCycleStart returns correct Sunday | unit | new file needed | No — Wave 0 gap |

### Sampling Rate

- **Per task commit:** `pnpm test tests/unit/ledger-calculate.test.ts` (quick — pure unit)
- **Per wave merge:** `pnpm test` (full suite)
- **Phase gate:** Full suite green + ledger-engine integration test passing before `/gsd-verify-work`

### Wave 0 Gaps

Phase 6 Wave 0 must create:
- [ ] `src/modules/ledger/calculate.ts` — enables `ledger-calculate.test.ts` (12 tests)
- [ ] `src/modules/ledger/engine.ts` — enables `ledger-engine.test.ts` integration tests
- [ ] `src/modules/ledger/queries.ts` — enables `ledger-queries.test.ts` (3 tests)

These three files unblock 3 of the 6 currently failing test categories. Create them in Wave 0 so subsequent waves can run a clean test suite.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | `auth()` from next-auth in every Route Handler; child session from `verifyChildSession()` |
| V3 Session Management | yes | JWT sessions — existing; child session cookie from Phase 2 |
| V4 Access Control | yes | Family isolation: `eq(taskTemplates.familyId, familyId)` on every query; child session scope guard |
| V5 Input Validation | yes | Zod schemas for Route Handler bodies; reject non-UUID commandId |
| V6 Cryptography | no | No new crypto operations in Phase 6 |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Child accesses another child's garden via URL manipulation | Elevation of Privilege | `validateChildSessionScope()` checks `session.childProfileId === childId` from URL params |
| Parent modifies tasks of another family via forged familyId | Elevation of Privilege | Server Action checks `familyId` belongs to session user's family membership |
| Harvest replay doubles Kreds balance | Tampering | Unique index on `commandId` + catch 23505; returns 409 not 500 |
| Float amount in harvest request creates sub-integer ledger entries | Tampering | Zod `z.number().int().positive()` rejects floats at validation layer |
| Task created with negative `kredsValue` | Tampering | Schema `CHECK (kreds_value > 0)` enforced at DB level; Zod `z.number().int().positive()` at API level |

## Sources

### Primary (MEDIUM confidence — Context7)

- `/vercel/next.js` Context7 — Route Handler params syntax, `await params` requirement, HTTP method exports, Server Actions with `revalidatePath`. Source: official Next.js docs via Context7.
- `/drizzle-team/drizzle-orm-docs` Context7 — `.returning()`, `.onConflictDoNothing()`, `db.transaction()` patterns. Source: official Drizzle ORM docs via Context7.

### Secondary (HIGH confidence — codebase inspection)

- `tests/integration/ledger-engine.test.ts` — defines exact behavior contracts for `postEarning`, `postNegativeAdjustment`, `postReversal`, and idempotency. VERIFIED by reading file.
- `tests/unit/ledger-calculate.test.ts` — defines exact behavior of `calculateFirstfruits` including edge cases (ceiling math, integer validation). VERIFIED by reading file.
- `tests/unit/ledger-queries.test.ts` — defines interface of `getBalance`, `getChildLedgerHistory`, `getGuardianLedgerHistory`. VERIFIED by reading file.
- `src/lib/db/schema/index.ts` + `src/lib/db/schema/ledger.ts` — exact column names, enums (`accountType`: `available`/`firstfruits`), constraints, and index names. VERIFIED by reading files.
- `src/app/family/[familyId]/tasks/page.tsx` — existing patterns for `await params`, `auth()`, Drizzle queries. VERIFIED by reading file.
- `pnpm test` output — confirmed 15 failing test files, 6 due to missing module imports. VERIFIED by running command.

### Tertiary (LOW confidence — training data / assumed)

- Harvest commandId client-generation pattern — ASSUMED based on standard idempotency key practices.
- `getCurrentCycleStart` UTC date arithmetic — ASSUMED; not externally verified.
- `src/modules/ledger/` path convention — VERIFIED by test imports (not code).

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages confirmed in `package.json`; no new dependencies needed
- Ledger module interfaces: HIGH — defined by existing test files (contracts pre-written)
- Route Handler patterns: MEDIUM — confirmed via Context7 official docs
- Cycle date computation: LOW — pure logic assumption; no external verification

**Research date:** 2026-06-26
**Valid until:** 2026-07-26 (stable stack; Next.js / Drizzle APIs unlikely to change)
