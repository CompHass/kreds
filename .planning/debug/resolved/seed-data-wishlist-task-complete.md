---
status: resolved
slug: seed-data-wishlist-task-complete
trigger: "esse historico nao foi criado por mim"
created: 2026-06-08
updated: 2026-06-08
---

# Debug Session: seed-data-wishlist-task-complete

## Symptoms

- **Expected:** Wishlist ("Meus Sonhos") should be empty until user creates goals. New task assigned to 3 children should appear as pending for all.
- **Actual:** Two goals appeared with no user action — "Bicicleta Nova" (60% cultivado) and "Jogo de Tabuleiro" (20% cultivado). Also: a task created and assigned to all 3 children appeared immediately as "COMPLETA!" for Filha 2.
- **Error messages:** None visible — UI shows wrong state silently.
- **Timeline:** Noticed during manual UAT after Phase 3/4 execution. May have been introduced during test plan execution.
- **Reproduction:** Load the wishlist page for any child → goals appear. Create a task assigned to all 3 children → Filha 2 shows it as complete immediately.

## Bug 1: Phantom wishlist goals
- Goals "Bicicleta Nova" (60%) and "Jogo de Tabuleiro" (20%) exist in DB but were never created by the user.
- Suspicion: seed data or test fixtures inserted during Phase 3/4 plan execution and never cleaned up.

## Bug 2: Task immediately complete for Filha 2
- Task created and assigned to all 3 children.
- Filha 2's instance shows "COMPLETA!" immediately — before any completion action.
- Suspicion: existing completion record in DB from seed/test data, or task creation code has a bug that marks it complete on insert for some children.

## Current Focus

- hypothesis: Seed/test data was inserted during plan execution and not cleaned up; task completion record pre-exists for Filha 2's profile
- test: Check DB for wishlist_goals and task_completions rows — look for records with created_at near Phase 3/4 execution timestamps or with test/seed markers
- expecting: Find rows in DB that were never created through the UI flow
- next_action: gather initial evidence

## Evidence

- timestamp: 2026-06-08T00:00:00Z
  finding: >
    BUG 1 — Os itens "Bicicleta Nova" e "Jogo de Tabuleiro" NÃO vêm do banco de dados.
    Estão hardcoded no componente balance/page.tsx como constante DREAM_ITEMS (linhas 10-13).
    A constante é renderizada diretamente no JSX sem consultar nenhuma tabela wishlist.
    Não há tabela wishlist_goals no schema — ela simplesmente não existe ainda.
  file: src/app/(app)/child/[childId]/balance/page.tsx
  lines: 10-13

- timestamp: 2026-06-08T00:00:00Z
  finding: >
    BUG 2 — O badge "COMPLETA!" para Filha 2 NÃO vem do banco de dados nem de seed data.
    Em family/tasks/page.tsx, o STAGE_MAP tem 3 entradas: Estágio 1/5, Estágio 2/5, e "Completa!" (índice 2).
    O estado de cada card é determinado por `idx % STAGE_MAP.length` onde idx é a posição na lista de tasks.
    Quando o usuário cria uma tarefa para 3 filhos, são inseridas 3 rows em task_templates.
    A query getActiveTasksForFamily retorna todas ordenadas por createdAt implícito.
    O terceiro task (idx=2) recebe `stage = STAGE_MAP[2]` que é `{ label: 'Completa!', completed: true }`.
    Filha 2 aparece como "COMPLETA!" porque é a terceira task retornada (índice 2 % 3 = 2).
  file: src/app/family/tasks/page.tsx
  lines: 20-23, 215-218

## Eliminated Hypotheses

- Seed data ou fixtures no banco de dados: ELIMINADO — nenhum arquivo seed.ts/seed.sql encontrado, migrations não contêm INSERT, e os dados em questão são hardcoded no frontend.
- Bug na lógica de criação de task que auto-completa: ELIMINADO — createTaskTemplate não tem lógica de completion, insere apenas em task_templates sem nenhum status de conclusão.
- task_completions table com dados fantasma: ELIMINADO — não existe tabela task_completions no schema atual (fase de completions ainda não foi implementada).

## Resolution

### Bug 1 — Phantom wishlist goals
- root_cause: Constante `DREAM_ITEMS` hardcoded em `src/app/(app)/child/[childId]/balance/page.tsx` linhas 10-13 com valores de placeholder nunca removidos durante desenvolvimento.
- fix: Remover a constante `DREAM_ITEMS` e substituir a seção de goals por estado vazio (ou conectar a uma futura tabela wishlist_goals quando implementada).

### Bug 2 — Task immediately complete for Filha 2
- root_cause: Em `src/app/family/tasks/page.tsx` o `STAGE_MAP` (linhas 20-23) é um array de 3 entradas de UI decorativa, e o estado de cada card é determinado por `idx % STAGE_MAP.length` (linha 216) — puramente posicional. Quando 3 tasks são criadas para 3 filhos, o terceiro item (índice 2) sempre recebe o stage "Completa!" independente do estado real.
- fix: Remover o uso de `STAGE_MAP[idx % STAGE_MAP.length]` para determinar estado de conclusão. O estado deve vir do banco de dados (quando a funcionalidade de conclusão for implementada) ou todos os cards devem mostrar "pendente" até que existam dados reais de conclusão.
