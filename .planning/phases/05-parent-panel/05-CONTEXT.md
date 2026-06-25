# Phase 5: Parent Panel - Context

**Gathered:** 2026-06-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Fase 5 entrega o painel desktop do responsável para gerenciar tarefas da família — layout 1180px com sidebar (80px) + área principal + painel direito fixo (336px). CRUD completo: criar, editar, ativar/desativar e excluir tarefas. Inclui topbar 64px, filter chips por filho, task cards com toggle e lápis, e o form de criação/edição no painel direito.

Dados desta fase: **seed mock tipado** — sem chamadas reais ao backend (Fase 6 faz a integração). Schema `taskTemplates` recebe novos campos (`category`, `days`, `approval`) e `drizzle-kit push` roda nesta fase para preparar o banco.

Rota nova: `/family/[familyId]/tasks` — responsável chega aqui após login Zitadel.

</domain>

<decisions>
## Implementation Decisions

### URL & Navegação

- **D-01:** Rota do painel: `/family/[familyId]/tasks`. Usa `familyId` real na URL, contínuo com `/family/access/[familyId]` existente. SSR lê `familyId` dos params + resolve via `auth()` session.
- **D-02:** Redirect pós-login: após autenticação Zitadel bem-sucedida, responsável é redirecionado para `/family/[familyId]/tasks`. Backend resolve `familyId` do guardian logado via `family_memberships` (schema existente).

### Schema & Dados

- **D-03:** Novos campos em `taskTemplates`: `category` (text, nullable), `days` (jsonb array de strings D/S/T/Q/Q/S/S, nullable), `approval` (boolean, default false). Adicionar ao schema Drizzle + rodar `drizzle-kit push` nesta fase. Colunas nullable/com default — sem breaking change.
- **D-04:** Dados da UI: seed mock tipado (mesmo padrão das Fases 3-4). Nenhum endpoint real consumido nesta fase. Fase 6 conecta as chamadas reais de API.

### Painel Direito (Form)

- **D-05:** Estado inicial: painel sempre visível com placeholder elegante (ex: "Selecione uma tarefa ou clique em + para criar"). Sem shift de layout ao abrir/fechar.
- **D-06:** Create vs Edit no mesmo form — header e botões mudam: modo Create ("Nova tarefa" / botão "Salvar tarefa" verde); modo Edit ("Editar tarefa" / botão "Atualizar" verde + botão "Excluir" laranja/vermelho — PTASK-10, só aparece em modo Edit).
- **D-07:** Trigger de criação: botão "+ Nova tarefa" no topbar ou acima da lista na área principal. Clicar limpa o form e entra no modo Create.
- **D-08:** Trigger de edição: clicar no botão lápis (✏️) de um task card carrega os dados da tarefa no painel direito e entra em modo Edit.

### State Management

- **D-09:** Client component raiz (`ParentPanelView`) gerencia a lista de tasks via `useState`. Mutações (criar/editar/deletar/toggle) atualizam o array localmente (otimista). Sem reload de página, sem Server Actions nesta fase. Mesmo padrão do `GardenView` das fases 3-4.
- **D-10:** Flash `kredsNew` (PTASK-09): ao adicionar ou salvar tarefa, o card correspondente na lista recebe a classe `kredsNew` (glow ring verde 1.2s). Controlado por `newTaskId` state que é limpo após a animação.

### Claude's Discretion

- Ícones exatos da sidebar (SVGs inline ou lib seguindo padrão do projeto).
- Textos de placeholder no painel direito além do especificado.
- Animação de entrada/saída do painel direito (se presente).
- Avatar das crianças nos filter chips (inicial ou `avatarPreset` existente).
- Ordenação dos task cards na lista.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design Handoff

- `design_handoff_kreds/README.md` — Seções "Parent Panel" / "Painel de Tarefas dos Pais": tokens, medidas, categorias com cores, layout sidebar/topbar/painel direito.
- `design_handoff_kreds/Kreds Parents Panel.dc.html` — Protótipo interativo: inspecionar comportamento real dos task cards, filter chips, form, stepper de recompensa, pills de recorrência.

### Schema & Banco

- `src/lib/db/schema/index.ts` — `taskTemplates` table (linhas 177-230). Novos campos a adicionar: `category`, `days`, `approval`. Também consultar `childProfiles` (familyId, displayName, avatarPreset, accentColor) para filter chips.
- `src/lib/db/index.ts` — instância Drizzle. Usar para queries SSR na page.

### Autenticação (Padrão Fase 2)

- `src/app/family/access/[familyId]/page.tsx` — Padrão SSR com `auth()` + redirect: replicar para a nova rota `/family/[familyId]/tasks`.
- `auth.ts` (root) — instância next-auth configurada com Zitadel.
- `src/middleware.ts` — middleware que protege `/family/*`. Verificar se `/family/[familyId]/tasks` já está coberto.

### Requirements

- `.planning/REQUIREMENTS.md` §Painel de Tarefas dos Pais (PTASK-01..10) — 10 requirements desta fase.
- `.planning/ROADMAP.md` §Phase 5: Parent Panel — Success Criteria.

### CSS & Animações

- `src/app/globals.css` — `kredsNew` (glow ring verde 1.2s, `--animate-kreds-new`) pronta para uso por classe.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `auth()` de `next-auth` — usar na page SSR para obter session + familyId do guardian.
- `db` de `@/lib/db` — instância Drizzle para queries server-side.
- `childProfiles` schema — buscar filhos da família para filter chips (displayName, accentColor, avatarPreset).
- `taskTemplates` schema — buscar tarefas da família (após adicionar campos novos).
- CSS variables de tokens — verde `#3E6B4F`, bordas, fundos — disponíveis desde Fase 1.
- Animação `kredsNew` — já em `globals.css`, aplicar por classe `animate-kreds-new`.

### Established Patterns

- **Client component raiz** — `GardenView` é o modelo: recebe dados via props (server → client boundary), gerencia todo o estado interno com `useState`.
- **Props para baixo** — componentes filhos recebem state + handlers; não gerenciam estado próprio.
- **SSR page + client view** — page.tsx (Server Component) faz queries, passa dados para `<ParentPanelView>` (Client Component). Replicar da `src/app/(child)/child/[childId]/garden/page.tsx`.
- **Autenticação SSR** — `auth()` + `redirect('/login')` se sem session. Checar também que `familyId` da URL pertence ao guardian logado via `familyMemberships`.

### Integration Points

- Nova rota: `src/app/family/[familyId]/tasks/page.tsx` (Server Component).
- Novo client component: `src/components/parent/parent-panel-view.tsx` (Client Component raiz).
- Schema: `src/lib/db/schema/index.ts` — adicionar `category`, `days`, `approval` ao `taskTemplates`.
- Middleware: verificar se `/family/[familyId]/tasks` já coberto ou se precisa ajuste em `src/middleware.ts`.
- Redirect pós-login: ajustar `callbackUrl` ou `signIn` redirect em `src/app/login/page.tsx` ou `auth.ts`.

</code_context>

<specifics>
## Specific Ideas

- Filter chips: "Todas" sempre presente, + um chip por criança da família com mini avatar (inicial ou preset). Chip selecionado: fundo verde `#3E6B4F`, texto branco. Chip inativo: off-white com borda suave.
- Stepper de recompensa (PTASK-07): valor zero mostra "Mordomia" em verde; valor > 0 mostra "R$ X".
- Pills de recorrência (PTASK-08): D/S/T/Q/Q/S/S — selecionada em verde + botão "Todos os dias" atalho.
- 5 categorias (PTASK-05): quarto, higiene, estudos, casa, espiritual — cada uma com cor e ícone SVG distintos.

</specifics>

<deferred>
## Deferred Ideas

- **Endpoints reais de tasks (GET/POST/PATCH/DELETE)** — Fase 6: API Integration.
- **Fluxo de aprovação** (notificação → confirmar → creditar) — fora do escopo v2.0 (vide REQUIREMENTS.md).
- **Onboarding de nova família / adicionar filho** — fora do escopo v2.0.
- **Ajuste do callbackUrl pós-login** — se o redirect pós-Zitadel precisar de mudança maior no fluxo OIDC, avaliar na Fase 6 junto com integração completa.

</deferred>

---

*Phase: 5-Parent-Panel*
*Context gathered: 2026-06-24*
