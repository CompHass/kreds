---
phase: 03-kreds-engine-ledger-and-audit-foundation
plan: 03
subsystem: kreds-engine-ledger
tags:
  - ledger
  - audit
  - nextjs
  - zod
requires:
  - 03-02
provides:
  - negative adjustment posting
  - guardian adjustment form
  - adjustment API route
affects:
  - src/modules/ledger
  - src/app/api/ledger
  - src/app/(app)/guardian
tech_stack:
  added: []
  patterns:
    - db.transaction ledger posting
    - Zod route validation
    - server page plus client form split
key_files:
  created:
    - src/app/api/ledger/[childId]/post-adjustment/route.ts
    - src/app/(app)/guardian/[childId]/adjustment/page.tsx
    - src/app/(app)/guardian/[childId]/adjustment/AdjustmentFormClient.tsx
  modified:
    - src/modules/ledger/engine.ts
decisions:
  - Store adjustment reason and optional restoration note as JSON in ledger_transactions.note for audit readability without schema expansion.
  - Use placeholder UUIDs for family and guardian IDs in the client form until auth wiring lands in a later phase.
metrics:
  completed_at: 2026-06-07T00:00:00Z
  duration_minutes: 0
  tasks_completed: 2
  files_changed: 4
---

# Phase 03 Plan 03: Negative Adjustment Slice Summary

Negative adjustments now post atomically with a balance guard, preserve reason metadata in the transaction note, and expose a guardian-facing form that posts to the new API route.

## Completed Tasks

| Task | Name | Commit | Result |
| ---- | ---- | ------ | ------ |
| 1 | postNegativeAdjustment no engine + rota POST | a072e05 | Added atomic negative adjustment posting with pre-insert balance check, JSON note storage, and 201/409/422 route handling. |
| 2 | Formulário de ajuste negativo para guardian | 672e134 | Added server-rendered guardian page with available balance and a client form that submits reason and optional restoration note. |

## Verification

| Command | Result |
| ------- | ------ |
| `pnpm exec tsc --noEmit` | Passed with no output/errors. |
| Grep checks on `engine.ts`, `route.ts`, and guardian adjustment files | Passed for `db.transaction`, `Insufficient balance`, negative amount posting, `AdjustmentCommandSchema`, `already_posted`, `getBalance`, `use client`, `crypto.randomUUID()`, `required`, and `Registrar Ajuste`. |

Docker/Testcontainers integration tests were not run in this execution.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Split the guardian form into server and client files**
- **Found during:** Implementation of Task 2
- **Issue:** A single-file server/client hybrid would have placed `'use client'` below imports and server code, which is invalid in Next.js.
- **Fix:** Moved the interactive form into `AdjustmentFormClient.tsx` and kept the page as a server component.
- **Files modified:** `src/app/(app)/guardian/[childId]/adjustment/page.tsx`, `src/app/(app)/guardian/[childId]/adjustment/AdjustmentFormClient.tsx`
- **Commit:** `672e134`

## Known Stubs

| File | Stub | Reason |
| ---- | ---- | ------ |
| `src/app/(app)/guardian/[childId]/adjustment/AdjustmentFormClient.tsx` | Placeholder UUIDs for `familyId` and `guardianIdentityId` | Auth wiring is deferred to a later phase per plan notes. |

## Self-Check: PASSED

- Created files exist.
- Task commits exist: `a072e05`, `672e134`.
- `pnpm exec tsc --noEmit` passed.
- No unrelated dirty files were staged or committed.
