# Kreds

## What This Is

Kreds is a Christian stewardship and allowance management app for families. It helps parents teach children financial responsibility through weekly activities, automatic tithe separation, generosity incentives, savings goals, and gratitude reflection grounded in biblical principles.

The initial audience is Christian parents and guardians who want to educate children ages 6+ in both personal finance and character formation, with children using the product to track tasks, earnings, giving, and wishes.

## Core Value

Children learn to steward money faithfully by separating firstfruits, completing responsibilities with integrity, practicing generosity, and seeing progress toward personal goals.

## Requirements

### Validated

(None yet - ship to validate)

### Active

- [ ] Families can keep all data isolated by `family_id`.
- [ ] Parents can register multiple guardians and children in the same family.
- [ ] Family members can have customizable avatar profiles.
- [ ] The activity cycle runs from Sunday through Saturday.
- [ ] Tasks keep historical activation and deactivation state.
- [ ] Children or parents cannot backfill task completion more than 72 hours after the occurrence date.
- [ ] Children earn Kreds for completed tasks.
- [ ] Parents can record negative adjustments for misaligned behaviors.
- [ ] The financial engine automatically withholds 10% of all positive earnings into the Firstfruits Treasury.
- [ ] Parents can apply a 10% matching bonus on voluntary donation amounts.
- [ ] Children can create and track wishlist goals with progress indicators.
- [ ] Children can donate through the Kreds do Bem social-impact module.
- [ ] The app can show strategic Bible verses such as Malachi 3:10, Proverbs 22:6, and Colossians 3:23.
- [ ] Families receive a weekly gratitude report at the end of each cycle.
- [ ] The product ships as a web and mobile-capable PWA.

### Out of Scope

- Native mobile apps - PWA is the initial delivery target.
- Non-family multi-tenant organizations - the product is scoped around family households first.
- Full banking integrations - Kreds tracks allowance/stewardship internally rather than moving real money in v1.
- Public charity marketplace - v1 can model causes or people selected by the family without needing a regulated donation marketplace.
- Real-time chat or social networking - not required for stewardship, allowance, or family education value.

## Context

Kreds is framed as discipleship rather than a generic allowance tracker. The product should reinforce Christian stewardship: everything belongs to God, children are managers of resources, tithing is treated as firstfruits, service reflects Christlike love, and the 72-hour rule encourages honesty and discipline.

The PRD names the financial engine as the Kreds Engine. Positive earnings generate task credits, negative adjustments model behaviors that are out of alignment, tithe is mandatory at 10% of every positive gain, and voluntary giving can receive a parent-funded 10% match.

The product includes a biblical content layer with strategic verses and a weekly gratitude report. These should be integrated naturally into the product experience without turning the core app into a content library.

The provided technical direction is a React/Next.js web and mobile PWA, a Go or Node.js backend, PostgreSQL for relational auditability, and production infrastructure using Kubernetes, ArgoCD, Docker, and Harbor. There is also a separate Stitch design-system artifact in the repository that may inform later UI work.

## Constraints

- **Language**: Planning docs, code, comments, identifiers, and commit messages are English - required by the active agent rules.
- **Product language**: User-facing copy can be localized later, but the current planning artifacts are written in English for implementation consistency.
- **Frontend**: React/Next.js PWA - requested by the PRD for web and mobile reach.
- **Backend**: Node.js/TypeScript is recommended by research for v1; any backend choice must integrate with ZITADEL OIDC.
- **Authentication**: ZITADEL is the authentication provider, with issuer `https://auth.hasslab.pro` discovered via OIDC metadata.
- **Database**: PostgreSQL - required for relational financial records and auditability.
- **Infrastructure**: Kubernetes, ArgoCD, Docker, and Harbor - requested target platform for deployment.
- **Financial integrity**: All Kreds Engine transactions need an auditable model because the app teaches stewardship and must preserve trust.
- **Family privacy**: Family data isolation by `family_id` is a core architectural requirement.
- **Weekly cadence**: The activity period is Sunday through Saturday and shapes task validation, reports, and phase decomposition.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Build Kreds as a Christian stewardship app, not a generic allowance tracker | The PRD centers discipleship, firstfruits, generosity, and gratitude as the product identity | - Pending |
| Use automatic 10% firstfruits withholding on all positive earnings | The Principle of Firstfruits is a core value and must be systemic rather than optional | - Pending |
| Enforce a 72-hour task backfill limit | Encourages integrity and discipline in activity recording | - Pending |
| Target a PWA first | The PRD requests web and mobile reach without native mobile scope | - Pending |
| Use PostgreSQL for the financial ledger | Relational records support auditability for transactions and family data isolation | - Pending |
| Resolve Go versus Node.js before implementation | The PRD leaves backend language open; choosing one affects stack, hiring assumptions, and architecture | - Pending |
| Use ZITADEL for authentication | The project will use the HassLab ZITADEL instance as the OIDC identity provider | - Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check - still the right priority?
3. Audit Out of Scope - reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-05 after selecting ZITADEL authentication*
