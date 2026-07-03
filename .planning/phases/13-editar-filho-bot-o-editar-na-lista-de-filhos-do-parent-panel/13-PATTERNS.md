# Phase 13: Editar Filho - Pattern Map

**Mapped:** 2026-07-03
**Files analyzed:** 5
**Analogs found:** 5 / 5

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `src/lib/families/child-profiles.ts` (`updateChildProfile`) | service | CRUD | same file — `createChildProfile` (age validation) + `updateChildProfile` (existing update transaction) | exact |
| `src/app/family/children/actions.ts` (`updateChildAction`) | route (server action) | request-response | `addChildAction` in same file | exact |
| `src/app/family/children/[childId]/edit/page.tsx` | route (SSR page) | request-response | `src/app/family/children/page.tsx` (SSR auth+membership resolution) | role-match (SSR fetch), `set-pin/page.tsx` is client-only so not a fetch analog |
| `src/app/family/children/[childId]/edit/EditChildForm.tsx` | component (form) | request-response | `src/app/family/children/ChildrenForm.tsx` | exact (visual pattern), minus PIN/consent fields |
| `src/app/family/children/page.tsx` (add "Editar" link) | component (SSR page, list item) | CRUD (read) | same file — existing action-link buttons (PIN/Desativar block) | exact |

## Pattern Assignments

### `src/lib/families/child-profiles.ts` — extend `updateChildProfile` (service, CRUD)

**Analog:** same file, two internal patterns to combine.

**Age validation pattern** — copy from `createChildProfile` (lines 59-61):
```typescript
if (!Number.isInteger(input.ageYears) || input.ageYears < 0 || input.ageYears > 120) {
  throw new Error('Age in years must be a valid integer between 0 and 120 (D-09)')
}
```
Apply as an *optional* check inside `updateChildProfile` — only validate when `input.ageYears !== undefined`.

**Interface to extend** (lines 21-29):
```typescript
export interface UpdateChildProfileVisualsInput {
  childProfileId: string
  familyId: string
  guardianIdentityId: string
  displayName?: string
  avatarPreset?: string
  accentColor?: string
  pin?: string
}
```
Add `ageYears?: number`.

**Update/changes accumulation pattern to replicate** (lines 219-243, inside `updateChildProfile`):
```typescript
const updates: Record<string, unknown> = {}
const changes: string[] = []

if (input.displayName !== undefined && input.displayName.trim()) {
  updates.displayName = input.displayName.trim()
  changes.push(`display_name: "${existing.displayName}" → "${input.displayName.trim()}"`)
}
if (input.avatarPreset !== undefined) {
  updates.avatarPreset = input.avatarPreset
  changes.push(`avatar: "${existing.avatarPreset}" → "${input.avatarPreset}"`)
}
```
Add an analogous block for `ageYears`:
```typescript
if (input.ageYears !== undefined) {
  updates.ageYears = input.ageYears
  changes.push(`age: ${existing.ageYears} → ${input.ageYears}`)
}
```
Place the range-validation check for `ageYears` alongside the existing avatar/accent validation block (lines 208-217), before the `updates`/`changes` accumulation.

**Existing profile fetch + active check** (lines 180-206) — no change needed, already fetches `ageYears` in the `existing` select and already rejects inactive profiles (satisfies SPEC boundary "cannot edit inactive child").

**Audit event pattern** (lines 259-270) — no change needed; `changes` array is already interpolated into `summary`, so the new age change line flows through automatically.

---

### `src/app/family/children/actions.ts` — add `updateChildAction` (route/server-action, request-response)

**Analog:** `addChildAction` in the same file (lines 13-84).

**Imports to add:**
```typescript
import { updateChildProfile } from '@/lib/families/child-profiles'
```
(add to the existing `createChildProfile, deactivateChildAction` import line 6, or a new import line)

**Auth + membership resolution pattern** (lines 17-39, identical in `addChildAction` and `deactivateChildAction` — copy verbatim):
```typescript
const session = await auth()

let identity
try {
  identity = requireAuthenticatedIdentity(session)
} catch {
  redirect('/api/auth/signin')
}

let kredsIdentityId: string
try {
  kredsIdentityId = await resolveKredsIdentityId(identity.zitadelSub)
} catch {
  redirect('/family/onboarding')
}

const [membership] = await db
  .select({ familyId: schema.familyMemberships.familyId })
  .from(schema.familyMemberships)
  .where(eq(schema.familyMemberships.identityId, kredsIdentityId))
  .limit(1)

if (!membership) redirect('/family/onboarding')
```

**FormData parsing + validation pattern** (lines 43-65, adapt field set — no `consentGiven`/`pin` for edit, add `childProfileId`):
```typescript
const displayName = formData.get('displayName')?.toString()?.trim()
const ageYearsRaw = formData.get('ageYears')?.toString()
const avatarPreset = formData.get('avatarPreset')?.toString()
const accentColor = formData.get('accentColor')?.toString()
const childProfileId = formData.get('childProfileId')?.toString()

if (!childProfileId || !displayName || !ageYearsRaw || !avatarPreset || !accentColor) {
  return { error: 'Todos os campos são obrigatórios.' }
}

const ageYears = parseInt(ageYearsRaw, 10)
if (isNaN(ageYears)) {
  return { error: 'Idade inválida.' }
}
```

**Service call + error handling + redirect pattern** (lines 67-84):
```typescript
try {
  await updateChildProfile({
    childProfileId,
    familyId: membership.familyId,
    guardianIdentityId: kredsIdentityId,
    displayName,
    ageYears,
    avatarPreset,
    accentColor,
  })
} catch (err) {
  console.error('[updateChildAction] error:', err)
  return { error: 'Não foi possível salvar as alterações. Tente novamente.' }
}

redirect('/family/children?success=1')
```
Note: SPEC says redirect to `/family/children` on success — reuse `addChildAction`'s exact redirect shape (`?success=1` is optional/discretionary per CONTEXT; the plain path also satisfies the acceptance criteria).

**Function signature** (matches `addChildAction` lines 13-16):
```typescript
export async function updateChildAction(
  _prevState: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
```

---

### `src/app/family/children/[childId]/edit/page.tsx` — new SSR edit page (route, request-response)

**Analog:** `src/app/family/children/page.tsx` (SSR auth + membership + data fetch pattern, lines 1-65).

**Imports pattern** (lines 1-12 of `page.tsx`):
```typescript
import { redirect } from 'next/navigation'
import { auth } from '../../../../../../auth'  // adjust relative depth for nested [childId]/edit
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuthenticatedIdentity, resolveKredsIdentityId } from '@/lib/auth/authorization'
import { AVATAR_PRESETS, ACCENT_COLORS, type AvatarPreset, type AccentColor } from '@/lib/families/avatar-presets'
import EditChildForm from './EditChildForm'
```

**Auth + membership resolution pattern** (copy lines 33-53 of `page.tsx` verbatim — same as actions.ts):
```typescript
const session = await auth()

let identity
try {
  identity = requireAuthenticatedIdentity(session)
} catch {
  redirect('/api/auth/signin')
}

let kredsIdentityId: string
try {
  kredsIdentityId = await resolveKredsIdentityId(identity.zitadelSub)
} catch {
  redirect('/family/onboarding')
}

const [membership] = await db
  .select({ familyId: schema.familyMemberships.familyId })
  .from(schema.familyMemberships)
  .where(eq(schema.familyMemberships.identityId, kredsIdentityId))
  .limit(1)

if (!membership) redirect('/family/onboarding')
```

**Child lookup + ownership/active guard** — new pattern needed (no direct existing analog does a single-child lookup by id + family + active in a page component). Compose from `updateChildProfile`'s existing-profile fetch (child-profiles.ts lines 180-206):
```typescript
const [child] = await db
  .select({
    id: schema.childProfiles.id,
    displayName: schema.childProfiles.displayName,
    ageYears: schema.childProfiles.ageYears,
    avatarPreset: schema.childProfiles.avatarPreset,
    accentColor: schema.childProfiles.accentColor,
    active: schema.childProfiles.active,
  })
  .from(schema.childProfiles)
  .where(
    and(
      eq(schema.childProfiles.id, childId),
      eq(schema.childProfiles.familyId, membership.familyId),
    ),
  )
  .limit(1)

if (!child || !child.active) {
  redirect('/family/children')
}
```
This satisfies SPEC requirement 3 (404/redirect for wrong family or inactive child) — redirect only, no data exposed, matching SPEC's "redireciona sem expor dados" wording.

**Route params access** — Next.js App Router dynamic segment `[childId]`; use the async `params` prop shape already established in `page.tsx`'s `searchParams` handling (lines 26-30, 57):
```typescript
export default async function EditChildPage({
  params,
}: {
  params: Promise<{ childId: string }>
}) {
  const { childId } = await params
  // ...
}
```

**Avatar/accent options mapping** (copy lines 66-71 of `page.tsx` verbatim):
```typescript
const avatarOptions = (Object.entries(AVATAR_PRESETS) as [AvatarPreset, string][]).map(
  ([key, label]) => ({ key, label }),
)
const accentOptions = (Object.entries(ACCENT_COLORS) as [AccentColor, string][]).map(
  ([key, label]) => ({ key, label }),
)
```

**Cancel link (D-02)** — style from existing header nav links in `page.tsx` (lines 123-137):
```typescript
<Link
  href="/family/children"
  style={{
    fontSize: '0.8125rem',
    color: 'var(--color-text-soft, #72796e)',
    textDecoration: 'none',
    padding: '8px 14px',
    borderRadius: '99px',
    border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
    fontWeight: 600,
  }}
>
  Cancelar
</Link>
```

**Card wrapper style** — copy the "Adicionar filho" card container (lines 432-439 of `page.tsx`) for the edit form's outer card.

---

### `src/app/family/children/[childId]/edit/EditChildForm.tsx` — new form component (component, request-response)

**Analog:** `src/app/family/children/ChildrenForm.tsx` (full file, 281 lines) — copy structure, drop PIN + consent fields per D-01.

**Imports pattern** (lines 1-4):
```typescript
'use client'

import { useActionState, useState } from 'react'
import { updateChildAction } from '../../actions'
```
(adjust relative import path — `actions.ts` lives at `src/app/family/children/actions.ts`, form lives at `src/app/family/children/[childId]/edit/EditChildForm.tsx`)

**Props shape** — extend `ChildrenFormProps` (lines 9-12) with initial values:
```typescript
interface EditChildFormProps {
  childProfileId: string
  initialDisplayName: string
  initialAgeYears: number
  initialAvatarPreset: string
  initialAccentColor: string
  avatarOptions: AvatarOption[]
  accentOptions: AccentOption[]
}
```

**Constants to copy verbatim** (lines 14-32): `AVATAR_EMOJI`, `ACCENT_CSS`, `labelStyle`, `inputStyle`.

**`useActionState` + error box pattern** (lines 55, 61-72) — same shape, bound to `updateChildAction`:
```typescript
const [state, formAction, isPending] = useActionState(updateChildAction, null)
```
```typescript
{state?.error && (
  <div role="alert" style={{
    padding: '12px 16px',
    borderRadius: '12px',
    background: 'rgba(220,38,38,0.08)',
    border: '1px solid rgba(220,38,38,0.24)',
    color: '#b91c1c',
    fontSize: '0.875rem',
  }}>
    {state.error}
  </div>
)}
```

**Hidden `childProfileId` field** — new, required for `updateChildAction` to identify the target:
```typescript
<input type="hidden" name="childProfileId" value={childProfileId} />
```

**Display name field, pre-filled** — adapt lines 75-87, add `defaultValue`:
```typescript
<input
  id="displayName"
  name="displayName"
  type="text"
  required
  defaultValue={initialDisplayName}
  minLength={1}
  disabled={isPending}
  style={{ ...inputStyle, opacity: isPending ? 0.6 : 1 }}
/>
```

**Age field, pre-filled** — adapt lines 90-106, add `defaultValue={initialAgeYears}`.

**Avatar grid picker, pre-selected** — adapt lines 128-188; initialize state with the existing value instead of empty string:
```typescript
const [selectedAvatar, setSelectedAvatar] = useState<string>(initialAvatarPreset)
```
Rest of the grid/button rendering copies verbatim (lines 132-188).

**Accent dot picker, pre-selected** — same approach, lines 191-230:
```typescript
const [selectedAccent, setSelectedAccent] = useState<string>(initialAccentColor)
```

**Fields to OMIT** (per D-01, out of scope): PIN input (lines 108-125), consent checkbox (lines 232-252).

**Submit button pattern** — adapt lines 255-277, change label per Claude's discretion (CONTEXT.md D-discretion: "Salvar alterações" vs "Atualizar"):
```typescript
<button
  type="submit"
  disabled={isPending || !selectedAvatar || !selectedAccent}
  style={{ /* same as ChildrenForm.tsx lines 258-274 */ }}
>
  {isPending ? 'Salvando...' : 'Salvar alterações'}
</button>
```

---

### `src/app/family/children/page.tsx` — add "Editar" link (component, list item)

**Analog:** existing action-link block for each active child card (lines 294-343, the "Ver saldo / PIN / Desativar" row).

**Link pattern to copy** (PIN link style, lines 310-324 — closest visual match, a `Link` not a `form`):
```typescript
<Link
  href={`/family/children/${child.id}/edit`}
  style={{
    fontSize: '0.75rem',
    color: 'var(--color-primary, #154212)',
    background: 'rgba(45,90,39,0.08)',
    border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
    borderRadius: '99px',
    padding: '4px 10px',
    textDecoration: 'none',
    fontWeight: 600,
  }}
>
  Editar
</Link>
```
Per CONTEXT D-02/discretion, insert this link in the same `<div style={{ display: 'flex', gap: '6px' }}>` row as "Ver saldo"/"PIN"/"Desativar" (lines 294-343) — exact position is Claude's discretion. Since `children` here is already `listActiveChildProfiles(familyId)` (line 56), no extra active-filter is needed — every rendered card is already an active child, satisfying SPEC requirement 4 automatically.

**No new imports needed** — `Link` from `next/link` already imported (line 2).

## Shared Patterns

### Auth + Family Membership Resolution
**Source:** `src/app/family/children/actions.ts` lines 17-39 (also duplicated in `src/app/family/children/page.tsx` lines 33-53)
**Apply to:** `updateChildAction`, new `edit/page.tsx`
```typescript
const session = await auth()
let identity
try {
  identity = requireAuthenticatedIdentity(session)
} catch {
  redirect('/api/auth/signin')
}
let kredsIdentityId: string
try {
  kredsIdentityId = await resolveKredsIdentityId(identity.zitadelSub)
} catch {
  redirect('/family/onboarding')
}
const [membership] = await db
  .select({ familyId: schema.familyMemberships.familyId })
  .from(schema.familyMemberships)
  .where(eq(schema.familyMemberships.identityId, kredsIdentityId))
  .limit(1)
if (!membership) redirect('/family/onboarding')
```

### Guardian-Scoped Update Transaction (service layer)
**Source:** `src/lib/families/child-profiles.ts` lines 162-273 (`updateChildProfile`)
**Apply to:** extension only — no new function needed, just add `ageYears` to existing transaction body (see Pattern Assignments above).

### Form Error Display (`useActionState` + alert box)
**Source:** `src/app/family/children/ChildrenForm.tsx` lines 55, 61-72
**Apply to:** `EditChildForm.tsx`

### Visual Pickers (avatar grid + accent dots)
**Source:** `src/app/family/children/ChildrenForm.tsx` lines 14-32 (constants), 127-230 (picker JSX)
**Apply to:** `EditChildForm.tsx` — identical rendering, only difference is `useState` initialized with existing values instead of `''`.

## No Analog Found

None — all 5 files have a strong existing analog in the codebase.

## Metadata

**Analog search scope:** `src/app/family/children/`, `src/lib/families/`
**Files scanned:** `child-profiles.ts`, `actions.ts`, `page.tsx`, `ChildrenForm.tsx`, `[childId]/set-pin/page.tsx`, `avatar-presets.ts`
**Pattern extraction date:** 2026-07-03
