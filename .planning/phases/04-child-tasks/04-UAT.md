---
status: testing
phase: 04-child-tasks
source: [04-VERIFICATION.md]
started: 2026-06-22T13:30:00Z
updated: 2026-06-22T13:30:00Z
---

## Current Test

number: 1
name: Plantar dízimo → flores no hero
expected: |
  Clicar em "Plantar" no TitheCard muda para "Feito ✓" desabilitado E as DecorativeFlowers aparecem no GardenHero
awaiting: user response

## Tests

### 1. Plantar dízimo → flores no hero
expected: Clicar em "Plantar" no TitheCard muda para "Feito ✓" desabilitado E as DecorativeFlowers aparecem no GardenHero (titheDone=true propagado ao hero via state)
result: [pending]

### 2. Animação da progress bar do Cofrinho
expected: Ao carregar `/child/[childId]/garden`, a progress bar do SavingsCard inicia em 0% e anima suavemente até 25% (~0.6s cubic-bezier)
result: [pending]

### 3. BottomNav: ícone ativo muda ao scrollar
expected: Scrollar até seção #section-tasks muda ícone ativo de "Jardim" para "Tarefas" (cor #3E6B4F). "Doar" sempre aria-disabled.
result: [pending]

### 4. BottomNav: scroll suave ao clicar ícone
expected: Clicar em "Cofrinho" no BottomNav faz scroll suave (behavior: smooth) até #section-savings sem recarregar página
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
