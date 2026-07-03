---
status: awaiting_human_verify
trigger: "TaskCard não permite desmarcar tarefa concluída — falta feature de toggle bidirecional + atualização de progresso/valores ao desmarcar"
created: 2026-06-22T14:00:00Z
updated: 2026-06-22T15:00:00Z
---

## Current Focus

hypothesis: "CONFIRMADA — TaskCard tem disabled={task.done} + guard !task.done no onClick, bloqueando completamente o uncheck. GardenView.handleTaskComplete só seta done: true e incrementa waterTick, sem path para done: false. A prop onComplete (nome unidirecional) também evidencia a intenção original."
test: "Código lido diretamente — evidência direta, sem ambiguidade"
next_action: "Aplicar fix em task-card.tsx e garden-view.tsx"

reasoning_checkpoint:
  hypothesis: "disabled={task.done} no TaskCard + guard !task.done no onClick bloqueiam o uncheck. handleTaskComplete no GardenView nunca seta done:false. Toggle bidirecional está completamente ausente."
  confirming_evidence:
    - "task-card.tsx linha 18: disabled={task.done} — botão desabilitado quando done=true"
    - "task-card.tsx linha 17: onClick={() => !task.done && onComplete(task.id)} — guard adicional impede call mesmo se disabled fosse removido"
    - "garden-view.tsx linhas 53-60: handleTaskComplete seta done: true e incrementa waterTick — não existe path para done: false"
    - "TaskCardProps define onComplete (não onToggle) — intenção unidirecional na interface"
  falsification_test: "Se existisse um handler de uncheck no GardenView chamando setTasks com done:false, a hipótese estaria errada. Não existe."
  fix_rationale: "Remover disabled={task.done} e o guard !task.done. Renomear prop para onToggle e mudar assinatura. Criar handleTaskToggle que inverte done e ajusta waterTick (+1 ao marcar, -1 ao desmarcar). cursor deve ser pointer sempre."
  blind_spots: "WaterDrops usa key={waterTick} para replay de animação — waterTick negativo ou zero não causa bug, mas precisa de atenção. canHarvest = doneCount === tasks.length — ao desmarcar, harvest deve sair automaticamente (já resolvido via derivado)."

## Symptoms

expected: "Usuário pode clicar em tarefa já concluída para desmarcá-la (toggle bidirecional). Progresso e valores refletem a mudança imediatamente."
actual: "Botão de check está disabled quando task.done=true — não é possível desmarcar"
error_messages: "Nenhum erro — é comportamento intencional mas incorreto"
timeline: "Feature nunca existiu — TaskCard foi implementado com disabled={task.done} no plano 04-02"
reproduction: "Marcar uma tarefa, tentar desmarcar — botão não responde"

## Evidence

- timestamp: 2026-06-22T14:20:00Z
  checked: "src/components/tasks/task-card.tsx"
  found: "disabled={task.done} na linha 18 e guard !task.done && onComplete(task.id) na linha 17"
  implication: "Toggle bloqueado em duas camadas — disabled HTML nativo + guard JS no onClick"

- timestamp: 2026-06-22T14:20:00Z
  checked: "src/components/garden/garden-view.tsx handleTaskComplete (linhas 53-60)"
  found: "seta done: true e incrementa waterTick — não há path para done: false"
  implication: "Mesmo que TaskCard chamasse onToggle, o handler pai não saberia desmarcar"

- timestamp: 2026-06-22T14:20:00Z
  checked: "TaskCardProps interface"
  found: "onComplete: (taskId: string) => void — prop nomeada para conclusão, não toggle"
  implication: "Feature de uncheck foi omitida desde a implementação inicial, não é regressão"

## Eliminated

## Resolution

root_cause: "TaskCard tinha disabled={task.done} + guard !task.done no onClick, bloqueando o uncheck em duas camadas. handleTaskComplete no GardenView só setava done:true, sem path para inverter o estado."
fix: "1) task-card.tsx: removido disabled={task.done}, removido guard !task.done, renomeado prop onComplete→onToggle, cursor sempre pointer, aria-label atualizado para 'Desmarcar tarefa' quando done. 2) garden-view.tsx: handleTaskComplete→handleTaskToggle invertendo done com !t.done; animação de gota/pop apenas ao marcar (wasAlreadyDone=false). 3) child-tasks.test.tsx: prop atualizada para onToggle, teste de interação bidirecional adicionado, teste de disabled removido."
verification: "15/15 testes em child-tasks.test.tsx passando. Suite completa: sem regressões nos arquivos relacionados."
files_changed:
  - src/components/tasks/task-card.tsx
  - src/components/garden/garden-view.tsx
  - tests/unit/child-tasks.test.tsx
