---
phase: 13-editar-filho-bot-o-editar-na-lista-de-filhos-do-parent-panel
reviewed: 2026-07-03T00:00:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - src/lib/families/child-profiles.ts
  - src/app/family/children/actions.ts
  - tests/integration/family-child-profiles.test.ts
  - src/app/family/children/[childId]/edit/EditChildForm.tsx
  - src/app/family/children/[childId]/edit/page.tsx
  - src/app/family/children/page.tsx
findings:
  critical: 0
  warning: 4
  info: 2
  total: 6
status: issues_found
---

# Phase 13: Code Review Report

**Reviewed:** 2026-07-03T00:00:00Z
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

Reviewed the "editar filho" feature: an SSR edit page (`/family/children/[childId]/edit`), a new client form (`EditChildForm.tsx`), a new `updateChildAction` server action, and the extended `updateChildProfile` backend function (age support added).

The core authorization boundary explicitly called out for this review — cross-family `childId` ownership and inactive-profile mutation bypass — is implemented correctly. `updateChildProfile` derives `familyId` from the caller's own guardian membership row (never trusts a client-supplied `familyId`), joins it against `childProfiles.id = childProfileId AND childProfiles.familyId = familyId`, and separately re-checks `active` inside the same transaction before allowing any mutation. The SSR edit page performs the equivalent read-side check and redirects away for cross-family or inactive/nonexistent children before rendering the form. I could not construct a bypass of either guard from the reviewed code.

However, I found real defects that should be fixed before shipping:

1. The most significant is that the integration test file for this exact functionality (`family-child-profiles.test.ts`) is a facade — every test body only asserts `expect(fn).toBeDefined()` and never actually invokes `updateChildProfile`/`createChildProfile`/`deactivateChildProfile` against the wired-up Postgres testcontainer, despite the harness (`beforeAll`/`migrate`) being fully set up to do real assertions. This means the exact behaviors this review was asked to focus on — cross-family guard, inactive-profile guard, ageYears range validation — have zero automated coverage, only my manual trace.
2. `updateChildProfile` writes a misleading audit "change" entry for `ageYears`/`avatarPreset`/`accentColor` on every save, even when the submitted value is identical to the existing value, because the change-tracking pushes to `changes[]` unconditionally on `!== undefined` rather than comparing against `existing`. Since the edit form always submits all three fields, this means every single "save" (even a no-op re-submit) produces a spurious `child_profile.updated` audit event claiming e.g. `age: 8 → 8`.
3. `ageYears` parsing via `parseInt(ageYearsRaw, 10)` silently accepts malformed/truncated input (`"12abc"` → `12`, `"12.9"` → `12`) instead of rejecting it, in both `addChildAction` and the new `updateChildAction`.
4. The edit page's DB lookup by `childId` route param is not wrapped in error handling; a non-UUID `childId` in the URL causes an unhandled Postgres type-cast exception instead of a graceful redirect back to `/family/children`.

None of these rise to Critical/BLOCKER — the authorization-critical paths are sound — but items 1 and 2 materially affect the trustworthiness of exactly the controls (access control, audit integrity) that this phase claims to deliver, so I'm flagging them as Warnings.

## Warnings

### WR-01: Integration tests for updateChildProfile never execute the function under test

**File:** `tests/integration/family-child-profiles.test.ts:116-152`
**Issue:** All "Guardian management (FAM-03)" tests — including the ones added for this phase ("should allow guardian to update child age in years", "should validate ageYears using the same 0-120 integer range constraint", "should include the age change in the audit summary when ageYears is updated") — only assert `expect(updateChildProfile).toBeDefined()`. They never call `updateChildProfile(...)`, never seed a family/guardian/child in the testcontainer DB, and never assert on the returned profile, thrown errors, or audit rows. The same is true for `createChildProfile` and `deactivateChildProfile`. The `beforeAll` hook stands up a real Postgres container and runs migrations, so the harness is ready — it's just unused. This leaves the cross-family ownership guard, the inactive-profile guard, and the ageYears 0-120 validation (all explicitly in scope for this review) without any automated regression coverage; a future refactor could silently break any of them and CI would stay green.
**Fix:**
```ts
it('should reject updating a child profile that belongs to a different family', async () => {
  const familyA = await insertFamily(db)
  const familyB = await insertFamily(db)
  const guardianA = await insertGuardian(db, familyA.id)
  const childInFamilyB = await insertChild(db, familyB.id)

  await expect(
    updateChildProfile({
      childProfileId: childInFamilyB.id,
      familyId: familyA.id,
      guardianIdentityId: guardianA.identityId,
      displayName: 'Hacked Name',
    }),
  ).rejects.toThrow('Child profile not found or not in this family')
})

it('should reject updating a deactivated child profile', async () => {
  const family = await insertFamily(db)
  const guardian = await insertGuardian(db, family.id)
  const child = await insertChild(db, family.id, { active: false })

  await expect(
    updateChildProfile({
      childProfileId: child.id,
      familyId: family.id,
      guardianIdentityId: guardian.identityId,
      ageYears: 10,
    }),
  ).rejects.toThrow('Cannot update a deactivated child profile')
})

it('should reject ageYears outside 0-120 on update', async () => {
  const family = await insertFamily(db)
  const guardian = await insertGuardian(db, family.id)
  const child = await insertChild(db, family.id)

  await expect(
    updateChildProfile({
      childProfileId: child.id,
      familyId: family.id,
      guardianIdentityId: guardian.identityId,
      ageYears: 121,
    }),
  ).rejects.toThrow(/0 and 120/)
})
```

### WR-02: updateChildProfile records spurious audit "changes" for unchanged fields

**File:** `src/lib/families/child-profiles.ts:233-244`
**Issue:** `ageYears`, `avatarPreset`, and `accentColor` are added to `updates` and pushed into the `changes[]` audit summary whenever `input.X !== undefined`, without comparing against `existing.X`. `displayName` is the only field that compares (implicitly, since a falsy/unchanged-but-identical trimmed name still gets pushed too — see note below). Because `EditChildForm` unconditionally submits `ageYears`, `avatarPreset`, and `accentColor` on every save (they are not optional in the form), simply opening the edit page and clicking "Salvar alterações" without changing anything produces a `child_profile.updated` audit event with a summary like `age: 8 → 8; avatar: "oak-sprout" → "oak-sprout"; accent: "moss" → "moss"`. This pollutes the parent-facing audit timeline (FAM-07, D-17/D-18 — the audit trail is meant to be a trustworthy, sanitized record of real changes) with no-op entries, and makes genuine changes harder to spot in the timeline.
**Fix:**
```ts
if (input.displayName !== undefined && input.displayName.trim() && input.displayName.trim() !== existing.displayName) {
  updates.displayName = input.displayName.trim()
  changes.push(`display_name: "${existing.displayName}" → "${input.displayName.trim()}"`)
}
if (input.ageYears !== undefined && input.ageYears !== existing.ageYears) {
  updates.ageYears = input.ageYears
  changes.push(`age: ${existing.ageYears} → ${input.ageYears}`)
}
if (input.avatarPreset !== undefined && input.avatarPreset !== existing.avatarPreset) {
  updates.avatarPreset = input.avatarPreset
  changes.push(`avatar: "${existing.avatarPreset}" → "${input.avatarPreset}"`)
}
if (input.accentColor !== undefined && input.accentColor !== existing.accentColor) {
  updates.accentColor = input.accentColor
  changes.push(`accent: "${existing.accentColor}" → "${input.accentColor}"`)
}
```
Note this also fixes a secondary issue: currently, if `updates` ends up empty (nothing actually changed) the function returns early at line 250-252 without writing an audit event — but only by accident, because `pin` is never submitted by this form. Once `ageYears`/`avatarPreset`/`accentColor` comparisons are fixed, the early-return path will correctly trigger for true no-op saves.

### WR-03: ageYears input accepts and silently truncates malformed strings

**File:** `src/app/family/children/actions.ts:124-127` (also present in `addChildAction:54-57`)
**Issue:** `parseInt(ageYearsRaw, 10)` is lenient: `parseInt('12abc', 10)` returns `12` and `parseInt('12.9', 10)` returns `12`, both passing the subsequent `isNaN(ageYears)` check. A malformed or non-integer submission (e.g. tampered `ageYears` form field, or a browser that doesn't enforce `type="number"` semantics) is silently coerced into a plausible-looking integer instead of being rejected with a validation error, even though `updateChildProfile`'s own `Number.isInteger` check would catch a true non-integer `Number` — it never gets the chance because `parseInt` already truncated it.
**Fix:**
```ts
const ageYears = Number(ageYearsRaw)
if (!Number.isInteger(ageYears) || ageYearsRaw.trim() !== String(ageYears)) {
  return { error: 'Idade inválida.' }
}
```
Or at minimum, validate the raw string matches `/^\d+$/` before calling `parseInt`.

### WR-04: Unvalidated childId route param can throw an unhandled DB error

**File:** `src/app/family/children/[childId]/edit/page.tsx:42-58`
**Issue:** `childId` comes directly from the URL segment and is passed unvalidated into `eq(schema.childProfiles.id, childId)`. `child_profiles.id` is a `uuid` column; if `childId` is not a well-formed UUID (e.g. a guardian manually edits the URL, or a stale/garbled link is followed), Postgres raises an `invalid input syntax for type uuid` error that is not caught anywhere in this file, resulting in an unhandled exception rendered as a generic Next.js error page instead of the same graceful `redirect('/family/children')` used for the "not found" and "inactive" cases just a few lines later.
**Fix:**
```ts
import { validate as isUuid } from 'uuid' // or a lightweight regex check

const { childId } = await params
if (!isUuid(childId)) {
  redirect('/family/children')
}
```

## Info

### IN-01: Family-membership lookup ignores role/status, unlike the deeper backend guard

**File:** `src/app/family/children/[childId]/edit/page.tsx:34-38`, `src/app/family/children/actions.ts:33-37,106-110,164-168`
**Issue:** The route-layer `familyId` lookup (`.where(eq(schema.familyMemberships.identityId, kredsIdentityId)).limit(1)`) does not filter by `role = 'guardian'` or `status = 'active'`, and has no `orderBy`, so if an identity ever holds more than one `family_memberships` row (the schema's `unique_active_guardian` index is unique per `(familyId, identityId)`, not globally unique per `identityId` — nothing prevents a guardian from belonging to multiple families, and a child-role membership row for the same identity is also theoretically possible depending on future features), an arbitrary row is picked. This is a pre-existing pattern used identically across the whole `src/app` tree (dashboard, tasks, invitations, audit, etc.), not something introduced by this phase, and the deeper `updateChildProfile`/`deactivateChildProfile` functions do correctly re-verify `role = 'guardian' AND status = 'active'` before mutating, so it is not exploitable as a privilege escalation today. Flagging as Info since it's systemic and out of scope to fix here, but worth tracking centrally (e.g. a shared `resolveActiveGuardianFamily()` helper) rather than re-adding the same edit-page copy each time a new guardian route is built.
**Fix:** Consider extracting a shared `requireActiveGuardianFamily(kredsIdentityId)` helper that filters `role = 'guardian' AND status = 'active'` and use it consistently across `actions.ts`, `edit/page.tsx`, and `page.tsx` instead of the bare `identityId` lookup.

### IN-02: Duplicate ACCENT_CSS / AVATAR_EMOJI maps across components

**File:** `src/app/family/children/[childId]/edit/EditChildForm.tsx:20-37`, `src/app/family/children/page.tsx:17-24`
**Issue:** `ACCENT_CSS` (accent key → hex color) is duplicated verbatim between `page.tsx` and `EditChildForm.tsx`, and `AVATAR_EMOJI` is new to `EditChildForm.tsx` with no equivalent reuse point. Any future addition/change to the closed avatar/accent sets in `avatar-presets.ts` requires remembering to update every duplicated map, risking silent visual drift (e.g. a new accent color rendering with the `?? '#154212'` fallback instead of its real color).
**Fix:** Move `ACCENT_CSS` and `AVATAR_EMOJI` into a shared module (e.g. `src/lib/families/avatar-presets.ts` or a new `avatar-display.ts`) and import from both components.

---

_Reviewed: 2026-07-03T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
