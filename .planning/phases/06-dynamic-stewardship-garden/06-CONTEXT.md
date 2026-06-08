# Phase 6: Dynamic Stewardship Garden - Context

**Gathered:** 2026-06-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 06 turns the family dashboard garden from a static pre-composed image into a stateful visual composition. The garden must show an empty isometric base when no active missions exist, then place task-linked plant assets into stable slots as missions appear and progress through the weekly stewardship loop.

Phase 06 depends on Phase 05 for real task completion and approval progress. It may define fallback contracts and visual fixtures before Phase 05 is complete, but production staging must use server-derived weekly task progress rather than task index or random state.

</domain>

<decisions>
## Implementation Decisions

- **D-01:** Use a layered frontend composition, not a newly generated full-garden image per state. The base garden is empty; task plants are separate transparent assets positioned over it.
- **D-02:** Empty garden state is driven by active mission count. If a family has zero active missions, the dashboard shows no plants or mature trees.
- **D-03:** Each active mission maps to a stable garden slot. Slot assignment must be deterministic so plants do not jump between renders.
- **D-04:** Growth stage is derived from weekly task progress after Phase 05 exists. Do not persist visual-only stage if it can be derived from authoritative completion/approval records.
- **D-05:** Plant type can be explicit later, but v1 may use a deterministic default template such as oak unless task metadata adds plant selection.
- **D-06:** The dashboard should stop relying on `/garden-isometric.png` as the dynamic state image once this phase executes.

</decisions>

<canonical_refs>
## Canonical References

- `.planning/ROADMAP.md` — Phase 06 goal, requirements, and dependency on Phase 05.
- `.planning/REQUIREMENTS.md` — GARD-01 through GARD-05.
- `.planning/phases/04-weekly-task-templates-and-activity-cycles/04-CONTEXT.md` — active task template semantics and Sunday-Saturday cadence.
- `.planning/phases/05-*` — Phase 05 completion/approval/progress contracts once planned/executed.
- `src/app/family/dashboard/page.tsx` — current static garden dashboard implementation.
- `src/lib/db/tasks/queries.ts` — current active task query used by the dashboard.

</canonical_refs>

<asset_context>
## User-Provided Visual Direction

The user generated isometric garden examples and plant growth-stage templates. Existing local reference path:

- `stitch_a_golden_woven_basket_filled_with_glowing_golden_light_and_ethereal_sparkles/set_of_5_growth_stages_for_a_stylized_3d_isometric_oak_tree_for_a_children_s/screen.png`

Implementation should convert usable assets into separate transparent files under `public/`, for example:

- `public/garden/base-empty.png`
- `public/garden/plants/oak/stage-0.png`
- `public/garden/plants/oak/stage-1.png`
- `public/garden/plants/oak/stage-2.png`
- `public/garden/plants/oak/stage-3.png`
- `public/garden/plants/oak/stage-4.png`

</asset_context>

<deferred>
## Deferred Ideas

- Child-selected plant species and cosmetic customization.
- Drag-and-drop garden editing.
- Procedural generation or server-side image compositing.
- Animated growth transitions beyond subtle frontend transitions.

</deferred>

---

*Phase: 06-Dynamic Stewardship Garden*
*Context gathered: 2026-06-08*
