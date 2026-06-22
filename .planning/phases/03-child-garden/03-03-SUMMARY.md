---
phase: 03-child-garden
plan: 03
subsystem: ui
tags: [react, next.js, drizzle, animation, css-variables, tdd, garden, celebration]

dependency_graph:
  requires:
    - plan: 03-01
      provides: "bibleVerses Drizzle table, GardenSeed/getPlantStage/getBubbleText, constantes SEED_*"
    - plan: 03-02
      provides: "GardenHeader, GardenHero e todos os componentes passivos"
  provides:
    - WaterDrops (src/components/garden/water-drops.tsx) — GARD-05
    - HarvestButton (src/components/garden/harvest-button.tsx) — GARD-08
    - ConfettiField (src/components/garden/confetti-field.tsx) — GARD-10
    - CelebrationOverlay (src/components/garden/celebration-overlay.tsx) — GARD-10
    - GardenView (src/components/garden/garden-view.tsx) — Client Component raiz GARD-05/08/10
    - GardenPage (src/app/(child)/child/[childId]/garden/page.tsx) — rota D-04
  affects:
    - Fase 4 (task cards da criança — GardenView UI mínima de tarefas aguarda UI completa)
    - Fase 6 (POST /harvest real, reset de ciclo, validateChildSessionScope)

tech-stack:
  added: []
  patterns:
    - Client Component raiz com useState orquestrando estado de tarefas/água/colheita
    - key={waterTick} para remontar e replay de animação CSS (sem remover/adicionar classes)
    - CONFETTI_ITEMS array estático fora do componente (sem Math.random no render — anti-hydration-mismatch)
    - Server Component async + await params + Drizzle RANDOM() via sql tag (Next.js 16)
    - canHarvest passado ao GardenHero como harvested (não como doneCount==total) para manter WaterTracker visível em 4/4

key-files:
  created:
    - src/components/garden/water-drops.tsx
    - src/components/garden/harvest-button.tsx
    - src/components/garden/confetti-field.tsx
    - src/components/garden/celebration-overlay.tsx
    - src/components/garden/garden-view.tsx
    - src/app/(child)/child/[childId]/garden/page.tsx
  modified: []

key-decisions:
  - "canHarvest ao GardenHero usa harvested (não doneCount==total) para WaterTracker ficar visível em 4/4 tarefas concluídas — compatibilidade com contrato de teste garden-view.test.tsx"
  - "aria-label do HarvestButton é 'Colher Frutos' (não 'Colher os frutos do jardim') — nome acessível compatível com regex do teste /colher frutos/i"
  - "Falhas pré-existentes na suite completa (family, ledger, e2e, db-connection) não foram tocadas — escopo da Fase 3 é apenas os 7 arquivos garden"

requirements-completed: [GARD-05, GARD-08, GARD-10]

duration: 15min
completed: 2026-06-22
---

# Phase 03 Plan 03: Interactive Layer + Garden Page Summary

**6 componentes interativos do jardim entregues: WaterDrops (kredsDrop replay via key), HarvestButton (kredsFruit gradiente laranja), ConfettiField (20 itens estáticos), CelebrationOverlay (dialog + versículo + botão voltar), GardenView (Client Component raiz orquestrando estado), e rota /child/[childId]/garden com query Drizzle RANDOM() — fecha o loop GARD-05/08/10 da Fase 3.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-06-22T08:12:00Z
- **Completed:** 2026-06-22T08:27:00Z
- **Tasks:** 3
- **Files created:** 6

## Accomplishments

- WaterDrops com 5 divs kredsDrop e delays 0/80/160/240/320ms — remontado via key={waterTick} para replay (GARD-05)
- HarvestButton com gradiente #C77F52→#B5623F, animação kredsFruit, aria-label, minHeight 44px (GARD-08)
- ConfettiField com CONFETTI_ITEMS constante estática de 20 items (sem Math.random) — evita hydration mismatch
- CelebrationOverlay com role=dialog, aria-modal, card de versículo bíblico animado kredsCele e botão "Voltar ao jardim" (GARD-10)
- GardenView: Client Component raiz com estado tasks/waterTick/showPop/harvested/showOverlay; handleCloseOverlay NÃO reseta tasks/harvested (D-10)
- GardenPage: Server Component async com await params, Drizzle RANDOM() query, verse ?? null fallback

## Task Commits

1. **Task 1: WaterDrops + HarvestButton + ConfettiField + CelebrationOverlay** - `114af11` (feat)
2. **Task 2: GardenView — Client Component raiz** - `fe9604e` (feat)
3. **Task 3: GardenPage — Server Component com RANDOM verse** - `19cd850` (feat)

## Files Created/Modified

- `src/components/garden/water-drops.tsx` - 5 divs kredsDrop com delays escalonados (GARD-05)
- `src/components/garden/harvest-button.tsx` - Botão laranja kredsFruit visível quando canHarvest (GARD-08)
- `src/components/garden/confetti-field.tsx` - CONFETTI_ITEMS array estático de 20 (GARD-10)
- `src/components/garden/celebration-overlay.tsx` - Overlay dialog + versículo + botão voltar (GARD-10)
- `src/components/garden/garden-view.tsx` - Client Component raiz orquestrando todo estado interativo
- `src/app/(child)/child/[childId]/garden/page.tsx` - Server Component com Drizzle RANDOM() (D-04, D-08)

## Decisions Made

- **canHarvest passado ao GardenHero = harvested (não doneCount==total):** GardenHero oculta WaterTracker quando canHarvest=true. Se passássemos canHarvest real (doneCount==total && !harvested), ao completar a 4ª tarefa o tracker sumia imediatamente sem mostrar 4/4. O teste garden-view.test.tsx espera o tracker visível com aria-label "tracker de água.*4" após clicar na 4ª tarefa. Solução: GardenHero recebe harvested como canHarvest — tracker some apenas após colheita real.

- **aria-label HarvestButton = "Colher Frutos":** O nome acessível de um button é definido pelo aria-label quando presente. O teste usa `getByRole('button', { name: /colher frutos/i })`. Aria-label "Colher os frutos do jardim" não batia com esse regex. Simplificado para "Colher Frutos".

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] aria-label do HarvestButton incompatível com contrato de teste**
- **Found during:** Task 2 (garden-view.test.tsx rodando)
- **Issue:** HarvestButton implementado com `aria-label="Colher os frutos do jardim"` (seguindo UI-SPEC §Accessibility Notes). O teste GARD-08 usa `getByRole('button', { name: /colher frutos/i })` — o regex não bate com "Colher os frutos do jardim" por causa do "os".
- **Fix:** Alterado para `aria-label="Colher Frutos"` — corresponde ao texto do botão e ao regex do teste.
- **Files modified:** src/components/garden/harvest-button.tsx
- **Verification:** 3/3 garden-view.test.tsx passam
- **Committed in:** fe9604e (Task 2 commit)

**2. [Rule 1 - Bug] WaterTracker sumia ao completar todas as tarefas (antes da colheita)**
- **Found during:** Task 2 (garden-view.test.tsx — "clicar em uma tarefa avança o tracker de água")
- **Issue:** GardenHero.tsx (Plano 02) oculta WaterTracker quando `canHarvest=true`. GardenView passava `canHarvest={doneCount===total && !harvested}`, então ao clicar na 4ª tarefa o tracker desaparecia imediatamente (canHarvest=true). O teste esperava o tracker visível com 4 de 4.
- **Fix:** GardenView passa `canHarvest={harvested}` ao GardenHero — tracker some apenas após harvest real. O HarvestButton ainda aparece via slot children quando canHarvest computado é true.
- **Files modified:** src/components/garden/garden-view.tsx
- **Verification:** 3/3 garden-view.test.tsx passam; 7/7 arquivos garden passam (29 testes)
- **Committed in:** fe9604e (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2× Rule 1 — Bug)
**Impact on plan:** Ambas as correções necessárias para compatibilidade com os contratos de teste definidos no Plano 01. Sem mudança de escopo.

## Issues Encountered

- Suite completa (`pnpm test`) tem 15 falhas pré-existentes (e2e, integração, family, ledger, glossary, db-connection) — confirmadas como anteriores ao Plano 03 por comparação com baseline. Os 7 arquivos garden passam 29/29 testes.

## Known Stubs

- GardenView renderiza lista de tarefas com UI mínima (button por task) — task cards completos (design do design handoff) são escopo da Fase 4 (CTASK-05). Este stub é intencional (D-01, Plano 03 CONTEXT.md) e não bloqueia o objetivo da fase.
- GardenPage usa `SEED_STAGE_C` hardcoded — dados reais por criança na Fase 6.

## Threat Flags

Nenhuma nova superfície de ameaça além do mapeado no threat_model do plano:
- T-03-01 (acesso sem sessão): mitigado pelo middleware existente (verificado em tests/unit/middleware.test.ts)
- T-03-06 (childId spoofing): aceito (seed mockado, sem dados reais por criança)
- T-03-07 (versículo ao cliente): aceito (conteúdo bíblico público)
- T-03-08 (estado de colheita manipulado): aceito (sem POST ao backend nesta fase — D-09)

## Self-Check: PASSED

Arquivos criados:
- FOUND: src/components/garden/water-drops.tsx
- FOUND: src/components/garden/harvest-button.tsx
- FOUND: src/components/garden/confetti-field.tsx
- FOUND: src/components/garden/celebration-overlay.tsx
- FOUND: src/components/garden/garden-view.tsx
- FOUND: src/app/(child)/child/[childId]/garden/page.tsx

Commits:
- FOUND: 114af11 (Task 1)
- FOUND: fe9604e (Task 2)
- FOUND: 19cd850 (Task 3)

Testes: 29/29 garden passam (7 arquivos)

## Next Phase Readiness

- Rota /child/[childId]/garden funcional — loop completo PIN→portão→jardim navegável
- GARD-05/08/10 entregues — Fase 3 fechada
- Fase 4 recebe GardenView pronto para substituir task-list mínima por task cards completos do design handoff

---
*Phase: 03-child-garden*
*Completed: 2026-06-22*
