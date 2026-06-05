# Feature Landscape

**Project:** Kreds  
**Domain:** Christian stewardship and allowance management family PWA  
**Researched:** 2026-06-04  
**Research mode:** Ecosystem / features dimension  
**Overall confidence:** MEDIUM-HIGH. Core allowance/chore features are verified against official product pages from Greenlight, Acorns Early/GoHenry, FamZoo, BusyKid, and CFPB financial-education guidance. Christian stewardship-specific product patterns are lower confidence because mainstream allowance apps generally support generic giving/charity, not explicitly biblical firstfruits, gratitude, or discipleship flows.

## Executive Takeaway

Family allowance products have converged around the same table-stakes loop: parent creates child profiles, assigns chores or allowance rules, child marks work complete, parent approves, earnings move into spend/save/give buckets, and both sides see activity history. Products that lack profiles, recurring chores, approval controls, earnings balances, savings goals, and mobile-friendly child UX will feel incomplete.

Kreds should not try to beat Greenlight, Acorns Early, BusyKid, or FamZoo on banking-card breadth in v1. Their strongest features include debit cards, real-time spend notifications, investing, category controls, and FDIC-backed card accounts. Kreds' differentiated wedge is values formation: mandatory firstfruits, generosity matching, weekly gratitude, 72-hour integrity guardrails, scripture/contextual reflection, and parent-led discipleship around money decisions.

The best MVP is an internal Kreds ledger, not a regulated money-moving product. It should feel like a faithful stewardship habit system: Sunday-Saturday cycle, responsibilities, earnings, firstfruits separated first, voluntary giving encouraged with parent match, wishlist goals made visible, and a weekly gratitude/report ritual.

## Ecosystem Snapshot

| Product / Source | Verified feature signals | Relevance to Kreds | Confidence |
|---|---|---|---|
| Greenlight | Child/parent app experiences, chores, automated allowance, savings goals, investing, real-time notifications, parental controls, financial literacy game, up to five kids on family plan | Confirms chores + allowance + child goal tracking + education are table stakes in leading family-finance apps | HIGH |
| Acorns Early / GoHenry | Kids ages 6-18, allowance, chores, savings goals, debit card, parental controls, real-time alerts, bite-sized money lessons, relative gifting, custodial investing | Confirms age target, lessons, chore automation, and family gifts as mainstream expectations | HIGH |
| BusyKid | Chores/allowance by age, auto allowance, Save/Share/Spend allocations, charities, investing, bonuses, savings match, multi-parent approvals, activity feed, money movement controls | Especially relevant because it already includes share/give, savings matching, and parent approvals | HIGH |
| FamZoo | Prepaid/IOU option, chores, automated allowance, charitable giving, customizable subaccounts, chore review, chore penalties, parent-paid interest, savings goals, family loans, restricted child access | Confirms ledger-only / IOU mode is viable and supports rich family-finance education without banking in every flow | HIGH |
| CFPB Money as You Grow | Age-appropriate money milestones, activities, conversation starters, reading guides, financial capability research | Supports embedding short parent-child prompts rather than content-heavy courses | HIGH |

## Table Stakes

Features users in this category expect. Missing these makes Kreds feel unfinished even if the Christian layer is strong.

| Feature | Why Expected | Complexity | MVP Priority | Notes |
|---|---|---:|---:|---|
| Family account with isolated household data | Every family-finance product separates households; Kreds already requires `family_id` isolation | Medium | P0 | Must be secure from day one. Drives every data model. |
| Parent/guardian and child roles | Parents configure and approve; children complete tasks and view balances | Medium | P0 | Include multiple guardians early because BusyKid and family products support multi-parent oversight. |
| Child profiles and avatars | Child-facing products rely on personalization to make money visible and age-appropriate | Low | P1 | Use simple avatars/custom colors in MVP; avoid complex avatar marketplace. |
| Mobile-first PWA child and parent experiences | Competitors are app-first; Kreds must work well on family phones | Medium | P0 | PWA installability, offline-tolerant task entry, and responsive views matter more than native apps. |
| Task/chore creation | Core behavior loop in Greenlight, BusyKid, FamZoo, Acorns Early | Medium | P0 | Support title, description, value, cadence, assigned child, active dates. |
| Recurring weekly task schedule | Allowance apps commonly automate chores and paydays; Kreds PRD fixes Sunday-Saturday cycle | Medium | P0 | Start with weekly recurrence; defer arbitrary recurrence rules. |
| Task activation/deactivation history | Required for auditability and avoiding disputes about what was active in a given week | Medium | P0 | Store historical versions/effective dates, not just current task state. |
| Child task completion marking | Kids need autonomy and engagement | Low | P0 | Include date of occurrence, completion timestamp, optional note. |
| Parent approval/review | Competitors support chore review; parents need final authority before credits | Medium | P0 | MVP should require approval before ledger credit. Later allow trusted auto-approval. |
| 72-hour backfill rule | Kreds-specific integrity guardrail, but table stakes for this product identity | Medium | P0 | Enforce systemically for child and parent backfill unless an explicit admin override is logged. |
| Earnings ledger | Users expect balances to be consistent and explainable | High | P0 | Use transaction records for every credit/debit/withholding/match. No mutable balance-only model. |
| Positive earnings from completed tasks | Core allowance loop | Medium | P0 | Post only after approval. |
| Negative adjustments | PRD requires debits for misaligned behavior; some competitors support penalties/IOUs | Medium | P1 | Use sparingly and transparently; require parent note to avoid arbitrary punishment feel. |
| Automatic 10% firstfruits withholding | Kreds' central stewardship requirement; equivalent to automatic split/bucket allocation in competitors | Medium | P0 | Separate before any spend/save/wishlist allocation. Treat as mandatory in v1. |
| Visible Firstfruits Treasury balance | Children need to see that the first portion is set apart | Low | P0 | Should be named and explained consistently. |
| Spend/save/give-style buckets or destinations | BusyKid and FamZoo normalize Save/Share/Spend or subaccounts | Medium | P0 | Kreds model: Firstfruits, Available, Wishlist, Kreds do Bem. |
| Wishlist goals with progress | Savings goals are common across competitors and explicitly required by PRD | Medium | P0 | Include target amount, current progress, priority, optional image/emoji. |
| Donation/generosity destination tracking | Charitable giving is present in BusyKid/FamZoo; Kreds needs Kreds do Bem | Medium | P0 | V1 can model family-selected causes/people without real payment rails. |
| Parent-funded donation matching | BusyKid supports savings match; Kreds uses 10% match on voluntary giving | Medium | P1 | Needs ledger entries that distinguish child donation and parent match. |
| Weekly cycle summary | Families need closure around Sunday-Saturday cadence | Medium | P0 | Include earned, firstfruits, donated, saved, wishlist progress, tasks completed/missed. |
| Activity feed / audit trail | Competitors show transaction/activity history; financial trust requires explainability | Medium | P0 | Parent and child views should both answer, "Why is my balance this?" |
| Notifications/reminders | Chore apps reduce nagging via reminders | Medium | P1 | MVP can use in-app reminders; push/email can follow after PWA setup. |
| Parent dashboard | Parents need quick status across children | Medium | P0 | Show pending approvals, weekly progress, balances, gratitude/report status. |
| Child dashboard | Children need simple next actions and progress | Medium | P0 | Show today's/this week's tasks, Kreds balance, firstfruits, wishlist progress, giving opportunity. |
| Basic financial education prompts | Greenlight and Acorns Early include lessons; CFPB encourages age-appropriate activities/conversations | Medium | P1 | Keep concise and contextual; avoid a large content library in MVP. |
| Privacy and child-safety controls | Products aimed at children must be trust-first | Medium | P0 | No public profiles, no ads, no child-to-child social feed. |

## Differentiators

Features that make Kreds meaningfully different from generic allowance apps. These are the competitive advantage and should shape roadmap naming.

| Feature | Value Proposition | Complexity | Suggested Phase | Notes |
|---|---|---:|---:|---|
| Christian stewardship framing | Converts allowance from money management into discipleship: God owns, we steward | Low | MVP | Needs product copy, onboarding, and consistent vocabulary more than complex tech. |
| Mandatory firstfruits before anything else | Teaches "give first," not "give leftovers"; stronger than generic Save/Share/Spend splits | Medium | MVP | Ledger must make firstfruits the first transaction derived from positive earnings. |
| Firstfruits Treasury | Gives children a tangible place to see tithe set apart | Medium | MVP | Should include explanation and parent-controlled record of where it was given. |
| Kreds do Bem module | Channels generosity toward family-approved causes/people and social impact | Medium | MVP/P1 | V1 should track intent and ledger effects; real charity marketplace is an anti-feature for now. |
| 10% donation matching | Encourages voluntary generosity beyond mandatory firstfruits | Medium | P1 | Parent-funded matching creates a teaching moment and is simpler than external corporate matching. |
| Weekly gratitude report | Turns the weekly cycle into reflection, not just payout | Medium | MVP/P1 | Should ask: "What did God provide? Who did you help? What did you learn?" |
| Scripture-in-context nudges | Reinforces values at moments of earning, giving, diligence, and gratitude | Low | P1 | Use a curated small set; avoid random proof-texting or notification spam. |
| 72-hour integrity rule | Makes honesty and discipline part of the system mechanics | Medium | MVP | Strong Kreds identity feature; should be explained as character formation, not punishment. |
| Parent-child stewardship conversations | CFPB supports conversation starters; Kreds can add biblical prompts around decisions | Medium | P1 | Add lightweight prompts to weekly report and donation/wishlist decisions. |
| Gratitude streaks / family blessings log | Builds ritual and family memory around provision and generosity | Medium | P2 | More aligned than gamified money streaks. Avoid guilt if streak breaks. |
| Faith-aware task categories | Chores can include service, diligence, responsibility, care for others | Low | P1 | Tag tasks with values like diligence, service, stewardship, obedience, generosity. |
| Values-based negative adjustment flow | Reframes debits as restoration/accountability, not arbitrary punishment | Medium | P1 | Require reason category, note, and optional restoration task. |
| Parent-controlled cause library | Keeps giving local and relational: church, missionary, neighbor, family-selected needs | Medium | P1 | Avoid public marketplace/regulatory complexity while preserving generosity value. |
| Wishlist + 72-hour pause / purchase reflection rule | Teaches delayed gratification before redeeming for wants | Medium | P2 | The prompt requested 72-hour rule; keep task backfill as MVP and add purchase/wishlist 72-hour cooling-off later. |
| Blessing allocation presets | Families choose patterns like Firstfruits 10%, Generosity goal, Savings goal, Available | Medium | P2 | Keep firstfruits fixed; allow optional generosity/savings templates later. |
| Parent discipleship notes on reports | Parents can write encouragement tied to weekly report | Low | P2 | High emotional value; low technical cost after reports exist. |
| Age-adaptive reflection depth | Younger children get simple emojis/prompts; teens get deeper stewardship questions | Medium | P2 | Helps serve ages 6+ without overcomplicating MVP. |

## Anti-Features

Features to deliberately avoid, especially in v1. These either conflict with the project identity, introduce regulatory/compliance burden, or distract from the stewardship loop.

| Anti-Feature | Why Avoid | What to Do Instead |
|---|---|---|
| Full banking/debit-card integration in v1 | Competitors already excel here; real money movement adds KYC, custodial/card program, fraud, support, and compliance complexity | Use an internal Kreds ledger with parent-settlement outside the app. Design ledger so payment rails can be added later. |
| Public charity marketplace | Donation marketplace can create vetting, tax, payment, fraud, and theological alignment complexity | Let parents define family-approved causes/people/churches and record giving manually. |
| Investment trading for kids | Greenlight/BusyKid/Acorns use investing as a differentiator, but it increases suitability/regulatory complexity and distracts from firstfruits/generosity MVP | Defer; teach basic stewardship, saving, and delayed gratification first. |
| Social feed, child-to-child comparison, leaderboards | Can produce pride, shame, competition, privacy risks, and a values mismatch | Use private family encouragement, gratitude, and parent notes. |
| Ads, affiliate offers, or marketplace upsells to children | Violates trust and child privacy expectations | Keep child UX ad-free and parent-mediated. |
| Randomized rewards / loot-box mechanics | Undermines stewardship and can mimic gambling-like reinforcement | Use clear earned Kreds, visible progress, and intentional celebration. |
| AI-generated Bible teaching without review | Risk of theological error, hallucinated verses, or pastoral overreach | Use a curated verse/prompt library approved by the product owner. |
| Sermon/content-library sprawl | Turns Kreds into a devotional app instead of a stewardship habit product | Keep biblical content contextual: firstfruits, diligence, generosity, gratitude. |
| Punitive debt spirals | Negative adjustments can become demotivating or shame-based | Cap negative balance behavior, require parent notes, and support restoration actions. |
| Unlimited parent overrides of 72-hour rule | Destroys the integrity lesson and makes records untrustworthy | Permit rare admin override only with reason, timestamp, actor, and audit trail. |
| Complex recurrence engine in MVP | Arbitrary schedules will consume effort before core loop is validated | Start with Sunday-Saturday weekly tasks and simple one-off tasks. |
| Real-time chat | Not needed for stewardship/allowance value and adds moderation/privacy work | Use parent notes/comments on tasks/reports only if needed. |
| Non-family organizations | Schools/church groups introduce multi-tenant permissions and safeguarding complexity | Keep v1 household/family-only. |
| Public child profiles or shareable achievements | Privacy risk and values mismatch | Keep achievements private inside the family account. |
| Parent surveillance creep | Location/SOS/driving features are mainstream in Greenlight but unrelated to Kreds' stewardship wedge | Do not build safety/location features unless a later product strategy requires it. |

## Feature Dependencies

```text
Family isolation → Roles/profiles → Parent/child dashboards

Family isolation → Task definitions → Weekly cycle → Completion marking → 72-hour validation → Parent approval → Earnings ledger

Earnings ledger → Positive earning transaction → Automatic firstfruits withholding → Firstfruits Treasury balance

Earnings ledger → Available balance → Wishlist funding/progress

Earnings ledger → Available balance → Voluntary donation → Donation match → Kreds do Bem history

Task activation history → Weekly report accuracy

Task approvals + ledger + firstfruits + wishlist + donation records → Weekly gratitude report

Weekly report → Gratitude reflection → Parent discipleship notes

Curated scripture library → Contextual verse nudges → Weekly gratitude report content

Cause library → Donation flow → Donation match

Wishlist goal → 72-hour purchase reflection / cooling-off rule
```

## MVP Recommendation

Prioritize the smallest complete stewardship loop:

1. **Family setup and roles**: family isolation, parent/guardian accounts, child profiles, avatars.
2. **Weekly chore/task loop**: Sunday-Saturday cycle, tasks with active history, child completion, 72-hour backfill lock, parent approval.
3. **Kreds Engine ledger**: task earnings, negative adjustments with notes, automatic 10% firstfruits withholding, auditable activity feed.
4. **Destinations**: Firstfruits Treasury, available Kreds, wishlist goals, Kreds do Bem donation record.
5. **Weekly gratitude report**: summary of tasks, earnings, firstfruits, giving, wishlist progress, and one gratitude prompt.

Include one differentiator in MVP beyond mechanics: **mandatory firstfruits + weekly gratitude**. These make Kreds instantly different from a generic chore tracker.

Defer:

- **Real debit cards / banking:** high compliance burden; not needed to validate family stewardship behavior.
- **Investing:** competitors already offer it; not core to Kreds' first milestone.
- **Public charity marketplace:** replace with parent-defined causes.
- **Large lesson/game curriculum:** use contextual prompts first.
- **Advanced recurrence / notifications:** add after the weekly loop proves useful.
- **72-hour wishlist purchase cooling-off:** valuable, but depends on wishlist and redemption flows existing first.

## Suggested Feature Phases

### Phase 1: Family + Weekly Stewardship Loop

- Family isolation
- Parent/child roles
- Child profiles and avatars
- Weekly Sunday-Saturday cycle
- Task creation, activation/deactivation history
- Child task completion
- 72-hour task backfill rule
- Parent approval
- Basic dashboards

**Why first:** Without this loop, there are no trustworthy earnings to steward.

### Phase 2: Kreds Engine + Firstfruits

- Ledger transaction model
- Positive task earnings
- Negative adjustments with notes
- Automatic 10% firstfruits withholding
- Firstfruits Treasury
- Activity feed

**Why second:** The financial engine must be auditable before donation, wishlist, or reports depend on it.

### Phase 3: Goals + Generosity

- Wishlist goals and progress
- Kreds do Bem parent-defined causes
- Voluntary donation flow
- Parent 10% donation match
- Basic cause/giving history

**Why third:** Generosity and goals require balances and ledger destinations to be correct.

### Phase 4: Weekly Gratitude + Biblical Layer

- Weekly gratitude report
- Gratitude/reflection prompts
- Curated scripture snippets in context
- Parent encouragement note
- Simple export/share within family

**Why fourth:** Reports need task, ledger, firstfruits, wishlist, and giving data to be meaningful.

### Phase 5: Habit Polish + Education

- In-app reminders/push notifications
- Age-adaptive prompts
- Values tags on tasks
- Delayed-gratification / 72-hour wishlist cooling-off
- Parent-child discussion guides

**Why fifth:** These polish behavior change after core value is validated.

## Complexity Notes

### High Complexity

- Ledger integrity and derived balances.
- Family data isolation and authorization.
- Future real-money/banking/donation integrations.
- Multi-guardian permission nuances.

### Medium Complexity

- 72-hour rules with time zones and weekly cycles.
- Task activation history and historical reports.
- Donation matching entries and rollback/correction behavior.
- PWA installability and mobile UX quality.

### Low Complexity

- Curated scripture display.
- Avatar selection.
- Parent notes and gratitude prompts.
- Simple parent-defined causes.

## Source Notes

- **Greenlight official pages** — verified chores/allowance, flexible schedules, pay-per-chore, streaks, up-for-grabs chores, chore reviews, automated allowance, savings goals, investing, child/parent app experiences, financial literacy game, parental controls, real-time notifications, and family plan positioning.  
  https://greenlight.com/ and https://greenlight.com/chores-and-allowance-app-for-kids and https://greenlight.com/level-up-financial-literacy-game and https://greenlight.com/security-and-parental-control
- **Acorns Early / GoHenry official page** — verified kids ages 6-18, chores, automatic allowance/tasks, savings goals, parental controls, real-time alerts, bite-sized money lessons, relative gifts, and custodial investment match.  
  https://www.gohenry.com/us/
- **BusyKid official features page** — verified chores/allowance by age, auto allowance, Save/Share/Spend allocations, charities, investing, bonuses, savings match, multi-parent approvals, activity feed, money movement controls, and up to five prepaid cards.  
  https://busykid.com/busykid-features/
- **FamZoo official page** — verified chores, automated allowances, charitable giving, customizable subaccounts, chore review, penalties, parent-paid interest, savings goals, family loans, IOU accounts, browser access, and restricted child access.  
  https://famzoo.com/
- **CFPB Money as You Grow** — verified that parent/caregiver financial education should be age-appropriate and use activities/conversation starters; page last modified May 20, 2026.  
  https://www.consumerfinance.gov/consumer-tools/money-as-you-grow/

## Confidence Assessment

| Area | Confidence | Reason |
|---|---|---|
| Generic allowance/chore table stakes | HIGH | Multiple leading official product pages agree on chores, allowance, savings, controls, activity, and child/parent experiences. |
| Giving/generosity features | HIGH for generic charity/give buckets; MEDIUM for Kreds-specific implementation | BusyKid and FamZoo verify giving/charity exists; Christian firstfruits and matching are project-specific. |
| Christian stewardship differentiators | MEDIUM | Strongly grounded in Kreds PRD, but not broadly validated against direct competitors. Treat as product positioning to test with target families. |
| Anti-features | MEDIUM-HIGH | Banking/investing/social/compliance risks are evident from competitor disclaimers and Kreds scope, but specific regulatory advice needs legal review if scope changes. |
| Phase ordering | MEDIUM-HIGH | Dependencies are clear: family/task loop before ledger, ledger before reports/giving. |
