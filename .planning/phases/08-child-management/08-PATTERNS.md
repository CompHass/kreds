# Phase 8: Child Management - Pattern Map

**Mapped:** 2026-07-01
**Files analyzed:** 15
**Analogs found:** 12 / 15

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|-----------------|----------------|
| `src/app/family/[familyId]/layout.tsx` | provider (layout) | request-response | `src/app/family/[familyId]/tasks/page.tsx` (auth-gate portion) | role-match |
| `src/app/family/[familyId]/tasks/page.tsx` (refactor) | route | request-response | itself (pre-refactor) | exact |
| `src/app/family/[familyId]/children/page.tsx` | route | CRUD (read) | `src/app/family/[familyId]/tasks/page.tsx` | exact |
| `src/app/actions/children.ts` (createChild, resetChildPin, revealChildPin, toggleChildActive) | service (Server Actions) | CRUD | `src/app/actions/tasks.ts` | exact |
| `src/app/api/family/[familyId]/children/route.ts` | route (Route Handler) | CRUD | `src/app/api/family/[familyId]/tasks/route.ts` | exact |
| `src/app/api/family/[familyId]/children/[childId]/route.ts` | route (Route Handler) | CRUD | `src/app/api/family/[familyId]/tasks/route.ts` (POST handler shape) | role-match |
| `src/components/parent/parent-sidebar.tsx` (modify) | component | event-driven | itself (pre-modification) | exact |
| `src/components/parent/children-panel-view.tsx` | component (client root) | CRUD | `src/components/parent/parent-panel-view.tsx` | exact |
| `src/components/parent/child-form-panel.tsx` | component | request-response | `src/components/parent/task-form-panel.tsx` | exact |
| `src/components/parent/child-card.tsx` | component | transform | `src/components/parent/parent-topbar.tsx` (avatar-initial pattern) | partial |
| `src/components/parent/child-pin-reset-panel.tsx` | component | request-response | `src/components/parent/task-form-panel.tsx` (panel shell) | role-match |
| `src/components/parent/confirm-deactivate-dialog.tsx` | component (modal) | event-driven | none (first modal in project) — use RESEARCH.md Pattern 3 | no analog |
| `src/lib/crypto/pin-cipher.ts` | utility | transform | `src/lib/families/child-pin.ts` | role-match |
| `src/lib/env.ts` (modify) | config | transform | itself (pre-modification) | exact |
| `drizzle/00XX_*.sql` migration (pin_encrypted column) | migration | batch | `src/lib/db/schema/index.ts` (`pinHash` nullable text column, same table) | exact |

## Pattern Assignments

### `src/app/family/[familyId]/layout.tsx` (provider, request-response)

**Analog:** `src/app/family/[familyId]/tasks/page.tsx` (auth-gate slice, lines 1-24)

**Imports pattern:**
```typescript
import { redirect } from 'next/navigation'
import { auth } from '../../../../auth'   // NOTE: one fewer '../' than tasks/page.tsx (layout.tsx is one level up)
```

**Auth gate pattern** (mirrors tasks/page.tsx lines 19-24):
```typescript
export default async function FamilyLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ familyId: string }>
}) {
  const { familyId } = await params   // CRITICAL: params is a Promise in Next.js 15+ (Pitfall 1 in tasks/page.tsx)
  const session = await auth()
  if (!session) redirect('/login')
  return <>{children}</>
}
```

**Resolved ambiguity (RESEARCH.md Open Question 1):** Per RESEARCH's own recommendation, `layout.tsx` should stay minimal — auth-gate only — and NOT literally instantiate `ParentSidebar`/`ParentTopbar` with shared state. Each page's own client view (`ParentPanelView`, `ChildrenPanelView`) imports and renders `ParentSidebar`+`ParentTopbar`+its own drawer, exactly as `ParentPanelView` does today (see below). This satisfies D-03 ("no duplicated *logic*") without violating D-04 (drawer must stay page-local) or hitting Pitfall 1 (cross-page state leakage from a persisted layout instance).

---

### `src/app/family/[familyId]/tasks/page.tsx` (refactor — route, request-response)

**Analog:** itself, pre-refactor (already read in full above)

**No change to query/data logic.** Only the wrapping changes: remove nothing from the page itself (it already delegates chrome to `ParentPanelView`), since the resolved layout approach (see above) means `layout.tsx` only adds the auth-gate — which the page already has redundantly. Either: (a) leave the page's own `auth()`/`redirect` call as defense-in-depth, or (b) remove it and rely solely on the shared layout. **Recommendation: keep the page's own auth check removed** once layout.tsx performs it, to avoid duplicate logic — but do not change the `ParentPanelView` invocation, its props, or the DB query shape at lines 28-48.

---

### `src/app/family/[familyId]/children/page.tsx` (route, CRUD)

**Analog:** `src/app/family/[familyId]/tasks/page.tsx` (full file, lines 1-75)

**Imports pattern** (lines 1-13):
```typescript
import { redirect } from 'next/navigation'
import { auth } from '../../../../../auth'
import { db } from '@/lib/db'
import { childProfiles, families } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { ChildrenPanelView } from '@/components/parent/children-panel-view'
```

**Core pattern — parallel queries + familyId scoping** (mirrors lines 28-48):
```typescript
const [children, familyResult] = await Promise.all([
  db
    .select()   // select all columns needed by ChildCard: displayName, ageYears, accentColor, active, pinHash IS NOT NULL check, pinEncrypted presence
    .from(childProfiles)
    .where(eq(childProfiles.familyId, familyId)),   // NOTE: no `active=true` filter — deactivated children must still show (D-14 toggle target)
  db
    .select({ name: families.name })
    .from(families)
    .where(eq(families.id, familyId)),
])
const familyName = familyResult[0]?.name ?? 'Família'
```

**Prop-passing convention** (mirrors lines 64-73 — avoid `children` as prop name, Pitfall 2):
```typescript
return (
  <ChildrenPanelView
    familyId={familyId}
    familyName={familyName}
    currentUserName={session.user?.name ?? ''}
    guardianEmail={session.user?.email ?? ''}
    initialChildren={children}   // NOT `children` — reserved React prop name (Pitfall 2, same as tasks/page.tsx line 70 comment)
  />
)
```

---

### `src/app/actions/children.ts` (service, CRUD)

**Analog:** `src/app/actions/tasks.ts` (full file, lines 1-133)

**Imports pattern** (lines 1-17):
```typescript
'use server'
import { revalidatePath } from 'next/cache'
import { auth } from '../../../auth'
import { db } from '@/lib/db'
import { childProfiles } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { hashPin, validatePinFormat } from '@/lib/families/child-pin'
import { encryptPin, decryptPin } from '@/lib/crypto/pin-cipher'
```

**Auth + validation pattern** (mirrors `createTask`, lines 23-50):
```typescript
export async function createChild(data: z.infer<typeof CreateChildSchema> & { familyId: string }) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  CreateChildSchema.parse(data)   // throws ZodError if invalid

  const [child] = await db
    .insert(childProfiles)
    .values({
      familyId: data.familyId,
      displayName: data.displayName,
      ageYears: data.ageYears,
      accentColor: data.accentColor,
      avatarPreset: 'initial',   // D-08: fixed value, NOT user-selectable
    })
    .returning()

  revalidatePath(`/family/${data.familyId}/children`)
  return child   // real DB row with UUID — same "Pitfall 6" concern as createTask
}
```

**familyId-scoped update pattern** (mirrors `updateTask`, lines 55-80, and `toggleTaskActive`, lines 85-104):
```typescript
export async function toggleChildActive(childId: string, familyId: string, active: boolean): Promise<void> {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  await db
    .update(childProfiles)
    .set({
      active,
      deactivatedAt: active ? null : new Date(),   // D-14/D-15: only blocks NEW logins, no session revocation
      updatedAt: new Date(),
    })
    .where(and(eq(childProfiles.id, childId), eq(childProfiles.familyId, familyId)))   // T-06-15 familyId isolation — NEVER trust client-supplied familyId alone

  revalidatePath(`/family/${familyId}/children`)
}
```

**PIN reset — dual-write pattern (D-13), from RESEARCH.md Code Examples section:**
```typescript
export async function resetChildPin(childId: string, familyId: string, pin: string): Promise<void> {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  if (!validatePinFormat(pin)) throw new Error('Invalid PIN format')

  const pinHash = await hashPin(pin)
  const pinEncrypted = encryptPin(pin)   // D-13: written together, same UPDATE statement

  await db
    .update(childProfiles)
    .set({ pinHash, pinEncrypted, updatedAt: new Date() })
    .where(and(eq(childProfiles.id, childId), eq(childProfiles.familyId, familyId)))

  revalidatePath(`/family/${familyId}/children`)
}
```

**PIN reveal — read-only, server-side decrypt only:**
```typescript
export async function revealChildPin(childId: string, familyId: string): Promise<string | null> {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const [child] = await db
    .select({ pinEncrypted: childProfiles.pinEncrypted })
    .from(childProfiles)
    .where(and(eq(childProfiles.id, childId), eq(childProfiles.familyId, familyId)))
    .limit(1)

  if (!child?.pinEncrypted) return null   // Pitfall 6: pre-existing children have pinEncrypted=NULL — UI must show "PIN ainda não definido"
  return decryptPin(child.pinEncrypted)
}
```

**Error handling:** No try/catch inside the actions themselves — matches `tasks.ts` convention (errors propagate to caller, which the client component catches with fire-and-forget `.catch()`, see `parent-panel-view.tsx` `handleToggle`/`handleSave`).

---

### `src/app/api/family/[familyId]/children/route.ts` and `[childId]/route.ts` (route, CRUD)

**Analog:** `src/app/api/family/[familyId]/tasks/route.ts` (full file, lines 1-79)

**Imports + auth guard pattern** (lines 10-27):
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../../auth'
import { db } from '@/lib/db'
import { childProfiles } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { CreateChildSchema } from '@/types/child'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ familyId: string }> },
) {
  const { familyId } = await params   // CRITICAL: await params (Next.js 15+)
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const children = await db
    .select()
    .from(childProfiles)
    .where(eq(childProfiles.familyId, familyId))
  return NextResponse.json(children)
}
```

**Zod validation + familyId injection pattern** (mirrors POST, lines 42-78):
```typescript
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ familyId: string }> },
) {
  const { familyId } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const result = CreateChildSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Validation failed', details: result.error.flatten() }, { status: 400 })
  }

  // familyId isolation: inject from URL params, never trust body (T-06-06/T-06-07 pattern)
  const [created] = await db
    .insert(childProfiles)
    .values({ ...result.data, familyId, avatarPreset: 'initial' })
    .returning()

  return NextResponse.json(created, { status: 201 })
}
```

---

### `src/components/parent/parent-sidebar.tsx` (modify — component, event-driven)

**Analog:** itself, current state (lines 109-139, "Crianças" nav button)

**Current code (no href, static gray color) — lines 110-139:**
```typescript
<button
  aria-label="Crianças"
  style={{ width: 44, height: 44, borderRadius: 12, background: 'none', ... }}
>
  <svg ... stroke="#9AA092" ...>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" />
  </svg>
</button>
```

**Target pattern (D-05) — mirror "Tarefas" button's active styling** (lines 76-107 show the active variant: `background: '#E7EFE8'`, `stroke="#3E6B4F"`). The component needs a new prop for current route (e.g., `activeRoute: 'tasks' | 'children'`) and `useRouter`/`Link`-based navigation:
```typescript
'use client'
import { useRouter } from 'next/navigation'
// ...
interface ParentSidebarProps {
  guardianInitial: string
  onOpenProfile: () => void
  familyId: string
  activeRoute: 'tasks' | 'children'   // NEW prop — determines which icon gets active styling
}
// Inside component:
const router = useRouter()
// "Crianças" button becomes:
<button
  aria-label="Crianças"
  onClick={() => router.push(`/family/${familyId}/children`)}
  style={{
    width: 44, height: 44, borderRadius: 12,
    background: activeRoute === 'children' ? '#E7EFE8' : 'none',
    border: 'none', cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  }}
>
  <svg ... stroke={activeRoute === 'children' ? '#3E6B4F' : '#9AA092'} ...>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" />
  </svg>
</button>
```
Same treatment must be retrofitted onto the "Tarefas" button (currently hardcoded active) to make it conditional on `activeRoute === 'tasks'`.

---

### `src/components/parent/children-panel-view.tsx` (component, CRUD)

**Analog:** `src/components/parent/parent-panel-view.tsx` (full file, 330 lines)

**Imports pattern** (lines 1-17):
```typescript
'use client'
import { useState } from 'react'
import { ParentSidebar } from './parent-sidebar'
import { ParentTopbar } from './parent-topbar'
import { ChildCard } from './child-card'
import { ChildFormPanel, type ChildFormData, EMPTY_CHILD_FORM } from './child-form-panel'
import { ConfirmDeactivateDialog } from './confirm-deactivate-dialog'
import { GuardianProfileDrawer } from './guardian-profile-drawer'
import { createChild, resetChildPin, revealChildPin, toggleChildActive } from '@/app/actions/children'
```

**Root state shape** (mirrors lines 33-51 — `editingId` sentinel pattern, `profileOpen` local state):
```typescript
const [children, setChildren] = useState(initialChildren)
const [editingId, setEditingId] = useState<string | 'new' | null>(null)   // null=idle, 'new'=create, '<id>'=edit — same sentinel as ParentPanelView (Pitfall 6 there)
const [formData, setFormData] = useState<ChildFormData>(EMPTY_CHILD_FORM)
const [profileOpen, setProfileOpen] = useState(false)   // D-04: page-local, NOT shared with /tasks
const [confirmTargetId, setConfirmTargetId] = useState<string | null>(null)   // D-14: which child's deactivate confirm dialog is open
const [revealedPins, setRevealedPins] = useState<Record<string, string>>({})   // D-12: client-side cache of already-decrypted PINs, only after explicit reveal
const guardianInitial = currentUserName.charAt(0).toUpperCase()
```

**Optimistic mutation + fire-and-forget Server Action pattern** (mirrors `handleToggle`, lines 72-84):
```typescript
function handleConfirmDeactivate() {
  if (!confirmTargetId) return
  const child = children.find((c) => c.id === confirmTargetId)
  if (!child) return
  setChildren((prev) => prev.map((c) => (c.id === confirmTargetId ? { ...c, active: !c.active } : c)))   // optimistic
  toggleChildActive(confirmTargetId, familyId, !child.active).catch((err) => {
    console.error('toggleChildActive failed', err)
  })
  setConfirmTargetId(null)   // closes the dialog — Pitfall 3: fire-and-forget matches existing optimistic-UI convention
}
```

**JSX composition — sidebar/topbar/drawer rendered directly by this view** (mirrors lines 182-330; per the resolved layout ambiguity, `ParentSidebar`+`ParentTopbar`+`GuardianProfileDrawer` are imported and rendered here exactly as `ParentPanelView` does, NOT lifted into `layout.tsx`):
```typescript
return (
  <div style={{ minHeight: '100vh', background: 'var(--color-kreds-bg)', display: 'flex', flexDirection: 'row' }}>
    <ParentSidebar guardianInitial={guardianInitial} onOpenProfile={() => setProfileOpen(true)} familyId={familyId} activeRoute="children" />
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <ParentTopbar familyName={familyName} currentUserName={currentUserName} onOpenProfile={() => setProfileOpen(true)} />
      {/* content: list + form panel, same flex row layout as lines 207-316 */}
    </main>
    <GuardianProfileDrawer open={profileOpen} guardianName={currentUserName} guardianEmail={guardianEmail} onClose={() => setProfileOpen(false)} />
    <ConfirmDeactivateDialog
      open={confirmTargetId !== null}
      childName={children.find((c) => c.id === confirmTargetId)?.displayName ?? ''}
      willDeactivate={children.find((c) => c.id === confirmTargetId)?.active ?? true}
      onConfirm={handleConfirmDeactivate}
      onOpenChange={(open) => !open && setConfirmTargetId(null)}
    />
  </div>
)
```

---

### `src/components/parent/child-form-panel.tsx` (component, request-response)

**Analog:** `src/components/parent/task-form-panel.tsx` (full file, 365 lines)

**Contract shape pattern** (mirrors lines 15-43 — `FormData` interface + `EMPTY_FORM` + `xToFormData` mapper):
```typescript
export interface ChildFormData {
  displayName: string
  ageYears: number
  accentColor: string
}

export const EMPTY_CHILD_FORM: ChildFormData = {
  displayName: '',
  ageYears: 6,
  accentColor: '#3E6B4F',
}
```

**Container/panel shell — reuse exact 336px fixed-width, shadow, idle-state pattern** (lines 73-123):
```typescript
const containerStyle: React.CSSProperties = {
  width: 336, flexShrink: 0, padding: 20, borderRadius: 20,
  background: '#ffffff', boxShadow: '0 16px 36px -26px rgba(40,55,45,.5)',
  minHeight: 400, display: 'flex', flexDirection: 'column', gap: 16,
}
// idle mode: same centered placeholder pattern as lines 88-123
```

**Header + cancel-X + CTA button pattern** (lines 138-179, 292-314) — copy verbatim styling, swap labels to "Adicionar filho" per D-06 discretion.

**Deviation from analog (per RESEARCH.md Standard Stack + Alternatives table):** Unlike `TaskFormPanel`'s raw `useState`/`onChange` controlled-prop pattern, `ChildFormPanel` should use `react-hook-form` + `zodResolver` (RESEARCH.md Pattern 4, "first phase to actually wire it up"). This is a deliberate deviation flagged in RESEARCH.md — the planner should decide whether to keep parity with `TaskFormPanel`'s controlled pattern or adopt RHF per the stack's stated recommendation. Concrete RHF example from RESEARCH.md:
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const CreateChildSchema = z.object({
  displayName: z.string().min(1, 'Nome obrigatório'),
  ageYears: z.number().int().min(1).max(18),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida'),
})

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(CreateChildSchema),
  defaultValues: EMPTY_CHILD_FORM,
})
// <input type="color" {...register('accentColor')} />
```

**No delete button** — D-06/D-14 mean this form never shows a destructive delete action (deactivation is a separate flow via `ChildCard`, not this panel) — omit the `mode === 'edit'` delete-button block entirely (lines 316-361 of the analog do NOT apply).

---

### `src/components/parent/child-card.tsx` (component, transform)

**Analog (partial):** avatar-initial + accentColor rendering pattern from `parent-topbar.tsx` (lines 67-84) and `parent-sidebar.tsx` (lines 240-262)

**Avatar-by-initial pattern to reuse (D-08):**
```typescript
<div
  style={{
    width: 52, height: 52, borderRadius: '50%',   // Frame C spec: 52×52px
    background: `linear-gradient(135deg, ${child.accentColor} 0%, ${child.accentColor}CC 100%)`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 20, fontWeight: 700, color: '#ffffff', flexShrink: 0,
  }}
>
  {child.displayName.charAt(0).toUpperCase()}
</div>
```

**PIN masked/reveal display (D-12) — no direct analog; new pattern:**
```typescript
<span>{revealedPin ?? '••••'}</span>
<button onClick={onTogglePinReveal} disabled={!child.hasEncryptedPin}>
  {revealedPin ? 'Ocultar' : 'Mostrar'}
</button>
{!child.hasEncryptedPin && <span style={{ fontSize: 12, color: 'var(--color-kreds-muted)' }}>PIN ainda não definido</span>}
```
(Pitfall 6: `hasEncryptedPin` derived from `pinEncrypted !== null` on the server-fetched row — never attempt reveal for children with NULL `pinEncrypted`.)

---

### `src/components/parent/child-pin-reset-panel.tsx` (component, request-response)

**Analog:** `src/components/parent/task-form-panel.tsx` (panel shell only, lines 73-85, 133-180) + CAUTH-01's numeric keypad component (not read in this pass — planner/implementer should locate the child-login numeric keypad component referenced in D-10 and RESEARCH.md Architecture Diagram as `NumericKeypad`, adapting it non-fullscreen for this panel).

**No new excerpt beyond the panel shell above** — this file's core interaction (3×4 numeric keypad) should be extracted/reused from the existing child-login component per D-10; search `src/components/child/` or similar for the canonical `NumericKeypad` before writing a new one.

---

### `src/components/parent/confirm-deactivate-dialog.tsx` (component, event-driven)

**No analog in this codebase** — first modal/dialog. Use RESEARCH.md's Pattern 3 verbatim (already a complete, concrete example — see RESEARCH.md lines 258-314):
```typescript
'use client'
import { AlertDialog } from 'radix-ui'

interface ConfirmDeactivateDialogProps {
  open: boolean
  childName: string
  willDeactivate: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
}

export function ConfirmDeactivateDialog({ open, childName, willDeactivate, onConfirm, onOpenChange }: ConfirmDeactivateDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay style={{ position: 'fixed', inset: 0, background: 'rgba(39,55,44,.25)', zIndex: 60 }} />
        <AlertDialog.Content style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#ffffff', borderRadius: 16, padding: 24, width: 360, zIndex: 61 }}>
          <AlertDialog.Title style={{ fontSize: 18, fontWeight: 700 }}>
            {willDeactivate ? `Desativar ${childName}?` : `Reativar ${childName}?`}
          </AlertDialog.Title>
          <AlertDialog.Description style={{ fontSize: 14, color: 'var(--color-kreds-muted)' }}>
            {willDeactivate ? `${childName} não conseguirá fazer login até ser reativado.` : `${childName} poderá fazer login novamente.`}
          </AlertDialog.Description>
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <AlertDialog.Cancel asChild><button type="button">Cancelar</button></AlertDialog.Cancel>
            <AlertDialog.Action asChild><button type="button" onClick={onConfirm}>{willDeactivate ? 'Desativar' : 'Reativar'}</button></AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
```
Requires `npm install radix-ui` (unified package, v1.6.1) — not yet a project dependency.

---

### `src/lib/crypto/pin-cipher.ts` (utility, transform)

**Analog:** `src/lib/families/child-pin.ts` (full file, 17 lines) — for the `'server-only'` import convention and function-pair shape (`hashPin`/`verifyPin` → `encryptPin`/`decryptPin`).

**`server-only` guard pattern to replicate** (line 1):
```typescript
import 'server-only'
```

**Full implementation** (from RESEARCH.md Pattern 2, verified against Node's official crypto docs):
```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

function getKey(): Buffer {
  const raw = process.env.PIN_ENCRYPTION_KEY
  if (!raw) throw new Error('PIN_ENCRYPTION_KEY is not set')
  const key = Buffer.from(raw, 'base64')
  if (key.length !== 32) throw new Error('PIN_ENCRYPTION_KEY must decode to exactly 32 bytes (256 bits)')
  return key
}

export function encryptPin(pin: string): string {
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })
  const ciphertext = Buffer.concat([cipher.update(pin, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return [iv, authTag, ciphertext].map((b) => b.toString('base64')).join(':')
}

export function decryptPin(stored: string): string {
  const key = getKey()
  const [ivB64, tagB64, ctB64] = stored.split(':')
  const iv = Buffer.from(ivB64, 'base64')
  const authTag = Buffer.from(tagB64, 'base64')
  const ciphertext = Buffer.from(ctB64, 'base64')
  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })
  decipher.setAuthTag(authTag)
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return plaintext.toString('utf8')
}
```
**Never** reference `bcryptjs`/`pinHash` from this file — strictly isolated per D-11.

---

### `src/lib/env.ts` (modify — config, transform)

**Analog:** itself, current state (full 15-line file)

**Existing pattern to mirror** (`CHILD_SESSION_SECRET`, line 9):
```typescript
CHILD_SESSION_SECRET: z.string().min(32),
```

**Addition:**
```typescript
PIN_ENCRYPTION_KEY: z.string().refine(
  (v) => Buffer.from(v, 'base64').length === 32,
  'PIN_ENCRYPTION_KEY must be a base64-encoded 32-byte (256-bit) key',
),
```
Add as a new field inside the existing `envSchema` object (line 3-13), preserving `z.object({...})` + `envSchema.parse(process.env)` eager-parse-at-module-load pattern (Pitfall 4 in RESEARCH.md — must fail fast at boot, not first PIN request).

---

### `drizzle/00XX_*.sql` migration (migration, batch)

**Analog:** `pinHash` column definition, `src/lib/db/schema/index.ts` line 68 (same table, same nullability pattern)

**Schema addition:**
```typescript
// Add to childProfiles table definition (src/lib/db/schema/index.ts), after pinHash (line 68):
pinEncrypted: text('pin_encrypted'), // nullable — D-12; null until first "Redefinir PIN" post-migration
```

**Generate via existing workflow:**
```bash
npm run db:generate   # produces drizzle/0009_<name>.sql: ALTER TABLE "child_profiles" ADD COLUMN "pin_encrypted" text;
npm run db:migrate
```
**Critical constraint:** Column MUST be nullable, no `NOT NULL`, no default — the one existing seeded child ("Ana") has `pin_hash` set but no way to backfill `pin_encrypted` (Pitfall 6). Do not attempt any backfill migration.

## Shared Patterns

### Authentication / Session Guard
**Source:** `src/app/actions/tasks.ts` lines 26-27 (repeated at every action: `createTask`, `updateTask`, `toggleTaskActive`, `deactivateTask`)
**Apply to:** All new Server Actions in `src/app/actions/children.ts` and both Route Handlers.
```typescript
const session = await auth()
if (!session) throw new Error('Unauthorized')   // Server Actions
// or, in Route Handlers:
if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```

### Family Isolation (familyId scoping)
**Source:** `src/app/actions/tasks.ts` lines 67-71, 97-101, 124-128 (`and(eq(id, X), eq(familyId, Y))` on every mutation's `.where()`)
**Apply to:** Every children Server Action/Route Handler mutation — never trust a client-supplied `familyId`, always scope by both `id` and `familyId` together.
```typescript
.where(and(eq(childProfiles.id, childId), eq(childProfiles.familyId, familyId)))
```

### revalidatePath After Mutation
**Source:** `src/app/actions/tasks.ts` lines 47, 77, 103, 131 — always called with the concrete path (not a pattern/glob) AFTER the DB write completes.
**Apply to:** All children Server Actions.
```typescript
revalidatePath(`/family/${familyId}/children`)
```

### Optimistic UI + Fire-and-Forget Server Action
**Source:** `src/components/parent/parent-panel-view.tsx` lines 72-84 (`handleToggle`)
**Apply to:** `handleConfirmDeactivate`, any other instant-feeling mutation in `ChildrenPanelView`.
```typescript
setChildren((prev) => prev.map((c) => (c.id === targetId ? { ...c, active: !c.active } : c)))   // optimistic first
toggleChildActive(targetId, familyId, !currentActive).catch((err) => console.error('toggleChildActive failed', err))   // fire-and-forget
```

### editingId Sentinel Pattern (no separate isCreating boolean)
**Source:** `src/components/parent/parent-panel-view.tsx` lines 44-58 (comment explicitly calls out the anti-pattern to avoid)
**Apply to:** `ChildrenPanelView`'s form-open state — `null=idle`, `'new'=create`, `'<id>'=edit`, with `formMode` derived at render time, never stored separately.

### Server-Only Guard on Sensitive Modules
**Source:** `src/lib/families/child-pin.ts` line 1, `src/lib/auth/child-guard.ts` line 1
**Apply to:** `src/lib/crypto/pin-cipher.ts` — must start with `import 'server-only'` to prevent any accidental client bundle inclusion of the encryption key path.

### Avatar-by-Initial + accentColor
**Source:** `src/components/parent/parent-topbar.tsx` lines 67-84, `src/components/parent/parent-sidebar.tsx` lines 240-262
**Apply to:** `ChildCard`'s avatar rendering (D-08 — no avatar presets, initial + accentColor only).

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/components/parent/confirm-deactivate-dialog.tsx` | component (modal) | event-driven | First Radix Dialog/AlertDialog in the project — no existing modal to copy from. Use RESEARCH.md Pattern 3 (Radix AlertDialog example) directly. |
| `src/lib/crypto/pin-cipher.ts` (encryption logic itself) | utility | transform | First reversible-encryption utility in the project (only `bcrypt` one-way hashing exists as `child-pin.ts`). Analog covers file *shape*/`server-only` convention only — the AES-GCM logic itself must come from RESEARCH.md Pattern 2 / Node's official `crypto` docs, not from any existing file. |

## Metadata

**Analog search scope:** `src/app/family/`, `src/app/actions/`, `src/app/api/family/`, `src/components/parent/`, `src/lib/families/`, `src/lib/auth/`, `src/lib/db/schema/`, `src/types/`
**Files scanned:** parent-panel-view.tsx, task-form-panel.tsx, parent-sidebar.tsx, parent-topbar.tsx, guardian-profile-drawer.tsx, filter-chips.tsx (referenced not read in full), tasks/page.tsx, api/family/[familyId]/tasks/route.ts, actions/tasks.ts, child-auth.ts, child-guard.ts, child-pin.ts, env.ts, schema/index.ts, types/task.ts
**Pattern extraction date:** 2026-07-01
