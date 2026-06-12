---
status: testing
phase: 11-role-segregation-auth-middleware-child-nav-guardian-share-li
source: 11-01-SUMMARY.md, 11-02-SUMMARY.md, 11-03-SUMMARY.md, 11-04-SUMMARY.md, 11-05-SUMMARY.md, 11-06-SUMMARY.md, 11-07-SUMMARY.md
started: 2026-06-11T00:00:00Z
updated: 2026-06-11T00:00:00Z
---

## Current Test

number: 1
name: Middleware protects /child/* routes without child-session
expected: |
  Navigate to /child/home without logging in.
  Should redirect to /family/access/[familyId] (extracting familyId from a valid JWT) or to / if no token.
awaiting: user response

## Tests

### 1. Middleware protects /child/* routes without child-session
expected: Navigate to /child/home without logging in should redirect to /family/access/[familyId] or /
result: pending

### 2. Middleware protects /family/* routes without NextAuth
expected: Navigate to /family/dashboard without NextAuth cookie should redirect to /api/auth/signin
result: pending

### 3. Middleware allows public routes
expected: Navigate to / (home) should load without redirects
result: pending

### 4. Child dashboard loads with session
expected: Authenticated child navigates to /child/[childId]/dashboard. Page loads showing avatar initial, child name, balance badge, garden image, and ChildBottomNav with 4 tabs (Jardim, Tarefas, Sonhos, Saldo)
result: pending

### 5. ChildBottomNav active tab styling
expected: On /child/[childId]/dashboard, Jardim tab has green background rgba(202,236,125,0.55) and dark text #4c6700. Other tabs are lighter (opacity 0.7)
result: pending

### 6. Child tasks page lists assigned tasks
expected: Navigate to /child/[childId]/tasks. Page shows "Minhas Tarefas" with list of tasks assigned to this child for current week. Each task shows title, Kreds value, and toggle button
result: pending

### 7. Toggle task completion from pending to completed
expected: Click toggle button on pending task. Button shows loading state, then displays green "✓ Feita" pill with "Desmarcar" link. Task completion saved to database (idempotent)
result: pending

### 8. Toggle task completion from completed to pending
expected: Click "Desmarcar" on completed task. Button returns to outlined "Marcar como feita" state. Completion status reverts in database
result: pending

### 9. Child dreams page shows wishlist goals
expected: Navigate to /child/[childId]/dreams. Page shows wishlist goals with GoalCard component, "Plantando Novo Sonho" button, and ChildBottomNav with Sonhos tab active
result: pending

### 10. Child balance page shows balance and history
expected: Navigate to /child/[childId]/balance. Page shows available Kreds balance, firstfruits balance badge, and ledger history list with transactions. ChildBottomNav with Saldo tab active
result: pending

### 11. Child donations page shows and creates donations
expected: Navigate to /child/[childId]/donations. Page shows existing donations list and "Doe Kreds" form. Form validates amountKreds > 0. Submitting creates donation record in database
result: pending

### 12. Guardian sees ShareLinkButton in family children page
expected: Authenticated guardian navigates to /family/children. Page shows child list with ShareLinkButton. Clicking button copies accessible link (e.g., /family/access/[familyId]) to clipboard. Button text changes to "Copiado!" for 2 seconds
result: pending

### 13. Guardian balance page shows child's balance and history
expected: Guardian navigates to /guardian/[childId]/balance. Page shows child's available balance, firstfruits badge, and complete ledger history. Guardian can only see balance of children in their own family
result: pending

### 14. Child cannot access guardian routes
expected: Authenticate as child. Try to navigate to /guardian/[childId]/balance. Should redirect (blocked by middleware or auth guard)
result: pending

### 15. Guardian cannot access /child/[childId] routes (only via /guardian routes)
expected: Authenticate as guardian. Try to navigate to /child/[childId]/dashboard. Should redirect or show error (middleware should block /child/* without child-session)
result: pending

### 16. Cold Start Smoke Test
expected: Kill any running server. Clear ephemeral state (temp DBs, caches). Start application from scratch with `pnpm dev`. Server boots without errors, migrations apply, and homepage loads with live data
result: pending

## Summary

total: 16
passed: 0
issues: 0
pending: 16
skipped: 0
blocked: 0

## Gaps

[none yet]
