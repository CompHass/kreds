# Kreds — Child Privacy Data Inventory

**Document Version:** 1.0
**Status:** Draft — Phase 1 Baseline
**Last Updated:** 2026-06-06

---

## 1. Overview

Kreds is a Christian stewardship and allowance management app for families. In future phases, Kreds will collect and process data about children ages 6 and older as part of its core functionality: task management, financial stewardship tracking, savings goals, giving allocation, and weekly gratitude reporting.

**This inventory documents all child data categories before any collection begins.** It is created in Phase 1 of the project to ensure that privacy, consent, and compliance requirements are understood, documented, and reviewable before any child profile data is collected (see Phase 2 and later). This document serves as the authoritative reference for what child data Kreds collects, why it collects it, how long it retains it, and under what legal basis.

Kreds follows a **parent-managed family model**: children are profiles under a family that is created and operated by a parent or guardian. Children do not register independently. This architecture limits data collection exposure and puts parents in control of their children's information from the start.

This inventory is a living document and should be updated whenever a new data category is introduced in any future phase. The associated requirement IDs (FAM-03 through BIBL-06) link each data category to its originating requirement specification.

---

## 2. Data Categories Table

The following table enumerates every category of child data that Kreds will collect across its planned phases. Each row includes the phase in which collection begins, the purpose for collection, the legal basis, and the retention policy. All legal bases rely on **parental consent**, since children are profiles under parent-managed families and parents authorize all data collection.

| Data Category | Collected In | Purpose | Legal Basis | Retention |
|---|---|---|---|---|
| Child display name | Phase 2 (FAM-03) | Profile identification within the family | Parental consent (parent creates profile) | Until account deleted |
| Child role assignment | Phase 2 (FAM-04) | Authorization and UI gating (guardian vs. child) | Parental consent | Until account deleted |
| Child avatar/visual identifier | Phase 2 (FAM-06) | Profile customization and visual recognition | Parental consent | Until changed or deleted |
| Task completion records | Phase 5 (ACT-04) | Earnings tracking and responsibility verification | Parental consent (parent approves completions) | Retained for audit/history |
| Earnings and balance data | Phase 3 (LEDG-01) | Financial stewardship tracking and Kreds Engine operation | Parental consent | Retained for audit/history |
| Firstfruits Treasury records | Phase 3 (LEDG-04) | Tithing tracking and firstfruits withholding enforcement | Parental consent | Retained for audit |
| Wishlist goals | Phase 6 (GOAL-01) | Savings goal tracking and progress visualization | Parental consent | Until completed or deleted |
| Gratitude reflections | Phase 8 (BIBL-04) | Weekly spiritual reflection and gratitude reporting | Parental consent | In weekly report snapshots |
| Family membership | Phase 2 (FAM-01) | Tenancy and family isolation by family_id | Parental consent | Until family deleted |

**Notes:**

- **Phase references** correspond to requirement IDs documented in `.planning/REQUIREMENTS.md`. See the traceability section for the full mapping.
- **Child display name** is the only personal identifier collected. It is typically a first name or nickname chosen by the parent during profile creation.
- **Task completion records** include the task description, the completion timestamp, the approval timestamp, and the associated Kreds value.
- **Earnings and balance data** includes all Kreds movements recorded by the Kreds Engine: earnings, firstfruits withholdings, Kreds do Bem allocations, donation matches, negative adjustments, and current available and treasury balances.
- **Firstfruits Treasury records** track the accumulated 10% withholding from every positive earning. These are not spendable by children and are tracked separately from available balances.
- **Wishlist goals** consist of a goal name, a target amount in Kreds, and a progress indicator. These are created by children and approved by parents.
- **Gratitude reflections** are short, child-authored responses to weekly reflection prompts within the Weekly Gratitude Report.
- **Family membership** refers to the association between a child profile and a family entity. This is the basis for all data tenancy and family isolation (family_id enforcement).

---

## 3. COPPA Compliance Checklist

Kreds collects data about children under 13 (ages 6+). The Children's Online Privacy Protection Act (COPPA) imposes the following requirements. This checklist documents the current compliance posture at Phase 1. Each item will be addressed in the phase indicated before any child data collection begins.

- [ ] **Requirement 1: Verifiable parental consent** — Kreds must obtain verifiable parental consent before collecting any personal information from children. **Not yet implemented (Phase 1 baseline).** Will be implemented in Phase 2 when family and child profile creation is built. The consent flow is described in Section 4 below.

- [ ] **Requirement 2: Clear privacy policy** — Kreds must post a clear, comprehensive privacy policy explaining what data is collected, how it is used, and with whom it is shared. **Not yet implemented (Phase 1 baseline).** A dedicated privacy policy page will be created before any child data collection begins (Phases 2+).

- [ ] **Requirement 3: Data minimization** — Kreds may not require children to disclose more information than is reasonably necessary to participate in the app's activities. **Not yet implemented (Phase 1 baseline).** Phase 1 establishes this inventory as a data minimization review artifact. Each phase must justify every data category it adds.

- [ ] **Requirement 4: Data retention limits** — Kreds must retain child personal information only as long as is reasonably necessary to fulfill the purpose for which it was collected, and must securely delete it thereafter. **Not yet implemented (Phase 1 baseline).** Retention policies are documented in this inventory (see Section 5) and will be enforced in the implementation phases.

- [ ] **Requirement 5: Parental rights** — Kreds must provide parents with the ability to review, delete, and refuse further collection or use of their child's personal information. **Not yet implemented (Phase 1 baseline).** Parental controls will be implemented in Phase 2 (family management) and continue to be refined across subsequent phases.

**COPPA Compliance Status:** Baseline established. All five requirements are marked as not yet implemented, which is the correct posture for Phase 1 — no child data is collected yet. Each checkbox will be resolved to [x] in the phase indicated before any child data collection operations begin.

---

## 4. Parental Consent Flow Description

Kreds uses a **parent-managed family model** for child data collection consent. This model ensures that children are never independent users of the system — they are always profiles within a parent-created and parent-managed family. The consent flow is as follows:

### Family Creation (Phase 2)

1. A parent or guardian authenticates through ZITADEL OIDC (Phase 2).
2. The authenticated parent creates a family account, which serves as the tenancy unit for all child data.
3. By creating a family account, the parent accepts the terms of service and privacy policy on behalf of the family.

### Child Profile Creation (Phase 2)

1. Within an existing family, the parent creates child profiles individually.
2. During child profile creation, the parent:
   - Provides the child display name.
   - Selects the child role (child, not guardian).
   - Optionally selects an avatar or visual identifier.
3. By creating a child profile, the parent provides verifiable parental consent for the collection of the associated child data.
4. Each child profile creation event is recorded in the audit trail.

### Ongoing Consent (Phases 3-8)

1. When new data categories are introduced (task completions, earnings, wishlist goals, giving allocations, gratitude reflections), the parent's existing consent covers collection within the scope of normal app operation.
2. If a feature enables optional data collection (e.g., gratitude reflections), the parent can opt each child in or out independently.
3. The parent retains full control to disable or delete any data category for any child at any time.

### Consent Verification

- Parental consent is verified at the time of child profile creation through the authenticated parent session.
- The parent's identity is authenticated via ZITADEL OIDC before any family or child management operations.
- Consent events are recorded in the system audit trail for compliance review.

---

## 5. Data Retention and Deletion Policy

### Retention Periods

| Data Category | Retention Period | Rationale |
|---|---|---|
| Child display name | Until account deleted | Needed for identification during the entire account lifecycle |
| Child role assignment | Until account deleted | Authorization requirement for the duration of membership |
| Child avatar/visual identifier | Until changed or account deleted | User preference; retained only while actively used |
| Task completion records | Retained for audit and history | Stewardship tracking requires historical records for activity reports |
| Earnings and balance data | Retained for audit and history | Financial integrity requires complete transaction history |
| Firstfruits Treasury records | Retained for audit | Permanent financial record of religious practice requirement |
| Wishlist goals | Until completed or deleted | No ongoing need after goal completion or removal |
| Gratitude reflections | Retained in weekly report snapshots | Historical record of weekly reflection activity |
| Family membership | Until family account deleted | Required for data tenancy and isolation |

### Deletion Mechanism

- **Full account deletion:** When a family account is deleted, all associated child profiles and their data are deleted through a cascade operation.
- **Individual child deletion:** A child profile can be deleted independently, removing all associated data including display name, role, avatar, task completions, earnings, wishlist goals, and gratitude reflections.
- **Selective data deletion:** The parent can delete specific data categories (e.g., wishlist goals, gratitude reflections) without deleting the entire child profile.

### Audit Trail Retention Exception

Certain ledger transactions and audit records may be retained beyond normal deletion windows to maintain financial integrity and auditability:

- **Ledger transactions** are append-only and cannot be deleted. Corrections are made through reversal or adjustment entries (see LEDG-08).
- **Approved task completions** that have generated ledger postings are retained as part of the financial record.
- **Weekly gratitude report snapshots** are immutable by design (BIBL-06) and remain as historical records even after underlying data is modified.

These retention exceptions are documented and intentional. They ensure that financial records cannot be destroyed to hide errors or misappropriation, which would undermine the trust Kreds is designed to build.

### Secure Deletion

- When data is deleted, it is marked as deleted in the database and excluded from all queries.
- A future phase will implement physical deletion (VACUUM / archival) for records past their legal retention window.
- Deletion is logged in the audit trail with a timestamp and the identity of the requesting parent.

---

## 6. Third-Party Data Sharing Policy

**Kreds v1 shares NO child data with third parties.**

This is a firm policy for the initial release:

- **No advertising networks:** Kreds does not serve ads and does not share child data with ad networks, advertising exchanges, or any ad-tech platforms.
- **No data brokers:** Child data is never sold, licensed, or provided to data brokers, people-search services, or any commercial data aggregation platforms.
- **No analytics providers:** Kreds does not integrate third-party analytics SDKs (e.g., Google Analytics, Mixpanel, Amplitude) on child-facing pages. Basic telemetry may be considered for parent-facing pages only, and only after privacy review.
- **No social media:** Kreds does not integrate social media platforms, share buttons, or social login for children.
- **No third-party content:** Kreds does not embed third-party content (videos, widgets, tracking pixels) that could collect child data.

### Future Changes

Any future change to this policy that would involve sharing child data with a third party requires:

1. Privacy review and impact assessment.
2. Updated COPPA compliance checklist review.
3. Updated privacy policy and user notification.
4. New verifiable parental consent for the data sharing arrangement.

### Service Providers

The only external service provider in the Kreds architecture is:

- **ZITADEL OIDC** at `auth.hasslab.pro` — Used for parent authentication only. Children do not authenticate through ZITADEL and no child data is shared with the identity provider. Only the authenticated parent's session token is transmitted to ZITADEL.

---

## 7. What Phase 1 Does NOT Collect

Phase 1 is a foundation phase. **No child data is collected in Phase 1.** Specifically, Phase 1 does not:

1. **No child profile data** — No child display names, roles, avatars, or any child profile records are created or stored.
2. **No child authentication** — Children do not authenticate. Authentication is implemented in Phase 2 for parents only. Children are profiles under parent-managed families and access the app through the parent's family session.
3. **No personal identifiers beyond display name** — The only personal identifier planned for future phases is a display name (typically first name or nickname). No real names, legal names, email addresses, phone numbers, or government-issued identifiers are collected for children.
4. **No location data** — Kreds does not collect, store, or transmit any location data for children or parents. The only location-adjacent data is the family timezone setting, which is set by the parent and is not a real-time location signal.
5. **No behavioral tracking or analytics** — Kreds does not implement behavioral tracking, engagement metrics, session recording, heatmaps, or any analytics instrumentation on child-facing pages or flows.
6. **No biometric data** — No fingerprint, face recognition, or any biometric identifier is collected or used.
7. **No communication content** — Kreds does not collect text messages, chat logs, or any form of child-to-child communication content.

All of these data categories are explicitly excluded from the Kreds v1 design. Any future addition of these categories would require a dedicated privacy review and compliance update before implementation.

---

## 8. Contact Information

For privacy-related inquiries, data access requests, deletion requests, or any questions about this inventory:

- **Email:** privacy@kreds.app
- **Response time:** We aim to respond to privacy inquiries within 5 business days.
- **Data Protection Contact:** privacy@kreds.app (placeholder — will be updated with a named contact in a future phase)

For general inquiries about the Kreds project, please refer to the project maintainers through the project's published channels.

---

## 9. Review Sign-Off

This child privacy data inventory has been reviewed and approved by the following:

| Role | Name | Date | Signature |
|---|---|---|---|
| Project Maintainer | | | |
| Privacy Reviewer | | | |

**Sign-off Instructions:** To sign off, add your role, name, date, and signature (or initials) to the table above. This sign-off acknowledges that the inventory has been reviewed and accurately reflects Kreds' current and planned child data collection categories, consent mechanisms, retention policies, and compliance posture.

---

**Document Change Log**

| Date | Version | Change Description | Author |
|---|---|---|---|
| 2026-06-06 | 1.0 | Initial child privacy data inventory created (Phase 1 baseline) | Phase 1 Executor |

*This document is a living artifact and should be updated whenever new data categories are introduced in future phases.*
