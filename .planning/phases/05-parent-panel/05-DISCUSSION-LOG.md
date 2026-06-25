# Phase 5: Parent Panel - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-24
**Phase:** 05-parent-panel
**Areas discussed:** URL & navegação pós-login, Schema + dados desta fase, Painel direito (form), State management

---

## URL & Navegação pós-login

### Roteamento

| Option | Description | Selected |
|--------|-------------|----------|
| `/family/[familyId]/tasks` | familyId na URL, contínuo com /family/access/[familyId]. SSR lê params + session. | ✓ |
| `/guardian/tasks` | URL limpa, sem familyId explícito. Backend resolve via session. Precisa de lookup extra. | |
| `/family/tasks` | Sem familyId. Simples mas não escala se guardian tiver múltiplas famílias. | |

**User's choice:** `/family/[familyId]/tasks`
**Notes:** Consistente com o padrão de URL estabelecido em Fase 2.

### Redirect pós-login

| Option | Description | Selected |
|--------|-------------|----------|
| `/family/[familyId]/tasks` | Direto ao painel. Backend resolve familyId via family_memberships. | ✓ |
| `/family/access/[familyId]` | Tela de seleção de perfil primeiro. Mais cliques. | |
| Manter redirect atual | Não mexer no fluxo de login. Guardian navega manualmente. | |

**User's choice:** `/family/[familyId]/tasks`

---

## Schema + Dados desta fase

### Campos novos no schema

| Option | Description | Selected |
|--------|-------------|----------|
| Sim — adicionar category/days/approval + drizzle push | Sem breaking change. Fase 6 encontra campos prontos. | ✓ |
| Não — mock puro sem schema | Mais rápido agora, retrabalho na Fase 6. | |

**User's choice:** Adicionar ao schema + drizzle-kit push nesta fase.

### Camada de dados

| Option | Description | Selected |
|--------|-------------|----------|
| Seed mock (padrão fases 3-4) | UI completa com dados fixos tipados. Sem dep. de API. | ✓ |
| API real já nesta fase | Phase 5 cria endpoints + UI. Fase 6 fica menor. | |

**User's choice:** Seed mock.

---

## Painel direito (form)

### Estado inicial

| Option | Description | Selected |
|--------|-------------|----------|
| Sempre visível com placeholder | Sem shift de layout. Placeholder elegante. | ✓ |
| Oculto — abre ao clicar +/lápis | Slide-in. Mais mobile-like. | |
| Aberto em modo Create por padrão | Incentiva criação imediata, pode confundir na 1ª visita. | |

**User's choice:** Sempre visível com placeholder.

### Create vs Edit

| Option | Description | Selected |
|--------|-------------|----------|
| Mesmo form, botão muda | Header + botão adaptam. Excluir só em Edit. | ✓ |
| Forms separados | Mais explícito, muita duplicação de JSX. | |
| Stepper/wizard | Muito elaborado para o design handoff. | |

**User's choice:** Mesmo form com header e botões adaptados.

### Trigger de criação

| Option | Description | Selected |
|--------|-------------|----------|
| Botão + no topbar/área principal | Explícito, visível, limpa form e entra em Create. | ✓ |
| Clicar em área vazia do painel | Menos explícito. | |
| Sem botão — só via lápis | Confuso. | |

**User's choice:** Botão "+ Nova tarefa" no topbar/área principal.

---

## State Management

### Abordagem CRUD

| Option | Description | Selected |
|--------|-------------|----------|
| useState puro — padrão GardenView | Mutações atualizam array localmente. Sem reload. Consistente com fases anteriores. | ✓ |
| Server Actions + revalidatePath | Mais robusto para persistência, latency visível, padrão diferente. | |
| Server Actions + useOptimistic | Melhor dos dois mundos, mais complexo. | |

**User's choice:** `useState` puro.

### Flash kredsNew (PTASK-09)

| Option | Description | Selected |
|--------|-------------|----------|
| No card da tarefa recém-salva | Alinhado com design handoff. Glow ring 1.2s no card. | ✓ |
| No painel direito inteiro | Menos preciso. | |
| Claude decide | Deixar para executor. | |

**User's choice:** No card correspondente na lista.

---

## Claude's Discretion

- Ícones exatos da sidebar
- Textos de placeholder no painel direito além do especificado
- Animação de entrada/saída do painel direito
- Avatar das crianças nos filter chips (inicial vs avatarPreset)
- Ordenação dos task cards na lista

## Deferred Ideas

- Endpoints reais de tasks (GET/POST/PATCH/DELETE) → Fase 6
- Fluxo de aprovação completo → fora do escopo v2.0
- Onboarding de nova família / adicionar filho → fora do escopo v2.0
- Ajuste maior no callbackUrl pós-Zitadel → avaliar na Fase 6
