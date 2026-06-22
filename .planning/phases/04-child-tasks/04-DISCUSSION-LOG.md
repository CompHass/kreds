# Phase 4: Child Tasks - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-22
**Phase:** 04-child-tasks
**Areas discussed:** Estrutura de página, Bottom Nav, Seed do cofrinho, Nav ativo

---

## Estrutura de Página

| Option | Description | Selected |
|--------|-------------|----------|
| Página única /garden | Scroll vertical com hero → tarefas → dízimo → cofrinho. Estado compartilhado trivial (já no GardenView). | ✓ |
| Rota separada /tasks | Subpágina separada, bottom nav navega entre rotas. Requer gerenciamento de estado entre páginas. | |

**User's choice:** Página única /garden (Recomendado)
**Notes:** Alinha com o design handoff que especifica "scroll vertical" em uma única tela.

---

## Bottom Nav

| Option | Description | Selected |
|--------|-------------|----------|
| Scroll anchor na mesma página | Cofrinho faz scroll até o card. Doar fica disabled/placeholder. | ✓ |
| Rotas separadas /savings e /give | Requer criar novas páginas mesmo que vazias. | |
| Somente visual (sem action) | Bottom nav puramente visual, sem navegação real. | |

**User's choice:** Scroll anchor na mesma página (Recomendado)
**Notes:** "Doar" fica como placeholder desabilitado — sem rota definida nesta fase.

---

## Seed do Cofrinho

| Option | Description | Selected |
|--------|-------------|----------|
| Estender GardenSeed | Adicionar `savings: number` e `goal: number` ao GardenSeed existente. Valores: savings=25, goal=100. | ✓ |
| Seed separado por componente | Card de cofrinho com constantes próprias independentes do GardenSeed. | |

**User's choice:** Estender GardenSeed (Recomendado)
**Notes:** Estado centralizado no GardenView, consistente com padrão da Fase 3.

---

## Nav Ativo (Bottom Nav)

| Option | Description | Selected |
|--------|-------------|----------|
| Jardim ativo por padrão + IntersectionObserver | Jardim ativo ao carregar. IntersectionObserver alterna ativo ao scrollar para seções. | ✓ |
| Sempre Jardim ativo | Sem lógica de scroll tracking. Simples. | |

**User's choice:** Jardim ativo por padrão (Recomendado)
**Notes:** Usar IntersectionObserver para alternar entre Jardim → Tarefas → Cofrinho conforme scroll.

---

## Claude's Discretion

- Texto secundário nos task cards (recompensa, data ou vazio)
- Ícones SVG do bottom nav (inline ou lib)
- Comportamento exato do scroll anchor (smooth, offset 80px)
- Texto/subtítulo dos cards além do especificado no design handoff

## Deferred Ideas

- **Backend real** — tarefas, dízimo e cofrinho via API. Fase 6.
- **Ícone "Doar"** — sem design/rota definida. Fase futura.
- **Rota /savings separada** — cofrinho como página própria. Não necessário nesta fase.
