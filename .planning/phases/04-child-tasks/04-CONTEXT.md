# Phase 4: Child Tasks - Context

**Gathered:** 2026-06-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Fase 4 entrega a tela completa de tarefas da criança como extensão da página `/child/[childId]/garden` existente: lista de task cards com toggle visual, card de dízimo com botão "Plantar", card de cofrinho com progress bar animada, e bottom nav fixo com 4 ícones. Tudo numa única página de scroll vertical sobre o jardim já entregue na Fase 3.

Dados desta fase: **seed mockado** — extensão do `GardenSeed` com campos `savings` e `goal`. Sem chamadas reais ao backend (Fase 6).

</domain>

<decisions>
## Implementation Decisions

### Estrutura de Página

- **D-01:** Página única `/child/[childId]/garden` — scroll vertical com hero do jardim (já existente) → lista de tarefas → card dízimo → card cofrinho → bottom nav fixo. Não há rota separada `/tasks`.
- **D-02:** `GardenView` (client component existente) é o componente raiz que gerencia todo o estado: `tasks`, `titheDone`, `savings`, `harvested`. Novos componentes de Fase 4 recebem state + handlers por props.

### Bottom Nav

- **D-03:** Bottom nav fixo 80px, 4 ícones: Jardim, Tarefas, Cofrinho, Doar.
- **D-04:** Fundo `rgba(248,247,242,.93)`, `backdrop-filter: blur(8px)`, `border-top: 1px solid #E7E2D6`.
- **D-05:** Navegação por scroll anchor: "Jardim" → topo da página, "Tarefas" → seção de task cards, "Cofrinho" → card de cofrinho. "Doar" fica desabilitado/placeholder (sem rota nesta fase).
- **D-06:** Ícone ativo usa IntersectionObserver para alternar estado: ao carregar, "Jardim" fica ativo (verde `#3E6B4F`). Ao scrollar para a seção de tarefas, "Tarefas" fica ativo. Ícone inativo usa stroke `#9AA092`.

### Task Cards

- **D-07:** Card pendente: `bg #fff`, `border #EDE9DF`. Card concluído: `bg #EEF3EA`, `border #D6E2CC`. Título pendente `#27372C`, concluído `#4E6E3E`. Transição `background .3s ease, border-color .3s ease`.
- **D-08:** Botão check 38×38px, `border-radius: 50%`. Desmarcado: `border #D7DBCC`, bg branco. Marcado: `bg #3E6B4F`, SVG checkmark branco. Ao marcar: chama `handleTaskComplete(taskId)` existente no GardenView (aciona rega + pop na planta).
- **D-09:** Task card inclui emoji + título. Sub (segundo texto) é Claude's Discretion — pode mostrar recompensa ou deixar vazio nesta fase.

### Card de Dízimo

- **D-10:** Card de dízimo aparece logo abaixo da lista de task cards. Ícone de flor (SVG ou emoji 🌸), título "Dízimo".
- **D-11:** Botão "Plantar": gradiente rosa `#C98AA0 → #A55E76`. Após clicar: `bg #B07E91`, label muda para "Feito ✓". Ação: seta `titheDone = true` no GardenView state — ativa flores decorativas no jardim hero (GARD-09, já implementado na Fase 3).
- **D-12:** Estado "Feito ✓" é visual apenas (sem POST ao backend). `titheDone` já existe no `GardenSeed` e no estado do `GardenView`.

### Card de Cofrinho

- **D-13:** Card de cofrinho aparece abaixo do card de dízimo. Exibe: meta (`goal`) em R$, valor salvo (`savings`) em R$, progress bar.
- **D-14:** Progress bar: 12px height, `border-radius: 999px`, gradiente `#5A8A66 → #3E6B4F`. Transição `width .6s cubic-bezier(.2,.8,.3,1)`.
- **D-15:** Valores mockados adicionados ao `GardenSeed`: `savings: number` e `goal: number`. Valor padrão: `savings: 25`, `goal: 100`. Todas as constantes existentes (SEED_STAGE_A..D, SEED_TITHE, SEED_HARVESTED) ganham esses campos.

### Claude's Discretion

- Texto secundário nos task cards (ex: recompensa, data) — pode omitir ou mostrar emoji + recompensa mockada.
- Ícones SVG do bottom nav — usar SVG inline ou lib de ícones seguindo padrão já adotado no projeto.
- Comportamento exato do scroll anchor (smooth scroll, offset de 80px pelo nav fixo).
- Texto/subtítulo do card de dízimo e cofrinho além dos especificados no design handoff.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design Handoff
- `design_handoff_kreds/README.md` — Seções "Kreds Kids Garden.dc.html" e "Lista de Tarefas": especificação de layout, cores, medidas, animações, bottom nav, card dízimo, card cofrinho.
- `design_handoff_kreds/Kreds Kids Garden.dc.html` — Protótipo interativo: inspecionar comportamento real de task toggle, dízimo, cofrinho e bottom nav.

### Código Existente (Fase 3)
- `src/components/garden/garden-view.tsx` — Client component raiz. Fase 4 estende este componente com novos handlers (`handleTithe`) e novos campos de estado derivados de `savings`/`goal`.
- `src/lib/seed/garden-seed.ts` — `GardenSeed` interface e constantes de seed. Fase 4 adiciona `savings: number` e `goal: number` à interface e às constantes existentes.
- `src/app/globals.css` — Animações CSS prontas: `kredsNew` (glow ring verde 1.2s), `kredsPop` (0.6s ease). Aplicar por classe diretamente.

### Requirements
- `.planning/REQUIREMENTS.md` §Tarefas da Criança (CTASK-01..05) — 5 requirements desta fase.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `GardenView` state: `tasks`, `setTasks`, `handleTaskComplete` — já implementados. Fase 4 adiciona `titheDone` como state interativo (hoje vem do seed mas não tem setter) e campos de cofrinho.
- `GardenSeed.titheDone` — boolean existente no seed. Adicionar setter para tornar interativo no GardenView.
- CSS variables de tokens (verde `#3E6B4F`, borders, bg) — disponíveis desde Fase 1.

### Established Patterns
- **Client Component** — `GardenView` é `'use client'`. Todos os novos componentes de interação (TaskCard, TitheCard, SavingsCard, BottomNav) devem ser client components ou receber handlers por props de GardenView.
- **Props por cima** — GardenView passa state + handlers para componentes filhos; filhos não gerenciam estado próprio (padrão Fase 3).
- **Scroll vertical** — página do jardim já é scroll vertical; novos cards seguem abaixo do hero/watertracker/harvestbutton existentes.

### Integration Points
- `GardenView` → adicionar `titheDone` como `useState` (hoje é derivado do seed, sem setter).
- `GardenSeed` interface → adicionar `savings: number`, `goal: number`.
- `GardenView` → adicionar handler `handleTithe()` que seta `titheDone = true`.
- Novos componentes em `src/components/tasks/` seguindo convenção do `src/components/garden/`.

</code_context>

<specifics>
## Specific Ideas

- Task toggle no card chama `handleTaskComplete(taskId)` — já existente no GardenView. Efeito de rega + pop na planta acontece automaticamente (Fase 3 já conectou).
- Clicar "Plantar" no dízimo → `titheDone = true` → flores decorativas aparecem no jardim hero via `DecorativeFlowers` component (já existente, condicionado a `seed.titheDone`).
- Bottom nav usa `position: fixed`, `bottom: 0`, `width: 100%` — garden page precisa de `padding-bottom: 80px` para não ocultar conteúdo.
- IntersectionObserver para alternar ícone ativo no bottom nav: criar refs para as seções (jardim, tarefas, cofrinho) e observar qual está visível.

</specifics>

<deferred>
## Deferred Ideas

- **Backend real** — buscar tarefas, dízimo e cofrinho da criança via API. Fase 6: API Integration.
- **Ícone "Doar"** — sem design/rota definida. Fase futura ou Fase 6.
- **Rota /savings separada** — cofrinho como página própria. Não necessário nesta fase (scroll anchor suficiente).
- **GARD-05 (drops ao concluir tarefa)** — animação de 5 drops animados (`kredsDrop`). Listado como pendente em REQUIREMENTS.md — verificar se já entregue na Fase 3 ou escopo da Fase 4.

</deferred>

---

*Phase: 4-Child-Tasks*
*Context gathered: 2026-06-22*
