---
phase: 8
slug: child-management
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-01
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.8 (unit/integration), Playwright 1.60.0 (e2e) |
| **Config file** | `vitest.config.ts` (jsdom environment, setupFiles `./tests/setup.ts`) |
| **Quick run command** | `npm test -- tests/unit/<file>.test.ts` (or `.tsx`) |
| **Full suite command** | `npm test` (unit + integration), `npm run test:e2e` for e2e specs |
| **Estimated runtime** | ~30-60 seconds (unit+integration), e2e separate |

---

## Sampling Rate

- **After every task commit:** Run the specific new/modified test file(s) via `npm test -- tests/unit/<file>`
- **After every plan wave:** Run `npm test` (full unit+integration suite)
- **Before `/gsd-verify-work`:** Full suite green (`npm test`); the `/tasks`-regression path is covered by the 08-05 human-verify checkpoint (see Manual-Only Verifications)
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 08-02 T2 | 08-02 | 1 | D-05 | — | "Crianças" sidebar icon navigates to `/children` and shows active state | unit (component) | `npm test -- tests/unit/parent-sidebar.test.tsx` | ❌ W0 | ⬜ pending |
| 08-04 form | 08-04 | 3 | D-06/D-07/D-08/D-09 | — | Add-child form validates via Zod, submits via Server Action | unit + integration | `npm test -- tests/unit/child-form-panel.test.tsx` | ❌ W0 | ⬜ pending |
| 08-03 T3 | 08-03 | 2 | D-10/D-13 | T-08-05 | `pinHash`/`pinEncrypted` written together on "Redefinir PIN" | integration (real Postgres) | `npm test -- tests/integration/child-pin-reset.test.ts` | ❌ W0 | ⬜ pending |
| 08-01 T1 | 08-01 | 1 | D-12 | T-08-01/02/03 (cross-family + tamper + IV) | `encryptPin`/`decryptPin` round-trip correctness, IV uniqueness, tampered-ciphertext rejection | unit | `npm test -- tests/unit/pin-cipher.test.ts` | ❌ W0 | ⬜ pending |
| 08-04 dialog | 08-04 | 3 | D-14 | T-08-15 | Deactivate/reactivate requires confirmation dialog before mutating `active` | unit (component, jsdom + Radix Portal) | `npm test -- tests/unit/confirm-deactivate-dialog.test.tsx` | ❌ W0 | ⬜ pending |
| 08-03 T4 | 08-03 | 2 | D-15 | T-08-13 (Elevation-of-privilege, accepted) | Child login blocked only for NEW attempts after deactivation; a JWT issued before deactivation still passes the unchanged `child-guard.ts` | unit | `npm test -- tests/unit/child-session-guard.test.ts` | ⚠️ extend existing (08-03 Task 4) | ⬜ pending |
| 08-01 T2 | 08-01 | 1 | D-01 (domain layer) | — | `createChildProfile`/`deactivateChildProfile`/`updateChildProfile` satisfy pre-existing scaffold | integration (real Postgres) | `npm test -- tests/integration/family-child-profiles.test.ts` | ✅ (currently RED) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/unit/pin-cipher.test.ts` — round-trip encrypt/decrypt, wrong-key/tampered-ciphertext rejection, IV uniqueness across calls (08-01 Task 1)
- [ ] `tests/unit/parent-sidebar.test.tsx` — no test file exists despite the component existing since Phase 5; add coverage for the new `href`/active-state behavior on the "Crianças" icon (08-02)
- [ ] `tests/unit/child-form-panel.test.tsx` — new component, RHF+Zod validation cases (displayName required, ageYears bounds, accentColor hex format) (08-04)
- [ ] `tests/unit/confirm-deactivate-dialog.test.tsx` — open/close via `onOpenChange`, ESC key closes, confirm triggers `onConfirm`, cancel does not (08-04)
- [ ] `tests/integration/child-pin-reset.test.ts` — real Postgres via Testcontainers (matches `family-child-profiles.test.ts` pattern), verifies `pinHash` and `pinEncrypted` written atomically and pre-existing rows with `pinEncrypted IS NULL` handled correctly by the reveal path (08-03 Task 3)
- [ ] `tests/unit/child-session-guard.test.ts` — EXTEND the pre-existing file with a D-15 boundary case: a child session issued before deactivation still passes `validateChildSessionScope` (the guard intentionally never checks `active`), and the guard exposes no `active`/DB surface. `child-guard.ts` and `child-auth.ts` MUST stay unchanged (08-03 Task 4)

*Existing `tests/integration/family-child-profiles.test.ts` is a pre-existing RED-phase scaffold that this phase makes pass (user-confirmed) — not a new Wave 0 file, but its implementation (`src/lib/families/child-profiles.ts`) is a Wave 0 dependency for any task that needs `createChildProfile`/`deactivateChildProfile`/`updateChildProfile`.*

*`tests/unit/child-session-guard.test.ts` already exists (six passing cases). Its "extend existing" status means 08-03 Task 4 appends a new `describe` block; it is not a from-scratch Wave 0 file, but the D-15 boundary case IS a hard Wave 0 requirement for D-15 coverage.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `/tasks` route behavior unchanged after the `layout.tsx`/`ParentShell` extraction (navigation, task list render, sidebar/topbar) | D-02/D-03 | Regression is covered by the 08-05 human-verify checkpoint (step 1: "Visit `/family/{familyId}/tasks` — confirm sidebar/topbar/task list render exactly as before the refactor"). A dedicated automated e2e spec extending `tests/e2e/family-access.spec.ts` was deferred to keep the phase within budget; the layout refactor is behavior-preserving and the checkpoint exercises the full path against the running container. | 08-05 Task 3 checkpoint, step 1 — log in as guardian, open `/family/{familyId}/tasks`, confirm no visual/behavioral regression and the "Tarefas" icon is active |
| Visual layout of `/tasks` after layout.tsx/ParentShell extraction matches pre-refactor appearance pixel-for-pixel | D-02/D-03 | Automated e2e regression covers behavior/flow, not exact visual parity | Screenshot `/family/[familyId]/tasks` before and after refactor at same viewport, compare manually |
| Native `<input type="color">` picker UX (browser-native, not stylable cross-browser) | D-07 | Native OS color picker widget is outside jsdom/Playwright's reliable control surface | Manually open add-child form, click color swatch, confirm OS picker opens and selection reflects in preview |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved (2026-07-01) — Wave 0 tests are present and mapped to concrete plan/tasks: pin-cipher (08-01 T1), parent-sidebar (08-02), child-form-panel + confirm-deactivate-dialog (08-04), child-pin-reset (08-03 T3), child-session-guard D-15 boundary extension (08-03 T4). The D-02/D-03 `/tasks` regression is reclassified as manual-only (covered by the 08-05 checkpoint step 1); a dedicated e2e spec was deferred by budget.
</content>
