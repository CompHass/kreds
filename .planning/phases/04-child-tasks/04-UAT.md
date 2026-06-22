---
status: complete
phase: 04-child-tasks
source: [04-VERIFICATION.md]
started: 2026-06-22T13:30:00Z
updated: 2026-06-22T13:30:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Plantar dízimo → flores no hero
expected: Clicar em "Plantar" no TitheCard muda para "Feito ✓" desabilitado E as DecorativeFlowers aparecem no GardenHero (titheDone=true propagado ao hero via state)
result: issue
reported: "As DecorativeFlowers não aparecem no GardenHero após clicar Plantar"
severity: major

### 2. Animação da progress bar do Cofrinho
expected: Ao carregar `/child/[childId]/garden`, a progress bar do SavingsCard inicia em 0% e anima suavemente até 25% (~0.6s cubic-bezier)
result: skipped
reason: Animação ainda não funciona após múltiplos fix attempts (setTimeout, double-rAF, IntersectionObserver). Deixado como pendência para resolver futuramente.

### 3. BottomNav: ícone ativo muda ao scrollar
expected: Scrollar até seção #section-tasks muda ícone ativo de "Jardim" para "Tarefas" (cor #3E6B4F). "Doar" sempre aria-disabled.
result: pass

### 4. BottomNav: scroll suave ao clicar ícone
expected: Clicar em "Cofrinho" no BottomNav faz scroll suave (behavior: smooth) até #section-savings sem recarregar página
result: pass

## Summary

total: 4
passed: 2
issues: 1
pending: 0
skipped: 1
blocked: 0

## Gaps

- truth: "DecorativeFlowers aparecem no GardenHero após clicar Plantar no TitheCard (titheDone=true propagado ao hero via state)"
  status: resolved
  reason: "User reported: As DecorativeFlowers não aparecem no GardenHero após clicar Plantar"
  severity: major
  test: 1
  root_cause: "PlantStage usa filter:drop-shadow criando stacking context — DecorativeFlowers renderizava no DOM mas aparecia visualmente atrás da planta"
  artifacts:
    - path: "src/components/garden/decorative-flowers.tsx"
      issue: "SVG sem zIndex — perdendo para stacking context do filter na planta"
  missing:
    - "zIndex: 1 no SVG do DecorativeFlowers"
  debug_session: ".planning/debug/decorative-flowers-not-showing.md"
