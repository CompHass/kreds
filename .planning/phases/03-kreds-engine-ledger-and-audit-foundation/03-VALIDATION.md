---
phase: 3
slug: kreds-engine-ledger-and-audit-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-06
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.8 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run --reporter=verbose src/lib/ledger` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose src/lib/ledger`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 1 | LEDG-01 | — | Ledger lines store integer amounts only | unit | `npx vitest run src/lib/ledger` | ❌ W0 | ⬜ pending |
| 3-01-02 | 01 | 1 | LEDG-02 | — | 10% firstfruits auto-withheld on earning | unit | `npx vitest run src/lib/ledger` | ❌ W0 | ⬜ pending |
| 3-01-03 | 01 | 1 | LEDG-03 | — | Ceiling rounding: 7 Kreds → 1 firstfruits | unit | `npx vitest run src/lib/ledger` | ❌ W0 | ⬜ pending |
| 3-02-01 | 02 | 1 | LEDG-06 | — | Duplicate command_id rejected (idempotency) | unit | `npx vitest run src/lib/ledger` | ❌ W0 | ⬜ pending |
| 3-02-02 | 02 | 1 | LEDG-04 | — | Balance computed via SUM, no drift | unit | `npx vitest run src/lib/ledger` | ❌ W0 | ⬜ pending |
| 3-03-01 | 03 | 2 | LEDG-05 | — | Negative adjustment requires reason text | unit | `npx vitest run src/lib/ledger` | ❌ W0 | ⬜ pending |
| 3-04-01 | 04 | 2 | LEDG-08 | — | Reversal entry has corrects_transaction_id | unit | `npx vitest run src/lib/ledger` | ❌ W0 | ⬜ pending |
| 3-05-01 | 05 | 3 | LEDG-07 | — | Child view hides guardian internal reasons | unit | `npx vitest run src/lib/ledger` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/ledger/__tests__/engine.test.ts` — stubs for LEDG-01 through LEDG-08
- [ ] `src/lib/ledger/__tests__/rounding.test.ts` — ceiling edge cases (1, 7, 10, 11 Kreds)
- [ ] Existing `vitest.config.ts` covers phase — no new install needed

*Existing infrastructure covers all phase requirements (Vitest already configured).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Guardian audit UI shows correction note and corrects_transaction_id | LEDG-08 | UI component, no unit test | Visit /api/ledger/history as guardian, check JSON includes corrects_transaction_id |
| Child audit UI shows "Correction applied" without internal reason | LEDG-07 | Differentiated view | Visit child audit endpoint, confirm reason field absent in child response |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
