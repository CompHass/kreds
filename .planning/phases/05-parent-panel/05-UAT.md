---
status: complete
phase: 05-parent-panel
source: 05-01-SUMMARY.md, 05-02-SUMMARY.md, 05-03-SUMMARY.md, 05-04-SUMMARY.md
started: 2026-06-30T00:00:00Z
updated: 2026-06-30T00:00:00Z
url: http://localhost:3000/family/299d5700-4740-4448-a6de-06892d71c8f7/tasks
---

## Current Test

[testing complete]

## Tests

### 1. Layout 3 colunas
expected: Página carrega com 3 painéis visíveis: sidebar esquerda, lista de tarefas no centro, painel direito idle (sem formulário aberto).
result: pass

### 2. FilterChips por filho
expected: Acima da lista de tarefas aparecem chips "Todas" + um chip por filho da família. Clicar num chip filtra as tarefas daquele filho.
result: pass

### 3. Toggle ativo/inativo
expected: Cada tarefa tem um toggle (switch). Clicar desativa/ativa a tarefa. O card muda visualmente (opacity reduzida quando inativo).
result: pass

### 4. Abrir formulário de criação
expected: Clicar "+ Nova tarefa" abre o painel direito com formulário em branco: título, categoria, dias da semana, valor de recompensa, assignee.
result: pass

### 5. RewardStepper
expected: No formulário, o stepper de recompensa começa em "R$ 0". Clicar + incrementa o valor. Clicar - decrementa.
result: pass

### 6. RecurrencePills (dias da semana)
expected: Pills de dias da semana (Seg, Ter, Qua...). Clicar num dia seleciona/desseleciona. Existe opção "Todos os dias" que seleciona todos os 7.
result: pass

### 7. Salvar nova tarefa
expected: Preencher título + categoria + pelo menos 1 dia + assignee e salvar. Nova tarefa aparece na lista com animação kredsNew (brilho/destaque por ~1s).
result: pass

### 8. Editar tarefa existente
expected: Clicar no ícone de lápis de uma tarefa existente abre o formulário preenchido com os dados dela. Botão "Excluir tarefa" é visível no modo edição (não aparece no modo criação).
result: pass

### 9. Topbar com nome da família
expected: Barra superior mostra o nome da família ou breadcrumb identificando o contexto. Badge do usuário logado visível.
result: pass

## Summary

total: 9
passed: 9
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
