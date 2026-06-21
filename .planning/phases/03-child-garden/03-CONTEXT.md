# Phase 3: Child Garden - Context

**Gathered:** 2026-06-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Fase 3 entrega a tela principal da criança (`/child/[childId]/garden`) com o jardim interativo completo: header com avatar/coins, hero 316px com sol/nuvens/planta em estágio correto, tracker de água, speech bubble contextual, flores decorativas ao separar dízimo, botão "Colher" quando todas tarefas concluídas, e overlay de celebração com confetes + versículo bíblico.

Dados desta fase: **seed mockado com constantes cobrindo todos os estágios** (plant-a até plant-d + estado colher disponível). Backend real conectado na Fase 6.

Colheita: **visual completo sem API real** — overlay aparece ao clicar "Colher", jardim mantém último estado ao voltar. API-03 (POST /harvest) implementado na Fase 6.

</domain>

<decisions>
## Implementation Decisions

### Dados do Jardim

- **D-01:** Dados são **seed mockado** — constantes cobrindo todos os 4 estágios de planta (plant-a até plant-d) + estado "colher disponível" (todas tarefas concluídas). Nenhuma chamada real ao backend nesta fase.
- **D-02:** Estrutura das constantes permite testar cada estado do jardim sem mudar código — suficiente para validação visual completa desta fase.

### Rota e Navegação

- **D-03:** PinScreen faz `router.push('/child/[childId]/garden')` **após portão fechar** (animação cubic-bezier 1s completa). Jardim é rota separada — portão termina na PinScreen, jardim é página própria.
- **D-04:** URL canônica do jardim: `/child/[childId]/garden` dentro do route group `(child)`.
- **D-05:** Bottom nav futura (Fase 4, CTASK-05) terá ícone "Jardim" que navega para `/child/[childId]/garden` diretamente (sem passar pelo PIN — sessão já existe).

### Versículo Bíblico

- **D-06:** Versículo exibido no overlay de celebração (GARD-10) vem de **tabela `bible_verses` no banco de dados**.
- **D-07:** **Esta fase inclui** migração Drizzle para criar a tabela `bible_verses` + seed inicial com 5–10 versículos sobre mordomia, colheita e generosidade.
- **D-08:** Seleção: aleatória (random) por query simples.

### Escopo da Colheita

- **D-09:** Botão "Colher" (GARD-08) ao ser clicado: exibe overlay completo (20 confetes kredsConfetti, card de versículo, botão "Voltar ao jardim"). **Sem POST ao backend nesta fase.**
- **D-10:** Ao fechar overlay ("Voltar ao jardim"): jardim mantém último estado visual (plant-d, tarefas todas marcadas, botão "Colher" some). Reset real de ciclo implementado na Fase 6 após API-03.

### Claude's Discretion

- Lógica exata de mapeamento `doneCount → stage` (quantas tarefas por estágio a/b/c/d) — seguir o design handoff ou decidir proporcionalmente ao total de tarefas do seed.
- Texto do speech bubble contextual (GARD-07) para cada estado do jardim — tom cristão/encorajador, decidir por Claude baseado no design handoff.
- Número exato de versículos no seed e quais — escolher versículos sobre mordomia/colheita/generosidade.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design Handoff
- `design_handoff_kreds/README.md` — Especificação completa do jardim (seção "Frame G: App da Criança — Jardim Interativo"): layout 392×812px, hero 316px, medidas, cores, animações, speech bubbles, flores, glow de colheita, overlay de celebração.
- `design_handoff_kreds/Kreds Kids Garden.dc.html` — Protótipo interativo da criança (jardim + tarefas + cofrinho). Abrir no browser para inspecionar comportamento real.

### Assets Visuais
- `design_handoff_kreds/garden/plant-a.png` — Estágio 0 (semente/broto inicial)
- `design_handoff_kreds/garden/plant-b.png` — Estágio 1 (broto)
- `design_handoff_kreds/garden/plant-c.png` — Estágio 2 (planta jovem)
- `design_handoff_kreds/garden/plant-d.png` — Estágio 3 (árvore com frutas)

### Animações (já implementadas na Fase 1)
- `src/app/globals.css` — Todas as animações do jardim já existem como keyframes e variáveis CSS: `kredsSun`, `kredsDrift1`, `kredsDrift2`, `kredsDrop`, `kredsPop`, `kredsBubble`, `kredsFruit`, `kredsConfetti`, `kredsNew`. Aplicar por classe diretamente.

### Backend/Schema
- `src/lib/db/schema/index.ts` — Schema Drizzle existente. Esta fase adiciona tabela `bible_verses`. Verificar imports e convenções de naming antes de criar migração.
- `src/app/(child)/child/[childId]/login/page.tsx` — PinScreen existente. D-03 requer adicionar `router.push` após portão fechar.

### Requirements
- `REQUIREMENTS.md` §Jardim da Criança (GARD-01..10) — 10 requirements desta fase.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/globals.css`: todas animações do jardim prontas (`--animate-kreds-*`) — aplicar diretamente por classe Tailwind ou `style={{ animation: 'var(--animate-kreds-sun)' }}`.
- `src/app/(child)/child/[childId]/login/page.tsx`: PinScreen existente — adicionar `router.push('/child/[childId]/garden')` no callback de portão completo.
- Design tokens (verde `#3E6B4F`, fundos, bordas) — disponíveis como variáveis CSS desde Fase 1.

### Established Patterns
- **Route group `(child)`** — novo jardim vai em `src/app/(child)/child/[childId]/garden/page.tsx`. Middleware já protege `/child/**` com `child-session`.
- **Server Components** — página pode ser async Server Component para seed data; sem Server Action necessária nesta fase (sem mutação).
- **Drizzle ORM** — `db` export de `src/lib/db/` para query do versículo. Migração seguindo padrão das migrations existentes.

### Integration Points
- `src/app/(child)/child/[childId]/login/page.tsx` → adicionar `router.push` após portão
- `src/lib/db/schema/index.ts` → adicionar tabela `bible_verses`
- Middleware já protege `/child/[childId]/garden` automaticamente (padrão `/child/**` do middleware existente)

</code_context>

<specifics>
## Specific Ideas

- Portão abre (cubic-bezier 1s na PinScreen) → ao completar a animação, `router.push('/child/[childId]/garden')` — a transição é imperceptível porque o jardim já aparecia atrás do portão visualmente.
- Tracker de água (GARD-04): 4 dots — azul `#6E9BA0` se rega feita, branco semi-transparente se não. Estado calculado a partir de tarefas concluídas no seed.
- Flores decorativas (GARD-09): SVG inline de flores aparecem no hero do jardim quando "dízimo" está marcado (campo booleano no seed).
- Glow de colheita: circle radial amarelo absolute ao redor da planta, visível somente quando `canHarvest = true` (todas tarefas concluídas).
- Overlay de celebração (GARD-10): 20 `<div>` com `animation: var(--animate-kreds-confetti)` distribuídos em posições aleatórias fixas (evitar `Math.random()` em render — gerar array estático).

</specifics>

<deferred>
## Deferred Ideas

- **API-03 (POST /harvest)** — endpoint real de colheita que registra no ledger. Fase 6: API Integration.
- **Reset de ciclo real** — após colheita, zerar tarefas e voltar plant-a com dados persistidos. Depende de API-03 + dados reais (Fase 6).
- **Dados reais do backend** — buscar tarefas, coins e perfil da criança via API/Drizzle. Fase 6 conecta toda a UI ao backend.
- **Bottom nav funcional** (CTASK-05) — ícone "Jardim" da nav. Escopo da Fase 4 (Child Tasks).

</deferred>

---

*Phase: 3-Child-Garden*
*Context gathered: 2026-06-21*
