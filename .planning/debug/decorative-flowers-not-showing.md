---
status: diagnosed
trigger: "DecorativeFlowers não aparecem no GardenHero após clicar Plantar no TitheCard"
created: 2026-06-22T19:56:00Z
updated: 2026-06-22T19:57:00Z
---

## Current Focus

hypothesis: DecorativeFlowers são renderizadas no DOM mas ficam visualmente ocultas atrás da imagem da planta PNG porque ambos os elementos compartilham a mesma área (bottom: 30-230 vs bottom: 40-120), e a posição `bottom: 40` das flores fica dentro da área de cobertura da planta. Porém a ordem DOM está correta (flores renderizadas depois). A lógica React e passagem de props está 100% correta — confirmado por teste de integração.

test: Executar teste de integração GardenView → TitheCard click → DecorativeFlowers no DOM
expecting: Teste passa (confirma que o bug não é lógico/React)
next_action: DIAGNOSED — retornar root cause ao caller

## Symptoms

expected: Clicar "Plantar" → titheDone=true → DecorativeFlowers aparecem visualmente no GardenHero
actual: Botão muda para "Feito ✓" (titheDone state atualiza), mas flores não aparecem visualmente
errors: Nenhum erro de console reportado
reproduction: Clicar botão "Plantar" no TitheCard
started: Não especificado

## Eliminated

- hypothesis: prop name mismatch entre GardenView e GardenHero
  evidence: garden-view.tsx linha 113 passa `titheDone={titheDone}` — bate exatamente com GardenHeroProps.titheDone
  timestamp: 2026-06-22T19:55:00Z

- hypothesis: DecorativeFlowers não importado no GardenHero
  evidence: garden-hero.tsx linha 8: `import { DecorativeFlowers } from './decorative-flowers'` — importado corretamente
  timestamp: 2026-06-22T19:55:00Z

- hypothesis: lógica condicional invertida (`!titheDone`)
  evidence: garden-hero.tsx linha 153: `<DecorativeFlowers visible={titheDone} />` — lógica correta. decorative-flowers.tsx linha 8: `if (!visible) return null` — lógica correta
  timestamp: 2026-06-22T19:55:00Z

- hypothesis: state não atualiza no GardenView
  evidence: O botão mostra "Feito ✓" confirmando que titheDone=true foi setado. Teste de integração passou.
  timestamp: 2026-06-22T19:56:00Z

- hypothesis: SVG não está no DOM após click
  evidence: Teste de integração `tithe-flowers-integration.test.tsx` PASSOU — `screen.getByTestId('decorative-flowers')` encontra o elemento após fireEvent.click no botão "Plantar"
  timestamp: 2026-06-22T19:56:30Z

## Evidence

- timestamp: 2026-06-22T19:55:00Z
  checked: garden-view.tsx linha 109-126 (GardenHero props)
  found: `titheDone={titheDone}` na linha 113 — prop passada corretamente
  implication: Não é mismatch de prop name

- timestamp: 2026-06-22T19:55:00Z
  checked: garden-hero.tsx linha 153
  found: `<DecorativeFlowers visible={titheDone} />` — passagem correta para o componente
  implication: Não é mismatch interno

- timestamp: 2026-06-22T19:55:00Z
  checked: decorative-flowers.tsx
  found: `if (!visible) return null` — correto. SVG com `position: absolute, bottom: 40, left: 50%, transform: translateX(-50%)`. CSS var `--color-kreds-rose` definida como `#C98AA0`.
  implication: Componente implementado corretamente

- timestamp: 2026-06-22T19:55:30Z
  checked: plant-stage.tsx
  found: `position: absolute, bottom: 30, maxHeight: 200, filter: 'drop-shadow(...)'`. PlantStage cobre y=116 a y=286 do container de 316px. DecorativeFlowers fica em y=196 a y=276 — dentro da área da planta.
  implication: Flores estão na mesma região visual que a planta, mas ordem DOM garante flores na frente

- timestamp: 2026-06-22T19:56:00Z
  checked: garden-hero.tsx render order
  found: PlantStage (linha 150) renderizado ANTES de DecorativeFlowers (linha 153) no mesmo stacking context
  implication: Flores têm stacking order maior — deveriam aparecer na frente da planta

- timestamp: 2026-06-22T19:56:30Z
  checked: Teste de integração GardenView → click "Plantar" → queryByTestId('decorative-flowers')
  found: TESTE PASSOU — SVG está no DOM com `data-testid="decorative-flowers"` após click
  implication: O bug é visual/CSS, não de lógica React ou state management

- timestamp: 2026-06-22T19:57:00Z
  checked: globals.css para z-index, overflow, stacking context
  found: Nenhum z-index definido globalmente. Container do hero tem `overflow: hidden` e `position: relative`.
  implication: Nenhum CSS global interfere

## Resolution

root_cause: |
  PlantStage (garden-hero.tsx linha 150) usa `filter: 'drop-shadow(0 4px 8px rgba(0,0,0,.15))'`
  (plant-stage.tsx linha 27). A propriedade CSS `filter` cria um stacking context no
  elemento <img>. Segundo a spec CSS Stacking Context, elementos que formam stacking
  context (mesmo com z-index: auto implícito) são pintados POR CIMA de elementos irmãos
  que não formam stacking context — independente da ordem DOM.

  DecorativeFlowers (garden-hero.tsx linha 153) é um SVG posicionado absolutamente
  SEM z-index e SEM qualquer propriedade que crie stacking context. Portanto, mesmo
  sendo renderizado depois do PlantStage no DOM (linha 153 > 150), as flores ficam
  ATRÁS da imagem da planta na pintura visual — porque a planta forma stacking context
  via filter e "salta" para cima dos elementos sem stacking context.

  CONFIRMAÇÃO: Teste de integração passou (SVG está no DOM com titheDone=true), mas
  visualmente as flores ficam ocultas atrás da planta por causa do CSS stacking context.

fix_approach: |
  Adicionar `position: 'relative', zIndex: 1` no SVG das DecorativeFlowers
  (decorative-flowers.tsx) para criar um stacking context explícito com z-index
  superior ao da planta (que tem z-index: auto via filter). Alternativamente,
  adicionar `zIndex: 1` diretamente no style do SVG para que fique acima da planta.

files_changed: [src/components/garden/decorative-flowers.tsx]
