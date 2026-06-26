# Phase 06: API Integration — Validation

**Framework:** Vitest 4.1.8
**Quick run:** `pnpm test`
**Full suite:** `pnpm test`

## Requirements → Test Map

| Req ID | Behavior | Test Type | Command | File Exists? |
|--------|----------|-----------|---------|-------------|
| API-01 | `calculateFirstfruits` returns ceiling of 10% | unit | `pnpm test tests/unit/ledger-calculate.test.ts` | Created in 06-01 |
| API-02 | `postEarning` writes header + 2 lines atomically | integration | `pnpm test tests/integration/ledger-engine.test.ts` | Created in 06-01 |
| API-03 | Duplicate commandId returns 23505 → 409 | integration | `pnpm test tests/integration/ledger-engine.test.ts` | Created in 06-01 |
| API-04 | `getBalance` sums ledger lines by accountType | unit | `pnpm test tests/unit/ledger-queries.test.ts` | Created in 06-01 |
| API-05 | Task CRUD Server Actions persist to taskTemplates | unit | `pnpm test tests/unit/tasks-actions.test.ts` | Created in 06-02 |
| API-06 | Harvest Route Handler returns 409 on duplicate | unit (mock db) | `pnpm test tests/unit/harvest-route.test.ts` | Created in 06-03 |
| API-07 | `getCurrentCycleStart` returns correct Sunday ISO string | unit | `pnpm test tests/unit/current-cycle.test.ts` | Created in 06-01 |

## Sampling Rate

- **Per task commit:** `pnpm test tests/unit/ledger-calculate.test.ts` (pure unit, fast)
- **Per wave completion:** `pnpm test` (full suite)
- **Phase gate:** Full suite green + ledger-engine integration test passing before `/gsd-verify-work`

## Wave 0 Gaps (unblocking pre-existing failures)

Three modules cause 6 currently-failing test categories — must be created in 06-01:

- [ ] `src/modules/ledger/calculate.ts` — unblocks `tests/unit/ledger-calculate.test.ts`
- [ ] `src/modules/ledger/engine.ts` — unblocks `tests/integration/ledger-engine.test.ts`
- [ ] `src/modules/ledger/queries.ts` — unblocks `tests/unit/ledger-queries.test.ts`

## Success Criteria Verification

| Criterion | Verified By |
|-----------|-------------|
| `approval` persists via API-01 | Server Action unit test + manual: create task with approval=true, reload parent panel, badge visible |
| `category` + `days` in payload (API-02) | Parent panel loads real tasks with day pills filled; filter chips work |
| Harvest writes ledger (API-03) | Harvest button → `POST /api/child/[childId]/harvest` → 201; ledger_transactions row visible in DB |
