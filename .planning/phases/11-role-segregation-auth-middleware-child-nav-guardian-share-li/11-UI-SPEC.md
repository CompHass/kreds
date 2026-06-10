# Phase 11: Role Segregation — UI Spec

**Gathered:** 2026-06-09
**Status:** Ready for planning
**Design System:** Sylvan — established in phases 2–4, follow exactly

---

## Design System Reference (established — do not deviate)

All new screens follow the inline style system already in use. Pull values from existing pages, not from scratch.

| Token | Value |
|---|---|
| Background | `rgba(255,248,245,1)` — warm cream |
| Card | `rgba(255,255,255,0.64)` + `backdropFilter: blur(12px)` |
| Border | `rgba(45,90,39,0.16)` |
| Primary text | `#154212` |
| Soft text | `#72796e` |
| Primary green | `#2d5a27` / `#3b6934` |
| Gold | `#d2a501` |
| Border radius card | `24px` |
| Border radius pill | `9999px` |
| Shadow soft | `0 4px 16px rgba(45,90,39,0.06)` |

---

## Components to Build

### ChildBottomNav

Mirror of `src/components/BottomNav.tsx`. Same CSS, same pill active state. Tabs:

| Tab | Label | Icon | Route |
|---|---|---|---|
| jardim | Jardim | 🪴 | `/child/[childId]/dashboard` |
| tarefas | Tarefas | 📋 | `/child/[childId]/tasks` |
| sonhos | Sonhos | ✨ | `/child/[childId]/dreams` |
| saldo | Saldo | 🪙 | `/child/[childId]/balance` |

Active state: `background: rgba(202,236,125,0.55)`, `color: #4c6700`, pill shape, font-weight 700.

---

## Screens

### `/child/[childId]/dashboard`

**Layout:** Same header pattern as guardian dashboard — fixed top bar + main content + `ChildBottomNav`.

Top bar:
- Left: avatar initial circle (accentColor background) + child display name
- Right: Kreds badge (🪙 + balance amount, gold pill)

Hero section:
- Garden isometric image (`/garden-isometric.png`) in `4/3` aspect ratio card, same rounded corners as guardian dashboard
- Overlay text: "Meu Jardim" + task count message

Quick links section:
- "Minhas Tarefas" card → `/child/[childId]/tasks`
- "Meus Sonhos" card → `/child/[childId]/dreams`

---

### `/child/[childId]/tasks`

**Layout:** Standard page + `ChildBottomNav`.

Task list: one card per task template assigned to this child for current cycle.
Each card shows: task title, Kreds value (🪙), completion toggle button.

Toggle button states:
- Pending: outlined button "Marcar como feita" (green border)
- Completed: filled green pill "✓ Feita" + "Desmarcar" link

Empty state: "Nenhuma tarefa ativa esta semana." + garden icon.

---

### `/child/[childId]/dreams`

**Layout:** Standard page + `ChildBottomNav`.

List of wishlist goals + "Novo sonho" button.  
Each goal card: title, progress bar (`allocatedAmount / targetAmount`), Kreds badge.
Reuse GoalCard pattern from `/(app)/child/[childId]/balance/GoalCard.tsx`.

---

### `/child/[childId]/balance`

**Layout:** Standard page + `ChildBottomNav`.

Shows: available balance header + ledger history list.  
Same layout as existing `/(app)/child/[childId]/balance/page.tsx` but with `ChildBottomNav`.

---

### `/child/[childId]/donations`

**Layout:** Standard page + `ChildBottomNav`.

List of pending/approved donations + "Doe Kreds" form (target label + amount).  
Simple card list. Approved shown with ✓ badge.

---

### Guardian: Share Link on Child Card (`/family/children`)

Each child card in the list gets a "Compartilhar acesso" button:
- Icon: 🔗
- Style: outlined pill, same as existing action buttons
- On click: `navigator.clipboard.writeText(url)` → button shows "Copiado!" for 2s then reverts
- Below button: small grey URL text `appUrl/family/access/familyId` (truncated if long)

---

## Interaction Notes

- Copy-to-clipboard uses `navigator.clipboard.writeText`. Must be wrapped in a `'use client'` component since it's a browser API.
- Task toggle: optimistic UI update → POST to API → revert on error.
- Child session check: every child page calls `requireChildSession()` and also checks `session.childProfileId === params.childId`. If mismatch → redirect to child home.

---

## What NOT to build in this phase

- QR code
- Parent approval UI for task completions (Phase 5)
- Donations approval for guardian (Phase 8)
- Garden growth tied to task completion (Phase 6)
