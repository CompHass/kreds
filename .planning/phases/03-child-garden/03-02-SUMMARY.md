---
phase: 03-child-garden
plan: 02
subsystem: garden-display-components
tags: [react, components, garden, presentational, animation, svg, tdd]
dependency_graph:
  requires:
    - src/lib/seed/garden-seed.ts (SEASON_DOT_COLORS, tipos de stage e season — Plano 01)
    - public/garden/plant-{a,b,c,d}.png (assets — Plano 01)
    - src/app/globals.css (tokens CSS e animações --animate-kreds-*)
  provides:
    - GardenHeader (src/components/garden/garden-header.tsx) — GARD-01
    - WaterTracker (src/components/garden/water-tracker.tsx) — GARD-04
    - SeasonBadge (src/components/garden/season-badge.tsx) — GARD-06
    - PlantStage (src/components/garden/plant-stage.tsx) — GARD-03
    - DecorativeFlowers (src/components/garden/decorative-flowers.tsx) — GARD-09
    - SpeechBubble (src/components/garden/speech-bubble.tsx) — GARD-07
    - HarvestGlow (src/components/garden/harvest-glow.tsx)
    - GardenHero (src/components/garden/garden-hero.tsx) — GARD-02
  affects:
    - Plano 03: GardenView consome todos estes componentes
tech_stack:
  added: []
  patterns:
    - Componentes puramente presentacionais sem 'use client' e sem useState
    - Animações CSS via style prop com var(--animate-kreds-*) — nunca className Tailwind
    - img simples (não next/image) para assets de plant-stage
    - SVG inline com aria-hidden para elementos decorativos
    - Null return para componentes condicionais (DecorativeFlowers, SpeechBubble)
    - data-testid="decorative-flowers" para verificação no DOM via testing-library
key_files:
  created:
    - src/components/garden/garden-header.tsx
    - src/components/garden/water-tracker.tsx
    - src/components/garden/season-badge.tsx
    - src/components/garden/plant-stage.tsx
    - src/components/garden/decorative-flowers.tsx
    - src/components/garden/speech-bubble.tsx
    - src/components/garden/harvest-glow.tsx
    - src/components/garden/garden-hero.tsx
  modified: []
decisions:
  - "DecorativeFlowers retorna null quando !visible (não display:none) — padrão consistente com SpeechBubble e compatível com queryByTestId"
  - "GardenHero oculta WaterTracker quando canHarvest=true (slot liberado para HarvestButton do Plano 03 via children)"
  - "PlantStage usa bottom:30 left:'50%' translateX(-50%) como posicionamento padrão (centrado no hero)"
  - "GardenHero expõe prop pop opcional e aceita children como overlay — PlantStage renderizado internamente"
  - "droop prop no GardenHero é opcional (default false) para compatibilidade com garden-hero.test.tsx que não passa droop"
metrics:
  duration: "10 min"
  completed_date: "2026-06-22"
  tasks_completed: 3
  files_created: 8
  files_modified: 0
---

# Phase 03 Plan 02: Garden Display Components Summary

8 componentes presentacionais do jardim implementados e testados: GardenHeader com avatar gradiente e badge de moedas SVG, WaterTracker com 4 dots aria-label, SeasonBadge com SEASON_DOT_COLORS importado do seed, PlantStage com img simples e animações droop/pop, DecorativeFlowers SVG rosa com data-testid, SpeechBubble com animação kredsBubble, HarvestGlow radial amarelo, e GardenHero container 316px compondo todos os elementos com sol/nuvens/morros/chão animados.

## Tasks Executadas

| Task | Nome | Commit | Status |
|------|------|--------|--------|
| 1 | GardenHeader + WaterTracker + SeasonBadge | 09543da | DONE |
| 2 | PlantStage + DecorativeFlowers + SpeechBubble + HarvestGlow | 7db5801 | DONE |
| 3 | GardenHero container | a0d55b1 | DONE |

## Artifacts Entregues

### Task 1 — Componentes de estado e identidade (GARD-01/04/06)

- `garden-header.tsx`: avatar 46×46px borderRadius 15px, gradiente #5A8A66→#3E6B4F, inicial branca 700. Nome Display/24/700 com letterSpacing -0.01em. Badge de coins pill com SVG coin aria-hidden fill var(--color-kreds-coin), valor com var(--color-kreds-gold) peso 700.
- `water-tracker.tsx`: 4 dots 8×8 borderRadius 50%. `i < filled` → var(--color-kreds-water), restantes rgba(255,255,255,.35). Container com aria-label dinâmico "Tracker de água: N de 4 tarefas concluídas".
- `season-badge.tsx`: pill var(--color-kreds-card) com borda var(--color-kreds-border), borderRadius var(--radius-pill). Dot 8×8 com SEASON_DOT_COLORS[season] importado de garden-seed. Label 12/700 capitalizado (Primavera/Verão/Outono/Inverno).

**Testes:** garden-header.test.tsx 3/3 ✓, garden-season.test.ts 5/5 ✓

### Task 2 — Componentes visuais dinâmicos (GARD-03/07/09)

- `plant-stage.tsx`: `<img src={/garden/plant-${stage}.png}` com alt descritivo. transform compõe translateX(-50%) + rotate(-2.5deg) quando droop. transformOrigin 50% 94%. filter drop-shadow. animation var(--animate-kreds-pop) quando pop.
- `decorative-flowers.tsx`: SVG inline 120×80px com 3 flores, fill var(--color-kreds-rose), caules #5A8A66. aria-hidden, data-testid="decorative-flowers". Retorna null quando !visible.
- `speech-bubble.tsx`: posição absolute bottom:60, centralizada via left:50% translateX(-50%). animation var(--animate-kreds-bubble). Triângulo SVG pointer. Retorna null quando !visible.
- `harvest-glow.tsx`: div 220×220 borderRadius 50%, radial-gradient rgba(227,197,124,.4)→transparent. opacity 1↔0 por visible, transition 0.4s ease.

**Nota:** Nenhum componente importa next/image.

### Task 3 — GardenHero container (GARD-02)

- `garden-hero.tsx`: container position:relative height:316 borderRadius:28 overflow:hidden. Fundo gradiente linear 180deg #CFE0D8→#DCE6CC→#CCD8AF.
- Sol: div 58×58 borderRadius 50%, radial-gradient amarelo, top:16 right:24, animation var(--animate-kreds-sun).
- 2 nuvens: pills brancas com animation var(--animate-kreds-drift1) e var(--animate-kreds-drift2).
- 2 morros: círculos 260×260 #BBCB9E e #A9BA8B, posicionados absolute nos cantos inferiores.
- Chão: height:52 bottom:0, gradiente #AFC289→#96AB71, borderRadius 999px 999px 0 0.
- Composição: SeasonBadge (top:12 left:12), WaterTracker (top:12 right:12, oculto quando canHarvest), HarvestGlow, PlantStage, DecorativeFlowers, SpeechBubble, {children}.

**Testes:** garden-hero.test.tsx 3/3 ✓

## Verificação Final

```
pnpm test tests/unit/garden-header.test.tsx tests/unit/garden-hero.test.tsx tests/unit/garden-season.test.ts
→ Test Files  3 passed (3), Tests  11 passed (11)

ls src/components/garden/*.tsx
→ 8 componentes: decorative-flowers, garden-header, garden-hero, harvest-glow,
  plant-stage, season-badge, speech-bubble, water-tracker

grep -l "next/image" src/components/garden/*.tsx
→ (nenhum resultado — OK)

grep "var(--animate-kreds-sun)" src/components/garden/garden-hero.tsx
→ animation: 'var(--animate-kreds-sun)'
grep "var(--animate-kreds-drift1)" src/components/garden/garden-hero.tsx
→ animation: 'var(--animate-kreds-drift1)'
```

## Deviações do Plano

Nenhuma — plano executado exatamente como escrito.

## Known Stubs

Nenhum stub de dados hardcoded. GardenHero recebe todas as props do GardenView (Plano 03), sem valores padrão de placeholder.

## Threat Flags

Nenhuma nova superfície de ameaça. Componentes puramente presentacionais sem acesso a dados externos, sem estado persistente, sem chamadas de API. Dados são props injetadas pelo GardenView protegido por middleware child-session (T-03-01 mitigado na Fase 2, T-03-04/05 aceitos conforme threat_model do plano).

## Self-Check: PASSED

Arquivos criados:
- FOUND: src/components/garden/garden-header.tsx (export GardenHeader ✓, borderRadius 15 ✓, gradiente #5A8A66 ✓)
- FOUND: src/components/garden/water-tracker.tsx (export WaterTracker ✓, aria-label ✓)
- FOUND: src/components/garden/season-badge.tsx (export SeasonBadge ✓, SEASON_DOT_COLORS ✓)
- FOUND: src/components/garden/plant-stage.tsx (export PlantStage ✓, /garden/plant- ✓)
- FOUND: src/components/garden/decorative-flowers.tsx (export DecorativeFlowers ✓, var(--color-kreds-rose) ✓, data-testid ✓)
- FOUND: src/components/garden/speech-bubble.tsx (export SpeechBubble ✓, var(--animate-kreds-bubble) ✓)
- FOUND: src/components/garden/harvest-glow.tsx (export HarvestGlow ✓, radial-gradient ✓)
- FOUND: src/components/garden/garden-hero.tsx (export GardenHero ✓, var(--animate-kreds-sun) ✓, var(--animate-kreds-drift1) ✓)

Commits:
- FOUND: 09543da (Task 1)
- FOUND: 7db5801 (Task 2)
- FOUND: a0d55b1 (Task 3)

Testes: 11/11 passam ✓
