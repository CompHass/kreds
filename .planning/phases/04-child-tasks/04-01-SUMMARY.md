---
phase: 04-child-tasks
plan: 01
subsystem: seed-data, test-infrastructure
tags: [tdd, seed, testing, infrastructure]
dependency_graph:
  requires: []
  provides:
    - GardenSeed interface with savings/goal fields (D-15)
    - IntersectionObserver global mock in test environment
    - RED test contracts for CTASK-01..05
  affects:
    - src/lib/seed/garden-seed.ts
    - tests/setup.ts
    - tests/unit/child-tasks.test.tsx
    - tests/unit/bottom-nav.test.tsx
tech_stack:
  added: []
  patterns:
    - TDD RED phase — test contracts before implementation
    - vi.fn() mock in setupFiles for global browser API
    - vitest globals: true with explicit vi import in setup
key_files:
  created:
    - tests/unit/child-tasks.test.tsx
    - tests/unit/bottom-nav.test.tsx
  modified:
    - src/lib/seed/garden-seed.ts
    - tests/setup.ts
decisions:
  - Importar vi explicitamente de vitest em tests/setup.ts em vez de usar via globals (tsc exige referência de tipo explícita no arquivo setupFiles)
metrics:
  duration: 15min
  completed: 2026-06-22
  tasks: 3
  files: 4
---

# Phase 04 Plan 01: Fundação de Dados e Testes RED Summary

Interface GardenSeed estendida com savings/goal (D-15), mock de IntersectionObserver configurado globalmente, e contratos de teste RED criados para CTASK-01..05.

## What Was Built

**Task 1 — Estender interface GardenSeed (D-15):**
Adicionados campos `savings: number` e `goal: number` à interface `GardenSeed` em `src/lib/seed/garden-seed.ts`. Todas as 6 constantes de seed (`SEED_STAGE_A`, `SEED_STAGE_B`, `SEED_STAGE_C`, `SEED_STAGE_D`, `SEED_HARVESTED`, `SEED_TITHE`) receberam os valores `savings: 25` e `goal: 100` conforme especificado em D-15. Nenhuma função auxiliar existente foi alterada.

**Task 2 — Mock global de IntersectionObserver:**
Adicionado ao `tests/setup.ts` um mock de `IntersectionObserver` como classe com `observe`, `unobserve` e `disconnect` como `vi.fn()`. O construtor armazena a `callback` como campo público para permitir invocação manual nos testes de BottomNav. `vi` foi importado explicitamente de `vitest` (decisão técnica — ver Deviations).

**Task 3 — Testes RED para CTASK-01..05:**
Criados dois arquivos de teste descrevendo o contrato completo dos novos componentes:

- `tests/unit/child-tasks.test.tsx`: Cobre TaskCard (render título/emoji, aria-pressed pendente/concluída, click onComplete, click disabled em done), TitheCard (render "Dízimo", botão "Plantar" chama onPlant, estado "Feito ✓" disabled) e SavingsCard (render "Cofrinho", valores R$25/R$100, progressbar com aria-valuenow/valuemax/valuemin).
- `tests/unit/bottom-nav.test.tsx`: Cobre BottomNav (4 botões com labels "Jardim"/"Tarefas"/"Cofrinho"/"Doar", "Jardim" ativo por padrão com aria-current="page", "Doar" com aria-disabled="true").

Ambos os testes falham com `Cannot find module` — estado RED esperado confirmado.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | 3d84fe6 | feat(04-01): estender interface GardenSeed com savings e goal (D-15) |
| Task 2 | d3e5304 | chore(04-01): adicionar mock global de IntersectionObserver ao setup de testes |
| Task 3 | ee4243b | test(04-01): criar testes RED para TaskCard, TitheCard, SavingsCard e BottomNav |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Importar vi explicitamente no tests/setup.ts**
- **Found during:** Task 2
- **Issue:** O plano indicava usar `vi` globalmente (via `globals: true` do vitest), mas o TypeScript reportou `Cannot find name 'vi'` no arquivo `tests/setup.ts`. O `globals: true` do vitest injeta `vi` em arquivos de teste em tempo de execução, mas o TypeScript não mapeia esse global no `setupFiles` sem uma referência de tipo explícita.
- **Fix:** Adicionado `import { vi } from 'vitest'` no topo de `tests/setup.ts` antes da definição do mock. Isso satisfaz o type-checker sem quebrar o comportamento de runtime.
- **Files modified:** `tests/setup.ts`
- **Commit:** d3e5304

## TDD Gate Compliance

- RED gate (test commit): ee4243b — PASS
- GREEN gate: pendente — Planos 02/03 implementarão os componentes
- REFACTOR gate: não aplicável nesta fase

## Known Stubs

Nenhum stub de dados ou UI introduzido neste plano. Os arquivos de teste importam módulos inexistentes propositalmente (estado RED). Os valores `savings: 25` e `goal: 100` são valores de mock documentados em D-15, não stubs temporários — são o contrato explícito para desenvolvimento e teste.

## Threat Flags

Nenhum. Este plano é exclusivamente de dados de seed e infraestrutura de testes — nenhuma nova superfície de rede, autenticação ou acesso a arquivos foi introduzida.

## Self-Check: PASSED

- [x] `src/lib/seed/garden-seed.ts` existe e modificado — FOUND
- [x] `tests/setup.ts` existe e modificado — FOUND
- [x] `tests/unit/child-tasks.test.tsx` criado — FOUND
- [x] `tests/unit/bottom-nav.test.tsx` criado — FOUND
- [x] Commit 3d84fe6 existe — FOUND
- [x] Commit d3e5304 existe — FOUND
- [x] Commit ee4243b existe — FOUND
- [x] `grep -c 'savings: 25' garden-seed.ts` = 6 — PASS
- [x] `grep -c 'goal: 100' garden-seed.ts` = 6 — PASS
- [x] Testes falham com "Cannot find module" (estado RED) — CONFIRMED
