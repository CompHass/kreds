# Architecture Patterns

**Domain:** Christian stewardship and allowance management family PWA  
**Project:** Kreds  
**Researched:** 2026-06-04  
**Overall confidence:** HIGH for tenant isolation, ledger, authorization, and PWA boundaries; MEDIUM for exact implementation technology because the backend language remains unresolved.

## Recommended Architecture

Build Kreds as a modular, domain-oriented web application: a Next.js PWA frontend talks to a backend API that owns all business rules, authorization, family tenancy, weekly task cycles, ledger entries, Bible content selection, and reporting. PostgreSQL is the system of record. Every tenant-owned row carries `family_id`; the API enforces family membership and role permissions on every request; PostgreSQL Row-Level Security (RLS) provides defense in depth for cross-family isolation.

Do **not** let the frontend calculate earnings, tithe, matching, spendable balances, or report totals as authoritative state. The frontend may preview calculations for UX, but the backend ledger domain must be the only place that posts financial transactions.

```text
Next.js PWA
  ├─ Parent dashboard
  ├─ Child dashboard
  ├─ Task/check-in UI
  ├─ Wishlist/donation UI
  └─ Offline-tolerant read cache and install/push shell
        │ HTTPS JSON API / same-origin BFF
        ▼
Backend API
  ├─ Auth/session boundary
  ├─ Family domain
  ├─ Activity domain
  ├─ Ledger domain (Kreds Engine)
  ├─ Goals and donations domain
  ├─ Bible content domain
  ├─ Reporting domain
  └─ Notification/job workers
        │ parameterized SQL + per-request tenant context
        ▼
PostgreSQL
  ├─ Tenant-owned relational tables with family_id
  ├─ Append-only ledger and audit events
  ├─ RLS policies for family_id isolation
  └─ Reporting snapshots/materialized summaries as needed
```

## Component Boundaries

| Component | Responsibility | Owns | Must Not Own | Communicates With |
|-----------|----------------|------|--------------|-------------------|
| Frontend PWA | Installable web/mobile experience, role-specific screens, optimistic UX, local read cache, push subscription capture | UI state, form state, non-authoritative previews | Authorization decisions, ledger posting, tenant filtering, report totals | Backend API only |
| Backend API / BFF | Request routing, validation, session-to-family context, command orchestration, response DTO shaping | API contracts, command handlers, transaction boundaries | Static UI rendering details | All backend domains, PostgreSQL |
| Auth and Authorization | Identity, sessions, family membership, guardian/child roles, invitation flow, permission checks | `users`, `family_memberships`, role/relationship policies | Family profile business data beyond identity links | Family domain, API middleware, audit logging |
| Family Domain | Families, guardians, children, avatars, family settings such as timezone/week start, child profiles | Family aggregate and profile lifecycle | Task completion, ledger entries | Auth, Activity, Ledger, Reporting |
| Activity Domain | Task templates, activation/deactivation history, Sunday-Saturday cycles, completion requests, 72-hour rule | Task definitions, effective dates, completions, approvals | Financial balances | Ledger domain through explicit earning commands |
| Ledger Domain / Kreds Engine | Append-only financial events, 10% firstfruits withholding, negative adjustments, donation matching, balance projections | Ledger transactions, transaction lines, balances derived from ledger | UI display rules, task lifecycle | Activity, Goals/Donations, Reporting, Audit |
| Goals and Donations Domain | Wishlist goals, allocations toward goals, modeled donations, matching bonus requests | Goals, goal contributions, donation intents/records | Real-money payment processing in v1 | Ledger, Content, Reporting |
| Bible Content Domain | Curated verses, contextual prompts, gratitude reflection templates | Verse catalog, content placements, seasonal/contextual tags | General CMS sprawl, financial logic | Frontend, Reporting |
| Reporting Domain | Weekly gratitude reports, cycle summaries, parent/child views, export-ready summaries | Report generation, snapshots, delivery status | Source-of-truth ledger state | Activity, Ledger, Content, Notifications |
| Notification / Jobs | Weekly report generation, reminder delivery, push/email dispatch, scheduled maintenance | Job schedules, delivery attempts | Business rule derivation outside domains | Reporting, Activity, PWA push subscriptions |
| Audit Logging | Security and domain audit trails for sensitive actions | Audit events: actor, family, command, before/after metadata, correlation IDs | Balances as mutable truth | API, Auth, Ledger, Activity |

## Core Domain Model

Use a relational model with UUID identifiers and `family_id` on every family-scoped table. Suggested entities:

| Area | Key Tables | Notes |
|------|------------|-------|
| Identity | `users`, `sessions` or auth-provider identities | A user can belong to multiple families in the future; do not bake one-family-only into `users`. |
| Tenancy | `families`, `family_memberships`, `family_invitations` | Membership links user/profile to family and role (`guardian`, `child`). |
| Profiles | `child_profiles`, `guardian_profiles`, `avatars` | Children may not need independent login at first; model profile separately from authenticated user. |
| Activity | `task_templates`, `task_activation_periods`, `weekly_cycles`, `task_completions` | Historical activation/deactivation state should be explicit, not inferred from current task flags. |
| Ledger | `ledger_transactions`, `ledger_lines`, `ledger_account_balances` optional cache | Ledger is append-only; balances are derived or cached with reconciliation. |
| Accounts | `ledger_accounts` | Account types: `earnings`, `firstfruits_treasury`, `spendable`, `wishlist_reserved`, `donation_reserved`, `parent_match`, `adjustment`. |
| Goals | `wishlist_goals`, `goal_allocations` | Goal progress comes from ledger allocations, not independent counters. |
| Donations | `donation_targets`, `donation_intents`, `donation_matches` | V1 models family-selected causes/people; no public charity marketplace. |
| Content | `bible_verses`, `content_placements`, `reflection_prompts` | Keep curated and small; avoid a full CMS in early phases. |
| Reporting | `weekly_reports`, `weekly_report_sections`, `report_delivery_attempts` | Snapshot reports at cycle close so history does not change when tasks/settings change. |
| Audit | `audit_events`, `idempotency_keys` | Capture who did what, for which family, command, source, and correlation ID. |

## Tenant Isolation Model

Kreds is a multi-tenant family application. The tenant boundary is the family household, not an organization or public community. Isolation must be designed in three layers:

1. **Application-layer relationship checks:** Every request resolves `(user_id, family_id, member_role, profile_id)` from the session and route. Authorization uses relationship/attribute checks: a guardian may manage family settings and adjustments; a child may view their own profile, submit completions, and manage their own wishlist/donation intents; no member may access another family by guessing IDs.
2. **Database-layer RLS:** Enable PostgreSQL Row-Level Security on tenant-owned tables. Policies should restrict rows by `family_id` using a transaction-local setting such as `app.current_family_id`, set by the API after authorization. PostgreSQL documentation states RLS restricts which rows can be returned or modified and uses default-deny when enabled without policies; use that as defense in depth.
3. **Schema and query discipline:** Every tenant-owned table has `family_id NOT NULL`; every foreign key relationship must include or validate family consistency; indexes should begin with `family_id` for common tenant queries. Never rely only on opaque UUIDs as a security boundary.

Recommended RLS posture:

```sql
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions FORCE ROW LEVEL SECURITY;

CREATE POLICY family_isolation_task_completions
ON task_completions
USING (family_id = current_setting('app.current_family_id')::uuid)
WITH CHECK (family_id = current_setting('app.current_family_id')::uuid);
```

Use RLS as a backstop, not as the only authorization system. OWASP guidance recommends least privilege, deny by default, permission validation on every request, and preferring attribute/relationship-based access control over simplistic RBAC for multi-tenant object access.

## Financial Ledger Architecture

Use a double-entry-inspired append-only ledger. Each business action posts one `ledger_transaction` containing balanced `ledger_lines`. This gives Kreds auditability, deterministic reports, and fewer reconciliation bugs.

### Ledger Principles

- **Append-only:** Do not edit or delete posted ledger transactions. Corrections are reversal/adjustment transactions.
- **Idempotent commands:** Task completion posting and donation/matching commands require idempotency keys so retries do not double-credit children.
- **Single posting service:** The ledger domain is the only component allowed to write ledger transactions.
- **Derived balances:** Compute balances from ledger lines or maintain cached balances updated in the same database transaction, with reconciliation tests.
- **Explicit account semantics:** Separate spendable Kreds, firstfruits treasury, wishlist reservations, donation reservations, parent match, and negative adjustments.
- **Rounding rule decided early:** Define how 10% tithe is rounded for integer Kreds. Recommendation: store Kreds in integer minor units (for example, cents-like `kred_units`) and round withholding deterministically with a documented rule.

### Example Transaction: Task Earning

If a child earns 100 Kreds for a completed task:

```text
ledger_transaction: TASK_EARNING_POSTED
  metadata: family_id, child_profile_id, task_completion_id, cycle_id

lines:
  +100 child gross earnings / income source
  -10  firstfruits withheld from child gross
  +10  firstfruits treasury balance
  +90  child spendable balance
```

The exact debit/credit signs can be normalized during implementation, but the transaction must preserve these facts: gross earning was 100, mandatory tithe was 10, spendable increase was 90, and the firstfruits treasury increased by 10.

### Example Transaction: Voluntary Donation With Match

If a child donates 50 Kreds and parents match 10%:

```text
ledger_transaction: DONATION_WITH_MATCH_POSTED
  metadata: family_id, child_profile_id, donation_target_id

lines:
  -50 child spendable balance
  +50 donation reserved/paid balance
  +5  parent match contribution
  +5  donation reserved/paid balance
```

Do not apply tithe to parent matching unless the product explicitly defines match as child earnings. Current PRD says matching is a parent-paid bonus on donated amount, so model it separately from task earnings.

## Weekly Activity Cycle Architecture

The activity cycle runs Sunday through Saturday, but family timezone must be explicit. Store timestamps in UTC and derive cycle boundaries using the family's timezone. Create or compute `weekly_cycles` with:

- `family_id`
- `starts_at`, `ends_at` in UTC
- `local_start_date`, `local_end_date`
- `status`: `open`, `closing`, `closed`, `reported`

The 72-hour backfill rule should be enforced server-side in the Activity domain before any ledger command is emitted. Client-side disabling is only UX.

Task activation history should use effective-period records rather than destructive edits:

```text
task_templates
  id, family_id, child_profile_id nullable, name, value, created_at

task_activation_periods
  id, family_id, task_template_id, active_from, active_until nullable, changed_by

task_completions
  id, family_id, task_template_id, child_profile_id, occurrence_date,
  completed_at, submitted_by, approved_by nullable, status, posted_ledger_transaction_id nullable
```

This lets reports answer: “Was this task active on the occurrence date?” even after the parent changes or disables the task.

## Data Flow

### Primary Flow: Task Completion to Weekly Report

```text
1. Child or parent submits task completion
   Frontend -> Activity API command

2. API resolves session and tenant context
   Auth -> family membership -> role/profile permissions

3. Activity domain validates completion
   - task belongs to family_id
   - task was active on occurrence date
   - occurrence date is inside valid Sunday-Saturday cycle
   - now is within 72 hours of occurrence date
   - duplicate completion rules pass

4. Completion is stored
   task_completions row created/updated with family_id and audit event

5. Ledger command is emitted synchronously after approval/acceptance
   Activity -> Ledger: PostTaskEarning(completion_id)

6. Ledger domain posts transaction atomically
   - gross task earning
   - mandatory 10% firstfruits withholding
   - spendable balance increase
   - audit event and idempotency key

7. Frontend reads updated child dashboard
   API returns balances derived from ledger lines or cached balances

8. Child allocates spendable Kreds
   Wishlist or Donation domain -> Ledger allocation/donation transaction

9. Donation matching, when enabled, posts separately
   Donation domain -> Ledger: PostParentMatch(donation_id)

10. Cycle closes after Saturday in family timezone
    Job worker -> Reporting domain

11. Weekly report snapshots facts
    Reporting reads Activity + Ledger + Content, writes weekly_report snapshot

12. Family receives gratitude report
    Notification worker sends link/push/email; Frontend displays report
```

### Data Flow Direction Rules

- Activity can request ledger postings; Ledger must not mutate task completion state except storing a returned `ledger_transaction_id` through the orchestrating command.
- Goals and Donations can request ledger postings; they must not directly update spendable balances.
- Reporting reads from domains and writes immutable report snapshots; it must not correct source data.
- Bible Content is read-only support data for UI/reporting; it must not drive financial calculations.
- Frontend reads DTOs and sends commands; it must not bypass backend domains.

## Build Order and Dependencies

Roadmap should build foundations before user-facing financial features. Suggested phase order:

| Order | Phase | Build | Depends On | Why First/Next |
|-------|-------|-------|------------|----------------|
| 1 | Project skeleton and PWA shell | Next.js app shell, backend API skeleton, PostgreSQL migrations, health checks, CI, local dev | None | Creates deployable vertical slice and validates frontend/backend boundaries. |
| 2 | Auth, family tenancy, roles | Users, families, memberships, guardian/child roles, invitation basics, API middleware, tenant context, RLS baseline | Phase 1 | Every later feature is tenant-owned and role-sensitive. |
| 3 | Audit and ledger foundation | Ledger accounts, transactions, lines, idempotency, audit events, balance queries, transaction tests | Phase 2 | Financial integrity is central; avoid bolting ledger on later. |
| 4 | Activity cycle foundation | Task templates, activation periods, weekly cycles, 72-hour validation, completion records | Phase 2, ledger interfaces from Phase 3 | Activity is the main source of earnings. |
| 5 | Task-to-earning vertical slice | Completion approval/acceptance posts ledger earning and tithe; dashboards show balances | Phases 3-4 | First complete product loop: responsibility -> earning -> firstfruits -> balance. |
| 6 | Wishlist goals | Goals, allocations from spendable balance, progress indicators | Phase 5 | Uses ledger balances safely after earning flow exists. |
| 7 | Donations and matching | Donation targets/intents, voluntary giving, 10% parent match ledger posting | Phase 5 | More complex financial flows after ledger is proven. |
| 8 | Bible content layer | Verse catalog, contextual placements, reflection prompts | PWA shell, basic dashboards | Adds discipleship identity without blocking financial correctness. |
| 9 | Weekly reports and notifications | Cycle close job, report snapshots, gratitude report, push/email delivery | Activity, Ledger, Content | Reports need stable source domains and closed-cycle data. |
| 10 | Hardening and observability | Authorization tests, ledger reconciliation, RLS tests, security headers, monitoring | All prior phases | Validates trust boundaries before broader launch. |

Critical dependency: **tenant isolation and audit/ledger foundations must precede any feature that writes task completions, earnings, donations, or adjustments.** Otherwise, early code will leak assumptions into every later phase.

## Patterns to Follow

### Pattern 1: Command-Oriented Domain Services

**What:** Mutating operations should be explicit commands (`SubmitTaskCompletion`, `ApproveCompletion`, `PostTaskEarning`, `AllocateToWishlist`, `PostDonationMatch`) handled by backend domain services.  
**When:** Any operation that changes task state, ledger state, goals, donations, reports, or memberships.  
**Why:** Commands provide a natural place for authorization, validation, idempotency, transaction boundaries, and audit logging.

```typescript
type CommandContext = {
  actorUserId: string
  familyId: string
  role: 'guardian' | 'child'
  childProfileId?: string
  correlationId: string
}

async function submitTaskCompletion(ctx: CommandContext, input: SubmitTaskCompletionInput) {
  authorize(ctx, 'task_completion.submit', input)
  return db.transaction(async (tx) => {
    await setTenantContext(tx, ctx.familyId)
    const completion = await activity.createCompletion(tx, ctx, input)
    const posting = await ledger.postTaskEarning(tx, ctx, completion.id)
    await audit.record(tx, ctx, 'TASK_COMPLETION_SUBMITTED', { completionId: completion.id })
    return { completion, posting }
  })
}
```

### Pattern 2: Append-Only Ledger With Reversal Transactions

**What:** Store immutable ledger transactions and lines; correct mistakes with reversals and adjustments.  
**When:** All Kreds Engine flows: task earnings, tithe withholding, negative adjustments, wishlist allocations, donations, parent matching.  
**Why:** Parents and children must trust historical balances and reports. Mutable balances make auditability weak.

### Pattern 3: Effective-Dated Task Configuration

**What:** Track task activation/deactivation as historical periods.  
**When:** Any task whose availability or value can change over time.  
**Why:** Weekly reports and 72-hour validations need to know what was true on the occurrence date, not what is true now.

### Pattern 4: Snapshot Weekly Reports

**What:** Generate weekly report snapshots at cycle close and keep them stable.  
**When:** End of each Sunday-Saturday cycle.  
**Why:** Families expect the gratitude report to be a historical artifact. If old reports change when task names or Bible placements change, trust erodes.

### Pattern 5: Server-Enforced ABAC/ReBAC

**What:** Use relationship and attributes: actor belongs to family, actor role, child profile relationship, resource family, task owner, cycle status, time window.  
**When:** Every API request and every domain command.  
**Why:** Simple role checks are insufficient for “guardian can manage all children in family, child can only manage self” cases.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Frontend-Authoritative Balances

**What:** Calculating and persisting balances from client state.  
**Why bad:** Users can tamper with client requests; offline/optimistic updates can double-post; audit trail becomes unreliable.  
**Instead:** Frontend submits commands; backend ledger returns authoritative balances.

### Anti-Pattern 2: Current-State Task Flags Only

**What:** A single `tasks.active` boolean with no activation history.  
**Why bad:** Historical reports and occurrence-date validation become impossible after task changes.  
**Instead:** Use effective-dated activation periods.

### Anti-Pattern 3: Mutable Balance Columns as Source of Truth

**What:** Updating `child.balance = child.balance + amount` without ledger lines.  
**Why bad:** No reliable audit trail, hard to reverse errors, easy to drift under concurrency.  
**Instead:** Append ledger lines; cache balances only as a derived optimization.

### Anti-Pattern 4: Tenant Filtering as an Optional Query Clause

**What:** Remembering to add `WHERE family_id = ?` manually in each query.  
**Why bad:** One missed filter causes cross-family data leaks.  
**Instead:** Centralize tenant context in API middleware/repositories and enforce PostgreSQL RLS.

### Anti-Pattern 5: Treating Bible Content as a CMS First

**What:** Building a large content management system before the stewardship loop works.  
**Why bad:** It distracts from the core allowance/ledger/cycle architecture.  
**Instead:** Start with curated verses and placements; expand only after reports and dashboards need it.

## Auditability Implications

Kreds teaches stewardship, so auditability is product trust, not just compliance.

Minimum audit events:

- Family created, member invited, role changed, member removed.
- Child profile created/edited.
- Task created, activated, deactivated, value changed.
- Task completion submitted, approved, rejected, auto-blocked by 72-hour rule.
- Ledger transaction posted, reversed, or adjusted.
- Negative adjustment recorded.
- Wishlist goal created, completed, cancelled.
- Donation intent created, matched, cancelled.
- Weekly report generated and delivered.

Each audit event should include:

- `family_id`
- `actor_user_id` and optional `actor_profile_id`
- `subject_profile_id` when acting on a child
- event type
- resource type and ID
- before/after summary for configuration changes
- correlation/request ID
- timestamp
- source (`web`, `pwa`, `job`, `system`)

Do not store sensitive secrets or full session tokens in audit metadata. Keep audit rows tenant-scoped but administratively queryable through secure operations tooling.

## PWA Frontend/Backend Boundary

Next.js is a good fit for the installable PWA shell because its current documentation supports web app manifests through App Router and describes service worker/push-notification integration. The PWA should prioritize online-first correctness for financial mutations. Offline support should be limited initially to cached dashboards, cached Bible verses, and draft task submissions that must be revalidated server-side when synced.

Boundary recommendations:

- Use server-rendered or server-fetched dashboard data where practical for fast first load.
- Use client components for child-friendly interactions, task check-offs, progress bars, and install prompts.
- Store push subscriptions in the backend database per user/profile/family, not in process memory.
- Use HTTPS in all environments that test PWA install/push behavior.
- Add security headers and service-worker cache controls early.
- Avoid offline ledger posting in v1. Queue “draft completion submissions” only if product needs offline UX; when syncing, the backend must still enforce 72-hour and duplicate rules.

## Scalability Considerations

| Concern | At 100 families | At 10K families | At 1M families |
|---------|-----------------|-----------------|----------------|
| Tenant isolation | Single PostgreSQL DB, RLS, `family_id` indexes | Same, add authorization/RLS test suite and query monitoring | Consider partitioning large ledger/report tables by time or family hash; keep tenant model unchanged |
| Ledger | Compute balances from ledger lines or simple cached balances | Cached balances updated transactionally; nightly reconciliation | Event/ledger archival strategy, partitioned ledger, read replicas for reporting |
| Weekly reports | In-process scheduled job is acceptable | Dedicated worker queue; idempotent report generation | Distributed job workers, report partitions, delivery rate limits |
| PWA delivery | Single web deployment | CDN for static assets, API autoscaling | Multi-region static delivery; API/database locality decisions needed |
| Notifications | Manual/email optional | Push/email provider integration with delivery tracking | Queue-based fanout, provider failover, user preference service |
| Content | Static seeded verse catalog | Admin-seeded catalog and placements | Content versioning and localization workflow |

## Phase-Specific Architecture Warnings

| Phase Topic | Warning | Mitigation |
|-------------|---------|------------|
| Auth/tenancy | Children may not have independent login initially, but still need profile-level permissions | Separate authenticated `users` from `child_profiles`; allow child profiles to later link to users. |
| Activity cycles | Timezone and Sunday-Saturday boundaries can cause off-by-one errors | Store UTC timestamps, family timezone, and local occurrence dates; test cycle boundaries. |
| 72-hour rule | Client-side date disabling is bypassable | Enforce in backend command and audit blocked attempts. |
| Ledger | Tithe/match rounding ambiguity can create family-visible discrepancies | Define integer units and rounding in the first ledger phase. |
| Donations | Public charity marketplace could introduce regulatory/payment complexity | V1 models family-selected causes/people and internal Kreds only. |
| Reports | Reports generated from live queries can change historically | Snapshot reports at cycle close. |
| PWA offline | Offline writes can double-post or bypass validation | Online-first financial mutations; idempotency keys for retries. |

## Sources

- Kreds project context: `.planning/PROJECT.md` (HIGH confidence, primary project source).
- Original PRD: `PRD_Kreds_App.md` (HIGH confidence, primary product source; Portuguese original).
- PostgreSQL 18 Row Security Policies, current docs fetched 2026-06-04: `https://www.postgresql.org/docs/current/ddl-rowsecurity.html` (HIGH confidence). Key findings: RLS restricts returned/modified rows; default-deny when enabled without policies; `FORCE ROW LEVEL SECURITY` avoids owner bypass.
- PostgreSQL 18 Transaction Isolation, current docs fetched 2026-06-04: `https://www.postgresql.org/docs/current/transaction-iso.html` (HIGH confidence). Key findings: financial posting commands should use explicit transactions and be prepared for concurrency/retry behavior when stronger isolation is used.
- OWASP Authorization Cheat Sheet, fetched 2026-06-04: `https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html` (HIGH confidence). Key findings: least privilege, deny-by-default, validate permissions on every request, avoid IDOR, prefer ABAC/ReBAC for multi-tenant object access.
- Next.js PWA Guide, version 16.2.7, last updated 2026-02-11, fetched 2026-06-04: `https://nextjs.org/docs/app/guides/progressive-web-apps` (HIGH confidence). Key findings: App Router manifest support, service worker/push patterns, HTTPS/install requirements, security headers guidance.
