---
status: testing
phase: 08-child-management
source: [08-01-SUMMARY.md, 08-02-SUMMARY.md, 08-03-SUMMARY.md, 08-04-SUMMARY.md, 08-05-SUMMARY.md]
started: 2026-07-04T01:28:31Z
updated: 2026-07-04T01:28:31Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 2
name: Auth gate on /family/{familyId}/* routes
expected: |
  Visiting /family/{familyId}/children or /family/{familyId}/tasks without a valid session redirects to /login. Logged-in guardian sees the page normally.
awaiting: user response

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running server/service. Clear ephemeral state (temp DBs, caches, lock files). Start the application from scratch. Server boots without errors, any seed/migration completes, and a primary query (health check, children list load) returns live data.
result: pass

### 2. Auth gate on /family/{familyId}/* routes
expected: Visiting /family/{familyId}/children or /family/{familyId}/tasks without a valid session redirects to /login. Logged-in guardian sees the page normally.
result: [pending]

### 3. View children list
expected: Navigating to /family/{familyId}/children shows all children in the family (including deactivated ones, at reduced opacity), each showing name and avatar/accent color.
result: [pending]

### 4. Sidebar navigation active state
expected: Clicking "Crianças" in the sidebar navigates to /family/{familyId}/children and highlights that item active; clicking "Tarefas" navigates to /family/{familyId}/tasks and highlights that item instead.
result: [pending]

### 5. Add new child
expected: Clicking "add child" opens the ChildFormPanel. Filling name, age, and accent color and saving creates a new child that appears in the list immediately.
result: [pending]

### 6. Reset child PIN
expected: Selecting "reset PIN" for a child opens a numeric keypad. Entering a new 4-digit PIN and confirming updates the child's PIN (old PIN no longer works for child login).
result: [pending]

### 7. Reveal child PIN (gated)
expected: For a child with an encrypted PIN set, a "reveal PIN" action shows the plaintext PIN. For a child with no PIN set yet (pre-existing/no pinEncrypted), the reveal action is hidden or disabled.
result: [pending]

### 8. Deactivate child (dialog-gated)
expected: Clicking deactivate/toggle-active on a child does NOT immediately change state — it opens a ConfirmDeactivateDialog first. Confirming deactivates the child (shown at reduced opacity in the list); canceling leaves the child unchanged. Reactivating a deactivated child works the same way (confirm dialog, then flips back to active).
result: [pending]

## Summary

total: 8
passed: 1
issues: 0
pending: 7
skipped: 0

## Gaps

[none yet]
