# Phase 13: Editar Filho - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-03
**Phase:** 13-editar-filho-bot-o-editar-na-lista-de-filhos-do-parent-panel
**Areas discussed:** Reuso de componente do form, Navegação/cancelar

---

## Reuso componente

| Option | Description | Selected |
|--------|-------------|----------|
| Extrair EditChildForm novo | Componente próprio p/ edição (sem PIN/consentimento), copiando estilo do avatar grid e accent dots do ChildrenForm | ✓ |
| Fazer ChildrenForm aceitar modo create/edit | Um componente só com prop mode, mais DRY mas mistura lógica de criação e edição | |

**User's choice:** Extrair EditChildForm novo, reaproveitando os pickers visuais (recomendado)
**Notes:** Evita misturar lógica de PIN/consentimento (só create) com edição.

---

## Cancelar edição

| Option | Description | Selected |
|--------|-------------|----------|
| Link 'Cancelar' volta pra /family/children | Mesmo padrão de navegação simples usado no resto do app | ✓ |
| Sem botão cancelar, só botão salvar | Usuário usa botão voltar do navegador | |

**User's choice:** Link 'Cancelar' volta pra /family/children (recomendado)
**Notes:** —

---

## Claude's Discretion

- Texto exato dos labels/botões da página de edição
- Posição exata do botão "Editar" entre os botões já existentes no card do filho
- Reaproveitar estilos inline (`inputStyle`, `labelStyle`) do `ChildrenForm.tsx`

## Deferred Ideas

None — discussão ficou dentro do escopo da fase.
