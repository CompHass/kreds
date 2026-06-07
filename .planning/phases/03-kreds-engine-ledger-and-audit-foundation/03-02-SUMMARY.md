---
phase: 03-kreds-engine-ledger-and-audit-foundation
plan: 02
subsystem: kreds-engine-ledger
tags:
  - ledger
  - audit
  - nextjs
  - drizzle
requires:
  - 03-01
provides:
  - atomic task earning posting
  - computed ledger balances
  - ledger earning API route
  - child balance server page
affects:
  - src/modules/ledger
  - src/app/api/ledger
  - src/app/(app)/child
tech_stack:
  added: []
  patterns:
    - Drizzle db.transaction posting
    - SUM-based balance computation
    - Next.js App Router route handlers
key_files:
  created:
    - src/app/api/ledger/[childId]/post-earning/route.ts
    - src/app/api/ledger/[childId]/history/route.ts
    - src/app/(app)/child/[childId]/balance/page.tsx
  modified:
    - src/modules/ledger/engine.ts
    - src/modules/ledger/queries.ts
    - tests/integration/ledger-engine.test.ts
    - tests/unit/ledger-queries.test.ts
decisions:
  - postEarning preserves caller-provided commandId for DB-backed idempotency.
  - Child balance page uses English user-facing copy per active project rule.
metrics:
  completed_at: 2026-06-07T18:54:00Z
  duration_minutes: 8
  tasks_completed: 2
  files_changed: 7
---

# Phase 03 Plan 02: Earning Posting and Balance Slice Summary

Atomic task earning posting now creates ledger transaction headers plus available and firstfruits ledger lines, and the child balance page reads computed balances from ledger SUM queries.

## Completed Tasks

| Task | Name | Commit | Result |
| ---- | ---- | ------ | ------ |
| 1 | postEarning real + getBalance | 24e81e8 | Implemented `postEarning(command)` with `db.transaction`, firstfruits split, caller `commandId`, and `getBalance()` via `SUM(ledger_lines.amount)`. |
| 2 | POST earning route, history scaffold, child balance page | 3a7c0cb | Added Zod-validated POST route with `23505` → `409 already_posted`, scaffolded history GET route, and SSR child balance page. |
| Fix | Skip zero ledger lines | 5bfc812 | Prevented `amount=1` earnings from inserting a zero-value available line that violates `non_zero_amount`. |

## Verification

| Command | Result |
| ------- | ------ |
| `pnpm test tests/unit/ledger-calculate.test.ts --run` | Passed: 8 tests passed. |
| `pnpm exec tsc --noEmit` | Passed with no output/errors. |
| `pnpm exec tsc --noEmit` after zero-line fix | Passed with no output/errors. |
| Grep acceptance checks | Passed for `db.transaction`, `calculateFirstfruits`, `sum(ledgerLines.amount)`, `safeParse`, `23505`, `already_posted`, history `GET`, balance `getBalance`, and `Firstfruits`. |

The curl verification against `localhost:3000` was not run because no local Next.js server was started for this execution. Docker/Testcontainers integration tests were not run because this project has a known Docker daemon limitation with Testcontainers; they require an available Docker daemon or the documented cluster port-forward workaround.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated RED test call sites for new command signatures**
- **Found during:** Task 1 TypeScript verification
- **Issue:** Existing RED tests called `postEarning()` and `getBalance()` without arguments, causing `pnpm exec tsc --noEmit` to fail once real function signatures were implemented.
- **Fix:** Updated test call sites to pass typed sample ledger commands and balance parameters so TypeScript can compile. Integration tests remain environment-gated and were not executed.
- **Files modified:** `tests/integration/ledger-engine.test.ts`, `tests/unit/ledger-queries.test.ts`
- **Commit:** `24e81e8`

**2. [Rule 3 - Blocking] Skipped zero-value ledger lines**
- **Found during:** Orchestrator spot-check after Wave 1
- **Issue:** `amount=1` calculates `firstfruits=1` and `available=0`; inserting both lines would violate the ledger `non_zero_amount` check.
- **Fix:** Filtered ledger lines before insert so only non-zero postings are persisted.
- **Files modified:** `src/modules/ledger/engine.ts`
- **Commit:** `5bfc812`

## Known Stubs

| File | Stub | Reason |
| ---- | ---- | ------ |
| `src/modules/ledger/engine.ts` | `postNegativeAdjustment`, `postReversal` still throw `not implemented`. | Explicitly deferred to later Phase 03 plans. |
| `src/modules/ledger/queries.ts` | `getGuardianLedgerHistory`, `getChildLedgerHistory` still throw `not implemented`. | Explicitly deferred to Plan 04. |
| `src/app/api/ledger/[childId]/history/route.ts` | Returns `{ data: [], view }`. | Plan requested scaffold only; real history queries arrive in Plan 04. |

## Threat Flags

| Flag | File | Description |
| ---- | ---- | ----------- |
| threat_flag: unauthenticated-posting | `src/app/api/ledger/[childId]/post-earning/route.ts` | New posting endpoint intentionally has no auth guard in this slice; plan threat model accepts this until Phase 2 auth helper wiring. |
| threat_flag: unauthenticated-balance | `src/app/(app)/child/[childId]/balance/page.tsx` | New child balance page intentionally has no auth guard in this slice; plan threat model accepts this until auth wiring. |

## Self-Check: PASSED

- Created and modified plan files exist.
- Task commits exist: `24e81e8`, `3a7c0cb`, fix commit `5bfc812`.
- Unrelated pre-existing dirty files were not staged or committed.
