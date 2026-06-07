# Roadmap: Kreds

## Overview

Kreds v1 moves from a privacy-safe delivery skeleton into family tenancy, a trustworthy Kreds Engine, weekly task earnings, wishlist and generosity allocations, gratitude reporting, and finally PWA/child-experience hardening. The roadmap follows the dependency order required for a trust-sensitive child and family finance product: protect family data before profiles, establish append-only ledger rules before earnings and giving, then layer biblical content and mobile polish after the core stewardship loop works.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation, Privacy, and Delivery Skeleton** - Developers and maintainers can run, test, package, and review Kreds before child data exists.
- [ ] **Phase 2: Family Access, Tenancy, Roles, and Profiles** - Families can be created through ZITADEL-backed authentication with isolated memberships, guardians, children, roles, avatars, and identity audit history.
- [ ] **Phase 3: Kreds Engine Ledger and Audit Foundation** - Kreds movements are posted through integer, append-only, idempotent ledger transactions with firstfruits and correction rules.
- [ ] **Phase 4: Weekly Task Templates and Activity Cycles** - Parents can define weekly tasks whose Sunday-Saturday cycles and activation history are preserved.
- [ ] **Phase 5: Task Completion, Approval, and Earnings Slice** - Children complete tasks, parents approve them, and approved work posts Kreds earnings with visible status and history.
- [ ] **Phase 6: Wishlist Goals and Progress** - Children can set wishlist goals and move available Kreds toward visible goal progress.
- [ ] **Phase 7: Kreds do Bem Giving and Matching** - Families can record internal giving allocations with parent-approved targets, matching, and ledger-backed history.
- [ ] **Phase 8: Biblical Content and Weekly Gratitude Reports** - Families receive immutable weekly reports with curated scripture and reflection prompts tied to stewardship activity.
- [ ] **Phase 9: PWA Hardening and Child Experience Polish** - Parent and child flows are installable, responsive, accessible, safe on shared devices, and encouraging in tone.

## Phase Details

### Phase 1: Foundation, Privacy, and Delivery Skeleton

**Goal**: Developers and maintainers can safely bootstrap Kreds without collecting child profile data.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: FND-01, FND-02, FND-03, FND-04, FND-05
**Success Criteria** (what must be TRUE):

  1. Developer can run the Next.js TypeScript PWA shell locally against PostgreSQL-backed configuration.
  2. Developer can run migrations and automated tests from documented commands and see deterministic pass/fail output.
  3. Developer can build a Docker image suitable for the target Kubernetes delivery path.
  4. Maintainer can review child-privacy data inventory before any child profile data is collected.
  5. Maintainer can use canonical Kreds terminology for firstfruits, giving, tasks, and weekly reports.

**Plans**: 4 plans**Plans:**
**Wave 1**

- [x] 01-01-PLAN.md — Base Next.js scaffold, package legitimacy gate, dependency install, health API endpoint

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-02-PLAN.md — PostgreSQL (Deployed on hasslab-k3s/kreds), Drizzle migration application, families API and DB-backed page proof
- [x] 01-04-PLAN.md — Child privacy data inventory, canonical terminology glossary with TypeScript constants

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-03-PLAN.md — Test infrastructure with passing migration integration test and Docker multi-stage build

**UI hint**: yes

### Phase 2: Family Access, Tenancy, Roles, and Profiles

**Goal**: Parents can authenticate through ZITADEL and create isolated family accounts with guardians, children, roles, profile identifiers, and audit visibility.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: FAM-01, FAM-02, FAM-03, FAM-04, FAM-05, FAM-06, FAM-07
**Success Criteria** (what must be TRUE):

  1. Parent can authenticate through ZITADEL, create a family account, and all family-scoped data is isolated by `family_id`.
  2. Parent can invite or register another guardian and create child profiles without public child self-registration.
  3. Parent can assign Kreds guardian or child roles stored in the domain model, and family members only see data from their own family.
  4. Parent can customize child profiles with simple avatars or visual identifiers.
  5. Parent can review an audit trail for identity, membership, and profile changes.

**Plans**: 4 plans
**Wave 1**

- [ ] 02-01-PLAN.md — ZITADEL-backed family onboarding, domain roles, isolation schema, and blocking Drizzle schema push

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 02-02-PLAN.md — Guardian-managed child profiles with consent, Sylvan avatars, accent colors, and privacy inventory update
- [ ] 02-03-PLAN.md — Guardian invitation lifecycle with authenticated acceptance and audit events

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 02-04-PLAN.md — Guardian-readable audit timeline and cross-family isolation closure
**UI hint**: yes

### Phase 3: Kreds Engine Ledger and Audit Foundation

**Goal**: Families can trust balance changes because every Kreds movement is integer-based, append-only, explainable, and correction-safe.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: LEDG-01, LEDG-02, LEDG-03, LEDG-04, LEDG-05, LEDG-06, LEDG-07, LEDG-08
**Success Criteria** (what must be TRUE):

  1. System records every Kreds movement as append-only ledger transactions and lines using integer units.
  2. System applies one documented rounding policy for 10% firstfruits and 10% donation matching.
  3. System automatically withholds 10% of every positive earning into the Firstfruits Treasury before available balance changes.
  4. Parent can record negative adjustments with reasons and optional restoration notes.
  5. Parent and child can view activity history that explains balance changes, while mistakes are corrected through reversals or adjustments instead of historical edits.

**Plans**: TBD
**UI hint**: yes

### Phase 4: Weekly Task Templates and Activity Cycles

**Goal**: Parents can define weekly responsibilities that preserve Sunday-Saturday timing and historical activation state.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: ACT-01, ACT-02, ACT-03
**Success Criteria** (what must be TRUE):

  1. Parent can create task templates with title, description, assigned child, Kreds value, and active period.
  2. System computes each family activity cycle from Sunday through Saturday using the family timezone.
  3. System preserves task activation and deactivation history for later weekly reporting.

**Plans**: TBD
**UI hint**: yes

### Phase 5: Task Completion, Approval, and Earnings Slice

**Goal**: Children can turn approved weekly responsibilities into earned Kreds through the parent-governed stewardship loop.
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: ACT-04, ACT-05, ACT-06, ACT-07, ACT-08, ACT-09
**Success Criteria** (what must be TRUE):

  1. Child can submit task completions for specific occurrence dates and see submitted, approved, rejected, and earned statuses.
  2. System blocks task completion submissions more than 72 hours after the occurrence date using server-side validation.
  3. Parent can review pending approvals across children and approve or reject each submitted completion.
  4. System posts task earnings only after parent approval and routes firstfruits through the Kreds Engine.
  5. Parent and child can view current weekly tasks and earned Kreds for the active cycle.

**Plans**: TBD
**UI hint**: yes

### Phase 6: Wishlist Goals and Progress

**Goal**: Children can direct available Kreds toward personal wishlist goals and see progress grow.
**Mode:** mvp
**Depends on**: Phase 5
**Requirements**: GOAL-01, GOAL-02
**Success Criteria** (what must be TRUE):

  1. Child can create wishlist goals with target amounts.
  2. Child can allocate available Kreds toward a wishlist goal.
  3. Child and parent can see wishlist progress indicators based on current allocations.

**Plans**: TBD
**UI hint**: yes

### Phase 7: Kreds do Bem Giving and Matching

**Goal**: Families can practice generosity through parent-approved internal giving allocations with transparent matching and history.
**Mode:** mvp
**Depends on**: Phase 6
**Requirements**: GOAL-03, GOAL-04, GOAL-05, GOAL-06, GOAL-07
**Success Criteria** (what must be TRUE):

  1. Parent can define family-approved Kreds do Bem giving targets.
  2. Child can allocate available Kreds toward a parent-approved giving target.
  3. System clearly records Kreds do Bem as an internal family giving allocation, not a real-money charitable payment.
  4. System posts a parent-funded 10% match when a voluntary giving allocation is approved.
  5. Parent and child can view wishlist and giving history with ledger-backed totals.

**Plans**: TBD
**UI hint**: yes

### Phase 8: Biblical Content and Weekly Gratitude Reports

**Goal**: Families can reflect on weekly stewardship with curated scripture prompts and immutable gratitude report snapshots.
**Mode:** mvp
**Depends on**: Phase 7
**Requirements**: BIBL-01, BIBL-02, BIBL-03, BIBL-04, BIBL-05, BIBL-06
**Success Criteria** (what must be TRUE):

  1. Maintainer can manage a curated catalog of scripture references and reflection prompts.
  2. System can show contextual scripture references for stewardship, diligence, generosity, and gratitude moments without unreviewed AI-generated Bible teaching.
  3. Family can receive a weekly gratitude report at the end of each Sunday-Saturday cycle.
  4. Weekly gratitude report summarizes tasks, earnings, firstfruits, wishlist progress, giving, and reflection prompts.
  5. Weekly gratitude reports are saved as historical snapshots that do not drift after later task or content edits.

**Plans**: TBD
**UI hint**: yes

### Phase 9: PWA Hardening and Child Experience Polish

**Goal**: Parents and children can use Kreds safely and comfortably across mobile and desktop browsers, including shared-device scenarios.
**Mode:** mvp
**Depends on**: Phase 8
**Requirements**: PWA-01, PWA-02, PWA-03, PWA-04, PWA-05, PWA-06
**Success Criteria** (what must be TRUE):

  1. Parent and child can use responsive dashboards on mobile and desktop browsers.
  2. User can install the app as a PWA on supported devices.
  3. System avoids caching sensitive child or ledger data for offline financial writes in v1.
  4. User can log out and clear locally stored family-sensitive state on shared devices.
  5. Child-facing screens use formative, encouraging language and core flows support keyboard navigation, labels, and readable contrast.

**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation, Privacy, and Delivery Skeleton | 4/4 | ✅ Complete | 2026-06-06 |
| 2. Family Access, Tenancy, Roles, and Profiles | 0/TBD | Not started | - |
| 3. Kreds Engine Ledger and Audit Foundation | 0/TBD | Not started | - |
| 4. Weekly Task Templates and Activity Cycles | 0/TBD | Not started | - |
| 5. Task Completion, Approval, and Earnings Slice | 0/TBD | Not started | - |
| 6. Wishlist Goals and Progress | 0/TBD | Not started | - |
| 7. Kreds do Bem Giving and Matching | 0/TBD | Not started | - |
| 8. Biblical Content and Weekly Gratitude Reports | 0/TBD | Not started | - |
| 9. PWA Hardening and Child Experience Polish | 0/TBD | Not started | - |
