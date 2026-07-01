# Phase 7: Guardian Profile - Context

**Gathered:** 2026-07-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Fase 7 entrega o drawer de perfil do guardian no painel desktop: dois acionadores (botão de inicial na sidebar inferior + badge do topbar) abrem um drawer lateral deslizante com nome e email do guardian (read-only, da sessão Zitadel) e botão de logout. `signOut()` do next-auth executa direto, redireciona para `/login`. Sem edição de campos, sem chamadas à API Zitadel, sem página dedicada.

</domain>

<decisions>
## Implementation Decisions

### Superfície do perfil

- **D-01:** Exibição via **drawer lateral** (desliza da direita), não página dedicada. Mesmo padrão visual do `TaskFormPanel` — abre sobre o painel existente sem navegação nova.
- **D-02:** Animação de **slide** na entrada e saída do drawer. Consistente com `kredsFadeIn` e padrão de animações do projeto.
- **D-03:** Ambos os acionadores (sidebar inferior + badge do topbar) abrem o mesmo drawer. Estado de abertura controlado por `useState` no componente raiz `ParentPanelView` (ou wrapper).

### Edição de campos

- **D-04:** Drawer é **somente visualização** — sem edição. Exibe nome + email do guardian vindos de `session.user` (next-auth / Zitadel). Campos read-only; nenhum Server Action de PATCH necessário.
- **D-05:** Dados exibidos: **nome** + **email** (da sessão). Sem foto/avatar Zitadel.

### Logout flow

- **D-06:** Botão "Sair" fica **somente dentro do drawer** — sem ícone extra na sidebar.
- **D-07:** Logout **sem confirmação** — clicar executa `signOut()` do next-auth diretamente e redireciona para `/login`. Sem dialog intermediário.

### Sidebar P button

- **D-08:** Botão no rodapé da sidebar: **círculo 32px verde (#3E6B4F) com inicial do nome do guardian em branco** — mesmo visual do badge já existente no `ParentTopbar`. Sem texto "P" fixo.
- **D-09:** Badge do `ParentTopbar` passa a ser **clicável** para abrir o drawer (além do botão da sidebar).

### Claude's Discretion

- Largura exata do drawer (sugestão: 320–360px, seguindo `TaskFormPanel`).
- Espaçamento interno, separadores e hierarquia visual dentro do drawer.
- Texto do botão de logout (ex: "Sair" ou "Encerrar sessão").
- Estado hover/focus do botão da sidebar e do badge do topbar.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Autenticação & Sessão

- `auth.ts` (root) — instância next-auth com Zitadel. `signOut()` aqui. `session.user.name` e `session.user.email` são os campos disponíveis.
- `src/middleware.ts` — middleware que protege `/family/*`. Drawer de perfil é client-side; sem nova rota, sem impacto no middleware.

### Componentes existentes (reutilizar)

- `src/components/parent/parent-sidebar.tsx` — sidebar 80px. Botão "P" no rodapé é placeholder; substituir por círculo com inicial do guardian.
- `src/components/parent/parent-topbar.tsx` — badge do usuário (inicial + nome). Tornar clicável para abrir o drawer.
- `src/components/parent/parent-panel-view.tsx` — componente raiz Client. Gerencia o estado do drawer via `useState` (mesmo padrão do `selectedTask` para o `TaskFormPanel`).

### Requirements & Roadmap

- `.planning/ROADMAP.md` §Phase 7: Guardian Profile — 3 critérios de sucesso desta fase.

### Design

- `design_handoff_kreds/README.md` — verificar se há seção de perfil/settings no handoff antes de planejar visuais do drawer.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `auth()` de `next-auth` — `session.user.name`, `session.user.email` disponíveis em Server Components e via `useSession()` em Client Components.
- `signOut` de `next-auth/react` — importar no Client Component do drawer; chamar com `{ callbackUrl: '/login' }`.
- `ParentSidebar` — já estruturado com área de nav icons + logo; rodapé é o ponto de inserção do botão de perfil.
- `ParentTopbar` — badge já renderiza inicial e nome; adicionar `onClick` e `cursor-pointer`.
- CSS variables `--color-kreds-primary` (#3E6B4F), `--color-kreds-card`, `--color-kreds-border` — usar no drawer.

### Established Patterns

- **Client component raiz** (`ParentPanelView`) gerencia estado local via `useState`; componentes filhos recebem props + handlers. Mesmo padrão para o estado `profileOpen: boolean`.
- **Props para baixo** — `ParentSidebar` e `ParentTopbar` recebem `onOpenProfile` como prop; chamam quando o usuário clica.
- **SSR page + client view** — `page.tsx` (Server Component) lê a sessão via `auth()` e passa `user.name` / `user.email` como props para `ParentPanelView`.

### Integration Points

- `ParentPanelView` recebe `guardianName` e `guardianEmail` como props (do SSR), repassa para o drawer.
- `ParentSidebar` recebe `guardianInitial` (primeira letra do nome) e `onOpenProfile`.
- `ParentTopbar` recebe `onOpenProfile` adicional ao `currentUserName` já existente.
- Novo componente: `src/components/parent/guardian-profile-drawer.tsx` — drawer lateral com nome, email e botão de logout.

</code_context>

<specifics>
## Specific Ideas

- Círculo de inicial: mesmo estilo do badge do `ParentTopbar` (32px, `#3E6B4F`, inicial branca) — consistência visual entre sidebar e topbar.
- Drawer desliza da direita — mesma direção do `TaskFormPanel` para não criar novo padrão de movimento.
- `signOut({ callbackUrl: '/login' })` — destino explícito evita redirect para `/` que depois redireciona novamente.

</specifics>

<deferred>
## Deferred Ideas

- **Edição de perfil no Zitadel** (mudar nome/email/senha) — fora do escopo v2.0; requereria chamada à Zitadel Management API.
- **Foto/avatar Zitadel** — URL de imagem do Zitadel não garantida para todos os usuários; diferido para refinamento futuro.
- **Ícone de logout na sidebar** como atalho rápido — sugerido mas rejeitado; um único ponto de saída é suficiente.
- **Página /profile dedicada** — modal/drawer atende o critério de sucesso sem criar nova rota.

</deferred>

---

*Phase: 7-Guardian-Profile*
*Context gathered: 2026-07-01*
