# Phase 7: Guardian Profile - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-01
**Phase:** 07-guardian-profile
**Areas discussed:** Superfície do perfil, Edição de campos, Logout flow, Sidebar P button

---

## Superfície do perfil

| Option | Description | Selected |
|--------|-------------|----------|
| Modal overlay | Sheet/drawer ou modal central — abre sobre o painel existente | |
| Página dedicada | Rota /family/[familyId]/profile — navegação completa | |
| → Modal overlay | Escolhido | ✓ |

**User's choice:** Modal overlay

| Option | Description | Selected |
|--------|-------------|----------|
| Drawer lateral | Desliza da direita, mesmo padrão do TaskFormPanel | ✓ |
| Modal central | Dialog box centralizado com backdrop | |

**User's choice:** Drawer lateral

| Option | Description | Selected |
|--------|-------------|----------|
| Animação slide | Desliza da direita para dentro — consistente com padrão do projeto | ✓ |
| Sem animação | Aparece instantâneo | |

**User's choice:** Animação slide

**Notes:** Drawer segue exatamente o padrão visual e de movimento do `TaskFormPanel`.

---

## Edição de campos

| Option | Description | Selected |
|--------|-------------|----------|
| Somente visualização | Nome + email read-only da sessão Zitadel, sem PATCH | ✓ |
| Nome editável | Campo editável + Server Action + UPDATE | |

**User's choice:** Somente visualização

| Option | Description | Selected |
|--------|-------------|----------|
| Nome + email | Campos básicos da sessão | ✓ |
| Nome + email + avatar | Adiciona foto/inicial do Zitadel | |

**User's choice:** Nome + email

---

## Logout flow

| Option | Description | Selected |
|--------|-------------|----------|
| Somente dentro do drawer | Botão "Sair" no rodapé do drawer | ✓ |
| Drawer + botão na sidebar | Ícone adicional na sidebar como atalho | |

**User's choice:** Somente dentro do drawer

| Option | Description | Selected |
|--------|-------------|----------|
| Executa direto | signOut() imediato → /login | ✓ |
| Confirmação antes | Dialog "Tem certeza?" antes de sair | |

**User's choice:** Executa direto

---

## Sidebar P button

| Option | Description | Selected |
|--------|-------------|----------|
| Inicial em círculo verde | Círculo 32px #3E6B4F com inicial em branco — consistente com topbar | ✓ |
| Botão letra P fixo | Sempre exibe "P" sem personalizar | |

**User's choice:** Inicial em círculo verde

| Option | Description | Selected |
|--------|-------------|----------|
| Sim, ambos abrem o drawer | Sidebar inferior + badge topbar são acionadores | ✓ |
| Somente o botão da sidebar | Badge topbar fica decorativo | |

**User's choice:** Sim, ambos abrem o drawer

---

## Claude's Discretion

- Largura exata do drawer
- Espaçamento interno e hierarquia visual dentro do drawer
- Texto do botão de logout
- Estado hover/focus dos acionadores

## Deferred Ideas

- Edição de perfil no Zitadel (nome/email/senha) — fora do escopo v2.0
- Foto/avatar Zitadel — diferido
- Ícone de logout extra na sidebar — rejeitado, drawer suficiente
- Página /profile dedicada — rejeitada, drawer atende o critério
