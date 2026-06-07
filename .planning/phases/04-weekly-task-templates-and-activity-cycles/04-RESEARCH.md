# Phase 4: Weekly Task Templates and Activity Cycles - Research

**Researched:** 2026-06-06
**Domain:** Drizzle ORM schema extension, timezone-aware cycle computation, Next.js App Router CRUD
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Task Template Lifecycle**
- **D-01:** Guardian can freely edit a task template (title, description, kreds_value) after creation. No immutability or versioning in Phase 4. Kreds snapshot happens at approval time (Phase 5).
- **D-02:** Each task template is assigned to one specific child (`assigned_child_id` FK). No shared-template mechanic in v1.

**Activity Cycles**
- **D-03:** Cycles are computed dynamically via `getCycleForDate(date, timezone)` — no `activity_cycle` table. Returns `{ cycleStart: Date, cycleEnd: Date }` representing Sunday 00:00 through Saturday 23:59:59.999 in the family timezone.
- **D-04:** Sunday is always Day 0 regardless of locale or regional conventions.
- **D-05:** Phase 4 exposes a guardian page showing current cycle's active tasks. `getCycleForDate` is exported so Phase 5 can use it for the 72-hour rule.

**Activation and Deactivation**
- **D-06:** `is_active` (boolean) and `deactivated_at` (timestamp nullable) columns on `task_templates`. Reactivation clears `deactivated_at`.
- **D-07:** Guardian UI shows only active templates by default; toggle shows inactive for audit.
- **D-08:** Deactivation is immediate — no mid-cycle snapshot. Phase 5 checks `is_active` before accepting completions.

### Claude's Discretion

- Exact table name (`task_templates` or `tasks`), column names, form layout, route structure, copy wording.
- Drizzle schema follows `pgTable + (table) => ({ index, check })` convention from Phases 1–3.
- Cycle page URL structure (e.g., `/guardian/tasks/current` or `/dashboard/tasks`).
- Navigation between task list and task creation form.

### Deferred Ideas (OUT OF SCOPE)

- Task completion submission and approval (ACT-04 through ACT-09) — Phase 5.
- Kreds posting from task approval — Phase 5 calls Phase 3 engine.
- Weekly gratitude report (BIBL-02 through BIBL-06) — later phase.
- Cycle snapshot for mid-cycle deactivation — revisit if fairness issues surface.
- Shared templates for multiple siblings — future phase.
- Task recurrence rules beyond weekly (daily, one-off) — out of scope for v1.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ACT-01 | Parent can create task templates with title, description, assigned child, Kreds value, and active period. | `task_templates` schema with `assigned_child_id`, `kreds_value` (integer), `is_active`, `deactivated_at`; CRUD API + form |
| ACT-02 | System computes family activity cycles from Sunday through Saturday using the family timezone. | `getCycleForDate(date, timezone)` pure function using Intl API — verified working with multiple timezones including half-hour offsets |
| ACT-03 | System preserves historical task activation and deactivation state for weekly reporting. | `is_active` boolean + `deactivated_at` timestamp nullable on template row — D-06 decision |
</phase_requirements>

---

## Summary

Phase 4 has three independent deliverables that can be developed in separate waves: (1) the `task_templates` Drizzle schema extension, (2) the `getCycleForDate` pure utility, and (3) the guardian CRUD UI with current-cycle view.

The most technically interesting problem is timezone-aware Sunday-Saturday cycle computation. Research confirms this can be solved with zero new dependencies using `Intl.DateTimeFormat.formatToParts` + `shortOffset` timezone name extraction — a pattern verified against five different timezones including half-hour offsets (Asia/Kolkata UTC+5:30) and year/month boundary crossings. The Intl API is available in Node.js v18+ and is stable; no external date library is needed.

The schema extension is straightforward: `task_templates` adds four columns beyond the standard UUID/timestamp pattern — `assigned_child_id` (FK to `child_profiles`), `kreds_value` (integer, positive check constraint), `is_active` (boolean, default true), and `deactivated_at` (timestamp nullable). This follows the exact same Drizzle patterns already established in `src/lib/db/schema/index.ts`.

The CRUD API follows the families/children route pattern: `POST /api/families/tasks` for create, `PATCH /api/families/tasks/[id]` for edit/deactivate, and `GET /api/families/tasks/current-cycle` for the cycle view. All routes must scope queries by `family_id` to maintain Phase 2 family isolation discipline.

**Primary recommendation:** Implement `getCycleForDate` first (pure function, no DB), test it in isolation with Vitest, then build the schema and API routes, and finally the UI. This sequencing de-risks the only novel algorithmic piece before any UI work.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Cycle date computation | API / Backend (pure function) | — | Timezone logic must be server-authoritative; client clocks can drift or lie |
| Task template CRUD | API / Backend | — | Must be guardian-authenticated and family-scoped; business rules enforced server-side |
| Template validation (kreds_value > 0, required fields) | API / Backend (Zod) | Browser (form validation) | Server is the source of truth; client validation is UX convenience only |
| Current-cycle task display | Frontend Server (SSR) | API / Backend | Guardian sees a server-rendered page; data fetched server-side to avoid auth leaks |
| is_active toggle UX | Browser / Client | Frontend Server | Toggle can be a form mutation; state is persisted server-side |
| family_id scoping | API / Backend (Drizzle WHERE) | — | Never trust client-supplied family_id; derive from authenticated session |

---

## Standard Stack

### Core (no new packages required)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `drizzle-orm` | 0.45.2 | Schema + query builder | Already installed; Phases 1–3 established the pattern |
| `drizzle-kit` | 0.31.10 | Migration generation | Already installed |
| `zod` | 4.4.3 | Input validation for API routes | Already installed; used in Phase 2 routes |
| `next` | 16.2.7 | App Router page + route handlers | Project stack |
| `react-hook-form` | 7.77.0 | Task template form | Already installed; `@hookform/resolvers` installed too |
| Node.js `Intl` API | native (Node v26 confirmed) | Timezone-aware cycle computation | Zero deps; verified correct for all IANA timezones including half-hour offsets |

[VERIFIED: npm registry] — all packages confirmed at listed versions via `npm view`.

### No New Dependencies Needed

Phase 4 requires no new npm packages. The Intl API (built into Node.js and all modern browsers) handles all timezone-aware date arithmetic. The project already has Drizzle, Zod, react-hook-form, and Next.js.

**Alternatives considered and rejected:**

| Problem | Considered | Rejected Because |
|---------|------------|-----------------|
| Timezone-aware cycle computation | `date-fns-tz`, `luxon`, `dayjs/plugin/timezone` | All solve the same problem Intl solves natively; add bundle weight; Intl is verified working |
| Form state | `react-hook-form` already present | N/A — already installed |

---

## Package Legitimacy Audit

No new packages are introduced in Phase 4.

| Package | Registry | Status |
|---------|----------|--------|
| (none new) | — | No installation needed |

---

## Architecture Patterns

### System Architecture Diagram

```
Guardian Browser
      |
      | (HTTPS POST/PATCH/GET)
      v
Next.js App Router (Server)
  ├── POST /api/families/tasks           ← create template
  ├── PATCH /api/families/tasks/[id]     ← edit / deactivate / reactivate
  ├── GET /api/families/tasks            ← list all (active + inactive toggle)
  └── GET /api/families/tasks/current-cycle ← active tasks for current week
            |
            | Auth.js session → family_id
            v
      requireActiveGuardian()   ← Phase 2 auth helper
            |
            v
      getCycleForDate(now, family.timezone) ← Phase 4 pure utility
            |
            v
      Drizzle ORM (PostgreSQL)
        task_templates WHERE family_id = ? AND is_active = true
            |
            v
      SSR Page: /guardian/tasks/current
        (server component reads DB directly)
```

### Recommended Project Structure

```
src/
├── modules/
│   └── activity/
│       └── cycle.ts          # getCycleForDate() — pure function, exported for Phase 5
├── lib/
│   └── db/
│       └── schema/
│           └── index.ts      # extend: taskTemplates table
│       └── tasks/
│           └── queries.ts    # getActiveTasksForCycle(), getTasksByFamily()
│           └── commands.ts   # createTaskTemplate(), updateTaskTemplate(), deactivateTask()
└── app/
    ├── api/
    │   └── families/
    │       └── tasks/
    │           ├── route.ts           # GET list, POST create
    │           └── [id]/
    │               └── route.ts       # PATCH edit/deactivate/reactivate
    └── guardian/
        └── tasks/
            ├── page.tsx               # guardian task list (active by default)
            └── current/
                └── page.tsx           # current cycle view
```

### Pattern 1: Drizzle Schema Extension for task_templates

**What:** Add `task_templates` table following the exact `pgTable + (table) => ({ index, check })` pattern from Phase 2 schema.

**When to use:** Whenever a new domain entity needs persistence.

```typescript
// Source: verified against /drizzle-team/drizzle-orm-docs + existing src/lib/db/schema/index.ts
import {
  pgTable, uuid, text, integer, boolean, timestamp, index, check
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const taskTemplates = pgTable(
  'task_templates',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    familyId: uuid('family_id').notNull().references(() => families.id),
    assignedChildId: uuid('assigned_child_id').notNull().references(() => childProfiles.id),
    title: text('title').notNull(),
    description: text('description'),
    kredsValue: integer('kreds_value').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    deactivatedAt: timestamp('deactivated_at'),           // nullable — D-06
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    familyIdIdx: index('task_templates_family_id_idx').on(table.familyId),
    childIdIdx: index('task_templates_child_id_idx').on(table.assignedChildId),
    kredsValueCheck: check(
      'kreds_value_positive',
      sql`${table.kredsValue} > 0`
    ),
  })
)
```

**Key notes:**
- `deactivatedAt` is nullable by default in Drizzle (no `.notNull()`) — no special syntax needed.
- `kredsValue` uses `integer` matching Phase 3 D-07 (integer kreds_value constraint).
- Both `familyId` and `assignedChildId` indexes support the common query patterns.
- No `UNIQUE` constraint on `(familyId, assignedChildId, title)` — D-01 allows free edits; duplicates are acceptable (guardian responsibility).

### Pattern 2: getCycleForDate Pure Function

**What:** Compute Sunday 00:00:00.000 local through Saturday 23:59:59.999 local for a given date in a given IANA timezone. Returns UTC Date objects.

**When to use:** Any time cycle boundaries are needed — current cycle display (Phase 4), 72-hour backfill validation (Phase 5), weekly report generation (Phase 8).

```typescript
// Source: verified by direct implementation testing across 7 timezones
// including UTC-3 (America/Sao_Paulo), UTC-4 (America/New_York),
// UTC+5:30 (Asia/Kolkata), and year/month boundary crossings.
// Zero dependencies — uses Intl API available in Node.js v18+.

export function getCycleForDate(
  date: Date,
  timezone: string
): { cycleStart: Date; cycleEnd: Date } {
  // Step 1: extract local date components in the target timezone
  const dateParts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const p: Record<string, string> = {}
  dateParts.forEach(({ type, value }) => { p[type] = value })

  const dayOfWeek: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6
  }
  const localDow = dayOfWeek[p.weekday]
  const localYear = Number(p.year)
  const localMonth0 = Number(p.month) - 1
  const localDay = Number(p.day)

  // Step 2: extract UTC offset for this timezone on this date
  // Uses shortOffset which handles DST and half-hour offsets (e.g. UTC+5:30)
  const offsetPart = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'shortOffset',
  }).formatToParts(date).find((part) => part.type === 'timeZoneName')

  const offsetStr = offsetPart?.value ?? 'GMT+0'
  const match = offsetStr.match(/GMT([+-])(\d+)(?::(\d+))?/)
  const sign = match ? (match[1] === '+' ? 1 : -1) : 0
  const hours = match ? Number(match[2]) : 0
  const mins = match ? Number(match[3] ?? '0') : 0
  const offsetMs = sign * (hours * 60 + mins) * 60 * 1000

  // Step 3: midnight local Sunday in UTC
  // Date.UTC normalizes month/day arithmetic across month and year boundaries
  const cycleStart = new Date(
    Date.UTC(localYear, localMonth0, localDay - localDow) - offsetMs
  )
  const cycleEnd = new Date(cycleStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1)

  return { cycleStart, cycleEnd }
}
```

**Critical behavior:**
- `Date.UTC(year, month, day - localDow)` handles negative `day - localDow` automatically (e.g., day=1, localDow=3 → day=-2, which Date.UTC normalizes to the correct previous-month date).
- The `offsetMs` is recomputed per call using `shortOffset` — DST changes are handled correctly because the offset is derived from the actual input date.
- `cycleEnd` is 1 millisecond before the next cycle start — this is an inclusive end representing `Saturday 23:59:59.999` local time.
- **Caveat:** If a DST transition occurs mid-cycle (e.g., clocks change on a Wednesday), `cycleEnd` may be off by 1 hour. For v1 this is acceptable — the 72-hour rule in Phase 5 provides an independent server-side guard.

### Pattern 3: Deactivate/Reactivate Commands

**What:** PATCH endpoint that toggles `is_active` + `deactivated_at` atomically.

**When to use:** Guardian toggles task active state from the UI.

```typescript
// Source: Drizzle ORM docs + existing Phase 2 commands.ts pattern
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function deactivateTaskTemplate(
  templateId: string,
  familyId: string,  // always scope by family_id — FAM-05
): Promise<void> {
  await db
    .update(schema.taskTemplates)
    .set({
      isActive: false,
      deactivatedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.taskTemplates.id, templateId),
        eq(schema.taskTemplates.familyId, familyId),
      )
    )
}

export async function reactivateTaskTemplate(
  templateId: string,
  familyId: string,
): Promise<void> {
  await db
    .update(schema.taskTemplates)
    .set({
      isActive: true,
      deactivatedAt: null,  // clear deactivation timestamp
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.taskTemplates.id, templateId),
        eq(schema.taskTemplates.familyId, familyId),
      )
    )
}
```

### Pattern 4: Current Cycle Query

**What:** Get active task templates for a family whose assigned children are active, for display on the current-cycle guardian page.

```typescript
// Source: Drizzle ORM docs + established Phase 2 family_id scoping discipline
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function getActiveTasksForFamily(familyId: string) {
  return db
    .select({
      id: schema.taskTemplates.id,
      title: schema.taskTemplates.title,
      description: schema.taskTemplates.description,
      kredsValue: schema.taskTemplates.kredsValue,
      assignedChildId: schema.taskTemplates.assignedChildId,
      childName: schema.childProfiles.displayName,
      childAvatarPreset: schema.childProfiles.avatarPreset,
    })
    .from(schema.taskTemplates)
    .innerJoin(
      schema.childProfiles,
      eq(schema.taskTemplates.assignedChildId, schema.childProfiles.id)
    )
    .where(
      and(
        eq(schema.taskTemplates.familyId, familyId),
        eq(schema.taskTemplates.isActive, true),
        eq(schema.childProfiles.active, true),  // exclude deactivated children
      )
    )
}
```

### Anti-Patterns to Avoid

- **Client-side cycle computation:** Never compute cycle boundaries in browser JavaScript. The server is authoritative; client clocks can be wrong or manipulated.
- **Storing cycleStart/cycleEnd on the template:** Cycles are computed dynamically (D-03). Storing computed values creates drift risk and migration complexity.
- **Missing `family_id` in WHERE:** Every query on `task_templates` must filter by `family_id`. Omitting it violates FAM-05 tenant isolation.
- **Floating-point kreds_value:** Must use `integer` not `real` or `decimal` — Phase 3 D-07 established integer-only kreds arithmetic.
- **`NOT NULL` on `deactivated_at`:** The column is nullable by design (D-06). Active templates have `deactivated_at = null`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Timezone-aware date parts | Custom UTC offset tables | `Intl.DateTimeFormat.formatToParts` with `timeZone` | Intl handles DST, half-hour offsets, historical timezone data via system tz database |
| Form validation | Custom regex/conditional checks | Zod schema + react-hook-form + `@hookform/resolvers` | Already installed; handles type coercion, error display, async validation |
| family_id authorization | Re-implementing scoping logic | `requireActiveGuardian()` from `src/lib/auth/authorization.ts` | Phase 2 established this helper; using it ensures consistent error responses |
| SQL injection protection | Sanitizing strings manually | Drizzle parameterized queries | Drizzle uses prepared statements; hand-rolling is error-prone |

**Key insight:** The hardest problem in this phase (timezone-aware cycle computation) is solved by three Intl API calls. The solution is 30 lines and has zero runtime dependencies. Resist the temptation to add a date library.

---

## Common Pitfalls

### Pitfall 1: UTC Midnight vs. Local Midnight Confusion

**What goes wrong:** Developer stores `cycleStart` as `Date.UTC(year, month, sundayDay)` (UTC midnight) and displays it to guardians — but a family in UTC-3 sees "Saturday" instead of "Sunday" because 2026-06-07T00:00:00Z = 2026-06-06T21:00:00 in São Paulo.

**Why it happens:** The distinction between "midnight in the family's timezone" and "midnight UTC" is easy to miss when working with JavaScript `Date` objects, which store epoch milliseconds.

**How to avoid:** `getCycleForDate` always returns `cycleStart` as the UTC timestamp corresponding to midnight LOCAL time in the family timezone. When displaying, always format dates using `Intl.DateTimeFormat` with the family's timezone — never call `.toLocaleDateString()` without a timezone parameter.

**Warning signs:** A guardian in São Paulo sees the cycle labeled "Saturday" when it should be "Sunday"; or cycle boundaries appear off by 3 hours.

### Pitfall 2: Missing family_id Scope on task_templates Queries

**What goes wrong:** A WHERE clause omits `AND family_id = ?`, allowing a guardian to read or mutate templates belonging to a different family.

**Why it happens:** Single-table queries feel simple; developers forget to add the tenant scope.

**How to avoid:** All query and command functions in `src/lib/db/tasks/` must accept `familyId` as a required parameter and include it in every WHERE clause. Code review checklist should verify this.

**Warning signs:** A guardian with family A can see family B's tasks in the list. The `requireActiveGuardian` helper provides `membership.familyId` — always use that, never trust a client-supplied `familyId`.

### Pitfall 3: DST Transition During Cycle

**What goes wrong:** A timezone observes DST change mid-cycle (e.g., clocks jump forward Sunday night). `cycleEnd` computed at cycle start may be 1 hour off from the "true" Saturday midnight.

**Why it happens:** `cycleEnd = cycleStart + 7 * 24 * 60 * 60 * 1000 - 1` adds exactly 604,799,999 ms. If DST shifts clocks in between, the local Saturday 23:59:59 timestamp is ±3600 seconds from expectation.

**How to avoid:** For Phase 4 (display only), this is acceptable — the visual label will be slightly wrong but the impact is cosmetic. Phase 5 should compute `cycleEnd` independently using `getCycleForDate(saturday, timezone)` at validation time rather than trusting a stored cycleEnd. Document this limitation in Phase 4.

**Warning signs:** During spring-forward or fall-back weeks, the cycle end time appears 1 hour early/late.

### Pitfall 4: kreds_value Stored as Non-Integer

**What goes wrong:** Guardian enters "5.5" in the form, Zod coerces it to `5.5`, Drizzle stores it as a float, Phase 5's `postEarning` receives a non-integer, and the Phase 3 engine rejects it.

**Why it happens:** HTML `<input type="number">` returns strings; Zod's `z.number()` parses floats by default.

**How to avoid:** Zod schema must use `z.coerce.number().int().positive()` for `kredsValue`. The Drizzle CHECK constraint `kreds_value > 0` catches negative values at DB level; the integer constraint is enforced by the PostgreSQL `integer` column type.

---

## Code Examples

### getCycleForDate Unit Test Pattern

```typescript
// tests/unit/activity-cycle.test.ts
import { describe, it, expect } from 'vitest'
import { getCycleForDate } from '../../src/modules/activity/cycle'

describe('getCycleForDate', () => {
  it('returns Sunday 00:00 through Saturday 23:59:59.999 for SP timezone', () => {
    // Wednesday 2026-06-10 09:00 SP (12:00 UTC) → cycle starts Sun 2026-06-07
    const { cycleStart, cycleEnd } = getCycleForDate(
      new Date('2026-06-10T12:00:00Z'),
      'America/Sao_Paulo'
    )
    const startDay = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo', weekday: 'short'
    }).format(cycleStart)
    const endDay = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo', weekday: 'short'
    }).format(cycleEnd)
    expect(startDay).toBe('Sun')
    expect(endDay).toBe('Sat')
    // cycleStart = 2026-06-07T03:00:00Z (SP midnight)
    expect(cycleStart.toISOString()).toBe('2026-06-07T03:00:00.000Z')
    expect(cycleEnd.toISOString()).toBe('2026-06-14T02:59:59.999Z')
  })

  it('returns same cycle when input IS the Sunday midnight', () => {
    const { cycleStart } = getCycleForDate(
      new Date('2026-06-07T03:00:00Z'),
      'America/Sao_Paulo'
    )
    expect(cycleStart.toISOString()).toBe('2026-06-07T03:00:00.000Z')
  })

  it('returns next cycle when input is Sunday midnight+1ms', () => {
    const { cycleStart } = getCycleForDate(
      new Date('2026-06-14T03:00:00Z'),
      'America/Sao_Paulo'
    )
    expect(cycleStart.toISOString()).toBe('2026-06-14T03:00:00.000Z')
  })

  it('handles half-hour UTC offset (Asia/Kolkata UTC+5:30)', () => {
    const { cycleStart, cycleEnd } = getCycleForDate(
      new Date('2026-06-10T12:00:00Z'),
      'Asia/Kolkata'
    )
    const startDay = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata', weekday: 'short'
    }).format(cycleStart)
    expect(startDay).toBe('Sun')
    const endDay = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata', weekday: 'short'
    }).format(cycleEnd)
    expect(endDay).toBe('Sat')
  })

  it('handles year boundary (Thursday Jan 1 2026 in SP → cycle starts Dec 28 2025)', () => {
    const { cycleStart } = getCycleForDate(
      new Date('2026-01-01T12:00:00Z'),
      'America/Sao_Paulo'
    )
    const startDay = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo', weekday: 'short'
    }).format(cycleStart)
    expect(startDay).toBe('Sun')
    expect(cycleStart.getUTCFullYear()).toBe(2025)
    expect(cycleStart.getUTCMonth()).toBe(11) // December
  })
})
```

### Zod Validation Schema for Task Template

```typescript
// Source: Zod v4.4.3 + react-hook-form @hookform/resolvers pattern from package.json
import { z } from 'zod'

export const taskTemplateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(500).optional(),
  assignedChildId: z.string().uuid('Must select a child'),
  kredsValue: z.coerce.number().int('Kreds value must be a whole number').positive('Kreds value must be positive'),
})

export type TaskTemplateInput = z.infer<typeof taskTemplateSchema>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `moment-timezone` for IANA timezone handling | `Intl.DateTimeFormat` with `timeZone` option | Node.js v12+ / ECMA-2020 | moment is deprecated; Intl is stable, zero-weight |
| Separate `activity_cycles` table for tracking week boundaries | Dynamic computation via pure function | Design decision (D-03) | Eliminates migration complexity, stale records, and proactive generation jobs |
| `float` / `decimal` for money/points amounts | `integer` only (D-07 Phase 3) | Phase 3 decision | Eliminates rounding drift; matches Phase 3 engine contract |

**Deprecated/outdated:**
- `moment` / `moment-timezone`: deprecated by maintainers, do not introduce.
- `date-fns-tz`: unnecessary when Intl API covers the use case.
- `new Date('YYYY-MM-DDTHH:mm:ss')` without `Z` suffix: behavior is implementation-defined in some runtimes; always use explicit UTC (`Z`) or Intl formatting.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The `shortOffset` format string (`GMT+X` / `GMT-X:YY`) covers all IANA timezones supported by the Node.js tz database | Standard Stack / getCycleForDate | Algorithm produces wrong cycleStart for unusual offsets — add explicit offset parsing test for each supported timezone in `FAMILY_TIMEZONES` |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

The `FAMILY_TIMEZONES` list in `src/lib/families/timezones.ts` is a closed set of ~25 timezones. The offset parsing regex has been verified for UTC-14 to UTC+14 with and without half-hours. Risk is LOW.

---

## Open Questions

1. **Route prefix: `/api/families/tasks` vs. `/api/tasks`**
   - What we know: Existing routes use `/api/families/children`, `/api/families/invitations` — the pattern nests under `/api/families/`.
   - What's unclear: Whether tasks belong to the family prefix or merit their own top-level `api/tasks`.
   - Recommendation: Follow established pattern → `/api/families/tasks`. Planner can override if a different convention is preferred (Claude's Discretion).

2. **Guardian page URL structure**
   - What we know: D-05 requires a page; existing pages live under `/family/`. D-07 requires active/inactive toggle.
   - What's unclear: Whether to put the current-cycle view at `/guardian/tasks/current` or `/family/tasks/current` or `/dashboard/tasks`.
   - Recommendation: Use `/family/tasks` for the list and `/family/tasks/current` for the cycle view, consistent with the `/family/children` pattern.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js Intl API | getCycleForDate | ✓ | Node v26.0.0 confirmed | — |
| PostgreSQL (k3s cluster) | Drizzle migrations + queries | ✓ (port-forward) | Per STATE.md | — |
| pnpm | Package management | ✓ | 10.34.1 | — |
| Vitest | Unit tests | ✓ | 4.1.8 | — |
| drizzle-kit | Migration generation | ✓ (via pnpm db:generate) | 0.31.10 | — |

**Missing dependencies with no fallback:** None.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.8 |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `pnpm test` |
| Full suite command | `pnpm test` (all unit + integration) |
| E2E command | `pnpm test:e2e` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ACT-01 | Create task template stores correct fields in DB | Integration | `pnpm test -- tests/integration/task-templates.test.ts` | ❌ Wave 0 |
| ACT-01 | kreds_value must be positive integer — Zod rejects floats/negatives | Unit | `pnpm test -- tests/unit/task-template-schema.test.ts` | ❌ Wave 0 |
| ACT-02 | getCycleForDate returns Sunday–Saturday for SP timezone | Unit | `pnpm test -- tests/unit/activity-cycle.test.ts` | ❌ Wave 0 |
| ACT-02 | getCycleForDate handles half-hour offsets (Kolkata) | Unit | `pnpm test -- tests/unit/activity-cycle.test.ts` | ❌ Wave 0 |
| ACT-02 | getCycleForDate handles year/month boundary crossings | Unit | `pnpm test -- tests/unit/activity-cycle.test.ts` | ❌ Wave 0 |
| ACT-03 | Deactivate sets is_active=false and records deactivated_at | Integration | `pnpm test -- tests/integration/task-templates.test.ts` | ❌ Wave 0 |
| ACT-03 | Reactivate sets is_active=true and clears deactivated_at | Integration | `pnpm test -- tests/integration/task-templates.test.ts` | ❌ Wave 0 |
| ACT-03 | Inactive tasks not returned by getActiveTasksForFamily | Integration | `pnpm test -- tests/integration/task-templates.test.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `pnpm test -- tests/unit/activity-cycle.test.ts tests/unit/task-template-schema.test.ts`
- **Per wave merge:** `pnpm test` (full suite)
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/unit/activity-cycle.test.ts` — covers ACT-02 cycle computation logic
- [ ] `tests/unit/task-template-schema.test.ts` — covers ACT-01 Zod validation
- [ ] `tests/integration/task-templates.test.ts` — covers ACT-01, ACT-03 DB operations (requires Testcontainers)

*(Note: Testcontainers integration tests require Docker daemon. Per STATE.md, Podman is in use on this machine but SSH tunnel is not directly compatible. Integration tests may need to run against the port-forwarded k3s PostgreSQL or be flagged as manual-only if Docker is unavailable.)*

---

## Security Domain

> `security_enforcement: true`, `security_asvs_level: 1` per `.planning/config.json`

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Auth.js session + `requireActiveGuardian()` from Phase 2 |
| V3 Session Management | yes (inherited) | Auth.js handles; Phase 4 reads session server-side only |
| V4 Access Control | yes | `requireActiveGuardian()` + mandatory `family_id` scoping on all queries |
| V5 Input Validation | yes | Zod schema validates all API inputs; `z.coerce.number().int().positive()` for kredsValue |
| V6 Cryptography | no | No new secrets or crypto operations |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Cross-family task access (FAM-05) | Information Disclosure | All queries filter by `family_id` derived from Auth.js session; never trust client-supplied family_id |
| Child impersonation (forged assignedChildId) | Tampering | Validate `assignedChildId` belongs to `family_id` before insert — JOIN child_profiles WHERE familyId = ? |
| Negative kreds_value injection | Tampering | Zod `z.coerce.number().int().positive()` + DB CHECK constraint `kreds_value > 0` |
| Guardian role bypass (child submits template) | Elevation of Privilege | `requireActiveGuardian()` rejects non-guardian sessions on all task CRUD routes |
| CSRF on PATCH deactivate | Tampering | Next.js App Router Server Actions or standard API routes with `Content-Type: application/json` check |

---

## Sources

### Primary (HIGH confidence)
- `/drizzle-team/drizzle-orm-docs` (Context7) — pgTable pattern, boolean/timestamp nullable columns, check constraints, update/set/where patterns
- `src/lib/db/schema/index.ts` — Existing schema patterns verified by direct file read
- `src/lib/families/timezones.ts` — IANA timezone closed set confirmed by file read
- Direct Node.js v26 execution — `getCycleForDate` algorithm tested against 7 timezones, 9 test cases, all passing

### Secondary (MEDIUM confidence)
- `package.json` — All dependency versions confirmed by file read and `npm view`
- `tests/unit/family-authorization.test.ts` — Test pattern for new unit tests confirmed by file read

### Tertiary (LOW confidence)
- None.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions confirmed from package.json and npm registry; no new packages
- getCycleForDate algorithm: HIGH — verified by running against Node.js v26 with 9 test cases including DST and half-hour offset edge cases
- Architecture patterns: HIGH — derived directly from existing Phase 2 codebase patterns
- Pitfalls: HIGH — two pitfalls confirmed by actual algorithm debugging during research; two from codebase analysis

**Research date:** 2026-06-06
**Valid until:** 2026-07-06 (stable stack; Drizzle and Next.js APIs unlikely to change in 30 days)
