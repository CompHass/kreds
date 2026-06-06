# Kreds — Canonical Terminology Glossary

**Version:** 1.0
**Last Updated:** 2026-06-06
**Purpose:** This glossary defines all domain terminology used across Kreds documentation, code, requirements, and UI. It is the single source of truth for term definitions.

---

## Domain Terms

| Term | Definition | Context |
|---|---|---|
| **Kreds** | The internal currency unit used in the app. Stored as integer minor units (never floats). | All financial operations |
| **Firstfruits** | Mandatory 10% withholding from every positive earning, routed to the Firstfruits Treasury. Based on the biblical principle of giving the first portion to God (Malachi 3:10). | LEDG-04, automatic on all positive earnings |
| **Firstfruits Treasury** | The accumulated pool of firstfruits withholdings for a family. Not spendable by children; tracked separately from available balance. | Ledger accounting |
| **Kreds do Bem** | Internal family giving allocation. Not a real-money charitable payment. Represents the family's generosity practice. | GOAL-03 through GOAL-07 |
| **Donation Match** | Parent-funded 10% bonus posted when a voluntary giving allocation is approved. | GOAL-06 |
| **Task Template** | A recurring task definition with title, description, assigned child, Kreds value, and active period. | ACT-01 |
| **Task Completion** | A child's submission that they completed a specific task occurrence. Requires parent approval. | ACT-04 |
| **72-Hour Rule** | System blocks task completion submissions more than 72 hours after the occurrence date. Encourages integrity and discipline. | ACT-05 |
| **Weekly Cycle** | The activity period from Sunday through Saturday. Shapes task validation, reports, and phase decomposition. | ACT-02 |
| **Weekly Gratitude Report** | Immutable snapshot summarizing a family's weekly stewardship activity: tasks, earnings, firstfruits, wishlist progress, giving, and reflection prompts. | BIBL-04 through BIBL-06 |
| **Wishlist Goal** | A savings target created by a child with a target amount and progress indicator. | GOAL-01 |
| **Guardian** | A parent or guardian role in the Kreds domain model. Can create tasks, approve completions, manage family. | FAM-04 |
| **Child** | A child profile role in the Kreds domain model. Can complete tasks, create wishlist goals, allocate Kreds. Managed by guardians. | FAM-04 |
| **Family** | The core tenancy unit. All data is isolated by `family_id`. | FAM-01 |
| **Kreds Engine** | The financial engine that processes all Kreds movements: earnings, withholdings, adjustments, matches. | LEDG-01 through LEDG-08 |
| **Negative Adjustment** | A debit entry for misaligned behaviors, with a reason and optional restoration note. | LEDG-05 |
| **Ledger Transaction** | An append-only record of a Kreds movement. Cannot be edited; corrections use reversal or adjustment entries. | LEDG-01, LEDG-08 |

---

## Reference

The TypeScript constants for these terms are defined in `src/modules/glossary/terms.ts`. These constants should be used in application code to ensure consistent terminology across the codebase.

- **TermKey type:** `keyof typeof TERMS` — a union of all term key strings.
- **TERMS object:** `as const` object with SCREAMING_SNAKE_CASE keys matching the Term column above.

---

*This glossary is a living document. Add new terms as the domain model evolves. Update definitions when requirements change.*
