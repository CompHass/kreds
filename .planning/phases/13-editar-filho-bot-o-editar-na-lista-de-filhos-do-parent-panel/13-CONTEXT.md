# Phase 13: Editar Filho - Context

**Gathered:** 2026-07-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Adicionar edição de filho já cadastrado: botão "Editar" na lista `/family/children` (só para filhos ativos), abrindo página dedicada `/family/children/[childId]/edit` com form pré-preenchido de nome, idade, avatar e cor de destaque.

</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

**5 requirements are locked.** See `13-SPEC.md` for full requirements, boundaries, and acceptance criteria.

Downstream agents MUST read `13-SPEC.md` before planning or implementing. Requirements are not duplicated here.

**In scope (from SPEC.md):**
- Extensão de `updateChildProfile`/`UpdateChildProfileVisualsInput` para aceitar `ageYears`
- Server Action `updateChildAction`
- Página `/family/children/[childId]/edit` com form pré-preenchido (nome, idade, avatar, cor)
- Botão "Editar" na lista de filhos, visível só para filhos ativos
- Reaproveitar componentes visuais (avatar grid picker, accent dot picker) do padrão de `ChildrenForm`

**Out of scope (from SPEC.md):**
- Edição de PIN dentro deste form — fluxo dedicado em `/family/children/[childId]/set-pin` continua separado
- Editar filho desativado ou reativar filho — fora do escopo
- Alterar o formulário de criação (`ChildrenForm.tsx`) — só leitura/reaproveitamento de estilo
- Auditoria/histórico visual das edições na UI — audit event já gravado pelo backend, exibição não é desta fase

</spec_lock>

<decisions>
## Implementation Decisions

### Componentização do form

- **D-01:** Criar componente novo `EditChildForm` (não reusar/parametrizar `ChildrenForm` com prop de modo). Copia o padrão visual dos pickers (avatar grid, accent dots, `useActionState`, estilos inline) mas sem os campos de PIN e consentimento, que não fazem parte da edição.

### Navegação

- **D-02:** Página `/family/children/[childId]/edit` tem link "Cancelar" que volta para `/family/children`.

### Claude's Discretion

- Texto exato dos labels/botões da página de edição (ex: "Salvar alterações" vs "Atualizar").
- Posição exata do botão "Editar" entre os botões já existentes (PIN/Desativar) no card do filho.
- Se o form pré-preenchido usa os mesmos estilos inline (`inputStyle`, `labelStyle`) do `ChildrenForm.tsx` — recomendado reaproveitar para consistência visual.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Spec

- `.planning/phases/13-editar-filho-bot-o-editar-na-lista-de-filhos-do-parent-panel/13-SPEC.md` — Locked requirements — MUST read before planning

### Código existente relevante

- `src/lib/families/child-profiles.ts:158` — `updateChildProfile()` já implementado (falta aceitar `ageYears`)
- `src/app/family/children/actions.ts` — `addChildAction`/`deactivateChildAction`, padrão a seguir para `updateChildAction`
- `src/app/family/children/page.tsx` — lista de filhos, onde entra o botão "Editar"
- `src/app/family/children/ChildrenForm.tsx` — padrão visual dos pickers de avatar/cor e do form (`useActionState`, estilos inline)
- `src/app/family/children/[childId]/set-pin/` — padrão de rota dinâmica existente para referência de estrutura

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AVATAR_PRESETS`, `ACCENT_COLORS` (`src/lib/families/avatar-presets.ts`) — mesmos presets usados no create, reusar no edit
- Estilos inline `labelStyle`/`inputStyle` de `ChildrenForm.tsx` — copiar para consistência visual sem introduzir novo sistema de estilo

### Established Patterns
- Server Actions no projeto resolvem guardião+família com `requireAuthenticatedIdentity` + `resolveKredsIdentityId` + query em `familyMemberships` — mesmo padrão em `addChildAction`/`deactivateChildAction`, replicar em `updateChildAction`
- Formulários usam `useActionState` + `role="alert"` box para erros (padrão em `ChildrenForm.tsx:61-72`)

### Integration Points
- `updateChildProfile` (backend) precisa aceitar `ageYears` opcional — único ponto de extensão de schema/lógica necessário; coluna já existe no banco
- Lista `/family/children` já usa `listActiveChildProfiles`, então filtro de "só ativos" já é automático — só falta adicionar o link "Editar" ao lado dos existentes

</code_context>

<specifics>
## Specific Ideas

Nenhuma referência visual específica além de replicar o padrão já existente em `ChildrenForm.tsx` e nas rotas dinâmicas de filho (`set-pin`).

</specifics>

<deferred>
## Deferred Ideas

None — discussão ficou dentro do escopo da fase.

</deferred>

---

*Phase: 13-editar-filho-bot-o-editar-na-lista-de-filhos-do-parent-panel*
*Context gathered: 2026-07-03*
