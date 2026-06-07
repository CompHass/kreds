---
phase: 4
slug: weekly-task-templates-and-activity-cycles
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-07
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.8 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run --reporter=verbose src/modules/activity` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose src/modules/activity`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 4-01-01 | 01 | 0 | ACT-02 | — | getCycleForDate returns correct Sunday-Saturday bounds | unit | `npx vitest run src/modules/activity` | ❌ W0 | ⬜ pending |
| 4-01-02 | 01 | 0 | ACT-01 | — | task_templates schema has is_active, deactivated_at, kreds_value>0 | unit | `npx vitest run src/modules/activity` | ❌ W0 | ⬜ pending |
| 4-02-01 | 02 | 1 | ACT-01 | — | POST /api/families/tasks creates template scoped to family_id | unit | `npx vitest run src/modules/activity` | ❌ W0 | ⬜ pending |
| 4-02-02 | 02 | 1 | ACT-03 | — | PATCH /api/families/tasks/:id toggles is_active and sets deactivated_at | unit | `npx vitest run src/modules/activity` | ❌ W0 | ⬜ pending |
| 4-03-01 | 03 | 2 | ACT-02 | — | Current cycle page shows active tasks for correct Sunday-Saturday window | unit | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 4-03-02 | 03 | 2 | ACT-03 | — | Inactive tasks hidden by default, visible with toggle | unit | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/modules/activity/__tests__/cycle.test.ts` — unit tests for getCycleForDate (9 timezone edge cases: UTC, UTC-3/SP, UTC-4/NY, UTC+5:30/India, month boundary, year boundary, leap year, DST transition, midweek date)
- [ ] `src/modules/activity/__tests__/task-templates.test.ts` — stubs for ACT-01 (CRUD), ACT-03 (activation history)
- [ ] Existing `vitest.config.ts` covers phase — no new install needed

*Existing infrastructure covers all phase requirements (Vitest already configured).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Guardian UI shows inactive tasks only when toggle activated | ACT-03 | UI component, no unit test | Visit /family/tasks as guardian, confirm inactive tasks hidden; toggle filter and confirm they appear |
| Current cycle dates correct for family timezone | ACT-02 | Timezone rendering in browser | Login as guardian with SP timezone, verify cycle header shows correct Sunday-Saturday dates |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
