# Phase 3: Child Garden - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-21
**Phase:** 3-Child-Garden
**Areas discussed:** Dados do jardim, Rota pós-login, Versículo bíblico, Escopo da colheita

---

## Dados do jardim

| Option | Description | Selected |
|--------|-------------|----------|
| Seed data mockado | Página carrega dados fixos em hardcode ou arquivo seed. Fase 6 conecta ao backend real. | |
| Backend real já nesta fase | Chamar APIs existentes (tasks, child profile, ledger) já nesta fase. | |
| Props/params via URL + Server Component | Buscar dados do banco via Server Component (Drizzle direto, sem API REST). | |

**User's choice:** Seed data mockado

Pergunta de follow-up: como estruturar os dados mockados?

| Option | Description | Selected |
|--------|-------------|----------|
| Um estado fixo representativo | Ex: Sofia, 3 coins, 2/4 tarefas. Muda manualmente para testar. | |
| Constantes que testam todos os estágios | 4 objetos constantes (plant-a até plant-d) + estado colher disponível. | ✓ |
| Você decide | Deixa para o agente de planejamento definir. | |

**User's choice:** Constantes que testam todos os estágios
**Notes:** Necessário cobrir plant-a até plant-d + estado "colher disponível" para validação visual completa.

---

## Rota pós-login

| Option | Description | Selected |
|--------|-------------|----------|
| Navega para /child/[childId]/garden | PinScreen faz router.push após portão. Jardim é rota separada. | |
| Portão revela jardim na mesma página | Jardim renderiza atrás do portão desde o início (hidden). Sem navegação. | (inicialmente selecionado) |
| Navega para /child/[childId]/home | URL home em vez de garden. | |

**User's choice (final):** Navega para /child/[childId]/garden (rota separada)
**Notes:** Usuário inicialmente escolheu "portão revela jardim na mesma página" mas após reflexão reconheceu que complica o state management (duas telas no mesmo componente). Claude sugeriu rota separada como mais limpa — portão termina → `router.push('/child/[childId]/garden')`. Usuário confirmou essa estratégia.

Pergunta de follow-up: como a criança volta ao jardim depois?

| Option | Description | Selected |
|--------|-------------|----------|
| Bottom nav 'Jardim' navega para /child/[childId]/garden | Jardim tem URL própria para navegação direta. | ✓ |
| Sempre passa pelo PIN | Sem URL direta. Todo acesso via PIN. | |
| Você decide | Deixa para o planner definir. | |

**User's choice:** Bottom nav 'Jardim' navega para /child/[childId]/garden

---

## Versículo bíblico

| Option | Description | Selected |
|--------|-------------|----------|
| Array hardcoded no código | Lista fixa de 5-10 versículos no arquivo do componente. Simples. | |
| Tabela no banco de dados | Schema com tabela `bible_verses`. Flexível para futuro. Requer migração Drizzle. | ✓ |
| API externa (Bible API) | Busca de API externa. Dependência de internet. | |

**User's choice:** Tabela no banco de dados

Pergunta de follow-up: esta fase inclui a migração + seed?

| Option | Description | Selected |
|--------|-------------|----------|
| Esta fase cria a tabela + seed | Migração Drizzle nova + seed com 5-10 versículos sobre mordomia. | ✓ |
| Tabela já existe no schema | Schema já tem bible_verses. Só query no componente. | |
| Hardcoded por ora, banco depois | Array hardcoded agora, migra para banco em fase futura. | |

**User's choice:** Esta fase cria a tabela + seed

---

## Escopo da colheita

| Option | Description | Selected |
|--------|-------------|----------|
| Visual completo, sem chamada real de API | Overlay aparece ao clicar 'Colher'. Sem POST ao backend. Fase 6 conecta API-03. | ✓ |
| Incluir o endpoint harvest já nesta fase | Criar POST /api/child/[childId]/harvest aqui. Puxa Fase 6 para cá. | |
| Server Action mockada | Server Action `harvest()` que simula sucesso (sem DB real). | |

**User's choice:** Visual completo, sem chamada real de API

Pergunta de follow-up: após overlay fechar, o que o usuário vê?

| Option | Description | Selected |
|--------|-------------|----------|
| Jardim resetado (plant-a, 0 tarefas) | Estado visual reseta para o início. Simula novo ciclo. | |
| Jardim mantido no último estado | Botão 'Colher' some, overlay fecha. Jardim fica em plant-d com tarefas marcadas. | ✓ |
| Você decide | Deixa para o agente definir. | |

**User's choice:** Jardim mantido no último estado
**Notes:** Reset real de ciclo acontece na Fase 6 após API-03 ser implementada.

---

## Claude's Discretion

- Lógica exata de mapeamento `doneCount → stage` (quantas tarefas por estágio a/b/c/d)
- Texto do speech bubble contextual (GARD-07) para cada estado — tom cristão/encorajador
- Versículos específicos no seed (quais versículos sobre mordomia/colheita/generosidade)
- Posições fixas dos 20 confetes no overlay (evitar `Math.random()` em render)

## Deferred Ideas

- **API-03 (POST /harvest)** — endpoint real de colheita. Fase 6: API Integration.
- **Reset de ciclo real** — zerar tarefas e voltar plant-a persistido. Depende de API-03 + dados reais.
- **Dados reais do backend** — buscar tarefas, coins e perfil via API/Drizzle. Fase 6.
- **Bottom nav funcional** (CTASK-05) — ícone "Jardim" da nav. Fase 4: Child Tasks.
