---
phase: quick
plan: 260702-mta
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/parent/parent-task-card.tsx
  - src/components/parent/parent-panel-view.tsx
  - tests/unit/parent-task-card.test.tsx
autonomous: true
requirements: [MTA-01]

must_haves:
  truths:
    - "Parent can see which child(ren) a task is assigned to directly on the TaskCard, without opening filters"
    - "If multiple children are assigned to a task, all of them are visually represented (no silent truncation)"
    - "Existing ParentTaskCard tests and layout continue to pass unmodified in behavior (toggle, edit button, badges, animation)"
  artifacts:
    - path: "src/components/parent/parent-task-card.tsx"
      provides: "AssigneeAvatars sub-component rendered inside the badges row, resolving task.assigned child ids against familyChildren"
      contains: "AssigneeAvatars"
    - path: "src/components/parent/parent-panel-view.tsx"
      provides: "Passes familyChildren prop through to each ParentTaskCard instance"
      contains: "familyChildren={familyChildren}"
  key_links:
    - from: "src/components/parent/parent-panel-view.tsx"
      to: "src/components/parent/parent-task-card.tsx"
      via: "familyChildren prop"
      pattern: "<ParentTaskCard[\\s\\S]*?familyChildren="
    - from: "src/components/parent/parent-task-card.tsx"
      to: "task.assigned"
      via: "map assigned child ids to familyChildren avatar data"
      pattern: "task\\.assigned\\.map|familyChildren\\.find"
---

<objective>
Add a small visual indicator on `ParentTaskCard` showing which child(ren) a task is assigned to, so the parent does not need to open the filter chips to find out. Reuse the existing avatar-by-initial + accentColor chip pattern (already used in `FilterChips` and `AssigneeSelector`) for visual consistency with the rest of the parent panel.

Purpose: Close a discoverability gap called out by the user — the current `ParentTaskCard` (see attached screenshot) shows category icon, title, reward badge, and day-of-week pills, but nothing about assignee(s). The user pointed at the day-pills row as the natural location for this indicator.

Output: `ParentTaskCard` renders a compact avatar-chip row (one chip per assigned child, all shown — no truncation) inside the existing badges row, next to/after the day pills. `ParentPanelView` threads its already-available `familyChildren` list down as a new prop so `ParentTaskCard` can resolve `task.assigned` ids into displayName/accentColor for rendering.
</objective>

<execution_context>
@/Users/hass/.claude/gsd-core/workflows/execute-plan.md
@/Users/hass/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@./CLAUDE.md

# Component being modified — current TaskCard, no assignee indicator
@src/components/parent/parent-task-card.tsx

# Parent — already has familyChildren in scope, just needs to pass it down
@src/components/parent/parent-panel-view.tsx

# Existing test file — must keep passing, extend with new coverage
@tests/unit/parent-task-card.test.tsx

# Reuse this avatar visual pattern (initial + accentColor circle) for consistency
@src/components/parent/filter-chips.tsx
@src/components/parent/assignee-selector.tsx

# ParentTask type — task.assigned: string[] holds childProfile ids (currently
# always length 1 from DB today, but the type and UI must support N children)
@src/types/task.ts
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add AssigneeAvatars to ParentTaskCard and thread familyChildren prop</name>
  <files>src/components/parent/parent-task-card.tsx, src/components/parent/parent-panel-view.tsx</files>
  <behavior>
    - AssigneeAvatars renders nothing (null) when the resolved children list is empty (task.assigned is empty, or none of the ids match familyChildren — e.g. a deactivated child).
    - AssigneeAvatars renders one small circular chip per assigned child that IS found in familyChildren, each showing the child's first initial (uppercased) over their accentColor background — same visual language as FilterChips' mini avatar (24px circle, initial, accentColor bg, white text) but smaller (about 18-20px) to fit inline with the day pills without disrupting the existing row height/spacing.
    - When multiple children are assigned, ALL are rendered — small overlapping/tightly-packed row (e.g. negative margin-left on all but the first), never truncated or collapsed into a "+N" count.
    - ParentTaskCard accepts a new required prop `familyChildren: Array&lt;{ id: string; displayName: string; accentColor: string; avatarPreset: string }&gt;` (same shape already defined and passed around in parent-panel-view.tsx / filter-chips.tsx / assignee-selector.tsx — do not invent a new shape).
    - ParentPanelView passes `familyChildren={familyChildren}` to its ParentTaskCard instance (parent-panel-view.tsx already receives familyChildren as a prop from the page, it is simply not threaded to the card yet).
    - All 6 existing tests in tests/unit/parent-task-card.test.tsx continue to pass once familyChildren is added to their render calls (they currently omit it, which becomes a required prop).
  </behavior>
  <action>
    In parent-task-card.tsx: add an AssigneeAvatars function component above ParentTaskCard, following the same local-component convention as the existing DayPills function in this file. It takes assignedIds (string array) and familyChildren (same shape as the new ParentTaskCardProps field), resolves each id via familyChildren.find(c =&gt; c.id === id), filters out unmatched ids (e.g. a deactivated child no longer present in familyChildren), and returns null if the resolved list is empty. Render each resolved child as a small circle (width/height about 18-20px, borderRadius '50%', background: child.accentColor, white bold text at about 9-10px showing child.displayName.charAt(0).toUpperCase()), wrapped in a flex row with a small negative marginLeft (e.g. -6px) on all but the first chip to create a compact overlapping-stack effect for multiple assignees, plus a card-color border (1.5px, '#FBFAF5') on each chip so overlapping circles stay visually separable. Put aria-hidden="true" on each individual chip and add a single wrapping element with an aria-label listing the assigned children's display names (e.g. "Atribuída a: " + names.join(', ')) so the assignment is discoverable via accessibility tree/tests without parsing icons.

    Add AssigneeAvatars into the badges row (the flex row that currently holds the reward badge, DayPills, and approval badge), positioned immediately after DayPills and before the approval badge, per the user's screenshot annotation pointing at the day-pills row as the desired location. Only render it when task.assigned.length &gt; 0, mirroring the existing task.days.length &gt; 0 &amp;&amp; DayPills guard pattern already used in this file.

    Update ParentTaskCardProps to add the new required familyChildren field (same shape as FamilyChild in assignee-selector.tsx / ChildChip in filter-chips.tsx — reuse an equivalent inline interface; do not import a type from those files since neither currently exports one).

    In parent-panel-view.tsx: add familyChildren={familyChildren} to the existing ParentTaskCard JSX call (parent-panel-view.tsx already destructures familyChildren from its own props — no new data fetching needed, this is pure prop threading).

    Do NOT touch task-form-panel.tsx, assignee-selector.tsx, filter-chips.tsx, the tasks API route, Server Actions, or the DB schema — this is a read-only display feature layered on data that already flows into ParentPanelView. Do NOT change the DB-level one-child-per-task model (taskTemplates.assignedChildId) — the UI type already models assigned as string[] for forward compatibility, and this plan renders whatever is in that array (currently always 0 or 1 entries from real data) without assuming a cardinality.
  </action>
  <verify>
    <automated>cd /Users/hass/repos/github/comphass/kreds &amp;&amp; npx vitest run tests/unit/parent-task-card.test.tsx</automated>
  </verify>
  <done>ParentTaskCard renders an AssigneeAvatars chip row in the badges area whenever task.assigned is non-empty and ids resolve against familyChildren; ParentPanelView passes familyChildren through; all existing tests pass with familyChildren added to their render calls.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Extend test coverage for the assignee indicator</name>
  <files>tests/unit/parent-task-card.test.tsx</files>
  <behavior>
    - Test: task with `assigned: ['c1']` and a matching familyChildren entry (e.g. `{ id: 'c1', displayName: 'Ana', accentColor: '#3E6B4F', avatarPreset: 'x' }`) renders an element exposing the assignee's initial/name (query via `getByLabelText(/atribuída a/i)` or equivalent), confirming the indicator is visible without needing filters.
    - Test: task with `assigned: ['c1', 'c2']` and two matching familyChildren entries renders indicators for BOTH children (assert both initials/names present — no truncation, no "+1" collapsing).
    - Test: task with `assigned: []` (or ids that don't match any familyChildren, e.g. a deactivated child no longer in the list) renders no assignee indicator element (absence assertion via `queryByLabelText`).
    - All existing tests (6) continue passing with `familyChildren` now supplied on every `render(&lt;ParentTaskCard .../&gt;)` call in the file.
  </behavior>
  <action>
    Update the top of tests/unit/parent-task-card.test.tsx to define a shared `familyChildren` fixture array (e.g. two entries, ids matching MOCK_PARENT_TASKS conventions — use synthetic ids like 'c1'/'c2' since MOCK_PARENT_TASKS tasks currently have `assigned: []`). Add `familyChildren={familyChildren}` to every existing `&lt;ParentTaskCard .../&gt;` render call in the file (there are 6) so they keep passing now that the prop is required.

    Add a new `describe` or additional `it` blocks (co-located with the existing suite, same file) covering the three new behaviors above: single assignee visible, multiple assignees all visible (no truncation), and empty/unmatched assigned array renders nothing. Build each test's `task` object via `{ ...MOCK_PARENT_TASKS[0], assigned: [...] }` to keep other fields realistic and avoid duplicating the full ParentTask shape inline. Use `queryByLabelText`/`getByLabelText` against the aria-label pattern implemented in Task 1 (e.g. matching `/atribuída a/i`) rather than asserting on inline styles, so the tests stay resilient to visual tweaks.

    Do not modify or delete any of the 6 pre-existing test cases' assertions — only add the `familyChildren` prop to their render calls and append new test cases.
  </action>
  <verify>
    <automated>cd /Users/hass/repos/github/comphass/kreds &amp;&amp; npx vitest run tests/unit/parent-task-card.test.tsx</automated>
  </verify>
  <done>tests/unit/parent-task-card.test.tsx has 9+ passing tests: the original 6 (now passing familyChildren) plus 3 new tests proving single-assignee visibility, multi-assignee visibility without truncation, and correct absence when no assignment data resolves.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|--------------|
| Server (page.tsx) → Client (ParentPanelView/ParentTaskCard) | familyChildren and initialTasks are fetched server-side with familyId isolation already enforced (T-06-15); this plan only renders that pre-scoped data client-side, no new server calls |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|------------------|
| T-MTA-01 | Information Disclosure | AssigneeAvatars in parent-task-card.tsx | accept | familyChildren is already scoped to the authenticated guardian's own family (existing familyId-filtered query in tasks/page.tsx); this plan adds no new data source or cross-family lookup, so no new disclosure surface is introduced |
| T-MTA-02 | Tampering | N/A — no package installs, no server mutation added | accept | This is a pure client-rendering change reading existing props; no new dependencies, no new write path |
</threat_model>

<verification>
Run `cd /Users/hass/repos/github/comphass/kreds && npx vitest run tests/unit/parent-task-card.test.tsx` — all tests (original 6 + new 3) pass.

Manually confirm no other ParentTaskCard call sites were missed: `grep -rn "ParentTaskCard" src tests` should show only parent-panel-view.tsx (usage) and parent-task-card.tsx (definition) and the test file, all updated.
</verification>

<success_criteria>
- ParentTaskCard visually shows assignee avatar chip(s) for any task with a non-empty `assigned` array, resolved against `familyChildren`, positioned in the badges row near the day pills as the user requested.
- Multiple assignees are never truncated or hidden — every matched child gets a visible chip.
- No regression: all 6 pre-existing ParentTaskCard tests and the app's overall layout/behavior (toggle, edit, animation, opacity, editing border) remain intact.
- No changes to data model, API routes, Server Actions, or DB schema — display-only feature.
</success_criteria>

<output>
Create `.planning/quick/260702-mta-adicionar-indicador-visual-no-card-de-ta/260702-mta-SUMMARY.md` when done
</output>
