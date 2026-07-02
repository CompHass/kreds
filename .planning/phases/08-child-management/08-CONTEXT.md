# Phase 8: Child Management - Context

**Gathered:** 2026-07-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Fase 8 entrega o módulo de gerenciamento de filhos no painel do guardian: ícone "Crianças" na sidebar (já existe como placeholder inativo) abre uma página dedicada com lista de filhos da família, formulário lateral para adicionar novo filho (nome, idade, cor), fluxo de definir/redefinir PIN de 4 dígitos, e desativação/reativação de perfil. Inclui refactor de layout: sidebar/topbar saem do `ParentPanelView` e viram um `layout.tsx` compartilhado em `/family/[familyId]/`, consumido tanto pela rota nova (`/children`) quanto pela rota existente (`/tasks`).

</domain>

<decisions>
## Implementation Decisions

### Navegação e estrutura de rotas

- **D-01:** Nova rota `/family/[familyId]/children` (Server Component page), seguindo o padrão file-based já usado por `/family/[familyId]/tasks`.
- **D-02:** Extrair `src/app/family/[familyId]/layout.tsx` compartilhado contendo `ParentSidebar` + `ParentTopbar`. Ambas as rotas (`/tasks` e `/children`) plugam apenas o conteúdo principal como `children`.
- **D-03:** Refactor de `/tasks` (Fases 5-7) para consumir o layout compartilhado está DENTRO do escopo da Fase 8 — não duplicar sidebar/topbar na rota nova.
- **D-04:** `GuardianProfileDrawer` e o estado `profileOpen` (Fase 7) NÃO sobem para o layout compartilhado — cada página (`/tasks`, `/children`) mantém seu próprio drawer e estado local, replicando o padrão já usado em `ParentPanelView`.
- **D-05:** Ícone "Crianças" na sidebar (já existe em `parent-sidebar.tsx`, atualmente sem `onClick`/rota) ganha `href`/navegação para `/family/[familyId]/children` e passa a refletir estado "ativo" quando a rota atual for `/children` (mesmo padrão visual do ícone "Tarefas" hoje).

### Form de adicionar filho

- **D-06:** Campos do form: `displayName`, `ageYears`, `accentColor`. SEM seletor de `avatarPreset` — nenhum preset de avatar existe no design handoff.
- **D-07:** `accentColor` escolhida via color picker livre (`<input type="color">` nativo do navegador) — não uma paleta fixa de swatches.
- **D-08:** `avatarPreset` recebe valor fixo `'initial'` (schema exige NOT NULL) — toda renderização de avatar de filho usa inicial do nome + `accentColor`, mesmo padrão já usado em `ParentTopbar` e `FilterChips`.
- **D-09:** Form abre em painel lateral direito, mesmo padrão visual/animação do `TaskFormPanel` (PTASK-06) — não modal (nenhum modal existe hoje no projeto).

### Definir/trocar PIN

- **D-10:** PIN novo é digitado via teclado numérico 3×4 — mesmo componente usado no login da criança (CAUTH-01) — adaptado para o contexto de painel desktop (não fullscreen mobile).
- **D-11 (SECURITY TRADEOFF — confirmado explicitamente pelo usuário após aviso):** `pinHash` (bcrypt cost 10, D-10 da Fase 2) permanece intocado e continua sendo o único campo usado para verificar login da criança — nenhuma mudança no fluxo de autenticação/`child-guard.ts`.
- **D-12:** Novo campo `pinEncrypted` (criptografia simétrica reversível, ex. AES-GCM, chave via env var de servidor) adicionado ao schema `child_profiles` — usado exclusivamente pelo botão "Mostrar/Ocultar" no card do filho no painel do pai (Frame C do handoff). Nunca usado para autenticação.
- **D-13:** Ação "Redefinir PIN" escreve em AMBOS os campos simultaneamente (`pinHash` novo via bcrypt + `pinEncrypted` novo via AES-GCM) para manter os dois em sincronia.

### Desativar/reativar

- **D-14:** Ação de desativar/reativar filho exige diálogo de confirmação (primeiro modal/dialog do projeto) — não é toggle instantâneo como o switch de tarefas (PTASK-04), pois bloqueia login da criança.
- **D-15:** Desativar filho SÓ bloqueia NOVO login (rejeitado a partir da próxima tentativa) — não revoga sessão JWT ativa em curso. Sessão já emitida (D-11 Fase 2, expiração 8h) continua válida até expirar naturalmente. Sem mudança em `child-guard.ts` para checar `active` em toda requisição.

### Claude's Discretion

- Texto exato dos botões (ex: "Adicionar filho", "Redefinir PIN", "Desativar" vs "Desativar filho").
- Estilo visual do diálogo de confirmação (D-14) — primeiro modal do projeto; seguir tokens de cor/spacing do design system.
- Layout exato do card de filho na lista (baseado no Frame C do handoff, adaptado para lista em vez de card único).
- Mensagem de erro/estado quando tentativa de login de filho desativado ocorre.
- Escolha de biblioteca/padrão para o diálogo modal (Radix Dialog primitive já é parte do stack recomendado no CLAUDE.md).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Schema e dados

- `src/lib/db/schema/index.ts` — `childProfiles` table (linhas 54-76): já tem `displayName`, `ageYears`, `avatarPreset`, `accentColor`, `active`, `deactivatedAt`, `pinHash`. Precisa migration adicionando `pinEncrypted`.
- `src/lib/auth/child-guard.ts` — lógica de verificação de sessão da criança; NÃO modificar para D-15 (só bloqueia novo login, não sessão ativa).
- `src/app/actions/child-auth.ts` — Server Actions existentes relacionadas a auth/PIN da criança; ponto de referência para o padrão de `pinHash` (bcrypt).

### Componentes existentes (reutilizar)

- `src/components/parent/parent-sidebar.tsx` — ícone "Crianças" já existe (linhas 109-139), sem `onClick`; precisa navegação para `/children` (D-05).
- `src/components/parent/parent-topbar.tsx` — badge do usuário; migra para o layout compartilhado (D-02).
- `src/components/parent/parent-panel-view.tsx` — padrão de estado local (`useState`) e `GuardianProfileDrawer` a replicar na nova página `/children` (D-04).
- `src/components/parent/task-form-panel.tsx` — padrão visual/animação do painel lateral a reaproveitar para o form de adicionar filho (D-09).
- `src/components/parent/guardian-profile-drawer.tsx` (Fase 7) — referência de drawer lateral; padrão a duplicar (não compartilhar) para `/children`.

### Rotas e API existentes

- `src/app/family/[familyId]/tasks/page.tsx` — Server Component page a ser refatorada para consumir o novo `layout.tsx` (D-03).
- `src/app/api/family/[familyId]/tasks/route.ts` — padrão de Route Handler a espelhar para endpoints de children (list/create/update PIN/toggle active).
- `src/app/api/child/[childId]/harvest/route.ts` — único endpoint existente sob `/api/child/[childId]/` — padrão de path a estender.

### Design handoff

- `design_handoff_kreds/README.md` §"Frame C — Card de Credenciais da Criança" (linhas 58-65) — layout do card individual (avatar inicial 52×52px, PIN oculto `••••`, "Mostrar/Ocultar", "Redefinir PIN"). "Ver atividade" fica FORA de escopo da Fase 8 (pertence à Fase 9 Reports).
- `design_handoff_kreds/README.md` §"Frame A — Login da Criança (PIN)" (linhas 34-43) — teclado numérico 3×4 a adaptar para o fluxo de redefinir PIN no painel do pai (D-10).

### Requirements & Roadmap

- `.planning/ROADMAP.md` §Phase 8: Child Management — 4 critérios de sucesso desta fase.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `childProfiles` schema já cobre 100% dos campos necessários (exceto `pinEncrypted`, novo).
- Padrão de avatar por inicial + cor (`accentColor`) já estabelecido em `ParentTopbar`/`FilterChips`/`ParentTaskCard` — reaproveitar para D-08.
- `TaskFormPanel` fornece o padrão de painel lateral animado a clonar para o form de filho.
- Padrão de toggle ativo/inativo (PTASK-04, switch 42×24px) existe mas NÃO se aplica aqui — D-14 exige confirmação, não toggle direto.

### Established Patterns

- **Client component raiz por página** gerencia estado local via `useState` (mesmo padrão de `ParentPanelView`/`garden-view.tsx`). Página `/children` segue o mesmo molde com seu próprio componente raiz (ex: `ChildrenPanelView`).
- **SSR page + client view** — `page.tsx` (Server Component) lê sessão/dados via `auth()` + queries e passa como props ao client view raiz.
- **Server Actions para mutations** — padrão de `src/app/actions/tasks.ts` a espelhar em `src/app/actions/children.ts` (create, resetPin, toggleActive).

### Integration Points

- Novo `src/app/family/[familyId]/layout.tsx` (Server Component) renderiza `ParentSidebar` + `ParentTopbar`, recebe `children` como slot de conteúdo.
- `src/app/family/[familyId]/children/page.tsx` (novo) + `ChildrenPanelView` (novo client component) + `ChildFormPanel` (novo, clonado de `TaskFormPanel`) + diálogo de confirmação (novo, primeiro do projeto).
- Migration Drizzle adicionando coluna `pin_encrypted` a `child_profiles`.
- Nova rota API: `src/app/api/family/[familyId]/children/route.ts` (list/create) e `src/app/api/family/[familyId]/children/[childId]/route.ts` (update/reset-pin/toggle-active).

</code_context>

<specifics>
## Specific Ideas

- Refactor de layout deve ser transparente para o usuário — `/tasks` continua se comportando exatamente igual, só a estrutura de arquivos muda (sidebar/topbar saem do componente, viram layout compartilhado).
- PIN reversível (`pinEncrypted`) é uma exceção deliberada e isolada — não deve influenciar decisões de segurança em outras partes do sistema. Chave de criptografia via variável de ambiente do servidor, nunca exposta ao client.
- Card de filho na lista deve seguir visual do Frame C (avatar inicial + gradiente, PIN oculto por padrão, ações "Redefinir PIN"/"Mostrar-Ocultar"), mas "Ver atividade" fica fora — é da Fase 9.

</specifics>

<deferred>
## Deferred Ideas

- **"Ver atividade"** (botão presente no Frame C do handoff) — pertence à Fase 9: Reports, que já tem "resumo semanal por filho" como critério de sucesso.
- **Avatar preset customizável** (ilustrações/emojis) — nenhum asset existe no design handoff; ficou só inicial + cor por ora.
- **Unificação de `GuardianProfileDrawer` no layout compartilhado** — sugerido durante a discussão de navegação, mas rejeitado para manter escopo menor; cada página mantém seu próprio drawer duplicado por ora.
- **Revogação ativa de sessão JWT ao desativar filho** — rejeitado por escopo; exigiria checar `active` em toda requisição autenticada (mudança em `child-guard.ts` testado). Sessão expira sozinha em até 8h (D-11 Fase 2).

### Reviewed Todos (not folded)

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 8-Child-Management*
*Context gathered: 2026-07-01*
