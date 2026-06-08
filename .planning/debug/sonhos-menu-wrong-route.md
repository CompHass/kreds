---
slug: sonhos-menu-wrong-route
status: resolved
trigger: manual
created: 2026-06-08
---

# Debug Session: sonhos-menu-wrong-route

## Symptoms

Clicking the "Sonhos" item in the bottom navigation bar routes the user to `/family/tasks/current` (the tasks page) instead of a dreams/wishes page.

- **Expected:** `/family/wishes` (or similar dreams/wishlist page)
- **Actual:** `/family/tasks/current`
- **User impact:** Guardian cannot access the Sonhos/Wishlist section from the nav

## Current Focus

**hypothesis:** The `href` value for "Sonhos" in `BottomNav.tsx` was incorrectly set to `/family/tasks/current` — likely a copy-paste error when adding the nav item.

**next_action:** Fix `BottomNav.tsx` line 31 and create the `/family/wishes` page.

## Evidence

- timestamp: 2026-06-08T00:00:00Z
  file: src/components/BottomNav.tsx
  line: 31
  note: |
    Item "Sonhos" has `href: '/family/tasks/current'` — same as the tasks/current route, not a wishes route.
    The "Missões" item above it correctly uses `/family/tasks`.
    This is a copy-paste error: the href was never updated to a wishes URL.

- timestamp: 2026-06-08T00:00:01Z
  note: |
    Route `/family/wishes` does not exist in the filesystem.
    The Sonhos feature exists only as a child-facing view at `/child/[childId]/balance`.
    There is no guardian-facing wishes page yet.
    BottomNav is used in `/family/dashboard` and `/family/tasks` pages only (guardian context).

- timestamp: 2026-06-08T00:00:02Z
  note: |
    Schema and API: no `/api/families/wishes` endpoint exists.
    The `WISHLIST_GOAL` term exists in `src/modules/glossary/terms.ts`.
    REQUIREMENTS.md tracks GOAL-01 through GOAL-07 as unimplemented features.

## Resolution

**root_cause:** `BottomNav.tsx` line 31 — the "Sonhos" nav item `href` was set to `/family/tasks/current` (copy-paste error from the "Missões" item). The wishlist/dreams route `/family/wishes` did not exist.

**fix:** Two-part fix applied:
1. Updated `BottomNav.tsx` to use `href: '/family/wishes'` for the "Sonhos" item.
2. Created `/family/wishes/page.tsx` as a placeholder page for the Sonhos/Wishlist feature (feature is in backlog per REQUIREMENTS.md GOAL-01 through GOAL-07).
