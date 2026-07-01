# Phase 7: Guardian Profile - Pattern Map

**Mapped:** 2026-07-01
**Files analyzed:** 5
**Analogs found:** 5 / 5

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/components/parent/guardian-profile-drawer.tsx` | component | request-response | `src/components/garden/celebration-overlay.tsx` + `src/components/auth/gate-lock.tsx` | role-match (position:fixed overlay + translateX slide) |
| `src/components/parent/parent-panel-view.tsx` | component | request-response | self — existing state pattern for `editingId` | exact (add `profileOpen` boolean following same useState pattern) |
| `src/components/parent/parent-sidebar.tsx` | component | request-response | self — existing avatar div at line 235-252 | exact (replace static `P` with dynamic `guardianInitial` prop + onClick) |
| `src/components/parent/parent-topbar.tsx` | component | request-response | self — existing badge div at lines 38-77 | exact (add `onOpenProfile` prop + onClick to existing badge div) |
| `src/app/family/[familyId]/tasks/page.tsx` | route (Server Component) | request-response | self — existing `auth()` + prop pass pattern at lines 23-72 | exact (add `guardianEmail` prop to `ParentPanelView`) |

---

## Pattern Assignments

### `src/components/parent/guardian-profile-drawer.tsx` (NEW — component, request-response)

**Primary analog for slide:** `src/components/auth/gate-lock.tsx`
**Primary analog for fixed overlay:** `src/components/garden/celebration-overlay.tsx`

**`'use client'` directive + interface pattern** (gate-lock.tsx lines 1-5):
```typescript
'use client'

interface GateLockProps {
  open: boolean
}
```

**translateX slide pattern** (gate-lock.tsx lines 14-26):
```typescript
style={{
  transform: open ? 'translateX(0)' : 'translateX(101%)',
  transition: open ? 'transform 1s cubic-bezier(.76,0,.24,1)' : 'none',
}}
```
Note: For the profile drawer sliding from the RIGHT, use `translateX(100%)` when closed and `translateX(0)` when open. Adjust duration to `0.3s` (vs GateLock's 1s) for a lighter feel.

**position:fixed overlay with zIndex:50** (celebration-overlay.tsx lines 22-41):
```typescript
<div
  role="dialog"
  aria-modal="true"
  style={{
    position: 'fixed',
    inset: 0,
    zIndex: 50,
    background: 'rgba(244,241,232,.98)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    overflow: 'hidden',
  }}
>
```
Note: The backdrop for the drawer is a separate `<div>` with lower zIndex (40) that closes on click. The drawer panel itself sits at zIndex 50. Use `background: 'rgba(39, 55, 44, 0.25)'` for the backdrop (darker green tint consistent with project palette).

**Close button pattern** (celebration-overlay.tsx lines 104-121):
```typescript
<button
  onClick={onClose}
  style={{
    height: 52,
    borderRadius: 13,
    background: 'var(--color-kreds-primary)',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: 16,
    border: 'none',
    cursor: 'pointer',
    boxShadow: 'var(--shadow-cta)',
    marginTop: 8,
  }}
>
  Voltar ao jardim
</button>
```
Note: The logout button follows the same full-width CTA style. Text: "Sair". Import `signOut` from `'next-auth/react'`, call `signOut({ redirectTo: '/login' })`.

**Complete component interface:**
```typescript
'use client'
import { signOut } from 'next-auth/react'

interface GuardianProfileDrawerProps {
  open: boolean
  guardianName: string
  guardianEmail: string
  onClose: () => void
}
```

---

### `src/components/parent/parent-panel-view.tsx` (MODIFY — add profileOpen state)

**Analog:** self — `editingId` useState pattern (lines 39-43)

**Existing state pattern to copy** (parent-panel-view.tsx lines 9-16, 39-43):
```typescript
import { useState } from 'react'
import { ParentSidebar } from './parent-sidebar'
import { ParentTopbar } from './parent-topbar'
// ... other imports

// Add new import:
import { GuardianProfileDrawer } from './guardian-profile-drawer'

// Existing state pattern (copy for profileOpen):
const [editingId, setEditingId] = useState<string | 'new' | null>(null)

// New state (same pattern, simpler boolean):
const [profileOpen, setProfileOpen] = useState(false)
const guardianInitial = currentUserName.charAt(0).toUpperCase()
```

**Interface expansion** (parent-panel-view.tsx lines 18-29):
```typescript
interface ParentPanelViewProps {
  familyId: string
  familyName: string
  currentUserName: string
  guardianEmail: string   // NEW — passed from SSR page
  familyChildren: Array<{
    id: string
    displayName: string
    accentColor: string
    avatarPreset: string
  }>
  initialTasks: ParentTask[]
}
```

**Props-down pattern to sidebar and topbar** (parent-panel-view.tsx lines 185, 190-193):
```typescript
// Existing sidebar call (line 185):
<ParentSidebar />

// Modified:
<ParentSidebar
  guardianInitial={guardianInitial}
  onOpenProfile={() => setProfileOpen(true)}
/>

// Existing topbar call (lines 190-193):
<ParentTopbar
  familyName={familyName}
  currentUserName={currentUserName}
/>

// Modified:
<ParentTopbar
  familyName={familyName}
  currentUserName={currentUserName}
  onOpenProfile={() => setProfileOpen(true)}
/>
```

**Drawer placement in JSX root** — add as sibling to `<main>`, after closing `</main>` tag (line 306), before the outer wrapper closes (line 308). The drawer uses `position: fixed` so nesting inside `<main>` is safe but placing it at root level is cleaner:
```typescript
<GuardianProfileDrawer
  open={profileOpen}
  guardianName={currentUserName}
  guardianEmail={guardianEmail}
  onClose={() => setProfileOpen(false)}
/>
```

---

### `src/components/parent/parent-sidebar.tsx` (MODIFY — replace static avatar with dynamic initial + onClick)

**Analog:** self — existing avatar `<div>` at lines 234-252

**Existing static avatar to replace** (parent-sidebar.tsx lines 234-252):
```typescript
{/* Avatar 38px no rodapé */}
<div
  style={{
    marginTop: 'auto',
    width: 38,
    height: 38,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #5A8A66 0%, #3E6B4F 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 15,
    fontWeight: 700,
    color: '#ffffff',
    flexShrink: 0,
  }}
>
  P
</div>
```

**Replace with button using same visual style** — match the topbar avatar exactly (topbar lines 61-77):
```typescript
// Topbar avatar (exact style to replicate in sidebar button):
<div
  style={{
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #5A8A66 0%, #3E6B4F 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 700,
    color: '#ffffff',
    flexShrink: 0,
  }}
>
  {currentUserName.charAt(0).toUpperCase()}
</div>
```

**Interface addition** (parent-sidebar.tsx line 6 — component currently has no props):
```typescript
// Before (no props):
export function ParentSidebar() {

// After:
interface ParentSidebarProps {
  guardianInitial: string
  onOpenProfile: () => void
}

export function ParentSidebar({ guardianInitial, onOpenProfile }: ParentSidebarProps) {
```

**Nav button pattern** (parent-sidebar.tsx lines 70-83) — use same `<button>` element structure for the profile circle (not a `<div>`):
```typescript
<button
  aria-label="Tarefas"
  style={{
    width: 44,
    height: 44,
    borderRadius: 12,
    background: '#E7EFE8',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  }}
>
```

---

### `src/components/parent/parent-topbar.tsx` (MODIFY — make badge clickable)

**Analog:** self — existing badge div at lines 38-77

**Existing badge `<div>` to make interactive** (parent-topbar.tsx lines 38-77):
```typescript
{/* Badge do usuário logado */}
<div
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: '#ffffff',
    border: '1px solid #ECE7DB',
    borderRadius: 'var(--radius-pill)',
    padding: '5px 10px 5px 14px',
  }}
>
```

**Interface addition** (parent-topbar.tsx lines 5-8):
```typescript
// Before:
interface ParentTopbarProps {
  familyName: string
  currentUserName: string
}

// After:
interface ParentTopbarProps {
  familyName: string
  currentUserName: string
  onOpenProfile: () => void  // NEW
}
```

**Make clickable** — add `onClick`, `role`, `aria-label`, `tabIndex`, `onKeyDown`, and `cursor: 'pointer'` to the existing badge `<div>`:
```typescript
<div
  onClick={onOpenProfile}
  role="button"
  aria-label="Abrir perfil"
  tabIndex={0}
  onKeyDown={(e) => e.key === 'Enter' && onOpenProfile()}
  style={{
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: '#ffffff',
    border: '1px solid #ECE7DB',
    borderRadius: 'var(--radius-pill)',
    padding: '5px 10px 5px 14px',
  }}
>
```

---

### `src/app/family/[familyId]/tasks/page.tsx` (MODIFY — add guardianEmail prop)

**Analog:** self — existing `auth()` + prop-pass pattern (lines 23-72)

**Existing session usage** (tasks/page.tsx lines 23-24, 68):
```typescript
const session = await auth()
if (!session) redirect('/login')

// Line 68:
currentUserName={session.user?.name ?? ''}
```

**Add guardianEmail** — follow exact same nullish coalescing pattern:
```typescript
// After currentUserName prop, add:
guardianEmail={session.user?.email ?? ''}
```

Note: `session.user.email` is populated by next-auth from the OIDC `email` claim via Zitadel. The `auth.ts` callback (line 56) stores email in `kreds_identities` confirming it is available in `profile.email`. If the field is empty at runtime, check the `session()` callback in auth.ts — the `email` field may need to be explicitly propagated like `session.user.id` is.

---

## Shared Patterns

### CSS Variable Tokens
**Source:** `src/app/globals.css` (referenced throughout)
**Apply to:** `guardian-profile-drawer.tsx` for all colors and shadows
```typescript
// Use these tokens consistently:
background: 'var(--color-kreds-card)'      // drawer panel background
borderLeft: '1px solid var(--color-kreds-border)'
background: 'var(--color-kreds-primary)'   // logout button (#3E6B4F)
color: 'var(--color-kreds-muted)'          // secondary text (email)
boxShadow: 'var(--shadow-card)'            // drawer elevation
```

### `'use client'` Directive
**Source:** All parent components — gate-lock.tsx line 1, celebration-overlay.tsx line 1, parent-panel-view.tsx line 1
**Apply to:** `guardian-profile-drawer.tsx` — must be a Client Component because it calls `signOut` from `next-auth/react`

### Avatar Circle Visual (32px, gradient green, white initial)
**Source:** `src/components/parent/parent-topbar.tsx` lines 61-77
**Apply to:** `parent-sidebar.tsx` profile button (replace static `P` div). Use identical gradient and sizing for visual consistency between sidebar and topbar.
```typescript
// Exact visual to replicate (topbar lines 61-77):
width: 32,
height: 32,
borderRadius: '50%',
background: 'linear-gradient(135deg, #5A8A66 0%, #3E6B4F 100%)',
fontSize: 13,
fontWeight: 700,
color: '#ffffff',
```

### `role="dialog" aria-modal="true"` Pattern
**Source:** `src/components/garden/celebration-overlay.tsx` lines 29-30
**Apply to:** The drawer panel `<div>` in `guardian-profile-drawer.tsx`

### Backdrop onClick Close Pattern
**Source:** Research.md — `CelebrationOverlay` used as reference. Backdrop is a separate fixed div:
```typescript
<div
  aria-hidden="true"
  onClick={onClose}
  style={{
    position: 'fixed',
    inset: 0,
    background: 'rgba(39, 55, 44, 0.25)',
    opacity: open ? 1 : 0,
    pointerEvents: open ? 'auto' : 'none',
    transition: 'opacity 0.25s ease',
    zIndex: 40,   // below drawer (50) but above page content
  }}
/>
```

### signOut Import
**Source:** `auth.ts` line 8 exports `signOut` for server use. For the Client Component drawer, import from the React-specific path:
```typescript
import { signOut } from 'next-auth/react'
// Call with explicit redirectTo (next-auth v5 param name):
signOut({ redirectTo: '/login' })
```

---

## No Analog Found

None — all files have clear analogs within the existing codebase.

---

## Metadata

**Analog search scope:** `src/components/parent/`, `src/components/auth/`, `src/components/garden/`, `src/app/family/`, `auth.ts`
**Files scanned:** 7
**Pattern extraction date:** 2026-07-01
