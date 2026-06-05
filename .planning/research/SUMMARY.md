# Project Research Summary

**Project:** Kreds  
**Domain:** Christian stewardship and allowance management family PWA  
**Researched:** 2026-06-04  
**Confidence:** HIGH overall, with targeted MEDIUM gaps around Christian-content UX, jurisdiction, and future real-money flows

## Executive Summary

Kreds is a child- and parent-facing stewardship habit product, not a banking app. Experts should build it like a trust-sensitive family finance system: parent-governed child profiles, strict family tenancy, command-based backend workflows, immutable ledger entries, server-enforced authorization, and child-safe PWA experiences. The product succeeds when families can answer, at any time, “who did what, why did this balance change, what was set aside first, and what did we learn this week?”

The recommended approach is a TypeScript-first Next.js modular monolith backed by PostgreSQL. Build family isolation, auth, role permissions, audit events, and ledger foundations before adding generosity, wishlist, reporting, or PWA offline behavior. Keep Kreds as an internal family ledger in v1; do not compete with Greenlight, BusyKid, FamZoo, or GoHenry on debit cards, investing, payment rails, or charity marketplace breadth.

The biggest risks are child privacy, cross-family data leaks, mutable balances, scattered firstfruits/matching logic, and confusing internal giving with real charitable donations. Mitigate them by designing parent-created child profiles, `family_id` everywhere, PostgreSQL RLS as defense in depth, append-only ledger postings, idempotent domain commands, audit trails, child-friendly formative language, and clear “family-recorded giving” wording until real payments receive dedicated compliance research.

## Key Findings

### Recommended Stack

Use a single-language TypeScript stack for faster product iteration and shared validation across UI, API, domain services, tests, and workers. The core architecture should be a Next.js App Router PWA with server-only domain modules, PostgreSQL as system of record, Drizzle for typed SQL/migrations, Better Auth plus custom authorization, and a Postgres-backed worker for cycle/report jobs.

**Core technologies:**
- **Node.js 24 LTS / 22 LTS baseline:** runtime for a unified TypeScript application.
- **TypeScript 6.x / 5.8+ baseline:** shared types and validation contracts across frontend, backend, and tests.
- **Next.js 16 / 15 baseline + React 19:** full-stack PWA framework with App Router, Route Handlers, and Server Actions.
- **PostgreSQL 18 / 17 baseline:** transactional relational source of truth for tenancy, audit, and ledger integrity.
- **Drizzle ORM + `pg`:** explicit typed SQL, migrations, transactions, and raw-SQL escape hatches.
- **Better Auth:** auth/session foundation; do not treat its organization model as the Kreds domain model.
- **PostgreSQL RLS:** defense-in-depth isolation for every family-scoped table.
- **Serwist:** modern Next-compatible service worker/PWA tooling; verify with chosen Next version during bootstrap.
- **Tailwind CSS 4 + shadcn/Radix:** accessible, owned UI component foundation.
- **Vitest, Testcontainers, Playwright:** domain invariants, real PostgreSQL integration tests, and PWA/E2E flows.
- **pg-boss:** retryable Postgres-backed weekly cycle/report jobs without adding Redis in v1.

**Avoid for v1:** Go backend, microservices, MongoDB/Firestore as primary database, floating-point Kreds amounts, `next-pwa` by default, client-only authorization, and production Postgres inside Kubernetes without deliberate DB operations maturity.

### Table Stakes

Allowance/chore products converge on a standard loop: parents create child profiles, assign recurring chores/allowance rules, children mark work complete, parents approve, earnings update balances/buckets, and both sides can see history. Kreds must meet that baseline before its Christian differentiation will matter.

**Must have:**
- Family account with isolated household data and explicit `family_id` tenancy.
- Parent/guardian and child roles, including multi-guardian support early.
- Parent-created child profiles with simple avatars/custom colors.
- Mobile-first installable PWA for parent and child experiences.
- Weekly Sunday-Saturday task cycle with task templates, values, active periods, and historical activation/deactivation.
- Child completion submission, parent approval/review, and server-enforced 72-hour backfill rule.
- Append-only Kreds ledger for earnings, firstfruits, adjustments, destinations, and audit feed.
- Automatic 10% firstfruits withholding before spend/save/give allocation.
- Firstfruits Treasury, available Kreds, wishlist goals, and Kreds do Bem internal giving destinations.
- Parent dashboard, child dashboard, activity/history view, and weekly gratitude summary.
- Privacy and child-safety controls: no public child profiles, no ads, no unnecessary trackers.

### Differentiators

Kreds should differentiate on values formation, not financial product breadth.

**Competitive differentiators:**
- Christian stewardship framing: God owns, families steward.
- Mandatory firstfruits and visible Firstfruits Treasury.
- 72-hour integrity guardrail for task backfill.
- Kreds do Bem as parent-approved generosity allocation.
- Parent-funded 10% donation match as a teaching moment.
- Weekly gratitude report with reflection prompts.
- Curated scripture/context nudges tied to earning, diligence, giving, and gratitude.
- Restorative negative-adjustment flow with reason and repair note.

**Defer to v2+:**
- Real debit cards, banking, payment rails, or external money movement.
- Public charity marketplace and tax-receipt language.
- Investing/trading features.
- Large lesson/game curriculum or sermon-like content library.
- Advanced recurrence engine, public sharing, social feeds, leaderboards, and randomized rewards.
- Wishlist purchase cooling-off/redemption complexity until goals and parent fulfillment exist.

## Architecture Implications

Kreds should be a modular monolith with strict server/client boundaries. The frontend submits commands and renders DTOs; the backend owns tenancy, authorization, task-cycle validation, ledger postings, firstfruits/matching rules, content selection, reports, and audit events. PostgreSQL is the system of record, with RLS backing application-layer checks.

**Major components:**
1. **Frontend PWA:** role-specific dashboards, install shell, forms, progress views, non-authoritative previews, and privacy-reviewed caching only.
2. **Auth/Authorization:** users, sessions, family memberships, guardian/child roles, invitations, ABAC/ReBAC checks, and audit attribution.
3. **Family Domain:** family settings, timezone, child/guardian profiles, avatars, and lifecycle.
4. **Activity Domain:** task templates, activation periods, weekly cycles, completions, approvals, and 72-hour validation.
5. **Ledger Domain / Kreds Engine:** append-only transactions/lines, firstfruits, adjustments, donations, matches, derived/cached balances, idempotency.
6. **Goals and Donations Domain:** wishlist allocations, family-defined causes, giving intentions, parent approvals, and matching requests.
7. **Bible Content Domain:** small curated verse/prompt catalog with theme, context, age tone, licensing/attribution metadata.
8. **Reporting/Jobs:** cycle close, immutable weekly report snapshots, delivery status, reminders, and observability.
9. **Audit Logging:** actor, role, family, resource, command, before/after summary, correlation ID, timestamp, and source.

**Architecture rules:**
- Every family-scoped table has `family_id`; every endpoint proves membership and relationship to the requested resource.
- All mutating flows are explicit backend commands with validation, authorization, transaction boundary, idempotency key, and audit event.
- Ledger transactions are append-only; corrections use reversals/adjustments, not edits/deletes.
- Balances are derived from ledger lines or cached only inside the same transaction as postings.
- Store Kreds as integer minor units and decide firstfruits/match rounding in the first ledger phase.
- Store UTC timestamps plus family timezone/local dates; compute Sunday-Saturday cycles server-side.
- Snapshot weekly reports at cycle close so historical reports do not change after task/content edits.
- Offline financial writes are out of scope for v1; cache static shell/read-mostly content only until privacy/security review.

## Pitfalls and Mitigations

1. **Child data treated like ordinary user data** — use parent-created child profiles, data inventory, retention/deletion flows, no child self-registration, no trackers/session replay on child screens, and generated/curated avatars first.
2. **Weak family tenancy** — make `family_id` a first-class invariant, use membership-derived authorization, add cross-family tests, and enable PostgreSQL RLS as a backstop.
3. **Mutable balances instead of ledger** — use append-only ledger transactions/lines, integer units, idempotent commands, atomic firstfruits posting, and reconciliation tests.
4. **Scattered 10% firstfruits/match logic** — centralize Kreds Engine rules in backend services, define rounding once, and create invariant tests before destination modules.
5. **Internal giving confused with real donations** — call v1 flows “giving intention,” “family-recorded giving,” or “Kreds do Bem allocation”; avoid tax receipts, charity marketplace UI, and “Donate now” implications.
6. **Coercive/shame-based child UX** — use formative language, restorative notes, parent-only controls, encouragement-first scripture, and usability testing with age bands.
7. **Opaque parent controls** — expose actor-attributed activity and ledger history early, require separate guardian accounts, and audit sensitive changes.
8. **72-hour rule implemented only in UI** — enforce cutoff server-side using server time and family timezone; audit blocked attempts and reasoned overrides.
9. **PWA cache leaks family state** — cache static assets by default, clear local storage on logout/role switch, and require re-auth/PIN for parent-sensitive actions on shared devices.
10. **Weekly report history drift** — effective-date task configuration and generate reports from immutable events plus snapshots.

## Roadmap Implications

### Phase 0: Foundation, Privacy, and Delivery Skeleton
**Rationale:** Safety and deployability must exist before child data or financial logic is created.  
**Delivers:** Next.js app shell, PostgreSQL/Drizzle setup, migrations, CI/test baseline, Docker/Kubernetes target shape, privacy/data inventory, vendor register, canonical terminology glossary, security headers, no-tracker child policy.  
**Addresses:** PWA foundation, child privacy, delivery baseline.  
**Avoids:** COPPA/privacy blind spots, third-party risk, localization debt, overbuilt Kubernetes.

### Phase 1: Auth, Family Tenancy, Roles, and Profiles
**Rationale:** Every later feature is family-scoped and role-sensitive; retrofitting tenancy is expensive and dangerous.  
**Delivers:** Better Auth integration, families, memberships, guardian invitations, child profiles, generated avatars, tenant context, RLS baseline, authorization helpers, cross-family tests, audit events for identity/profile changes.  
**Addresses:** Family account, parent/guardian/child roles, child profiles.  
**Avoids:** Cross-family leaks, multi-guardian ambiguity, unsafe avatar uploads, shared parent credentials.

### Phase 2: Ledger and Audit Foundation
**Rationale:** Firstfruits, balances, adjustments, donations, wishlist, and reports all depend on a trustworthy Kreds Engine.  
**Delivers:** Ledger accounts, transactions, lines, idempotency keys, integer-unit rounding policy, firstfruits/match transaction types, reversal/adjustment model, derived/cached balance queries, ledger invariant tests, audit history surfaces.  
**Addresses:** Earnings ledger, firstfruits Treasury mechanics, activity feed foundation.  
**Avoids:** Mutable balances, duplicate credits, scattered 10% logic, opaque parent controls.

### Phase 3: Weekly Activity and Task-to-Earning Vertical Slice
**Rationale:** This is the first complete product loop: responsibility → completion → approval → earning → firstfruits → balance.  
**Delivers:** Task templates, activation/deactivation periods, Sunday-Saturday weekly cycles, family timezone, completion submissions, 72-hour server validation, parent approval, task earning postings, basic parent/child dashboards.  
**Addresses:** Task creation, recurring weekly schedule, child completion, approval, 72-hour rule, basic dashboards.  
**Avoids:** UI-only cutoff, timezone bugs, current-state task history, frontend-authoritative balances.

### Phase 4: Goals and Kreds do Bem Generosity
**Rationale:** Wishlist and generosity require reliable spendable balances and ledger destinations.  
**Delivers:** Wishlist goals, goal allocations/progress, parent-defined giving targets, child giving intentions, parent approval/recording, 10% parent match postings, clear internal-allocation language.  
**Addresses:** Wishlist goals, Kreds do Bem, voluntary donation flow, parent matching, giving history.  
**Avoids:** Purchase entitlement, real-donation/tax confusion, public charity marketplace complexity.

### Phase 5: Weekly Gratitude and Biblical Content Layer
**Rationale:** Reports become meaningful only after task, ledger, wishlist, and giving data exist. Biblical content should be contextual, curated, and non-punitive.  
**Delivers:** Weekly report snapshots, gratitude/reflection prompts, curated scripture placements, content licensing/attribution decision, parent encouragement note, report delivery job.  
**Addresses:** Weekly gratitude report, scripture nudges, parent-child stewardship conversations.  
**Avoids:** Decorative verses, shame-based content, mutable historical reports, surveillance-style weekly summaries.

### Phase 6: PWA Hardening, Notifications, and Habit Polish
**Rationale:** Polish and offline behavior should follow correctness, privacy, and core value validation.  
**Delivers:** Installability hardening, safe service-worker caching, storage clearing on logout, push/in-app reminders, accessibility pass, age-adaptive prompts, values tags, optional wishlist cooling-off.  
**Addresses:** Mobile/PWA quality, reminders, child UX refinement, delayed-gratification features.  
**Avoids:** Offline/cache leaks, offline ledger writes, over-gamification, accessibility-as-polish.

### Phase Ordering Rationale

- Build safety and tenancy before features because every user story touches child data and family boundaries.
- Build ledger before task payouts, destinations, donations, or reports because Kreds trust depends on explainable balances.
- Build activity after ledger interfaces so the first vertical slice posts authoritative earnings correctly.
- Build wishlist/giving after spendable balances exist; keep donations internal until a later compliance/payment phase.
- Build gratitude/content after source data exists; otherwise reports become decorative or inaccurate.
- Build PWA offline/push polish late because caching sensitive child/ledger data is a security feature, not plumbing.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 0:** COPPA/child privacy jurisdiction, vendor policy, and Portuguese vs English localization strategy.
- **Phase 2:** Ledger rounding semantics, transaction isolation/retry policy, and invariant test design.
- **Phase 4:** Donation wording, parent-recorded giving UX, and any real-money/payment scope decision.
- **Phase 5:** Bible translation licensing, attribution, denomination/tone guidelines, and content frequency controls.
- **Phase 6:** PWA cache/security strategy, push notification provider privacy, and shared-device re-auth/PIN patterns.

Phases with standard patterns that can usually skip additional research:
- **Phase 1:** Auth, family memberships, RLS baseline, and ABAC/ReBAC are well-documented patterns; validate library specifics only.
- **Phase 3:** Task CRUD, approvals, and dashboards are standard once timezone/72-hour requirements are specified.

## Open Decisions

- **Jurisdiction and language:** Will v1 target Brazil/Portuguese-speaking families, U.S. families, or both? Privacy, donation wording, and localization depend on this.
- **Bible content:** Which translation/version will be used? Full verse text needs licensing/attribution review; reference-only may be safer initially.
- **Money scope:** Will v1 remain an internal family ledger with parent settlement outside the app? Recommendation: yes; any real payment/donation scope requires a dedicated compliance phase.
- **Child age bands:** Which child UX split matters most for launch: 6-9, 10-12, teens, or parent-only setup first?
- **Rounding policy:** How exactly should 10% firstfruits and 10% parent match round in integer Kreds units?
- **Child login model:** Should children use parent-mediated profile switching initially, or have independent child credentials/PINs in v1?
- **Negative balance policy:** Are negative adjustments allowed to create negative child balances, or should they be capped/restorative only?

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core Next.js/TypeScript/PostgreSQL/Drizzle recommendation is strongly supported; Serwist/Better Auth details need version-specific verification during bootstrap. |
| Features | MEDIUM-HIGH | Generic allowance/chore table stakes are strongly verified; Christian stewardship differentiators need target-family validation. |
| Architecture | HIGH | Tenant isolation, append-only ledger, command services, RLS, audit, and report snapshots are well-established patterns. |
| Pitfalls | HIGH | Privacy, security, ledger, accessibility, and donation-risk pitfalls are backed by official guidance; religious-content UX remains more product-specific. |

**Overall confidence:** HIGH for roadmap structure; MEDIUM for faith-content copy, jurisdictional compliance, and future payment/donation decisions.

### Gaps to Address

- **Child privacy jurisdiction:** Resolve during Phase 0 before collecting child data or selecting analytics/error vendors.
- **Localization and terminology:** Create canonical glossary and localization keys before UI copy hardens.
- **Bible licensing:** Decide reference-only vs full text before implementing scripture snippets.
- **User validation:** Test firstfruits, matching, negative adjustments, and Kreds do Bem language with parents and children early.
- **Payment/compliance boundary:** Explicitly freeze v1 as internal ledger unless a separate compliance plan is approved.
- **Operational database posture:** Prefer managed PostgreSQL; if self-hosting becomes required, research backups, PITR, failover, and upgrades separately.

## Sources

### Primary (HIGH confidence)
- `.planning/research/STACK.md` — stack recommendation, versions, PWA/auth/jobs/testing guidance.
- `.planning/research/FEATURES.md` — competitor feature landscape, table stakes, differentiators, anti-features, feature dependencies.
- `.planning/research/ARCHITECTURE.md` — tenancy, ledger, domain boundaries, data flows, build order, auditability, PWA boundary.
- `.planning/research/PITFALLS.md` — privacy, security, ledger, donation, religious UX, accessibility, PWA cache, and weekly-cycle pitfalls.
- PostgreSQL docs — RLS, transactions, versioning, and transaction integrity.
- OWASP Authorization Cheat Sheet / ASVS — least privilege, deny-by-default, ABAC/ReBAC, and access-control verification.
- FTC COPPA guidance — child privacy, parent notice/consent, retention/deletion, third-party operators.
- W3C WCAG 2.2 guidance — accessibility baseline for web/mobile web applications.

### Secondary (MEDIUM confidence)
- Better Auth docs — auth organizations/custom roles capability; Kreds-specific family-role modeling still needs implementation design.
- Serwist Next.js docs — PWA setup; verify against chosen Next.js/Turbopack configuration.
- CFPB Money as You Grow — age-appropriate financial education prompts and parent-child conversations.
- Greenlight, GoHenry/Acorns Early, BusyKid, FamZoo official pages — competitor table stakes and feature expectations.
- IRS/FTC charity guidance — avoid tax-deductible/real charity implications without qualified organization/payment handling.

---
*Research completed: 2026-06-04*  
*Ready for roadmap: yes*
