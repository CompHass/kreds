# Requirements: Kreds

**Defined:** 2026-06-04  
**Core Value:** Children learn to steward money faithfully by separating firstfruits, completing responsibilities with integrity, practicing generosity, and seeing progress toward personal goals.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Foundation

- [ ] **FND-01**: Developer can run a Next.js TypeScript PWA shell locally with a PostgreSQL-backed configuration.
- [ ] **FND-02**: Developer can run database migrations and automated tests from documented commands.
- [ ] **FND-03**: Developer can build and package the app with Docker for the target Kubernetes delivery path.
- [ ] **FND-04**: Maintainer can review a child-privacy data inventory before any child profile data is collected.
- [ ] **FND-05**: Maintainer can use a canonical terminology glossary for Kreds, firstfruits, giving, tasks, and weekly reports.

### Family And Roles

- [ ] **FAM-01**: Parent can authenticate through ZITADEL and create a family account with data isolated by `family_id`.
- [ ] **FAM-02**: Parent can invite or register another guardian in the same family.
- [ ] **FAM-03**: Parent can create child profiles without public child registration.
- [ ] **FAM-04**: Parent can assign each member a Kreds guardian or child role that is stored in the Kreds domain model, not only in ZITADEL claims.
- [ ] **FAM-05**: Family member can view only data that belongs to their own family.
- [ ] **FAM-06**: Parent can customize child profiles with simple avatars or visual identifiers.
- [ ] **FAM-07**: Parent can review an audit trail for identity, membership, and profile changes.

### Ledger And Stewardship Engine

- [ ] **LEDG-01**: System records Kreds movements as append-only ledger transactions and lines.
- [ ] **LEDG-02**: System stores Kreds amounts as integer units, not floating-point values.
- [ ] **LEDG-03**: System applies a single documented rounding policy for 10% firstfruits and 10% donation matching.
- [ ] **LEDG-04**: System automatically withholds 10% of every positive earning into the Firstfruits Treasury before available balance changes.
- [ ] **LEDG-05**: Parent can record a negative adjustment with a reason and optional restoration note.
- [ ] **LEDG-06**: System prevents duplicate ledger postings for the same approved command.
- [ ] **LEDG-07**: Parent and child can view an activity history explaining why each balance changed.
- [ ] **LEDG-08**: System corrects ledger mistakes through reversal or adjustment entries rather than editing historical transactions.

### Weekly Activities

- [ ] **ACT-01**: Parent can create task templates with title, description, assigned child, Kreds value, and active period.
- [ ] **ACT-02**: System computes family activity cycles from Sunday through Saturday using the family timezone.
- [ ] **ACT-03**: System preserves historical task activation and deactivation state for weekly reporting.
- [ ] **ACT-04**: Child can submit a task completion for a specific occurrence date.
- [ ] **ACT-05**: System blocks task completion submission more than 72 hours after the occurrence date.
- [ ] **ACT-06**: Parent can approve or reject submitted task completions.
- [ ] **ACT-07**: System posts task earnings only after parent approval.
- [ ] **ACT-08**: Parent can view pending approvals across children.
- [ ] **ACT-09**: Child can view current weekly tasks, submitted completions, approvals, and earned Kreds.

### Goals And Generosity

- [ ] **GOAL-01**: Child can create wishlist goals with target amount and progress indicator.
- [ ] **GOAL-02**: Child can allocate available Kreds toward a wishlist goal.
- [ ] **GOAL-03**: Parent can define family-approved Kreds do Bem giving targets.
- [ ] **GOAL-04**: Child can allocate available Kreds toward a parent-approved giving target.
- [ ] **GOAL-05**: System records Kreds do Bem as an internal family giving allocation, not a real-money charitable payment.
- [ ] **GOAL-06**: System posts a parent-funded 10% match when a voluntary giving allocation is approved.
- [ ] **GOAL-07**: Parent and child can view wishlist and giving history with ledger-backed totals.

### Biblical Content And Gratitude

- [ ] **BIBL-01**: Maintainer can manage a curated catalog of scripture references and reflection prompts.
- [ ] **BIBL-02**: System can show contextual scripture references for stewardship, diligence, generosity, and gratitude moments.
- [ ] **BIBL-03**: System avoids unreviewed AI-generated Bible teaching in v1.
- [ ] **BIBL-04**: Family can receive a weekly gratitude report at the end of each Sunday-Saturday cycle.
- [ ] **BIBL-05**: Weekly gratitude report summarizes tasks, earnings, firstfruits, wishlist progress, giving, and reflection prompts.
- [ ] **BIBL-06**: Weekly gratitude reports are saved as historical snapshots that do not drift after later task or content edits.

### PWA And Child Experience

- [ ] **PWA-01**: Parent and child can use responsive dashboards on mobile and desktop browsers.
- [ ] **PWA-02**: User can install the app as a PWA on supported devices.
- [ ] **PWA-03**: System avoids caching sensitive child or ledger data for offline financial writes in v1.
- [ ] **PWA-04**: User can log out and clear locally stored family-sensitive state on shared devices.
- [ ] **PWA-05**: Child-facing screens use formative, encouraging language rather than shame-based or competitive language.
- [ ] **PWA-06**: User can navigate core parent and child flows with accessibility support for keyboard, labels, and readable contrast.

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Notifications And Habit Polish

- **NOTF-01**: Parent and child receive in-app reminders for pending tasks and approvals.
- **NOTF-02**: Family can enable push notifications after privacy and shared-device review.
- **NOTF-03**: Parent can add encouragement notes to weekly reports.
- **NOTF-04**: Child can use age-adaptive reflection prompts for different maturity bands.

### Advanced Stewardship

- **STEW-01**: Parent can tag tasks with values such as diligence, service, stewardship, obedience, and generosity.
- **STEW-02**: Child can use a 72-hour wishlist purchase reflection or cooling-off flow.
- **STEW-03**: Family can configure optional allocation templates beyond mandatory firstfruits.
- **STEW-04**: Parent can manage a richer family blessings log across cycles.

### Future Integrations

- **INTG-01**: Family can connect real payment rails after a dedicated compliance phase.
- **INTG-02**: Family can access a vetted charity marketplace after legal, tax, and theological review.
- **INTG-03**: Family can export reports for external family or church conversations.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Native mobile apps | PWA is the initial delivery target. |
| Real debit cards or banking in v1 | Adds KYC, fraud, support, and compliance burden before stewardship value is validated. |
| Public charity marketplace in v1 | Creates vetting, tax, payment, fraud, and theological-alignment complexity. |
| Investing or trading features | Distracts from stewardship, firstfruits, generosity, and task responsibility. |
| Public child profiles or social feeds | Creates child privacy risk and conflicts with family-centered discipleship. |
| Ads, affiliate offers, or marketplace upsells to children | Violates child-safety and parent-trust expectations. |
| AI-generated Bible teaching | Risk of theological error, hallucinated verses, and unreviewed pastoral claims. |
| Complex arbitrary recurrence engine | Sunday-Saturday weekly tasks are sufficient for v1. |
| Offline financial writes | Sensitive ledger mutations must remain server-authoritative in v1. |
| Non-family organizations | Schools, churches, and groups require a different permission and safeguarding model. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FND-01 | Phase 1 | Pending |
| FND-02 | Phase 1 | Pending |
| FND-03 | Phase 1 | Pending |
| FND-04 | Phase 1 | Pending |
| FND-05 | Phase 1 | Pending |
| FAM-01 | Phase 2 | Pending |
| FAM-02 | Phase 2 | Pending |
| FAM-03 | Phase 2 | Pending |
| FAM-04 | Phase 2 | Pending |
| FAM-05 | Phase 2 | Pending |
| FAM-06 | Phase 2 | Pending |
| FAM-07 | Phase 2 | Pending |
| LEDG-01 | Phase 3 | Pending |
| LEDG-02 | Phase 3 | Pending |
| LEDG-03 | Phase 3 | Pending |
| LEDG-04 | Phase 3 | Pending |
| LEDG-05 | Phase 3 | Pending |
| LEDG-06 | Phase 3 | Pending |
| LEDG-07 | Phase 3 | Pending |
| LEDG-08 | Phase 3 | Pending |
| ACT-01 | Phase 4 | Pending |
| ACT-02 | Phase 4 | Pending |
| ACT-03 | Phase 4 | Pending |
| ACT-04 | Phase 5 | Pending |
| ACT-05 | Phase 5 | Pending |
| ACT-06 | Phase 5 | Pending |
| ACT-07 | Phase 5 | Pending |
| ACT-08 | Phase 5 | Pending |
| ACT-09 | Phase 5 | Pending |
| GOAL-01 | Phase 6 | Pending |
| GOAL-02 | Phase 6 | Pending |
| GOAL-03 | Phase 7 | Pending |
| GOAL-04 | Phase 7 | Pending |
| GOAL-05 | Phase 7 | Pending |
| GOAL-06 | Phase 7 | Pending |
| GOAL-07 | Phase 7 | Pending |
| BIBL-01 | Phase 8 | Pending |
| BIBL-02 | Phase 8 | Pending |
| BIBL-03 | Phase 8 | Pending |
| BIBL-04 | Phase 8 | Pending |
| BIBL-05 | Phase 8 | Pending |
| BIBL-06 | Phase 8 | Pending |
| PWA-01 | Phase 9 | Pending |
| PWA-02 | Phase 9 | Pending |
| PWA-03 | Phase 9 | Pending |
| PWA-04 | Phase 9 | Pending |
| PWA-05 | Phase 9 | Pending |
| PWA-06 | Phase 9 | Pending |

**Coverage:**
- v1 requirements: 48 total
- Mapped to phases: 48
- Unmapped: 0
- Duplicate mappings: 0

---
*Requirements defined: 2026-06-04*
*Last updated: 2026-06-05 after selecting ZITADEL authentication*
