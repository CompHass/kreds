---
status: investigating
trigger: "Usuário quer desfazer o dízimo (TitheCard deve ser toggle bidirecional, similar ao task-uncheck fix)"
created: 2026-06-22T14:30:00Z
updated: 2026-06-22T14:30:00Z
---

## Current Focus

hypothesis: "TitheCard recebe done=false como prop e não tem estado interno — o handler onPlant está em GardenView como handleTithe(). Para desfazer: (1) TitheCard precisa exibir botão de desfazer quando done=true, (2) GardenView precisa de handler handleUntithe() que seta titheDone=false via setState."
test: "Verificar tithe-card.tsx e garden-view.tsx para mapear o que precisa mudar"
next_action: "Ler src/components/tasks/tithe-card.tsx e garden-view.tsx"
reasoning_checkpoint: ""

## Symptoms

expected: "Quando dízimo está feito, usuário pode clicar para desfazer — botão muda de volta para Plantar"
actual: "TitheCard com done=true mostra apenas texto estático — sem forma de reverter"
error_messages: "Nenhum erro"
timeline: "Feature nunca existiu — TitheCard foi implementado como one-way"
reproduction: "Clicar Plantar, tentar desfazer"

## Evidence

## Eliminated

## Resolution

root_cause: ""
fix: ""
verification: ""
files_changed: []
