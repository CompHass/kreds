# Child Privacy Data Inventory — Kreds

## Overview

Kreds is a Christian stewardship and allowance management application for families. It helps parents teach children (ages 6+) financial responsibility through weekly activities, automatic tithe separation, generosity incentives, savings goals, and gratitude reflection grounded in biblical principles.

This document catalogs all categories of child data that will be collected in future phases. It is created in Phase 1, before any child profile data is collected, to enable maintainer review and establish privacy-aware design from the start.

**Current status:** Phase 1 baseline — no child data is collected yet.

## Data Categories

| Data Category | Collected In | Requirement | Purpose | Legal Basis | Retention |
|---------------|-------------|-------------|---------|-------------|-----------|
| Child display name | Phase 2 | FAM-03 | Profile identification | Parental consent (parent creates profile) | Until family account deleted |
| Child age in years | Phase 2 | FAM-03 | Age-appropriate UI and content filtering. Full date of birth is NOT collected (D-09). | Parental consent | Until family account deleted |
| Child role assignment | Phase 2 | FAM-04 | Authorization and UI gating | Parental consent | Until family account deleted |
| Child avatar / visual identifier | Phase 2 | FAM-06 | Profile customization and visual recognition | Parental consent | Until changed or account deleted |
| Family membership | Phase 2 | FAM-01 | Tenancy and data isolation by family_id | Parental consent | Until family deleted |
| Parental consent record | Phase 2 | FAM-03 | Auditable evidence of explicit guardian consent for child profile creation (D-02) | Legal obligation (COPPA) | Retained for audit — duration of family account + 30 days |
| Identity link (optional future) | Phase 2 (nullable) | FAM-06 | Future optional child ZITADEL identity link. NULL in v1 — no child login (D-10). | Parental consent (future) | Until identity linked or family deleted |
| Task completion records | Phase 5 | ACT-04 | Earnings tracking and accountability | Parental consent (parent approves) | Retained for audit and history |
| Earnings and balance data | Phase 3 | LEDG-01 | Financial stewardship tracking | Parental consent | Retained for audit and history |
| Firstfruits Treasury records | Phase 3 | LEDG-04 | Tracking of mandatory tithe withholdings | Parental consent | Retained for audit |
| Wishlist goals | Phase 6 | GOAL-01 | Savings goal tracking and progress | Parental consent | Until goal completed or deleted |
| Giving allocations (Kreds do Bem) | Phase 7 | GOAL-03 | Generosity practice tracking | Parental consent | Retained for audit and history |
| Gratitude reflections | Phase 8 | BIBL-04 | Weekly spiritual reflection prompts | Parental consent | Retained in immutable weekly report snapshots |
| Weekly Gratitude Report snapshots | Phase 8 | BIBL-05 | Historical stewardship summary | Parental consent | Immutable — retained for audit |

## COPPA Compliance Checklist

Kreds anticipates collecting data about children under 13 (ages 6+). The following COPPA (Children's Online Privacy Protection Act) requirements apply:

1. [ ] **Verifiable parental consent** — Must obtain verifiable consent from a parent before collecting any personal information from children.
2. [ ] **Clear privacy policy** — Must provide a clear, comprehensive privacy policy explaining data collection practices, purposes, and sharing.
3. [ ] **Data minimization** — Must not require children to disclose more personal information than is reasonably necessary to participate in the activity.
4. [ ] **Data retention limits** — Must retain child personal information only as long as is reasonably necessary, then securely delete.
5. [ ] **Parental rights** — Parents must be able to review their child's data, delete it, and refuse further collection or use.

> **Phase 1 baseline:** These controls are marked [ ] Not yet implemented. They will be implemented in Phases 2-9 as child data collection begins. Phase 1 collects zero child data.

## Parental Consent Flow Description

In Kreds v1, children are not independent account holders. Instead:

1. A parent/guardian authenticates through ZITADEL OIDC (Phase 2).
2. The parent creates a family account and child profiles within that family.
3. All child data is managed under the parent's authenticated session.
4. Parental consent is established through an explicit checkbox confirmation that the guardian attests to being the parent or legal guardian of the child. This consent is recorded as an auditable event in the `parental_consents` table alongside the child profile creation transaction (D-02, D-13).
5. No child-facing registration flow exists — children cannot self-register or create accounts.
6. A future optional `identity_id` column on child profiles is nullable, preparing for optional child ZITADEL identity linkage without enabling child login in v1 (D-10).

This model means:
- Parents explicitly opt in to each data category by using the relevant feature.
- Children access the app only through their parent-managed profile.
- Parents can delete child data by removing the profile or family account.

## Data Retention and Deletion Policy

| Data Category | Retention Period | Deletion Mechanism |
|---------------|-----------------|-------------------|
| Display name, role, avatar, age in years | Duration of family account + 30 days grace | Cascade on family deletion |
| Parental consent records | Duration of family account + 30 days grace | Cascade on family deletion |
| Task completion records | Duration of family account | Cascade on family deletion |
| Earnings, balances, ledger transactions | Retained for audit (append-only) | Never deleted — correction entries only |
| Firstfruits Treasury records | Retained for audit | Never deleted — append-only |
| Wishlist goals | Until completed or deleted by child/parent | Soft delete with audit trail |
| Giving allocations | Retained for audit | Never deleted — append-only |
| Gratitude reflections | Retained in immutable report snapshots | Never deleted |
| Weekly Gratitude Reports | Permanent — immutable historical snapshots | Never deleted |
| Session / access logs | 90 days rolling | Auto-purged |

**Append-only ledger data** (earnings, firstfruits, giving, corrections) is never deleted to preserve financial audit integrity. Negative adjustments and correction entries provide the mechanism for remediating incorrect amounts without violating append-only semantics.

## Third-Party Data Sharing Policy

**Kreds v1 shares NO child data with third parties.**

- No advertising networks, analytics providers, or data brokers receive child data.
- No child data is sold, rented, or traded.
- The application uses ZITADEL for authentication, but ZITADEL handles only parent/guardian identity — child profiles are managed entirely within the Kreds application database.
- Any future third-party integration (e.g., charity marketplace in v2+) will require explicit privacy review and parental consent.

## What Phase 1 Does NOT Collect

Phase 1 establishes the project foundation and collects zero child data:

- No child profile data (display names, avatars, roles)
- No child authentication credentials
- No personal identifiers beyond the families table (which stores only family name and timezone)
- No location data (beyond family timezone setting)
- No behavioral tracking or analytics on child users
- No session data or cookies related to children
- No financial data (ledger transactions are Phase 3+)
- No task or activity records (Phase 4+)
- No reflection or gratitude content (Phase 8+)

The only data stored in Phase 1 is the `families` table structure (name, timezone) — and no families are created until Phase 2's onboarding flow.

## Contact Information

For privacy inquiries, data deletion requests, or questions about this inventory:

- Email: privacy@kreds.app
- Data Protection Contact: [To be assigned before Phase 2 production launch]

## Review Sign-Off

This privacy inventory must be reviewed and approved before any child data collection begins in Phase 2.

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Maintainer | | | |
| Privacy Reviewer | | | |
| Product Owner | | | |

---

*Document created: 2026-06-06 | Phase 1 baseline | Next review: Before Phase 2 launch*
