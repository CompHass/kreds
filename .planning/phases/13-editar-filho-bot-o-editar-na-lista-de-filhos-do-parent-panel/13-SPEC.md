# Phase 13: Editar Filho — Specification

**Created:** 2026-07-03
**Ambiguity score:** 0.14 (gate: ≤ 0.20)
**Requirements:** 5 locked

## Goal

Um responsável ativo consegue clicar em "Editar" na lista de filhos (`/family/children`), abrir um formulário pré-preenchido em `/family/children/[childId]/edit`, alterar nome/idade/avatar/cor de destaque de um filho ativo, e salvar — os dados persistidos no banco refletem imediatamente na lista.

## Background

`src/lib/families/child-profiles.ts:158` já tem `updateChildProfile()` funcional (transação, valida guardião ativo, valida avatar/accent, grava audit event) mas só aceita `displayName`, `avatarPreset`, `accentColor`, `pin` — **não aceita `ageYears`**. Não existe Server Action que chame essa função, nem página/form de edição, nem botão "Editar" na lista (`src/app/family/children/page.tsx`). A lista hoje só tem: Histórico, Ganho, Ajuste, Ver saldo, PIN (link para `/family/children/[childId]/set-pin`), Desativar. `ChildrenForm.tsx` existe só para criação (inclui PIN + consentimento, que não fazem parte deste form de edição).

## Requirements

1. **Extensão do backend para idade**: `updateChildProfile` aceita `ageYears` opcional.
   - Current: `UpdateChildProfileVisualsInput` (child-profiles.ts:21) não tem campo `ageYears`; função ignora idade.
   - Target: Interface ganha `ageYears?: number`; validação reutiliza a mesma regra de `createChildProfile` (inteiro entre 0 e 120); quando fornecido, `updates.ageYears` é setado e entra no audit log `changes`.
   - Acceptance: Chamar `updateChildProfile({ ..., ageYears: 10 })` em um perfil existente atualiza `ageYears` no banco e o audit event contém `age: X → 10`; chamar com `ageYears: 150` lança erro.

2. **Server Action de edição**: Nova action conecta form → `updateChildProfile`.
   - Current: Não existe `updateChildAction` em `src/app/family/children/actions.ts`.
   - Target: `updateChildAction(prevState, formData)` resolve guardião+família (mesmo padrão de `addChildAction`), lê `childProfileId`, `displayName`, `ageYears`, `avatarPreset`, `accentColor` do FormData, chama `updateChildProfile`, redireciona para `/family/children` em sucesso ou retorna `{ error }` em falha.
   - Acceptance: Submeter o form de edição com dados válidos redireciona para `/family/children` e a lista mostra os valores novos; submeter com nome vazio retorna `{ error }` sem persistir mudança.

3. **Página de edição**: `/family/children/[childId]/edit` (SSR) renderiza form pré-preenchido.
   - Current: Rota não existe. Só existe `/family/children/[childId]/set-pin`.
   - Target: Página busca o child profile ativo da família autenticada (404/redirect se não existir, não pertencer à família, ou estiver inativo), renderiza um form com nome/idade/avatar/cor já preenchidos com os valores atuais (sem campos de PIN ou consentimento).
   - Acceptance: Acessar a URL de um filho ativo da própria família mostra o form com valores atuais; acessar com `childId` de outra família ou de filho inativo redireciona para `/family/children` sem expor dados.

4. **Botão "Editar" na lista**: Link visível apenas para filhos ativos.
   - Current: `page.tsx` não tem link/botão de edição na lista de filhos.
   - Target: Cada card de filho ativo em `/family/children` ganha um link "Editar" → `/family/children/[childId]/edit`, posicionado junto aos botões existentes (PIN/Desativar).
   - Acceptance: Renderizar a lista com N filhos ativos mostra N botões "Editar"; nenhum botão "Editar" aparece para filhos desativados (já filtrados por `listActiveChildProfiles`, então este ponto é satisfeito automaticamente).

5. **Exibição de erro de validação**: Form de edição usa o mesmo padrão de `ChildrenForm`.
   - Current: Não aplicável (form não existe).
   - Target: Form de edição usa `useActionState` + `role="alert"` box de erro, mesmo padrão visual de `ChildrenForm.tsx:61-72`.
   - Acceptance: Erro retornado pela Server Action (ex: nome vazio) aparece na tela sem reload da página nem perda dos outros valores preenchidos.

## Boundaries

**In scope:**
- Extensão de `updateChildProfile`/`UpdateChildProfileVisualsInput` para aceitar `ageYears`
- Server Action `updateChildAction`
- Página `/family/children/[childId]/edit` com form pré-preenchido (nome, idade, avatar, cor)
- Botão "Editar" na lista de filhos, visível só para filhos ativos
- Reaproveitar componentes visuais (avatar grid picker, accent dot picker) do padrão de `ChildrenForm`

**Out of scope:**
- Edição de PIN dentro deste form — já existe fluxo dedicado em `/family/children/[childId]/set-pin`, mantido separado
- Editar filho desativado ou reativar filho — fora do escopo desta fase (backend já rejeita update em perfil inativo)
- Alterar o formulário de criação (`ChildrenForm.tsx` usado em "Adicionar filho") — só leitura/reaproveitamento de estilo, sem mudança de comportamento
- Auditoria/histórico visual das edições na UI — o audit event já é gravado pelo backend existente, mas exibir esse histórico não é desta fase

## Constraints

- Validação de idade reutiliza a mesma regra de `createChildProfile` (inteiro 0–120)
- Apenas guardião ativo da família pode editar (mesma checagem de `updateChildProfile` já existente)
- Sem migração de schema — `ageYears` já é coluna existente em `childProfiles`, só falta o código de update aceitar o campo

## Acceptance Criteria

- [ ] `updateChildProfile` aceita e persiste `ageYears` quando fornecido
- [ ] `updateChildAction` existe e conecta form → `updateChildProfile`
- [ ] `/family/children/[childId]/edit` renderiza form pré-preenchido para filho ativo da própria família
- [ ] Acesso a `/family/children/[childId]/edit` de filho inativo ou de outra família redireciona sem expor dados
- [ ] Lista `/family/children` mostra botão "Editar" em cada filho ativo, ausente para inativos
- [ ] Erro de validação no form de edição aparece inline sem perder os demais valores preenchidos

## Ambiguity Report

| Dimension          | Score | Min  | Status | Notes                                          |
|--------------------|-------|------|--------|-------------------------------------------------|
| Goal Clarity       | 0.90  | 0.75 | ✓      | Escopo de campos e rota definidos              |
| Boundary Clarity   | 0.85  | 0.70 | ✓      | PIN e reativação explicitamente fora           |
| Constraint Clarity | 0.80  | 0.65 | ✓      | Validação reaproveitada de createChildProfile  |
| Acceptance Criteria| 0.80  | 0.70 | ✓      | 6 critérios pass/fail                          |
| **Ambiguity**      | 0.14  | ≤0.20| ✓      |                                                 |

## Interview Log

| Round | Perspective     | Question summary                                  | Decision locked                                            |
|-------|-----------------|-----------------------------------------------------|--------------------------------------------------------------|
| 1     | Researcher      | Editar idade também, já que backend não suporta?    | Sim — estender `updateChildProfile` para aceitar `ageYears` |
| 1     | Boundary Keeper | Onde fica o botão/form de edição?                   | Página dedicada `/family/children/[childId]/edit`           |
| 1     | Boundary Keeper | PIN entra no form de editar?                        | Não — PIN continua em `/set-pin`, fora deste form            |
| 2     | Failure Analyst | Filho desativado pode ser editado?                  | Não — botão editar só aparece para filhos ativos             |

---

*Phase: 13-editar-filho-bot-o-editar-na-lista-de-filhos-do-parent-panel*
*Spec created: 2026-07-03*
*Next step: /gsd-discuss-phase 13 — decisões de implementação (layout do form, tratamento de campos, etc.)*
