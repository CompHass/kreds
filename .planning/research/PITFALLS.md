# Domain Pitfalls: Kreds Family Stewardship PWA

**Domain:** Christian stewardship, allowance, chores, child finance education, and family PWA products  
**Project:** Kreds  
**Researched:** 2026-06-04  
**Overall confidence:** HIGH for privacy, ledger, accessibility, donation-risk, and security pitfalls; MEDIUM for religious-content UX pitfalls because these depend on target church/family expectations.

## Executive Summary

Kreds is not just an allowance tracker. It combines child-facing UX, parent authority, simulated finance, Christian formation, family multi-tenancy, and donation-like flows. The biggest failure mode is treating those as ordinary CRUD screens. Families will abandon the product if children can misunderstand money, if parents cannot audit why balances changed, if one family can see another family's data, or if stewardship language feels coercive rather than formative.

The highest-risk areas should be addressed before feature expansion: child privacy and parent consent, strict `family_id` isolation, immutable ledger design, role-based authorization, and clear distinction between internal Kreds accounting and real-money/deductible donations. COPPA guidance is especially relevant because the product targets children ages 6+ and may collect personal information, avatars, identifiers, task histories, or parent contact information.

For roadmap planning, put safety/compliance and data architecture before UI polish, and put ledger correctness before wishlist/donation modules. Child UX should be tested early with age-appropriate prototypes because finance concepts such as tithe, match, negative adjustments, and donations are easy for adults to understand but easy for children to misinterpret.

## Critical Pitfalls

### Pitfall 1: Treating child data as normal user data

**What goes wrong:** The app collects child names, avatars, task histories, behavior adjustments, identifiers, or parent contact data without a child-specific privacy model, parental notice, retention policy, and deletion flow.  
**Why it happens:** Teams assume that because parents create family accounts, COPPA-style design is optional. They also underestimate that persistent identifiers, photos/avatars, usernames, and child activity records can be sensitive even when no real money moves.  
**Consequences:** Parent trust collapses; legal/compliance review blocks launch; analytics, marketing pixels, or third-party widgets become unsafe; child records become over-retained.  
**Warning signs:**
- Children can self-register or enter contact information before parent setup.
- No separate child privacy section in policy or parent onboarding.
- Analytics/session replay is enabled on child screens without a documented data map.
- Avatar upload is planned before deciding whether to allow real photos.
- No "delete child profile" or "export/review child data" flow in requirements.
**Prevention strategy:**
- Start with parent-created child profiles only; do not let children create accounts independently in v1.
- Prefer nicknames and generated avatars over real names/photos; if real images are allowed later, gate behind explicit parent consent.
- Maintain a data inventory for every child-facing field: purpose, retention period, visibility, and deletion behavior.
- Disable behavioral advertising, third-party trackers, and unnecessary persistent identifiers on child experiences.
- Build parent review/delete flows and direct privacy notice into onboarding, not as a legal afterthought.
**Phase that should address it:** Phase 0 / Foundation: privacy, consent, data model, onboarding requirements. Re-check in any phase that adds avatars, analytics, messaging, uploads, or external integrations.  
**Confidence:** HIGH. FTC COPPA guidance states that covered child-directed services must post clear policies, provide direct notice and verifiable parental consent, give parents access/deletion rights, maintain confidentiality/security, retain child data only as necessary, and avoid collecting more than needed.

### Pitfall 2: Weak family multi-tenancy boundaries

**What goes wrong:** Queries filter by user id but not consistently by `family_id`, or rely on frontend state for family selection. A child, parent, or guardian can access another family's profiles, tasks, balances, reports, or causes through direct API calls.  
**Why it happens:** Greenfield apps often add `family_id` as a column but do not make it a first-class security invariant. Multi-guardian households make this harder because access is not simply "one user owns many children."  
**Consequences:** Catastrophic privacy breach; ledger corruption; parents lose trust permanently.  
**Warning signs:**
- API handlers accept `family_id` from request body without deriving authorization from membership.
- Tests check happy-path family views but not cross-family access attempts.
- Admin/service roles bypass tenant filters without audit logging.
- Background jobs generate reports without tenant-scoped queries.
**Prevention strategy:**
- Model family membership explicitly: `family_memberships(user_id, family_id, role, status)`.
- Every domain table that belongs to a family must include `family_id`; add composite foreign keys where practical.
- Enforce tenant scope in repository/query-layer helpers and test every endpoint with "same role, wrong family" cases.
- Consider PostgreSQL Row-Level Security after core schema stabilizes, but do not rely on RLS alone; keep application-level authorization explicit.
- Log privileged access and cross-family admin reads.
**Phase that should address it:** Phase 1 / Identity, family, and authorization. Must precede tasks, ledgers, reports, and giving modules.  
**Confidence:** HIGH. This is a direct requirement in PROJECT.md and a common high-impact multi-tenant failure mode; OWASP ASVS provides a current baseline for access-control verification.

### Pitfall 3: Mutable balances instead of an auditable ledger

**What goes wrong:** The app stores current balances and updates them directly for task earnings, tithes, matches, donations, and negative adjustments. Bugs, retries, and edits create unexplained discrepancies.  
**Why it happens:** Allowance amounts feel small, so teams treat them like counters instead of financial records. But Kreds teaches stewardship, so perceived fairness matters as much as actual currency.  
**Consequences:** Parents cannot answer "why did my child's balance change?"; duplicate task submissions double-credit; firstfruits withholding drifts; weekly reports become untrustworthy.  
**Warning signs:**
- A `balance` column is the source of truth without transaction rows.
- Deleting/editing a task directly edits historical money effects.
- No idempotency key for task completion or parent adjustment creation.
- Tithe and match amounts are calculated in the UI or separately from the earning transaction.
**Prevention strategy:**
- Use an append-only ledger as source of truth: `ledger_entries` with amount, currency/unit, direction, type, source event, actor, child, family, created_at, and reversal linkage.
- Store balances as derived snapshots only; reconcile snapshots against ledger in tests/jobs.
- Generate earning, firstfruits withholding, and match entries in one database transaction.
- Never delete financial entries; reverse with compensating entries and reason codes.
- Use integer minor units or fixed-precision decimals; avoid floats.
**Phase that should address it:** Phase 2 / Kreds Engine ledger foundation, before wishlist, donations, or weekly reports.  
**Confidence:** HIGH. PostgreSQL documentation emphasizes transactions as all-or-nothing units for payment-like updates; this maps directly to Kreds Engine integrity.

### Pitfall 4: Firstfruits and matching logic spread across screens

**What goes wrong:** The 10% firstfruits withholding and 10% parent match are implemented in UI flows, scheduled jobs, and report code separately. Edge cases diverge: negative adjustments, edited tasks, reversals, rounding, or backfilled completions produce inconsistent totals.  
**Why it happens:** The 10% rules look simple until combined with reversals, weekly cycles, donations, and family-specific settings.  
**Consequences:** Children see one total, parents see another, and gratitude reports contradict the ledger. The app's core biblical stewardship mechanic becomes suspect.  
**Warning signs:**
- Multiple functions calculate "10%" in frontend and backend.
- No formal transaction types for `earning`, `firstfruits_withheld`, `donation`, `parent_match`, `negative_adjustment`, `reversal`.
- Product copy says mandatory tithe, but database allows earnings without firstfruits entries.
**Prevention strategy:**
- Centralize Kreds Engine rules in backend domain services, not UI components.
- Use one canonical rounding policy and test fractional/edge values.
- Attach firstfruits entries atomically to every positive earning transaction.
- Treat matching as a parent-funded bonus generated only when a voluntary donation event is approved/recorded.
- Create a ledger invariant test suite before adding new destination modules.
**Phase that should address it:** Phase 2 / Kreds Engine; regression-test in Phase 4 / giving and wishlist.  
**Confidence:** HIGH.

### Pitfall 5: Confusing internal "donations" with real charitable giving

**What goes wrong:** The app uses donation language, tax-deductible implications, public charity-like discovery, receipts, or cause marketplace mechanics before it has legal, payment, and charity-verification foundations.  
**Why it happens:** "Kreds do Bem" sounds like charity, but v1 scope says the app tracks internal stewardship rather than moving real money or operating a public charity marketplace.  
**Consequences:** Regulatory/legal complexity appears unexpectedly; parents misunderstand whether money moved; children think a cause was paid when only an internal ledger changed; app may imply tax benefits or charity legitimacy it cannot support.  
**Warning signs:**
- UI says "Donate now" without explaining whether this is simulated/internal or parent-recorded.
- Cause cards look like a public charity marketplace.
- Receipts use tax language or official donation terminology.
- The product stores beneficiary banking/payment details in v1.
**Prevention strategy:**
- In v1, call flows "Giving intention," "Family-recorded giving," or "Kreds do Bem allocation" unless real payment processing exists.
- Require parent confirmation for any giving allocation; child initiates, parent records/approves.
- Do not provide tax receipts; explicitly state that Kreds does not verify deductibility or transfer funds in v1.
- If real donations are added later, create a separate compliance/payment phase for charity verification, receipts, refunds, chargebacks, sanctions/fraud checks, and state fundraising considerations.
**Phase that should address it:** Phase 4 / Kreds do Bem must be scoped as internal allocation only. Any real-money donation support requires a later dedicated compliance/payment phase.  
**Confidence:** HIGH. IRS guidance distinguishes deductible contributions to qualified organizations and references IRS Tax Exempt Organization Search; FTC charity guidance tells donors to verify charity legitimacy, registration, and tax deductibility.

### Pitfall 6: Coercive or shame-based child UX around faith and money

**What goes wrong:** Children experience tithe, negative adjustments, chores, or generosity as punishment, surveillance, or spiritual shame rather than discipleship and stewardship.  
**Why it happens:** Adult theological language is copied into child screens. Finance dashboards overemphasize debt/loss. Negative adjustments are easier to implement than restorative coaching.  
**Consequences:** Children disengage or hide behavior; parents feel the app is manipulative; the Christian identity becomes a liability.  
**Warning signs:**
- Child screens use words like "failed," "debt," "bad behavior," or "you owe God."
- Negative adjustments appear more prominently than progress, gratitude, and repair.
- Bible verses are displayed as punishment after mistakes.
- No child-friendly explanation of firstfruits, generosity, or matching.
**Prevention strategy:**
- Use formative language: "practice," "stewardship," "repair," "try again," "thankfulness," and "generosity."
- Make parent-only controls distinct from child reflection screens.
- Include restorative notes for negative adjustments: what happened, how to repair, and what growth looks like.
- Use verses as encouragement/context, not as error messages.
- Test child flows with parents and children in two age bands: 6-9 and 10-13+.
**Phase that should address it:** Phase 3 / Child activity UX and Phase 5 / Biblical content and gratitude reports.  
**Confidence:** MEDIUM. Strong domain inference from product goals; requires user validation with Christian families.

### Pitfall 7: Parent trust gap from opaque controls

**What goes wrong:** Parents cannot see who approved a task, why a balance changed, whether a child attempted late backfill, or how a weekly report was generated.  
**Why it happens:** Teams optimize for child delight and postpone parent audit screens.  
**Consequences:** Parents stop using the app for real household routines; disputes become hard to resolve; multi-guardian families disagree over changes.  
**Warning signs:**
- Parent dashboard shows totals but not event history.
- No actor attribution for task completion, approval, adjustment, donation allocation, or reversal.
- Weekly report cannot be traced back to ledger/task events.
- Guardians share credentials instead of having separate accounts.
**Prevention strategy:**
- Store actor, role, timestamp, reason, source, and previous/new states for meaningful events.
- Build an "Activity & Ledger History" view early, even if visually simple.
- Give every guardian an account; do not encourage shared parent login.
- Include disputed/late/edited status in history, not just final state.
**Phase that should address it:** Phase 1 / family roles and Phase 2 / ledger; parent dashboards in Phase 3 should expose history.  
**Confidence:** HIGH.

### Pitfall 8: The 72-hour rule implemented only in the UI

**What goes wrong:** Children or parents bypass late-entry rules through API calls, timezone differences, browser clock manipulation, or editing existing records.  
**Why it happens:** The rule is framed as UX validation rather than a trust/integrity invariant.  
**Consequences:** The product's integrity principle becomes unenforceable; weekly reports are disputed; parents can unintentionally create inconsistent history.  
**Warning signs:**
- Date cutoff logic exists in React components but not backend services.
- Server accepts arbitrary occurrence dates.
- Timezone is not stored at family level.
- Edits to old completions are allowed without reversal/audit semantics.
**Prevention strategy:**
- Enforce the 72-hour rule server-side using server time and the family's configured timezone.
- Store occurrence date, submission timestamp, actor, and cutoff decision.
- Allow corrections after cutoff only through parent-visible reversal/override entries with reason, not silent edits.
- Add tests around Sunday-Saturday cycle, DST, timezone changes, and end-of-week report boundaries.
**Phase that should address it:** Phase 2 / Kreds Engine and task event model; Phase 3 / child task UX should reflect the backend rule clearly.  
**Confidence:** HIGH.

### Pitfall 9: Age-inappropriate financial abstraction

**What goes wrong:** Younger children cannot distinguish Kreds from cash, firstfruits from a penalty, wishlist progress from a purchase promise, or donation allocation from actual money transfer.  
**Why it happens:** Product copy is designed for parents but shown to children. Visual balance mechanics make simulated Kreds feel like spendable money.  
**Consequences:** Children become confused or disappointed; parents must explain around the app; trust erodes when wishlist or giving outcomes do not happen as expected.  
**Warning signs:**
- Same dashboard for 6-year-olds and teens.
- No parent-configurable explanation text.
- Wishlist button says "buy" before parent approval.
- Giving flow implies funds left the household.
**Prevention strategy:**
- Create separate child presentation modes: early reader (icons/simple labels) and older child/teen (more numbers/details).
- Use explicit labels: "Kreds tracked by your family," "saved toward," "set aside," "parent will help give."
- Require parent action for purchases and giving fulfillment.
- Validate terminology in usability tests before implementation locks in copy.
**Phase that should address it:** Phase 3 / child UX, then Phase 4 / wishlist and giving.  
**Confidence:** MEDIUM-HIGH.

### Pitfall 10: Over-gamifying chores and generosity

**What goes wrong:** The app turns responsibility, worship, and generosity into points-maximization. Children chase Kreds rather than learning service, gratitude, and stewardship.  
**Why it happens:** PWA product patterns borrow from games: streaks, neon progress, badges, leaderboards, and dopamine loops.  
**Consequences:** Values conflict with product behavior; parents reject the app as manipulative; generosity becomes transactional because of matching incentives.  
**Warning signs:**
- Roadmap includes streaks, leaderboards, random rewards, or peer comparison.
- Matching bonus is emphasized more than the giving itself.
- Gratitude report is only a scorecard.
**Prevention strategy:**
- Avoid family-wide child leaderboards and competitive rankings.
- Keep progress indicators calm and goal-oriented, not casino-like.
- Make matching a parent teaching moment: "we joined your generosity," not "bonus points."
- Include reflection prompts in weekly reports: what did you learn, who did you help, what are you thankful for?
**Phase that should address it:** Phase 3 / child UX and Phase 5 / gratitude.  
**Confidence:** MEDIUM.

### Pitfall 11: Religious content treated as decorative text

**What goes wrong:** Bible verses are sprinkled randomly or used as banners unrelated to the user's moment. The app feels like a generic allowance tracker with verses pasted on top.  
**Why it happens:** Teams implement content after the finance/task engine rather than designing theological intent into flows.  
**Consequences:** Christian differentiation weakens; content feels performative; parents disagree with tone or translation choices.  
**Warning signs:**
- Verses are hardcoded in components with no context metadata.
- No content guidelines for when a verse appears.
- No plan for translation/copyright/attribution of Bible text.
- Verse display interrupts task completion or creates guilt after negative events.
**Prevention strategy:**
- Create a small biblical content model: theme, verse reference, translation/source, use context, age tone, and parent-visible explanation.
- Use verses strategically: firstfruits explanation, service encouragement, weekly gratitude reflection.
- Decide early whether to display full verse text or reference-only to avoid licensing complexity; if full text, verify translation permissions and attribution requirements.
- Allow parents to hide or tune content frequency if family/church tradition differs.
**Phase that should address it:** Phase 5 / Biblical content layer; references can appear in Phase 2 only as backend metadata, not hardcoded UI copy.  
**Confidence:** MEDIUM. Product-specific; copyright/translation details require later source-specific verification.

### Pitfall 12: Negative adjustments become a behavior-control trap

**What goes wrong:** Parents use Kreds deductions as a broad discipline system rather than a narrow financial stewardship teaching aid. Children experience the app as punishment tracking.  
**Why it happens:** The PRD allows negative adjustments for misaligned behaviors, but without constraints every family conflict can become a debit.  
**Consequences:** Emotional harm, family conflict, low child adoption, and product identity drift from stewardship to surveillance.  
**Warning signs:**
- Adjustment categories include vague labels like "bad attitude" without guidance.
- Parents can create unlimited negative entries with no explanation.
- Child dashboard highlights negative balances or shame-colored warnings.
**Prevention strategy:**
- Make negative adjustments parent-only, reason-required, and framed as rare corrections.
- Provide suggested categories tied to stewardship/integrity, not broad morality judgments.
- Prevent or discourage negative child balances unless explicitly enabled by parents.
- Pair each adjustment with a repair note or conversation prompt.
**Phase that should address it:** Phase 2 / ledger types and Phase 3 / parent/child UX.  
**Confidence:** MEDIUM-HIGH.

### Pitfall 13: Accessibility and reading-level treated as polish

**What goes wrong:** The PWA is visually exciting but hard for early readers, neurodivergent children, keyboard users, or mobile users. Neon progress bars, small tap targets, hidden labels, and number-heavy dashboards block comprehension.  
**Why it happens:** Child apps often optimize for visual charm before WCAG, readability, and mobile ergonomics.  
**Consequences:** Children need parent help for every interaction; accessibility fixes become expensive; PWA adoption suffers.  
**Warning signs:**
- Icon-only buttons with no text labels.
- Dense tables in child views.
- Small touch targets, low contrast neon effects, or animation-heavy screens.
- No plan for WCAG 2.2 AA checks.
**Prevention strategy:**
- Design child screens for WCAG 2.2 AA, large tap targets, readable labels, reduced motion support, and screen-reader semantics.
- Prefer cards and simple progress language over tables for child flows.
- Use parent/teen advanced detail screens separately from young-child views.
- Include accessibility checks in component acceptance criteria, not final QA.
**Phase that should address it:** Phase 3 / child UX foundation; maintain in all frontend phases.  
**Confidence:** HIGH. W3C states WCAG covers web applications, mobile web, and dynamic content, and encourages use of the latest WCAG 2.2.

### Pitfall 14: PWA offline/cache leaks sensitive family state

**What goes wrong:** Service workers cache child profiles, ledger history, or family reports in ways visible across users on shared devices, stale after logout, or accessible offline without re-authentication.  
**Why it happens:** PWA caching is treated as performance plumbing, not privacy/security. Families often share tablets and phones.  
**Consequences:** A sibling or guest sees private behavior/financial data; old guardian access remains locally cached; parent trust breaks.  
**Warning signs:**
- App shell and API responses are cached with broad runtime caching rules.
- Logout does not clear local storage, IndexedDB, and service worker caches.
- Child sessions remain unlocked indefinitely on shared devices.
- Offline mode is planned for ledger writes before conflict/idempotency design.
**Prevention strategy:**
- Cache only static assets by default; do not cache ledger, reports, or profile data until a privacy-reviewed offline strategy exists.
- Clear client storage on logout and role switch.
- Add short re-auth/PIN requirements for parent actions on shared devices.
- If offline task completion is added later, use signed/idempotent local events, server-side cutoff enforcement, and conflict review.
**Phase that should address it:** Phase 0 / security architecture and Phase 6 / PWA hardening. Avoid offline financial writes in MVP.  
**Confidence:** HIGH based on PWA/security patterns and project privacy needs.

### Pitfall 15: Third-party services quietly expand risk

**What goes wrong:** Analytics, error reporting, email tools, avatar libraries, donation/payment providers, Bible APIs, or CDN-hosted widgets collect identifiers or child context beyond the app's stated purpose.  
**Why it happens:** Integrations are added for convenience before child privacy and vendor review.  
**Consequences:** COPPA/privacy exposure, data-processing ambiguity, hard-to-explain parent disclosures, and vendor lock-in.  
**Warning signs:**
- Product uses session replay or full-event analytics on child screens.
- Error logs include child names, task descriptions, or ledger amounts.
- Bible/donation APIs receive child identifiers.
- No vendor list in privacy documentation.
**Prevention strategy:**
- Maintain a vendor/data-transfer register from Phase 0.
- Strip PII from logs and analytics; hash or omit child identifiers.
- Keep Bible content local/static in v1 if feasible.
- Route all external calls through backend services that redact child context.
- Review each vendor against child data, retention, deletion, and security requirements.
**Phase that should address it:** Phase 0 / vendor policy; re-check every integration phase.  
**Confidence:** HIGH. COPPA FAQ explicitly includes third-party operators, plug-ins, persistent identifiers, confidentiality/security, and limiting collection.

### Pitfall 16: Weekly cycle/report logic lacks timezone and history semantics

**What goes wrong:** Sunday-Saturday cycles are computed inconsistently between backend, frontend, and reports. Task activation/deactivation history is lost, so old weekly reports change after task edits.  
**Why it happens:** Calendar logic seems simple until families travel, change timezone, deactivate chores, or correct events.  
**Consequences:** Children miss valid task windows, parents dispute reports, gratitude summaries rewrite history.  
**Warning signs:**
- Weekly periods are derived from browser local time.
- Task definitions are edited in place without version/effective dates.
- Reports query current task state instead of historical snapshots/events.
**Prevention strategy:**
- Store family timezone and compute week boundaries server-side.
- Model task activation/deactivation as effective-dated records.
- Generate reports from immutable events and historical task state, not current task settings.
- Add tests for Sunday boundary, DST, and task deactivation mid-week.
**Phase that should address it:** Phase 2 / task event model and Phase 5 / weekly gratitude reports.  
**Confidence:** HIGH.

## Moderate Pitfalls

### Pitfall 17: Multi-guardian ambiguity

**What goes wrong:** Any guardian can override any other guardian's changes without visibility, causing household conflict.  
**Warning signs:** No guardian-specific audit trail; no invitation/acceptance state; children see conflicting parent decisions.  
**Prevention strategy:** Add guardian invitations, role/status, actor attribution, and optional notifications for sensitive actions like negative adjustments, reversals, and giving approvals.  
**Phase:** Phase 1 / family roles.  
**Confidence:** HIGH.

### Pitfall 18: Wishlist implies entitlement or purchase guarantee

**What goes wrong:** Children interpret wishlist progress as a promise that parents will buy the item once the bar fills.  
**Warning signs:** Buttons say "Buy" or "Redeem" without parent approval; no parent-set rules.  
**Prevention strategy:** Use "Goal" and "Request parent review" language; require parent fulfillment; optionally let parents define whether goals represent cash, Kreds, or family agreement.  
**Phase:** Phase 4 / wishlist.  
**Confidence:** MEDIUM-HIGH.

### Pitfall 19: Admin tooling bypasses family trust

**What goes wrong:** Support/admin users can inspect family data casually or alter ledgers without immutable audit.  
**Warning signs:** Internal dashboards list child profiles and balances without break-glass controls.  
**Prevention strategy:** No broad admin data browser in MVP; if needed, implement least-privilege support roles, redaction by default, reason-required access, and immutable admin audit logs.  
**Phase:** Phase 0 / security posture and Phase 1 / auth.  
**Confidence:** HIGH.

### Pitfall 20: Localization debt from Portuguese PRD and English planning

**What goes wrong:** Product copy mixes English, Portuguese, and theological terms inconsistently; later localization changes ledger/report meanings.  
**Warning signs:** Hardcoded UI strings; domain terms translated ad hoc (`tithe`, `firstfruits`, `stewardship`, `Kreds do Bem`).  
**Prevention strategy:** Create an English canonical term glossary and localization keys early; separate product language from ledger type names.  
**Phase:** Phase 3 / UX copy foundation and Phase 5 / biblical content.  
**Confidence:** MEDIUM.

## Minor Pitfalls

### Pitfall 21: Avatar customization becomes a moderation problem

**What goes wrong:** Freeform uploaded avatars require moderation, storage controls, and privacy review.  
**Prevention strategy:** Start with generated avatars or curated asset sets; defer uploads.  
**Phase:** Phase 1 / family profiles.  
**Confidence:** HIGH.

### Pitfall 22: Overbuilding Kubernetes before product validation

**What goes wrong:** Infra complexity consumes time before the family/ledger UX is validated.  
**Prevention strategy:** Keep Kubernetes/ArgoCD as target production path, but phase MVP with simple deployable services and observability first.  
**Phase:** Phase 0 / delivery foundation; production hardening later.  
**Confidence:** MEDIUM.

### Pitfall 23: Gratitude report becomes a surveillance report

**What goes wrong:** Weekly reports summarize failures and deductions more than gratitude, learning, and generosity.  
**Prevention strategy:** Report structure should lead with completed responsibilities, firstfruits/giving, gratitude prompts, and growth notes; put corrections in a parent-only section.  
**Phase:** Phase 5 / gratitude reports.  
**Confidence:** MEDIUM-HIGH.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|----------------|------------|
| Phase 0: Foundation, privacy, security | Child privacy and third-party services treated as legal paperwork | Create data inventory, vendor register, parent notice requirements, no child self-registration |
| Phase 1: Family identity and roles | `family_id` isolation added inconsistently | Membership model, backend tenant guards, cross-family authorization tests |
| Phase 1: Profiles and avatars | Real child photos create privacy/moderation burden | Generated/curated avatars first; defer uploads |
| Phase 2: Task events and Kreds Engine | Mutable balances and scattered 10% logic | Append-only ledger, atomic transactions, invariant tests |
| Phase 2: 72-hour rule | UI-only validation | Server-side cutoff using family timezone; audited overrides only |
| Phase 3: Child task UX | Adult finance/theology language confuses children | Age-banded copy, accessibility criteria, child/parent usability testing |
| Phase 3: Parent dashboard | Parent trust gap from opaque totals | Actor-attributed activity and ledger history from first dashboard |
| Phase 4: Wishlist | Goals imply parent purchase promise | Parent approval/fulfillment flow and clear "saved toward" language |
| Phase 4: Kreds do Bem | Donation-like flow accidentally implies real transfer/tax deduction | Scope as internal family allocation; no receipts or charity marketplace in v1 |
| Phase 5: Bible verses and gratitude | Content feels decorative, coercive, or denomination-insensitive | Content metadata, encouragement-first placement, translation/licensing review |
| Phase 5: Weekly reports | Current task settings rewrite history | Reports generated from immutable events and task effective dates |
| Phase 6: PWA/mobile hardening | Offline/cache leaks family data | Static-asset-only caching until reviewed; clear storage on logout; parent re-auth for sensitive actions |

## Early Detection Checklist

Use this checklist during planning reviews and phase acceptance:

- [ ] Can every API endpoint answer: "Which family is authorized, and how is that proven?"
- [ ] Can every balance answer: "Which immutable ledger entries created this total?"
- [ ] Can every child-facing data field answer: "Why collect it, who sees it, when is it deleted?"
- [ ] Can a parent review and delete child profile data?
- [ ] Are child screens free of third-party trackers/session replay?
- [ ] Are task completion, firstfruits, match, donation allocation, and reversal generated by backend domain rules?
- [ ] Are late submissions blocked server-side using family timezone?
- [ ] Does Kreds do Bem clearly distinguish internal allocation from real charitable payment?
- [ ] Are Bible verses contextual, attributed/licensed, and non-punitive?
- [ ] Do weekly reports use historical events, not mutable current task definitions?
- [ ] Does logout clear local PWA storage and cached sensitive data?

## Sources

- FTC, **Children's Online Privacy Protection Rule (COPPA), 16 CFR Part 312** — HIGH confidence. Official rule summary: COPPA applies to child-directed websites/online services and services with actual knowledge of collecting child personal information. https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa
- FTC, **Complying with COPPA: Frequently Asked Questions** — HIGH confidence. Current business guidance covering parental notice/consent, persistent identifiers, retention/deletion, parent access, third parties, and penalties. https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions
- FTC, **Bringing Dark Patterns to Light** (September 2022) — HIGH confidence for avoiding manipulative child/parent flows. https://www.ftc.gov/reports/bringing-dark-patterns-light
- W3C WAI, **WCAG 2 Overview** (updated 2026-05-26) — HIGH confidence. WCAG applies to web applications, mobile web, dynamic content, and encourages latest WCAG 2.2. https://www.w3.org/WAI/standards-guidelines/wcag/
- PostgreSQL Documentation, **Transactions** (current docs, PostgreSQL 18) — HIGH confidence. Transactions provide all-or-nothing, durable, isolated updates for payment-like operations. https://www.postgresql.org/docs/current/tutorial-transactions.html
- OWASP, **Application Security Verification Standard 5.0.0** — HIGH confidence for access-control/security verification baseline. https://owasp.org/www-project-application-security-verification-standard/
- IRS, **Charitable contribution deductions** (reviewed/updated 2026-05-31) — HIGH confidence for avoiding tax-deductible donation implications without qualified organization handling. https://www.irs.gov/charities-non-profits/charitable-organizations/charitable-contribution-deductions
- FTC Consumer Advice, **Before Giving to a Charity** — HIGH confidence for charity verification expectations and scam avoidance. https://consumer.ftc.gov/articles/giving-charity

## Open Questions for Later Research

- Which Bible translation/version will Kreds use, and what exact copyright/attribution rules apply? Reference-only display may avoid most licensing risk, but full verse text needs source-specific review.
- Will Kreds target only Brazilian/Portuguese-speaking families, U.S. families, or both? Child privacy and donation rules vary by jurisdiction.
- Will v1 ever move real money, or remain an internal family ledger? If real money enters scope, create a dedicated payments/compliance research phase before implementation.
- What age bands matter most after initial validation: 6-9, 10-12, teens, or parent-only? UX complexity depends on this split.
