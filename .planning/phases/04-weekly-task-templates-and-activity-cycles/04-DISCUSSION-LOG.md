# Phase 4: Weekly Task Templates and Activity Cycles - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-06
**Phase:** 04-weekly-task-templates-and-activity-cycles
**Areas discussed:** Task template lifecycle, Ciclo Sunday-Saturday, Ativação e desativação de tasks

---

## Task Template Lifecycle

| Option | Description | Selected |
|--------|-------------|----------|
| Edit livre | Guardian edita diretamente. Ledger snapshot preserva valor no momento da aprovação. Mais simples. | ✓ |
| Imutável após criação | Para alterar, guardian desativa e cria nova. Garante integridade mas cria proliferação. | |
| Edit com versões | Cada edição gera nova versão. Completions referenciam snapshot. Mais complexo. | |

**User's choice:** Edit livre
**Notes:** Valor snapshot acontece no momento da aprovação (Phase 5 responsability), não no momento da edição do template.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Valor atual no momento da aprovação | Phase 5 snapshot kreds_value quando guardian aprova. | ✓ |
| Valor fixo na criação da completion | Snapshot no submit, não na aprovação. | |

**User's choice:** Valor atual no momento da aprovação

---

| Option | Description | Selected |
|--------|-------------|----------|
| Uma template por filho | assigned_child_id FK. Guardian cria templates separadas para irmãos. Simples. | ✓ |
| Template compartilhada | Template pode ser atribuída a múltiplos filhos. Mais flexível mas complexo. | |

**User's choice:** Uma template por filho

---

## Ciclo Sunday-Saturday

| Option | Description | Selected |
|--------|-------------|----------|
| Cálculo dinâmico | getCycleForDate(date, timezone) puro. Zero registros de ciclo. | ✓ |
| Registros de ciclo explícitos | activity_cycle table com start_date/end_date. Permite metadados por ciclo. | |

**User's choice:** Cálculo dinâmico
**Notes:** Função pura exportada para consumo da Phase 5 (72-hour rule).

---

| Option | Description | Selected |
|--------|-------------|----------|
| API interna + página de tasks ativa | getCycleForDate + rota/página mostrando tasks da semana atual. | ✓ |
| Só lógica interna | Nenhuma página na Phase 4. Só exportado para Phase 5. | |

**User's choice:** API interna + página de tasks ativa

---

| Option | Description | Selected |
|--------|-------------|----------|
| Domingo sempre é Day 0 | Princípio bíblico da semana. Independente de locale. | ✓ |
| Configurável por família | Cada família escolhe o dia de início. Mais flexível mas complexo. | |

**User's choice:** Domingo sempre é Day 0

---

## Ativação e desativação de tasks

| Option | Description | Selected |
|--------|-------------|----------|
| Campo is_active + deactivated_at | Boolean + timestamp. Toggle simples. | ✓ |
| Tabela de histórico de ativação | task_activation_log. Histórico completo mas complexo. | |

**User's choice:** is_active + deactivated_at

---

| Option | Description | Selected |
|--------|-------------|----------|
| Oculta por padrão com toggle 'mostrar inativas' | Menos ruído na UI principal. | ✓ |
| Sempre visível com badge 'inativa' | Mais simples de implementar. | |

**User's choice:** Oculta por padrão com toggle

---

| Option | Description | Selected |
|--------|-------------|----------|
| Não — desativação bloqueia submissions imediatamente | Sistema simples. Phase 5 verifica is_active. | ✓ |
| Sim — tasks ativas no início do ciclo podem ser completadas até o fim | Ciclo snapshot. Mais justo mas requer lógica extra. | |

**User's choice:** Desativação imediata sem mid-cycle snapshot

---

## Claude's Discretion

- Exact table name (`task_templates` vs `tasks`)
- Column names, form layout, route structure, copy wording
- Cycle page URL structure
- How guardian navigates between task list and task creation form

## Deferred Ideas

- Task completion submission and approval (Phase 5)
- Kreds posting from task approval (Phase 5)
- Weekly gratitude report (later phase)
- Cycle snapshot for mid-cycle deactivation (may revisit if fairness issues surface)
- Shared templates for multiple siblings (future phase)
- Task recurrence rules beyond weekly (out of scope v1)
