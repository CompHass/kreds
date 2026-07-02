---
phase: 8
slug: child-management
status: draft
nyquist_compliant: false
wave_0_complete: false
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
- **Before `/gsd-verify-work`:** Full suite green (`npm test` and `npm run test:e2e` for the `/tasks`-regression e2e path)
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | D-05 | — | "Crianças" sidebar icon navigates to `/children` and shows active state | unit (component) | `npm test -- tests/unit/parent-sidebar.test.tsx` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | D-06/D-07/D-08/D-09 | — | Add-child form validates via Zod, submits via Server Action | unit + integration | `npm test -- tests/unit/child-form-panel.test.tsx` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | D-10/D-13 | — | `pinHash`/`pinEncrypted` written together on "Redefinir PIN" | integration (real Postgres) | `npm test -- tests/integration/child-pin-reset.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | D-12 | T-06-15-style (cross-family access) | `encryptPin`/`decryptPin` round-trip correctness, IV uniqueness, tampered-ciphertext rejection | unit | `npm test -- tests/unit/pin-cipher.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | D-14 | — | Deactivate/reactivate requires confirmation dialog before mutating `active` | unit (component, jsdom + Radix Portal) | `npm test -- tests/unit/confirm-deactivate-dialog.test.tsx` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | D-02/D-03 | — | `/tasks` route behavior unchanged after layout refactor | integration/e2e (regression) | `npm run test:e2e -- tests/e2e/family-access.spec.ts` | ⚠️ extend existing | ⬜ pending |
| TBD | TBD | TBD | D-15 | Elevation-of-privilege (accepted) | Child login blocked only for NEW attempts after deactivation; active session still valid | integration | Extend `tests/unit/child-session-guard.test.ts` or `tests/unit/child-auth-endpoint.test.ts` | ⚠️ extend existing | ⬜ pending |
| TBD | TBD | TBD | D-01 (domain layer) | — | `createChildProfile`/`deactivateChildProfile`/`updateChildProfile` satisfy pre-existing scaffold | integration (real Postgres) | `npm test -- tests/integration/family-child-profiles.test.ts` | ✅ (currently RED) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/unit/pin-cipher.test.ts` — round-trip encrypt/decrypt, wrong-key/tampered-ciphertext rejection, IV uniqueness across calls
- [ ] `tests/unit/parent-sidebar.test.tsx` — no test file exists despite the component existing since Phase 5; add coverage for the new `href`/active-state behavior on the "Crianças" icon
- [ ] `tests/unit/child-form-panel.test.tsx` — new component, RHF+Zod validation cases (displayName required, ageYears bounds, accentColor hex format)
- [ ] `tests/unit/confirm-deactivate-dialog.test.tsx` — open/close via `onOpenChange`, ESC key closes, confirm triggers `onConfirm`, cancel does not
- [ ] `tests/integration/child-pin-reset.test.ts` — real Postgres via Testcontainers (matches `family-child-profiles.test.ts` pattern), verifies `pinHash` and `pinEncrypted` written atomically and pre-existing rows with `pinEncrypted IS NULL` handled correctly by the reveal path

*Existing `tests/integration/family-child-profiles.test.ts` is a pre-existing RED-phase scaffold that this phase makes pass (user-confirmed) — not a new Wave 0 file, but its implementation (`src/lib/families/child-profiles.ts`) is a Wave 0 dependency for any task that needs `createChildProfile`/`deactivateChildProfile`/`updateChildProfile`.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual layout of `/tasks` after layout.tsx/ParentShell extraction matches pre-refactor appearance pixel-for-pixel | D-02/D-03 | Automated e2e regression covers behavior/flow, not exact visual parity | Screenshot `/family/[familyId]/tasks` before and after refactor at same viewport, compare manually |
| Native `<input type="color">` picker UX (browser-native, not stylable cross-browser) | D-07 | Native OS color picker widget is outside jsdom/Playwright's reliable control surface | Manually open add-child form, click color swatch, confirm OS picker opens and selection reflects in preview |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
