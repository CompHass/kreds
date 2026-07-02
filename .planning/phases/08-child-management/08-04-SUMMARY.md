---
phase: 08-child-management
plan: "04"
subsystem: children-ui
tags: [radix-ui, alert-dialog, react-hook-form, zod, numeric-keypad, presentational-components]
dependency_graph:
  requires:
    - "08-03 (ChildProfileView type, CreateChildSchema/ResetPinSchema Zod schemas)"
  provides:
    - "src/components/parent/confirm-deactivate-dialog.tsx — ConfirmDeactivateDialog (first Radix AlertDialog in project, D-14)"
    - "src/components/parent/child-form-panel.tsx — ChildFormPanel, ChildFormData, EMPTY_CHILD_FORM"
    - "src/components/parent/child-card.tsx — ChildCard (Frame C list-row)"
    - "src/components/parent/child-pin-reset-panel.tsx — ChildPinResetPanel (NumericKeypad reuse)"
  affects:
    - "08-05 (ChildrenPanelView wires these four leaf components together with Server Actions)"
tech_stack:
  added:
    - "radix-ui@1.6.1 (unified package, AlertDialog primitive only)"
  patterns:
    - "Controlled AlertDialog.Root open/onOpenChange, no Trigger (button lives in ChildCard, not adjacent to dialog)"
    - "react-hook-form + zodResolver(CreateChildSchema), first phase to actually wire up RHF (TaskFormPanel used raw useState)"
    - "<input type=\"color\"> bound via RHF register — native picker always yields valid 7-char lowercase hex"
    - "hasEncryptedPin-gated PIN reveal button (Pitfall 6 — pre-existing children have NULL pinEncrypted)"
key_files:
  created:
    - src/components/parent/confirm-deactivate-dialog.tsx
    - src/components/parent/child-form-panel.tsx
    - src/components/parent/child-card.tsx
    - src/components/parent/child-pin-reset-panel.tsx
    - tests/unit/confirm-deactivate-dialog.test.tsx
    - tests/unit/child-form-panel.test.tsx
    - .planning/phases/08-child-management/deferred-items.md
  modified:
    - package.json (added radix-ui, bumped @hookform/resolvers 5.0.1 -> 5.4.0)
    - pnpm-lock.yaml
decisions:
  - "08-04: radix-ui installed via pnpm (project's packageManager), not npm — docker compose exec app has no npm/devDependencies (production runner image, same constraint noted in 08-03-SUMMARY.md); local pnpm has access to node_modules + Docker daemon"
  - "08-04: @hookform/resolvers upgraded 5.0.1 -> 5.4.0 (Rule 3 blocking fix) — installed 5.0.1's zodResolver reads the legacy ZodError.errors array shape, but Zod 4.4.3 (already installed) exposes .issues instead, silently swallowing all validation errors as an unhandled promise rejection. 5.4.0 is the exact version RESEARCH.md already flagged as current; no new package, only a version bump of an already-approved dependency"
  - "08-04: ChildFormPanel test assertions use onSave.mock.calls[0][0] instead of toHaveBeenCalledWith — RHF's handleSubmit(onSave) invokes onSave(data, event) with two arguments, and toHaveBeenCalledWith compares the full args array"
  - "08-04: ChildCard renders deactivated children at reduced opacity (0.55) rather than hiding them — D-14 requires deactivated children still appear in the list"
metrics:
  duration: "~25 minutes"
  completed_date: "2026-07-02T11:28:39Z"
  tasks_completed: 3
  files_created: 7
  files_modified: 2
---

# Phase 08 Plan 04: Child Management UI Components Summary

Four new leaf UI components for Phase 8's `/children` screen: `ConfirmDeactivateDialog` (project's first Radix `AlertDialog`), `ChildFormPanel` (add-child side panel with the project's first working React Hook Form + Zod wiring), `ChildCard` (Frame C list-row with initial-avatar and gated PIN reveal), and `ChildPinResetPanel` (non-fullscreen wrapper around the existing `NumericKeypad`). All four are presentational — Plan 05 wires them into `ChildrenPanelView` with real Server Actions.

## What Was Built

### Task 1: radix-ui install + ConfirmDeactivateDialog + dialog test

- Installed `radix-ui@1.6.1` (unified package, VERIFIED OK per 08-RESEARCH.md's Package Legitimacy Audit — 9.05M weekly downloads, no postinstall script).
- **`src/components/parent/confirm-deactivate-dialog.tsx`** — controlled `AlertDialog.Root` (no `Trigger`, since the "Desativar"/"Reativar" button lives in `ChildCard`). Overlay `rgba(39,55,44,.25)` matching `GuardianProfileDrawer`'s existing backdrop, content 360px/borderRadius 16/padding 24, centered via `translate(-50%,-50%)`. Title/body copy and the confirm button's label/color (`#B14A2E` destructive vs. `--color-kreds-primary` green) driven entirely by the `willDeactivate` prop, matching 08-UI-SPEC.md's copywriting contract exactly.
- **`tests/unit/confirm-deactivate-dialog.test.tsx`** — 5/5 green: closed-state title absent, open-state title present, "Desativar" click calls `onConfirm`, "Cancelar" click does not, ESC keydown triggers `onOpenChange(false)`.

### Task 2: ChildFormPanel + form test

- **`src/components/parent/child-form-panel.tsx`** — right-side panel cloned verbatim from `TaskFormPanel`'s shell (336px width, 20px padding — the documented UI-SPEC exception, borderRadius 20, identical boxShadow, minHeight 400). `mode: 'idle' | 'create'` only — no edit mode (D-06) and no delete button. `useForm({ resolver: zodResolver(CreateChildSchema), defaultValues: EMPTY_CHILD_FORM })` wires three fields: `displayName` (text, "Nome"), `ageYears` (number, "Idade", `valueAsNumber: true`), `accentColor` (`<input type="color">`, "Cor", D-07's native picker). Exports `ChildFormData`, `EMPTY_CHILD_FORM`, `ChildFormPanel`.
- **`tests/unit/child-form-panel.test.tsx`** — 4/4 green: empty-displayName shows "Nome obrigatório" and blocks `onSave`; valid submit calls `onSave` with the exact `{displayName, ageYears, accentColor}` payload; `ageYears > 18` blocks submit; idle mode renders the placeholder with zero form inputs in the DOM.

### Task 3: ChildCard + ChildPinResetPanel

- **`src/components/parent/child-card.tsx`** — full-width list-row (`borderRadius: 24`), 52×52px initial+accentColor gradient avatar (D-08), displayName/ageYears, a PIN region showing `revealedPin ?? '••••'` with a `disabled`-when-`!hasEncryptedPin` "Mostrar"/"Ocultar" toggle and the explanatory "PIN ainda não definido" copy (Pitfall 6), a "Redefinir PIN" button, and a "Desativar"/"Reativar" button whose label/color track `child.active`. Deactivated children render at 55% opacity rather than being hidden (D-14 requires they stay visible). No "Ver atividade" control (deferred to Phase 9).
- **`src/components/parent/child-pin-reset-panel.tsx`** — wraps the existing `NumericKeypad` unmodified inside a 336px panel shell (same family as `TaskFormPanel`/`ChildFormPanel`). Tracks entered digits in local `useState`, renders 4 progress dots, and calls `onSubmit(pin)` automatically once the 4th digit lands (D-10).
- Verified via `tsc --noEmit` (zero errors in either file) and an ad-hoc React Testing Library smoke render (3/3 passing, not persisted as a committed test file — the plan's `<verify>` block for this task only requires the typecheck command).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking dependency version bug] Upgraded `@hookform/resolvers` 5.0.1 → 5.4.0**
- **Found during:** Task 2, writing `child-form-panel.test.tsx`
- **Issue:** The installed `@hookform/resolvers@5.0.1`'s `zodResolver` checks `Array.isArray(caughtError?.errors)` to detect a `ZodError` and extract field-level messages. Zod 4.4.3 (already the project's installed version) changed `ZodError`'s shape — it exposes `.issues`, not `.errors`. This mismatch meant `zodResolver` never recognized validation failures as Zod errors: the promise rejected unhandled, `formState.errors` was never populated, and `onSave` also never fired (form state got stuck). Both the "empty displayName" and "valid submit" test cases failed — the first because the error text never rendered, the second because of resulting async/timing corruption from the unhandled rejection.
- **Fix:** `pnpm add @hookform/resolvers@5.4.0` — the exact version 08-RESEARCH.md's Standard Stack table already lists as "current". This is a version bump of an existing, already-approved dependency (not a new package install), so it does not require a package-legitimacy checkpoint.
- **Files modified:** `package.json`, `pnpm-lock.yaml`
- **Commit:** 9dc8942

**2. [Rule 1 - Test bug] Fixed `toHaveBeenCalledWith` assertion for RHF's two-argument `onSave` call**
- **Found during:** Task 2, debugging the "valid submit" test case
- **Issue:** React Hook Form's `handleSubmit(onSave)` invokes `onSave(data, event)` with two arguments (the validated data and the originating `SyntheticEvent`). `expect(onSave).toHaveBeenCalledWith({...})` compares the full arguments array, so it never matched even though `onSave` was called with the correct data as its first argument — this looked identical to the resolver bug above (test would hang until `waitFor`'s timeout) until confirmed with a debug harness capturing `onSave.mock.calls[0][0]` directly.
- **Fix:** Assert `onSave.mock.calls[0][0]` with `toEqual` instead of `toHaveBeenCalledWith` on the full args.
- **Files modified:** `tests/unit/child-form-panel.test.tsx`
- **Commit:** 9dc8942

### Out-of-scope findings (logged, not fixed)

Full-suite `npm test` run surfaced 11 pre-existing failing test files unrelated to this plan (broken imports referencing modules removed in the `src/` rebuild — `family-authorization`, `family-constants`, `family-invitations`, `glossary` — plus integration/e2e tests requiring Testcontainers Docker daemon / Playwright browser infra not part of this plan's verification scope). Confirmed pre-existing via `git stash` before/after comparison. Logged to `.planning/phases/08-child-management/deferred-items.md` per the scope-boundary rule; not touched.

## Verification Results

- `npx vitest run tests/unit/confirm-deactivate-dialog.test.tsx tests/unit/child-form-panel.test.tsx` — 9/9 passed.
- `npx tsc --noEmit -p tsconfig.json` — zero errors in any of the four new component files (`child-form-panel.tsx`, `child-card.tsx`, `child-pin-reset-panel.tsx`, `confirm-deactivate-dialog.tsx`); pre-existing `.next/types/*` errors from removed legacy pages are unrelated to this plan.
- `grep "\"radix-ui\"" package.json` — confirms `"radix-ui": "^1.6.1"`.
- All grep-based acceptance criteria from the plan (willDeactivate usage count, #B14A2E color, zodResolver/useForm wiring, native color input, no delete/edit markers, 20px padding preserved, hasEncryptedPin gating, "PIN ainda não definido" copy, absence of "Ver atividade", NumericKeypad reuse) confirmed via direct grep during execution.

## Known Stubs

None — all four components are fully implemented against the Plan 03 contract types (`ChildProfileView`, `CreateChildSchema`, `ResetPinSchema`). No placeholder values, TODO comments, or mock data. They are intentionally "leaf" components with no data-fetching of their own (by design — Plan 05 owns state and Server Action wiring), which is the documented composition boundary, not a stub.

## Threat Flags

No new threat surface beyond what was declared in the plan's `<threat_model>`. T-08-12 (invalid add-child input) is mitigated by `ChildFormPanel`'s `zodResolver(CreateChildSchema)` blocking submit client-side (server-side re-validation already exists per 08-03). T-08-13 (PIN reveal for a child with no encrypted PIN) is mitigated by `ChildCard` disabling "Mostrar" when `hasEncryptedPin` is false. T-08-SC (radix-ui npm install) was accepted per the pre-verified Package Legitimacy Audit in 08-RESEARCH.md — no blocking-human checkpoint was required or triggered.

## Self-Check: PASSED

- [x] `src/components/parent/confirm-deactivate-dialog.tsx` — FOUND, exports `ConfirmDeactivateDialog`
- [x] `src/components/parent/child-form-panel.tsx` — FOUND, exports `ChildFormPanel`, `ChildFormData`, `EMPTY_CHILD_FORM`
- [x] `src/components/parent/child-card.tsx` — FOUND, exports `ChildCard`
- [x] `src/components/parent/child-pin-reset-panel.tsx` — FOUND, exports `ChildPinResetPanel`
- [x] `tests/unit/confirm-deactivate-dialog.test.tsx` — FOUND, 5/5 tests GREEN
- [x] `tests/unit/child-form-panel.test.tsx` — FOUND, 4/4 tests GREEN
- [x] `package.json` — FOUND, `"radix-ui": "^1.6.1"` present
- [x] Commits: f6bef7e, 9dc8942, 881f8ce — all verified in `git log`

## Self-Check: PASSED (post-write verification)

All 8 claimed files confirmed present on disk; all 4 commit hashes (f6bef7e, 9dc8942, 881f8ce, 2c44186) confirmed in `git log --oneline --all`.
