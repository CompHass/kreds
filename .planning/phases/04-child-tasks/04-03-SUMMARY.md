---
phase: 04-child-tasks
plan: 03
subsystem: ui
tags: [tdd, components, ui, bottom-nav, accessibility, intersection-observer]
dependency_graph:
  requires:
    - 04-01 (mock global de IntersectionObserver em tests/setup.ts; teste RED bottom-nav.test.tsx)
  provides:
    - BottomNav (CTASK-05) — barra de navegação fixa 80px com 4 ícones e IntersectionObserver
  affects:
    - src/components/tasks/bottom-nav.tsx
    - tests/unit/bottom-nav.test.tsx (GREEN após este plano)
tech_stack:
  added: []
  patterns:
    - TDD GREEN phase — implementação satisfazendo contrato RED de 04-01
    - IntersectionObserver com Map<Element,Section>, threshold [0,0.1], cleanup disconnect()
    - 'use client' component sem props externas, useState interno para active section
    - SVG icons inline 24x24 strokeWidth 1.5 com stroke="currentColor" para herdar cor ativa/inativa
key_files:
  created:
    - src/components/tasks/bottom-nav.tsx
  modified: []
decisions:
  - "React importado explicitamente para tipagem React.ReactElement em Record<string,() => React.ReactElement> — namespace JSX não disponível no projeto sem import explícito"
  - "ICONS como Record<string, () => React.ReactElement> em vez de Map para evitar namespace JSX (TS2503)"
  - "Dois branches de render separados para item disabled vs navegável para clareza de props (aria-disabled vs aria-current)"
patterns-established:
  - "IntersectionObserver: criar Map<Element,Section> com guards (if gardenEl), threshold [0,0.1], cleanup () => observer.disconnect() em deps []"
  - "SVG inline com stroke=currentColor + color no botão pai para controle de cor ativa/inativa via prop CSS"
requirements-completed: [CTASK-05]
duration: 2min
completed: 2026-06-22
---

# Phase 04 Plan 03: BottomNav com IntersectionObserver Summary

**BottomNav fixo 80px com 4 ícones SVG inline (Jardim, Tarefas, Cofrinho, Doar), active state via IntersectionObserver observando 3 seções DOM, scroll anchor suave e "Doar" desabilitado (aria-disabled)**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-06-22T16:21:34Z
- **Completed:** 2026-06-22T16:23:07Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Componente `BottomNav` criado em `src/components/tasks/bottom-nav.tsx` como `'use client'` sem props externas
- 4 ícones SVG inline 24×24px com strokeWidth 1.5 e `stroke="currentColor"` — cor controlada pelo estado ativo/inativo
- IntersectionObserver com `Map<Element, Section>`, threshold `[0, 0.1]`, guards para elementos ausentes (jsdom), cleanup `observer.disconnect()` em deps `[]`
- "Jardim" ativo por padrão (`aria-current="page"`, cor `#3E6B4F`); inativos usam `#9AA092`
- "Doar" com `aria-disabled="true"`, `tabIndex={-1}`, `onClick` no-op e `cursor: 'default'`
- 4/4 testes `bottom-nav.test.tsx` GREEN; `tsc --noEmit` verde no arquivo

## Task Commits

1. **Task 1: Criar BottomNav fixo com 4 itens e estados acessíveis (CTASK-05)** — `b840564` (feat)

## Files Created/Modified

- `src/components/tasks/bottom-nav.tsx` — componente BottomNav fixo 80px com IntersectionObserver para active state, scroll anchor, 4 ícones SVG inline e "Doar" desabilitado

## Decisions Made

**1. React importado explicitamente para tipagem**
O arquivo usa `Record<string, () => React.ReactElement>` para o mapa de ícones. O namespace `JSX` não está disponível sem import explícito de React no contexto de configuração do projeto (`error TS2503: Cannot find namespace 'JSX'`). Solução: `import React, { useEffect, useState } from 'react'` — satisfaz o compilador sem alterar o comportamento de runtime.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Substituição de `JSX.Element` por `React.ReactElement`**
- **Found during:** Task 1 (verificação pós-escrita com `tsc --noEmit`)
- **Issue:** O código inicial usava `() => JSX.Element` como tipo do mapa de ícones; o TypeScript retornou `TS2503: Cannot find namespace 'JSX'` — o namespace não está no escopo sem configuração ou import explícito.
- **Fix:** Adicionado `import React` explicitamente e substituído o tipo para `() => React.ReactElement`. Nenhuma mudança de comportamento de runtime.
- **Files modified:** `src/components/tasks/bottom-nav.tsx`
- **Verification:** `tsc --noEmit` sem erros no arquivo; 4/4 testes passam.
- **Committed in:** b840564

---

**Total deviations:** 1 auto-fixed (Rule 1 — tipo incompatível detectado pelo compilador)
**Impact on plan:** Correção necessária para compilação. Sem mudança de comportamento.

## Issues Encountered

Nenhum além do desvio documentado acima.

## Known Stubs

Nenhum. O `BottomNav` é uma implementação completa de CTASK-05. Os IDs de seção (`section-garden`, `section-tasks`, `section-savings`) são referenciados via `getElementById` com guards para ausência — serão adicionados ao `GardenView` no Plano 04-04 (integração). O componente renderiza normalmente com "Jardim" ativo por padrão quando as seções estão ausentes (comportamento correto para jsdom e para primeiro render antes do scroll).

## Threat Flags

Nenhum. Componente é puramente visual/UI sem acesso a rede, autenticação ou sistema de arquivos.

## TDD Gate Compliance

- RED gate (test commit): ee4243b (04-01) — PASS
- GREEN gate (feat commit): b840564 — PASS (4/4 testes bottom-nav.test.tsx passam)
- REFACTOR gate: não necessário — código limpo na primeira implementação

## Self-Check: PASSED

- [x] `src/components/tasks/bottom-nav.tsx` existe — FOUND
- [x] `grep -c "export function BottomNav" bottom-nav.tsx` = 1 — PASS
- [x] `grep -c "Jardim\|Tarefas\|Cofrinho\|Doar" bottom-nav.tsx` = 4 — PASS
- [x] `grep -c "position: 'fixed'" bottom-nav.tsx` = 1 — PASS
- [x] `grep -c "height: 80" bottom-nav.tsx` = 1 — PASS
- [x] `grep -c "rgba(248,247,242,0.93)" bottom-nav.tsx` = 1 — PASS
- [x] `grep -c "blur(8px)" bottom-nav.tsx` = 1 — PASS
- [x] `grep -c "#E7E2D6" bottom-nav.tsx` = 1 — PASS
- [x] `grep -c "aria-current" bottom-nav.tsx` = 1 — PASS
- [x] `grep -c "aria-disabled" bottom-nav.tsx` = 1 — PASS
- [x] `grep -c "#3E6B4F" bottom-nav.tsx` = 2 (cor ativa) — PASS
- [x] `grep -c "#9AA092" bottom-nav.tsx` = 3 (cor inativa) — PASS
- [x] `grep -c "IntersectionObserver" bottom-nav.tsx` = 2 — PASS
- [x] `grep -c "getElementById('section-garden')" bottom-nav.tsx` = 1 — PASS
- [x] `grep -c "observer.disconnect" bottom-nav.tsx` = 1 — PASS
- [x] `grep -c "scrollIntoView" bottom-nav.tsx` = 1 — PASS
- [x] 4/4 testes passam em bottom-nav.test.tsx — GREEN CONFIRMED
- [x] Commit b840564 existe — FOUND

## Next Phase Readiness

- **Plano 04-04 (integração):** BottomNav disponível para importar no GardenView; IDs de seção (`section-garden`, `section-tasks`, `section-savings`) devem ser adicionados ao layout do GardenView
- **Nenhum bloqueador** para o Plano 04-04
