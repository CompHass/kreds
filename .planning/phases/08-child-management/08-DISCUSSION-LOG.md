# Phase 8: Child Management - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-01
**Phase:** 8-Child Management
**Areas discussed:** Navegação da lista, Form de adicionar filho, Definir/trocar PIN, Desativar/reativar

---

## Navegação da lista

| Option | Description | Selected |
|--------|-------------|----------|
| Nova rota /children | Segue padrão file-based já usado por /tasks. | ✓ |
| View alternada no ParentPanelView | Mantém tudo client-side numa SPA via useState. | |

**User's choice:** Nova rota /children

| Option | Description | Selected |
|--------|-------------|----------|
| Sim, layout.tsx compartilhado | Sidebar/Topbar saem do ParentPanelView e viram layout Server Component. | ✓ |
| Não, duplicar por página por ora | Cada página nova monta sua própria sidebar/topbar. | |

**User's choice:** Sim, layout.tsx compartilhado

| Option | Description | Selected |
|--------|-------------|----------|
| Sim, inclui refactor de /tasks | /tasks passa a consumir o layout compartilhado nesta fase. | ✓ |
| Não, só /children usa o layout novo | /tasks continua duplicando sidebar/topbar. | |

**User's choice:** Sim, inclui refactor de /tasks

| Option | Description | Selected |
|--------|-------------|----------|
| Sim, drawer sobe para o layout | GuardianProfileDrawer vira estado do layout compartilhado. | |
| Não, cada página mantém seu drawer | /children duplica o padrão de drawer/profileOpen de /tasks. | ✓ |

**User's choice:** Não, cada página mantém seu drawer
**Notes:** Refactor de layout compartilhado explicitamente inclui /tasks (Fases 5-7) nesta fase, mas o drawer de perfil (Fase 7) fica fora — decisão deliberada para conter escopo.

---

## Form de adicionar filho

| Option | Description | Selected |
|--------|-------------|----------|
| Nome + idade + cor (sem avatar preset) | avatarPreset fica com valor derivado fixo. | ✓ |
| Nome + idade + cor + avatar preset | Exigiria criar novos assets de avatar. | |

**User's choice:** Nome + idade + cor (sem avatar preset)

| Option | Description | Selected |
|--------|-------------|----------|
| Paleta fixa de swatches | Grade de 6-8 cores pré-definidas, consistente com design system. | |
| Color picker livre | Input de cor nativo do navegador, mais flexível. | ✓ |

**User's choice:** Color picker livre

| Option | Description | Selected |
|--------|-------------|----------|
| Inicial do nome como preset | avatarPreset = 'initial' fixo. | ✓ |
| Placeholder genérico | avatarPreset = 'default' sem significância visual. | |

**User's choice:** Inicial do nome como preset

| Option | Description | Selected |
|--------|-------------|----------|
| Painel lateral (TaskFormPanel) | Reaproveita layout/animação já estabelecidos. | ✓ |
| Modal centralizado | Padrão novo — nenhum modal existe ainda no código. | |

**User's choice:** Painel lateral (TaskFormPanel)

---

## Definir/trocar PIN

| Option | Description | Selected |
|--------|-------------|----------|
| Teclado numérico 3×4 (mesmo do login) | Reaproveita componente do CAUTH-01. | ✓ |
| Input simples de 4 dígitos | 4 caixas de texto numéricas, mais rápido de implementar. | |

**User's choice:** Teclado numérico 3×4 (mesmo do login)

| Option | Description | Selected |
|--------|-------------|----------|
| Não — PIN nunca é exibido em texto | pinHash bcrypt é unidirecional, impossível reverter. | |
| Sim — backend passa a guardar PIN reversível | Mudaria pinHash de bcrypt para algo reversível. | ✓ |

**User's choice:** Sim — backend passa a guardar PIN reversível
**Notes:** Claude sinalizou explicitamente o conflito com D-10 da Fase 2 (bcrypt cost 10, decisão de segurança travada) antes de prosseguir.

| Option | Description | Selected |
|--------|-------------|----------|
| Manter hash bcrypt — só Redefinir (recomendado) | Preserva D-10 sem alteração de schema/segurança. | |
| Confirmo reversível — quero Mostrar/Ocultar funcional | Aceito enfraquecer o hash para permitir visualização. | ✓ |

**User's choice:** Confirmo reversível — quero Mostrar/Ocultar funcional
**Notes:** Usuário confirmou explicitamente após segundo aviso de segurança.

| Option | Description | Selected |
|--------|-------------|----------|
| Sim — pinHash (login) + pinEncrypted (exibição) separados | Dois campos com propósitos distintos, preserva D-10. | ✓ |
| Não — substituir pinHash inteiro por reversível | Removeria bcrypt do fluxo de autenticação testado. | |

**User's choice:** Sim — pinHash (login) + pinEncrypted (exibição) separados
**Notes:** Abordagem de mitigação proposta por Claude para resolver o tradeoff de segurança sem tocar no fluxo de autenticação já testado (child-guard.ts). Aceita pelo usuário.

---

## Desativar/reativar

| Option | Description | Selected |
|--------|-------------|----------|
| Confirmação (dialog) | Ação sensível — bloqueia login imediatamente. Primeiro dialog do projeto. | ✓ |
| Toggle instantâneo | Mesmo padrão de PTASK-04, sem fricção extra. | |

**User's choice:** Confirmação (dialog)

| Option | Description | Selected |
|--------|-------------|----------|
| Só bloqueia novo login | Sem revogação ativa de JWT — sessão atual expira sozinha (máx 8h). | ✓ |
| Derruba sessão na hora | Exige checar 'active' em toda requisição autenticada (child-guard.ts). | |

**User's choice:** Só bloqueia novo login

---

## Claude's Discretion

- Texto exato dos botões (labels).
- Estilo visual do diálogo de confirmação (primeiro modal do projeto).
- Layout exato do card de filho na lista (baseado no Frame C, adaptado para lista).
- Mensagem de erro/estado para tentativa de login de filho desativado.
- Escolha de biblioteca/padrão para o diálogo modal (Radix Dialog primitive já recomendado no CLAUDE.md).

## Deferred Ideas

- "Ver atividade" (Frame C do handoff) — pertence à Fase 9: Reports.
- Avatar preset customizável (ilustrações/emojis) — sem assets no design handoff.
- Unificação de GuardianProfileDrawer no layout compartilhado — rejeitada para conter escopo.
- Revogação ativa de sessão JWT ao desativar filho — rejeitada por escopo; child-guard.ts não é alterado.
