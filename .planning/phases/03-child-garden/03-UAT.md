---
status: testing
phase: 03-child-garden
source: [03-VERIFICATION.md]
started: 2026-06-22T08:30:00Z
updated: 2026-06-22T08:30:00Z
---

## Current Test

number: 1
name: Animações de rega (GARD-05)
expected: |
  Ao concluir tarefa, 5 drops kredsDrop animam e planta faz pop kredsPop
awaiting: user response

## Tests

### 1. Animações de rega (GARD-05)
expected: Ao concluir tarefa, 5 drops kredsDrop disparam com delays 0/80/160/240/320ms e planta faz pop kredsPop
result: [pending]

### 2. HarvestButton + HarvestGlow (GARD-08)
expected: Após concluir 4 tarefas, botão "Colher Frutos" laranja aparece e HarvestGlow acende (radial-gradient amarelo)
result: [pending]

### 3. Overlay de celebração (GARD-10)
expected: Ao colher, overlay mostra 20 confetes kredsConfetti + card com versículo bíblico do banco + botão "Voltar ao jardim". Versículo muda em reloads diferentes (ORDER BY RANDOM())
result: [pending]

### 4. Persistência pós-colheita (D-10)
expected: Após fechar overlay (botão "Voltar ao jardim"), jardim mantém plant-d e tarefas marcadas. Estado não reseta.
result: [pending]

### 5. Animações do hero (GARD-02)
expected: GardenHero em 316px mostra sol (kredsSun), nuvens (drift1/drift2) animando continuamente — sensação de jardim vivo
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
