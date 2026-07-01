---
phase: 07-guardian-profile
plan: 01
subsystem: ui
tags: [react, next-auth, drawer, slide-animation, testing-library, vitest]

# Dependency graph
requires:
  - phase: 05-parent-panel
    provides: ParentPanelView pattern e componentes parent existentes
  - phase: 06-api-integration
    provides: signOut de next-auth/react em uso no projeto
provides:
  - GuardianProfileDrawer: drawer lateral read-only com nome + email + botão logout
  - Suite de teste Vitest (4 casos) cobrindo conteúdo, logout, backdrop, estado slide
affects:
  - 07-02-PLAN (conecta GuardianProfileDrawer ao ParentPanelView e wires state)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CSS translateX(100%)/translateX(0) + cubic-bezier para slide drawer da direita"
    - "vi.hoisted() para resolver problema de hoisting em vi.mock com variáveis externas"
    - "Backdrop aria-hidden + onClick pattern para fechar drawer ao clicar fora"
    - "autoFocus no botão principal do drawer para acessibilidade (Pitfall 5)"

key-files:
  created:
    - src/components/parent/guardian-profile-drawer.tsx
    - tests/unit/guardian-profile-drawer.test.tsx
  modified: []

key-decisions:
  - "vi.hoisted() usado no mock de signOut — vi.mock hoist para topo mas variáveis declaradas após são undefined (TDZ)"
  - "Componente recebe guardianName + guardianEmail via props (não useSession) — padrão SSR→props do projeto"
  - "signOut({ redirectTo: '/login' }) — parâmetro v5 (não callbackUrl de v4)"
  - "autoFocus no botão Sair para foco acessível ao abrir drawer (Pitfall 5)"

patterns-established:
  - "GuardianProfileDrawer: backdrop zIndex:40 + painel zIndex:50 — padrão consistente com CelebrationOverlay"

requirements-completed: []

# Metrics
duration: 2min
completed: 2026-07-01
---

# Phase 7 Plan 01: Guardian Profile Drawer Summary

**GuardianProfileDrawer Client Component com slide CSS translateX + suite Vitest de 4 casos (conteúdo, logout, backdrop close, estado open/close)**

## Performance

- **Duration:** 2min
- **Started:** 2026-07-01T15:03:43Z
- **Completed:** 2026-07-01T15:05:43Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Suite RED criada (`tests/unit/guardian-profile-drawer.test.tsx`) com 4 casos de teste cobrindo comportamento completo do drawer
- Componente `GuardianProfileDrawer` implementado como Client Component com slide CSS `translateX` + backdrop overlay
- Botão "Sair" chama `signOut({ redirectTo: '/login' })` do next-auth/react com `autoFocus` para acessibilidade
- Todos os 4 testes passam (GREEN); build compila com sucesso

## Task Commits

Cada task foi commitada atomicamente:

1. **Task 1: Suite RED do GuardianProfileDrawer** - `0a8e890` (test)
2. **Task 2: Componente GuardianProfileDrawer (GREEN)** - `00f8505` (feat)

## Files Created/Modified

- `src/components/parent/guardian-profile-drawer.tsx` — Client Component GuardianProfileDrawer com interface GuardianProfileDrawerProps, slide CSS, backdrop, avatar inicial, botão logout
- `tests/unit/guardian-profile-drawer.test.tsx` — Suite Vitest 4 casos (D-04/D-05 conteúdo, D-06/D-07 logout, backdrop click, D-01/D-02 translateX state)

## Decisions Made

- `vi.hoisted()` usado para declarar `mockSignOut` antes do hoisting de `vi.mock()` — Vitest eleva chamadas `vi.mock` para o topo do arquivo, causando TDZ (Temporal Dead Zone) para variáveis `const` declaradas depois
- Componente recebe `guardianName` e `guardianEmail` via props (não `useSession()`) — padrão SSR→props do projeto já estabelecido na Fase 5
- `signOut({ redirectTo: '/login' })` com parâmetro v5 — confirmado correto para next-auth 5.0.0-beta.31

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrigido problema de hoisting de mock no arquivo de teste**
- **Found during:** Task 2 (verificação GREEN após criar componente)
- **Issue:** `const mockSignOut = vi.fn()` declarado após `vi.mock('next-auth/react', ...)` causou `ReferenceError: Cannot access 'mockSignOut' before initialization` — o Vitest eleva vi.mock para o topo do arquivo, mas variáveis `const` não são inicializadas antes do seu ponto de declaração (TDZ)
- **Fix:** Substituído `const mockSignOut = vi.fn()` por `const { mockSignOut } = vi.hoisted(() => ({ mockSignOut: vi.fn() }))` — `vi.hoisted()` é executado antes do hoisting do vi.mock
- **Files modified:** `tests/unit/guardian-profile-drawer.test.tsx`
- **Verification:** `pnpm test --run tests/unit/guardian-profile-drawer.test.tsx` passa com 4 testes green
- **Committed in:** `00f8505` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Fix necessário para o mock funcionar corretamente; sem scope creep; testes passam como esperado.

## Issues Encountered

- Build (`pnpm build`) termina com exit code 1 devido a variáveis de ambiente faltando (`DATABASE_URL`, `AUTH_SECRET`, `CHILD_SESSION_SECRET`) na coleta de dados da rota `/api/auth/[...nextauth]`. O compilador Next.js executa com sucesso (`✓ Compiled successfully`). Este erro de runtime é pré-existente no projeto e não está relacionado ao componente criado neste plano.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `GuardianProfileDrawer` está pronto para ser integrado ao `ParentPanelView` no Plano 02
- Interface `GuardianProfileDrawerProps` definida: `open`, `guardianName`, `guardianEmail`, `onClose`
- Plano 02 precisará: adicionar `profileOpen` state ao `ParentPanelView`, propagar `onOpenProfile` para `ParentSidebar` e `ParentTopbar`, e passar `guardianEmail` do SSR `page.tsx`

---
*Phase: 07-guardian-profile*
*Completed: 2026-07-01*

## Self-Check: PASSED

- FOUND: src/components/parent/guardian-profile-drawer.tsx
- FOUND: tests/unit/guardian-profile-drawer.test.tsx
- FOUND: .planning/phases/07-guardian-profile/07-01-SUMMARY.md
- FOUND: commit 0a8e890 (Task 1 — test)
- FOUND: commit 00f8505 (Task 2 — feat)
