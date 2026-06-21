---
phase: 02-authentication
plan: 04
subsystem: auth
tags: [child-pin, ui, animation, pin-screen, gate-lock, numeric-keypad, checkpoint]

# Dependency graph
requires:
  - 02-01 (child-pin.ts, child-session.ts)
  - 02-03 (verifyChildPin Server Action, /family/access/[familyId] page)
provides:
  - PinDot({ filled, error }) em src/components/auth/pin-dot.tsx
  - PinDots({ count, error }) em src/components/auth/pin-dots.tsx
  - NumericKeypad({ onDigit, onBackspace }) em src/components/auth/numeric-keypad.tsx
  - GateLock({ open }) em src/components/auth/gate-lock.tsx
  - PinScreen({ childId, familyId, displayName }) em src/components/auth/pin-screen.tsx
  - /child/[childId]/login page em src/app/(child)/child/[childId]/login/page.tsx
affects:
  - 02-05 (login do responsável — fluxo Guardian, rota /login)
  - Fluxo completo: ProfileCard (02-03) → /child/[childId]/login → verifyChildPin → /child/[childId]/garden

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "SVG brotinho inline em PinDot (não biblioteca externa — 02-UI-SPEC Registry Safety)"
    - "Animações via CSS var() — style={{ animation: 'var(--animate-kreds-shake)' }}"
    - "GateLock overlay absolute inset-0 com transform translateX(±101%) 1s cubic-bezier"
    - "PinScreen: async handleDigit — verificação Server Action ao completar 4 dígitos"
    - "Route group (child) em src/app/(child)/ — não altera URL canônica /child/[childId]/login"
    - "notFound() de next/navigation para childId inválido no Server Component"

key-files:
  created:
    - src/components/auth/pin-dot.tsx
    - src/components/auth/pin-dots.tsx
    - src/components/auth/numeric-keypad.tsx
    - src/components/auth/gate-lock.tsx
    - src/components/auth/pin-screen.tsx
    - src/app/(child)/child/[childId]/login/page.tsx
  modified: []

key-decisions:
  - "SVG brotinho inline no PinDot (não importado de arquivo externo) — compatível com registry safety e bundle"
  - "handleDigit como async function (não useEffect) — lógica mais linear e previsível para 4 dígitos"
  - "GateLock como overlay absoluto com pointer-events-none — não interfere com o teclado abaixo"
  - "Route group (child) organiza rotas da criança sem alterar URL (D-12 confirmado)"

patterns-established:
  - "Pattern: animação kredsShake aplicada via style={{ animation: error ? 'var(...)' : undefined }}"
  - "Pattern: GateLock overlay absolute inset-0 com dois painéis translateX(±101%)"
  - "Pattern: handleDigit async — chama Server Action direto no handler de evento"

requirements-completed: [CAUTH-01, CAUTH-02, CAUTH-03, CAUTH-05]

# Metrics
duration: 3min
completed: 2026-06-21
---

# Phase 02 Plan 04: Tela de PIN da Criança — Summary

**5 componentes visuais da tela de PIN (dots+brotinho, teclado 3×4, portão, orquestrador) + página SSR em /child/[childId]/login — checkpoint visual aguardando aprovação humana das animações CAUTH-01..05**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-06-21T13:11:24Z
- **Completed:** 2026-06-21T13:14:44Z (Tasks 1-2; Task 3 é checkpoint)
- **Tasks:** 2 de 3 concluídas (Task 3 = checkpoint humano)
- **Files created:** 6

## Accomplishments

- `pin-dot.tsx`: PinDot 16px circle com SVG brotinho inline e kredsSprout ao ser preenchido (CAUTH-05); estado error com bg #D8916B/borda #C06B4A
- `pin-dots.tsx`: Container 4 dots com kredsShake ao error (CAUTH-02), role="status" aria-label acessível
- `numeric-keypad.tsx`: Grid 3×4 com botões 64px circle bg #FBFAF5 shadow, célula * vazia, ⌫ SVG sem fundo aria-label="Apagar"
- `gate-lock.tsx`: Overlay absolute inset-0, painéis L/R translateX(±101%) transition 1s cubic-bezier(.76,0,.24,1) (CAUTH-03)
- `pin-screen.tsx`: Orquestrador — handleDigit async verifica 4 dígitos, chama verifyChildPin Server Action, gateOpen+redirect 1.1s no sucesso, shake+reset 950ms no erro SEM texto, link Trocar perfil (CAUTH-04), planta hero kredsBreath (CAUTH-01), saudação displayName real
- `page.tsx`: Server Component, await params Next.js 15, query Drizzle displayName+familyId, notFound() se childId inválido, route group (child) mantém URL /child/[childId]/login

## Task Commits

1. **Task 1: PinDot + PinDots + NumericKeypad + GateLock** — `e0ac1a4`
2. **Task 2: PinScreen + /child/[childId]/login page** — `f0aea5d`
3. **Task 3: Checkpoint visual** — AGUARDANDO APROVAÇÃO HUMANA

## Files Created/Modified

- `src/components/auth/pin-dot.tsx` — dot 16px, SVG brotinho inline, kredsSprout, estados filled/error
- `src/components/auth/pin-dots.tsx` — 4 dots, kredsShake no container, role=status aria-label
- `src/components/auth/numeric-keypad.tsx` — grid 3×4, 64px circle, célula * vazia, ⌫ SVG
- `src/components/auth/gate-lock.tsx` — overlay absoluto dois painéis translateX(±101%) 1s cubic-bezier
- `src/components/auth/pin-screen.tsx` — orquestrador client: state pin/error/gate, verifyChildPin, kredsBreath, layout completo
- `src/app/(child)/child/[childId]/login/page.tsx` — Server Component SSR, await params, Drizzle select, PinScreen

## Decisions Made

1. **SVG brotinho inline:** O brotinho do PinDot é um SVG inline simples (caule + folhas + ponta) — evita dependência externa e mantém o bundle limpo (alinhado com registry safety).

2. **handleDigit como async function (não useEffect):** A verificação acontece no handler de evento ao completar 4 dígitos, não em um useEffect — lógica mais linear, sem race conditions com re-renders.

3. **GateLock pointer-events-none:** O overlay do portão não bloqueia eventos do teclado; apenas oculta visualmente quando fechado.

4. **Route group (child):** Confirmado D-12 — o grupo `(child)` não altera a URL canônica `/child/[childId]/login`.

## Deviations from Plan

### Auto-fixed Issues

Nenhum — plano executado exatamente conforme especificado.

## Threat Surface Scan

Nenhuma nova superfície de ameaça introduzida além das documentadas:

- `T-02-PIN-CLIENT`: Mitigado — PinScreen apenas coleta e envia ao Server Action; PIN nunca é comparado no cliente
- `T-02-PIN-FEEDBACK`: Mitigado — erro é shake silencioso sem texto (CAUTH sem distinção de motivo na UI)
- `T-02-PIN-SPAM`: Mitigado — PinScreen bloqueia input durante error/gateOpen (verificado via guards em handleDigit)

## Known Stubs

Nenhum — todos os componentes estão completamente implementados. A rota `/child/[childId]/garden` ainda não existe (Fase 3), portanto o redirect após o portão resultará em 404 — comportamento esperado e documentado no checkpoint (Task 3).

## Verification

- `pnpm tsc --noEmit` sem erros nos 6 arquivos criados (confirmado com grep nos caminhos dos arquivos)
- 38/38 testes unitários dos módulos auth (child-auth-endpoint, child-pin-management, child-session-guard, middleware) passando sem regressão
- Task 3: checkpoint humano pendente — animações CAUTH-01..05 são manual-only (02-VALIDATION.md)

## Self-Check: PASSED

- FOUND: src/components/auth/pin-dot.tsx
- FOUND: src/components/auth/pin-dots.tsx
- FOUND: src/components/auth/numeric-keypad.tsx
- FOUND: src/components/auth/gate-lock.tsx
- FOUND: src/components/auth/pin-screen.tsx
- FOUND: src/app/(child)/child/[childId]/login/page.tsx
- Commit e0ac1a4 verificado (4 componentes visuais)
- Commit f0aea5d verificado (PinScreen + login page)
- TypeScript sem erros nos arquivos criados
- 38/38 testes unitários auth passando

---
*Phase: 02-authentication*
*Completed: 2026-06-21 (Tasks 1-2 — Task 3 checkpoint pendente)*
