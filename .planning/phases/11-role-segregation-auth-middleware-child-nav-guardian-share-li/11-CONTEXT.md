# Phase 11: Role Segregation — Context

**Gathered:** 2026-06-09
**Status:** Ready for planning
**Source:** Direct user conversation

<domain>
## Phase Boundary

Fix role-based route segregation across the Kreds app. Currently guardian and child routes are mixed, there is no middleware protecting routes by role, the child has no bottom navigation, and the guardian has no easy way to share the child access link. This phase segregates all routes cleanly by role, adds auth guards, builds the child experience (dashboard, tasks, dreams, donations, balance), and ensures guardians can share the child access link with a single tap.

</domain>

<decisions>
## Implementation Decisions

### D-01: Child route namespace
All child-facing pages live under `/child/[childId]/` and require a valid child session cookie (`kreds_child_session`). The existing `/child/home` page stays but redirects to `/child/[childId]/dashboard`.

### D-02: Guardian route namespace
All guardian-facing pages live under `/family/` and require a valid NextAuth session. The existing structure is preserved.

### D-03: Next.js middleware for route guard
A `src/middleware.ts` file enforces:
- `/child/*` routes → require child session cookie; redirect to `/family/access/[familyId]` if absent (familyId resolved from cookie)
- `/family/*` routes → require NextAuth session; redirect to `/api/auth/signin` if absent
- `/(app)/*` routes → require child session (child content group) or guardian session depending on sub-path
- Public routes: `/`, `/family/access/[familyId]`, `/api/auth/*`, `/api/child/*`

### D-04: Guardian "share link" per child
In `/family/children`, each child card shows a "Compartilhar acesso" button that copies the URL `${NEXT_PUBLIC_APP_URL}/family/access/${familyId}` to clipboard. Also shows the URL as readable text on the card so the guardian can read it aloud or screenshot it. No QR code in v1.

### D-05: Child bottom nav
A `ChildBottomNav` component mirrors `BottomNav` but with child-specific tabs:
- Jardim (dashboard)
- Tarefas
- Sonhos
- Saldo

### D-06: Child dashboard with garden
`/child/[childId]/dashboard` — shows the child's garden visual (reuses the isometric garden image already used in the guardian dashboard), shows active tasks count, available Kreds balance, and a motivational message. Must use `requireChildSession` and verify `session.childProfileId === childId`.

### D-07: Child tasks with mark complete/uncomplete
New schema table `task_completions` tracks per-child per-task-template completion state for the current cycle.
- Child can mark a task as done or undo the mark (no parent approval in this phase — that is Phase 5).
- Only tasks assigned to this child are shown.
- `task_completions` has: `id`, `taskTemplateId`, `childProfileId`, `cycleStart` (ISO date string of cycle Sunday), `completedAt` (nullable timestamp), `status` (enum: `pending | completed`).
- Page: `/child/[childId]/tasks`

### D-08: Child dreams (wishlist goals)
`/child/[childId]/dreams` — shows existing wishlist goals (already in schema as `wishlist_goals`). Child can create new goals and allocate Kreds. Moves the existing `/(app)/child/[childId]/balance` GoalCard logic here. Replaces the old `/family/wishes` "coming soon" placeholder for the child view.

### D-09: Child balance
`/child/[childId]/balance` — shows available Kreds balance and ledger history. Uses existing ledger queries.

### D-10: Donations (Kreds do Bem) — schema only in this phase
Add `donations` table to schema: `id`, `familyId`, `childProfileId`, `targetLabel` (text), `amountKreds` (integer), `status` (enum: `pending | approved | rejected`), `requestedAt`, `approvedAt`. UI is a simple list + "Doe" form. Route: `/child/[childId]/donations`.

### D-11: Guardian must not access child session routes directly
Remove the direct `/child/${child.id}/balance` link from `/family/children` page. Replace with `/guardian/${child.id}/balance` (guardian view of child balance) which uses the NextAuth session, not the child session.

### D-12: /(app) route group cleanup
The `/(app)/child/[childId]/*` routes were accessible without child session guard. Add `requireChildSession` to each and verify `session.childProfileId === childId`. The `/(app)/guardian/[childId]/*` routes need guardian session guard via `requireAuthenticatedIdentity`.

### Claude's Discretion
- Visual design of ChildBottomNav follows existing BottomNav style exactly (same colors, font, pill active state)
- Copy-to-clipboard uses `navigator.clipboard.writeText` with a toast/status indicator
- Child dashboard garden uses the same `/garden-isometric.png` image already in public/
- `task_completions.cycleStart` computed server-side using existing `getCycleForDate` function
- Drizzle migration for `task_completions` and `donations` tables must run before UI

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Auth and session
- `src/lib/auth/child-guard.ts` — `requireChildSession` implementation
- `src/lib/auth/authorization.ts` — `requireAuthenticatedIdentity`, `resolveKredsIdentityId`
- `src/lib/families/child-session.ts` — child session JWT encoding/decoding
- `src/app/api/families/[familyId]/child-auth/route.ts` — child PIN auth endpoint
- `src/app/family/access/[familyId]/page.tsx` — child login page (public entry point)

### Schema
- `src/lib/db/schema/index.ts` — all tables including `taskTemplates`, `wishlistGoals`, `childProfiles`
- `src/lib/db/schema/ledger.ts` — ledger tables

### Existing child routes (to be guarded/extended)
- `src/app/(app)/child/[childId]/balance/page.tsx` — balance + goals (guardian accesses this now — must fix)
- `src/app/(app)/child/[childId]/history/page.tsx`
- `src/app/(app)/child/[childId]/new-goal/page.tsx`
- `src/app/child/home/page.tsx` — current child home (redirect to dashboard)

### Existing guardian routes (to be guarded)
- `src/app/family/children/page.tsx` — add share link, remove direct child route link
- `src/app/family/dashboard/page.tsx` — guardian dashboard
- `src/app/(app)/guardian/[childId]/history/page.tsx`
- `src/app/(app)/guardian/[childId]/earning/page.tsx`
- `src/app/(app)/guardian/[childId]/adjustment/page.tsx`

### Navigation
- `src/components/BottomNav.tsx` — guardian bottom nav (pattern for child version)

### Task cycle
- `src/modules/activity/cycle.ts` — `getCycleForDate` for computing cycle start

### DB access
- `src/lib/db/index.ts` — Drizzle db instance
- `src/lib/db/tasks/queries.ts` — `getActiveTasksForFamily`

### Env
- `src/lib/env.ts` — env validation (add `NEXT_PUBLIC_APP_URL` if missing)

</canonical_refs>

<specifics>
## Specific Ideas

- The child access URL format is: `${NEXT_PUBLIC_APP_URL}/family/access/${familyId}`
- `getCycleForDate` returns `{ start: Date, end: Date }` — use `start.toISOString().split('T')[0]` as `cycleStart` string
- Child dashboard shows: avatar initial, name, available balance badge, task count for current cycle, garden image
- `BottomNav` active tabs: `'jardim' | 'missoes' | 'sonhos' | 'perfil'` — child version: `'jardim' | 'tarefas' | 'sonhos' | 'saldo'`
- Copy button feedback: change button text to "Copiado!" for 2 seconds, then reset

</specifics>

<deferred>
## Deferred Ideas

- QR code for child access link — deferred to v2
- Parent approval flow for task completions — that is Phase 5 (ACT-04 to ACT-09)
- Full donations approval UI for guardian — Phase 8
- Child dashboard garden growth tied to task progress — Phase 6

</deferred>

---

*Phase: 11-role-segregation-auth-middleware-child-nav-guardian-share-li*
*Context gathered: 2026-06-09 via direct conversation*
