---
phase: 7
slug: guardian-profile
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-01
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm test --run` |
| **Full suite command** | `pnpm test --run && pnpm build` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test --run`
- **After every plan wave:** Run `pnpm test --run && pnpm build`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 7-01-01 | 01 | 1 | D-03/D-08 | — | N/A | component | `pnpm test --run` | ❌ W0 | ⬜ pending |
| 7-01-02 | 01 | 1 | D-09 | — | N/A | component | `pnpm test --run` | ❌ W0 | ⬜ pending |
| 7-01-03 | 01 | 1 | D-01/D-02 | — | N/A | component | `pnpm test --run` | ❌ W0 | ⬜ pending |
| 7-01-04 | 01 | 1 | D-04/D-05 | — | N/A | component | `pnpm test --run` | ❌ W0 | ⬜ pending |
| 7-01-05 | 01 | 1 | D-06/D-07 | — | signOut called with redirectTo /login | component | `pnpm test --run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/parent/__tests__/guardian-profile-drawer.test.tsx` — stubs for drawer open/close, name/email display, signOut trigger
- [ ] `src/components/parent/__tests__/parent-sidebar.test.tsx` — stub for profile button click handler
- [ ] `src/components/parent/__tests__/parent-topbar.test.tsx` — stub for badge click handler

*Existing vitest infrastructure is in place; Wave 0 adds test stubs for new components.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Drawer slide animation (entry/exit) | D-02 | CSS animation requires browser render | Open drawer, observe slide from right; close, observe slide out |
| signOut redirect to /login | D-07 | Auth session teardown requires real next-auth flow | Click "Sair", verify redirect to /login with session cleared |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
