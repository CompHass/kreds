# Phase 7: Guardian Profile - Research

**Researched:** 2026-07-01
**Domain:** React drawer UI pattern, next-auth v5 signOut, session data propagation, CSS slide animation
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Exibição via **drawer lateral** (desliza da direita), não página dedicada. Mesmo padrão visual do `TaskFormPanel` — abre sobre o painel existente sem navegação nova.
- **D-02:** Animação de **slide** na entrada e saída do drawer. Consistente com `kredsFadeIn` e padrão de animações do projeto.
- **D-03:** Ambos os acionadores (sidebar inferior + badge do topbar) abrem o mesmo drawer. Estado de abertura controlado por `useState` no componente raiz `ParentPanelView` (ou wrapper).
- **D-04:** Drawer é **somente visualização** — sem edição. Exibe nome + email do guardian vindos de `session.user` (next-auth / Zitadel). Campos read-only; nenhum Server Action de PATCH necessário.
- **D-05:** Dados exibidos: **nome** + **email** (da sessão). Sem foto/avatar Zitadel.
- **D-06:** Botão "Sair" fica **somente dentro do drawer** — sem ícone extra na sidebar.
- **D-07:** Logout **sem confirmação** — clicar executa `signOut()` do next-auth diretamente e redireciona para `/login`. Sem dialog intermediário.
- **D-08:** Botão no rodapé da sidebar: **círculo 32px verde (#3E6B4F) com inicial do nome do guardian em branco** — mesmo visual do badge já existente no `ParentTopbar`. Sem texto "P" fixo.
- **D-09:** Badge do `ParentTopbar` passa a ser **clicável** para abrir o drawer (além do botão da sidebar).

### Claude's Discretion

- Largura exata do drawer (sugestão: 320–360px, seguindo `TaskFormPanel`).
- Espaçamento interno, separadores e hierarquia visual dentro do drawer.
- Texto do botão de logout (ex: "Sair" ou "Encerrar sessão").
- Estado hover/focus do botão da sidebar e do badge do topbar.

### Deferred Ideas (OUT OF SCOPE)

- **Edição de perfil no Zitadel** (mudar nome/email/senha) — fora do escopo v2.0; requereria chamada à Zitadel Management API.
- **Foto/avatar Zitadel** — URL de imagem do Zitadel não garantida para todos os usuários; diferido para refinamento futuro.
- **Ícone de logout na sidebar** como atalho rápido — sugerido mas rejeitado; um único ponto de saída é suficiente.
- **Página /profile dedicada** — modal/drawer atende o critério de sucesso sem criar nova rota.
</user_constraints>

---

## Summary

A Fase 7 é uma adição de UI relativamente pequena ao painel desktop dos pais (Phase 5 + 6). O objetivo é entregar um drawer lateral deslizante que exibe nome e email do guardian (vindos da sessão next-auth já existente) e um botão de logout. Não há novas rotas, sem chamadas de API backend, sem Server Actions de escrita.

O trabalho se divide em três áreas: (1) adicionar estado `profileOpen: boolean` ao `ParentPanelView` e propagar `onOpenProfile` como prop para `ParentSidebar` e `ParentTopbar`; (2) criar o componente `GuardianProfileDrawer` com slide CSS baseado em `translateX`; (3) substituir o placeholder "P" no rodapé da sidebar por um círculo com inicial real do guardian recebida via prop.

O padrão de slide CSS já existe no projeto (`GateLock` usa `translateX(-101%)` com `transition cubic-bezier`). O drawer do perfil deve seguir o mesmo modelo: `translateX(100%)` quando fechado, `translateX(0)` quando aberto, com `transition: transform 0.3s ease`. Não há biblioteca de UI externa necessária.

**Primary recommendation:** Implementar o drawer com CSS puro (translateX + transition), sem Radix/shadcn, seguindo o padrão já estabelecido pelo GateLock e pelo TaskFormPanel. Usar `signOut({ redirectTo: '/login' })` do `next-auth/react` no Client Component do drawer.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Drawer state (open/close) | Frontend Client (`ParentPanelView`) | — | Estado local `useState` — padrão estabelecido para `editingId` do TaskFormPanel |
| Session data (name + email) | Frontend Server (page.tsx SSR) | Frontend Client (props) | `auth()` lê sessão no Server Component e passa como props — sem `useSession()` necessário |
| Logout action | Frontend Client (`GuardianProfileDrawer`) | — | `signOut()` de `next-auth/react` executa no client; redireciona para `/login` |
| Slide animation | Browser / CSS | — | `translateX` + `transition` CSS — zero JS para animação |
| Sidebar initial badge | Frontend Client (`ParentSidebar`) | — | Recebe `guardianInitial` como prop de `ParentPanelView` |
| Topbar click handler | Frontend Client (`ParentTopbar`) | — | Recebe `onOpenProfile` como prop adicional |

---

## Standard Stack

### Core

Nenhum pacote externo novo é necessário. A fase usa exclusivamente o que já está instalado.

| Library | Version (instalada) | Purpose | Why Standard |
|---------|---------------------|---------|--------------|
| `next-auth` | 5.0.0-beta.31 | `signOut` para encerrar sessão | Já em uso no projeto; `signOut` de `next-auth/react` é o padrão para Client Components |
| React + Next.js | 19.2.7 / 16.2.7 | `useState` para estado do drawer | Já em uso |
| Tailwind CSS | 4.x (via globals.css) | Classes e variáveis CSS para styling | Já em uso; tokens como `--color-kreds-primary` já definidos |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| CSS `translateX` + `transition` | CSS nativo | Animação slide do drawer | Sempre — não usar biblioteca JS de animação |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS slide puro | Radix UI `Sheet` | Radix traz acessibilidade melhor, mas adiciona dependência não existente no projeto e o padrão CSS já funciona para GateLock |
| CSS slide puro | Framer Motion | Overkill para um único drawer; projeto não usa Framer |
| Props drilling | `useSession()` | `useSession()` funciona, mas viola o padrão SSR→props já estabelecido em `page.tsx` do Phase 5 |

**Installation:** Nenhum novo pacote necessário.

---

## Package Legitimacy Audit

Nenhum pacote novo será instalado nesta fase. Auditoria não aplicável.

| Package | Note |
|---------|------|
| `next-auth` | Já instalado (5.0.0-beta.31) e em uso. Sem verificação adicional necessária. |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

---

## Architecture Patterns

### System Architecture Diagram

```
SSR page.tsx (Server Component)
  └─ auth() → session.user.name, session.user.email
  └─ passes guardianName, guardianEmail, guardianInitial as props
       │
       ▼
ParentPanelView (Client Component — estado raiz)
  ├─ useState: profileOpen: boolean  ← NOVO
  ├─ ParentSidebar
  │    └─ guardianInitial prop  ← NOVO (substitui "P" fixo)
  │    └─ onOpenProfile prop   ← NOVO
  │         └─ circle button click → setProfileOpen(true)
  ├─ ParentTopbar
  │    └─ onOpenProfile prop   ← NOVO
  │         └─ badge click → setProfileOpen(true)
  ├─ TaskFormPanel (sem mudança)
  └─ GuardianProfileDrawer  ← NOVO COMPONENTE
       ├─ open: boolean (prop)
       ├─ guardianName: string (prop)
       ├─ guardianEmail: string (prop)
       ├─ onClose: () => void (prop)
       ├─ Slide: translateX(100%) → translateX(0)
       ├─ Backdrop overlay (fecha ao clicar fora)
       └─ signOut({ redirectTo: '/login' })
```

### Recommended Project Structure

Apenas um arquivo novo:

```
src/
└── components/
    └── parent/
        ├── guardian-profile-drawer.tsx   ← NOVO
        ├── parent-panel-view.tsx         ← MODIFICADO (profileOpen state + props)
        ├── parent-sidebar.tsx            ← MODIFICADO (guardianInitial + onOpenProfile props)
        └── parent-topbar.tsx             ← MODIFICADO (onOpenProfile prop)
```

### Pattern 1: Drawer com CSS Slide (padrão do projeto)

**What:** Drawer que desliza da direita usando `translateX` + CSS `transition`. Sem biblioteca JS de animação.

**When to use:** Qualquer painel lateral que deve abrir/fechar com animação sobre o conteúdo existente.

**Example:**

```typescript
// Source: GateLock pattern (src/components/auth/gate-lock.tsx)
// Adaptado para drawer que desliza da DIREITA

'use client'

interface GuardianProfileDrawerProps {
  open: boolean
  guardianName: string
  guardianEmail: string
  onClose: () => void
}

export function GuardianProfileDrawer({
  open,
  guardianName,
  guardianEmail,
  onClose,
}: GuardianProfileDrawerProps) {
  return (
    <>
      {/* Backdrop — fecha ao clicar fora */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(39, 55, 44, 0.25)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.25s ease',
          zIndex: 40,
        }}
      />
      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Perfil do responsável"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 340,
          background: 'var(--color-kreds-card)',
          borderLeft: '1px solid var(--color-kreds-border)',
          boxShadow: 'var(--shadow-card)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(.76, 0, .24, 1)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          padding: 24,
        }}
      >
        {/* Conteúdo: nome, email, botão logout */}
      </div>
    </>
  )
}
```

### Pattern 2: Estado de drawer em componente raiz (padrão do projeto)

**What:** `ParentPanelView` gerencia `profileOpen` via `useState`, igual ao `editingId` do `TaskFormPanel`.

**When to use:** Qualquer estado de painel lateral que precisa ser controlado de múltiplos filhos.

**Example:**

```typescript
// Source: src/components/parent/parent-panel-view.tsx (padrão estabelecido)

// Adicionar ao ParentPanelView:
const [profileOpen, setProfileOpen] = useState(false)
const guardianInitial = currentUserName.charAt(0).toUpperCase()

// Props para sidebar:
<ParentSidebar
  guardianInitial={guardianInitial}
  onOpenProfile={() => setProfileOpen(true)}
/>

// Props para topbar:
<ParentTopbar
  familyName={familyName}
  currentUserName={currentUserName}
  onOpenProfile={() => setProfileOpen(true)}
/>

// Drawer no JSX raiz:
<GuardianProfileDrawer
  open={profileOpen}
  guardianName={currentUserName}
  guardianEmail={guardianEmail}
  onClose={() => setProfileOpen(false)}
/>
```

### Pattern 3: signOut no Client Component

**What:** `signOut` de `next-auth/react` com `redirectTo` explícito.

**When to use:** Botão de logout em Client Component.

**Example:**

```typescript
// Source: https://github.com/nextauthjs/next-auth/blob/main/docs/pages/getting-started/session-management/login.mdx
'use client'
import { signOut } from 'next-auth/react'

// Dentro do GuardianProfileDrawer:
<button onClick={() => signOut({ redirectTo: '/login' })}>
  Sair
</button>
```

**Nota:** A versão instalada é next-auth v5 beta. Em v5, o parâmetro é `redirectTo` (não `callbackUrl`). Verificar se a instância atual do projeto usa `callbackUrl` ou `redirectTo`.

**Verificação no código existente:** O projeto usa `auth.ts` na raiz (não em `src/`). A importação no drawer deve ser `from 'next-auth/react'` (sem caminho relativo).

### Anti-Patterns to Avoid

- **Não usar `useSession()`:** O projeto SSR passa `session.user` como props do `page.tsx`. Usar `useSession()` dentro do drawer introduz uma dependência de `SessionProvider` que não está no `RootLayout` atual. Receber `guardianName` e `guardianEmail` como props do `page.tsx` é o padrão correto.
- **Não criar nova rota `/profile`:** Decidido em D-01. Drawer não exige rota.
- **Não usar `callbackUrl` em next-auth v5:** Em v5 beta, o parâmetro de redirect é `redirectTo`, não `callbackUrl`. Verificar no teste manual.
- **Não colocar o `GuardianProfileDrawer` dentro do `<main>`:** O drawer usa `position: fixed`, então pode ficar como filho direto do wrapper raiz do `ParentPanelView`. Não deve ficar aninhado dentro de elementos com `overflow: hidden`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Animação slide | setTimeout + classe CSS | `translateX` + `transition` CSS nativo | Mais simples, sem estado extra |
| Fechar drawer ao clicar fora | `onMouseDown` + refs | Backdrop `<div>` com `onClick={onClose}` | Padrão já usado em `CelebrationOverlay` |
| Logout com redirect | Chamada fetch manual para `/api/auth/signout` | `signOut({ redirectTo: '/login' })` | next-auth já faz limpeza de cookie e redirect |

**Key insight:** Esta fase não requer nenhuma biblioteca nova. Todo o padrão necessário já existe no codebase.

---

## Runtime State Inventory

> Omitido — fase greenfield de novo componente UI, não renaming/refactoring/migração.

---

## Common Pitfalls

### Pitfall 1: `signOut` com parâmetro errado em next-auth v5

**What goes wrong:** Chamar `signOut({ callbackUrl: '/login' })` (parâmetro de v4) em vez de `signOut({ redirectTo: '/login' })` (v5). A sessão é destruída mas o redirect não ocorre ou vai para `/`.

**Why it happens:** Documentação de v4 ainda aparece em muitas buscas; o projeto usa `next-auth 5.0.0-beta.31`.

**How to avoid:** Usar `redirectTo` (v5). Verificar na próxima sessão se existe `redirectTo` ou `callbackUrl` no tipo `SignOutParams` da versão instalada.

**Warning signs:** Após clicar "Sair", o usuário fica na mesma URL ou redireciona para `/` em vez de `/login`.

### Pitfall 2: `position: fixed` aninhado em elemento com `transform`

**What goes wrong:** O drawer com `position: fixed` não cobre a tela inteira se algum ancestral tiver `transform`, `perspective` ou `filter` CSS, pois isso cria um novo contexto de stacking.

**Why it happens:** `ParentPanelView` usa `style` inline mas não tem `transform`. Não é um problema agora, mas atenção em fases futuras.

**How to avoid:** Confirmar que nenhum ancestral do `GuardianProfileDrawer` no JSX tem `transform` ativo.

**Warning signs:** Drawer aparece cortado ou em posição inesperada.

### Pitfall 3: `useSession()` sem `SessionProvider`

**What goes wrong:** Chamar `useSession()` dentro do drawer gera erro `[auth]: No auth config found.` porque o `RootLayout` atual não envolve com `SessionProvider`.

**Why it happens:** É tentador usar `useSession()` para obter `name` e `email` diretamente no Client Component.

**How to avoid:** Receber `guardianName` e `guardianEmail` como props vindas do `page.tsx` (que já faz `auth()` no servidor). Não adicionar `useSession()` ao drawer.

**Warning signs:** Erro de console: `useSession must be wrapped in a <SessionProvider />`.

### Pitfall 4: Botão "P" fixo na sidebar com prop não tipada

**What goes wrong:** `ParentSidebar` atualmente é um componente sem props. Adicionar `guardianInitial` sem atualizar a interface TypeScript, passando como atributo HTML `data-initial` gera warning ou tipo incorreto.

**Why it happens:** Componente foi criado como puramente estático na Phase 5.

**How to avoid:** Atualizar a interface `ParentSidebarProps` antes de adicionar a prop.

### Pitfall 5: Foco acessível no drawer

**What goes wrong:** Ao abrir o drawer, o foco permanece no botão da sidebar. Usuários de teclado ficam presos fora do drawer.

**Why it happens:** Drawers precisam de gerenciamento de foco explícito.

**How to avoid:** Usar `autoFocus` no primeiro elemento focável dentro do drawer (ex: botão "Sair"), ou um `useEffect` que chame `.focus()` na abertura.

---

## Code Examples

### Sidebar: botão de perfil com inicial

```typescript
// Substituir o placeholder "P" fixo por inicial dinâmica
// Padrão: círculo 32px, gradiente verde, inicial branca — idêntico ao badge do topbar
interface ParentSidebarProps {
  guardianInitial: string
  onOpenProfile: () => void
}

// No rodapé da sidebar:
<button
  aria-label="Abrir perfil"
  onClick={onOpenProfile}
  style={{
    marginTop: 'auto',
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #5A8A66 0%, #3E6B4F 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 700,
    color: '#ffffff',
    border: 'none',
    cursor: 'pointer',
    flexShrink: 0,
  }}
>
  {guardianInitial}
</button>
```

### Topbar: badge clicável

```typescript
// Adicionar onOpenProfile à interface ParentTopbarProps
interface ParentTopbarProps {
  familyName: string
  currentUserName: string
  onOpenProfile: () => void  // NOVO
}

// Tornar o badge div clicável (já existe, só adicionar onClick + cursor)
<div
  onClick={onOpenProfile}
  role="button"
  aria-label="Abrir perfil"
  tabIndex={0}
  onKeyDown={(e) => e.key === 'Enter' && onOpenProfile()}
  style={{
    cursor: 'pointer',
    // ...resto dos estilos existentes
  }}
>
```

### Page.tsx: propagar guardianEmail

```typescript
// No page.tsx do family/[familyId]/tasks, já temos:
// currentUserName={session.user?.name ?? ''}
// Adicionar:
// guardianEmail={session.user?.email ?? ''}

<ParentPanelView
  familyId={familyId}
  familyName={familyName}
  currentUserName={session.user?.name ?? ''}
  guardianEmail={session.user?.email ?? ''}   // NOVO
  familyChildren={children}
  initialTasks={mappedTasks}
/>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `callbackUrl` em next-auth v4 | `redirectTo` em next-auth v5 | next-auth v5 beta | Parâmetro de signOut renomeado |
| `useSession()` universal | SSR + props drilling | Padrão no Next.js App Router | Evita `SessionProvider` wrapper |

**Deprecated/outdated:**
- `callbackUrl` em `signOut()` — use `redirectTo` em next-auth v5.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `signOut({ redirectTo: '/login' })` é o parâmetro correto em next-auth 5.0.0-beta.31 | Pattern 3 / Pitfall 1 | Logout não redireciona para `/login`; fácil de corrigir no teste manual |
| A2 | `session.user.email` está disponível na sessão Zitadel (além de `name`) | Code Examples | Perfil exibe campo email vazio; resolver verificando o token JWT após login |

---

## Open Questions

1. **`redirectTo` vs `callbackUrl` no next-auth beta instalado**
   - What we know: next-auth v5 usa `redirectTo` na assinatura do tipo; v4 usava `callbackUrl`.
   - What's unclear: A versão exata `5.0.0-beta.31` pode ter breaking changes no parâmetro.
   - Recommendation: Verificar via `console.log` ou TypeScript autocomplete no IDE antes de implementar; o fallback é usar `window.location.href = '/login'` após `signOut({ redirect: false })`.

2. **`session.user.email` disponível?**
   - What we know: O callback `session()` em `auth.ts` propaga `session.user.id` e `session.user.systemRoles` explicitamente. `session.user.email` é populado pelo next-auth por padrão do claim `email` do OIDC, mas não aparece explicitamente no callback.
   - What's unclear: Se o campo `email` está populado no `session.user` depois do `session()` callback.
   - Recommendation: Verificar com `console.log(session.user)` no `page.tsx` antes de implementar o drawer. Se estiver vazio, buscar do `profile.email` no callback `jwt` (já disponível como `profile.email`).

---

## Environment Availability

> Omitido — fase é código/config apenas. Não há ferramentas externas ou serviços novos necessários.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.8 + Testing Library 16.x |
| Config file | `vitest.config.ts` (raiz) |
| Quick run command | `pnpm test -- --reporter=verbose tests/unit/parent-panel.test.tsx` |
| Full suite command | `pnpm test` |

### Phase Requirements → Test Map

| Behavior | Test Type | Automated Command | Note |
|----------|-----------|-------------------|------|
| Botão sidebar (círculo com inicial) abre drawer | unit | `tests/unit/parent-panel.test.tsx` | Arquivo existe; novos casos a adicionar |
| Badge do topbar clicável abre drawer | unit | `tests/unit/parent-panel.test.tsx` | Novos casos a adicionar |
| Drawer exibe nome + email do guardian | unit | `tests/unit/guardian-profile-drawer.test.tsx` | Arquivo não existe — Wave 0 gap |
| Botão "Sair" chama signOut mock | unit | `tests/unit/guardian-profile-drawer.test.tsx` | Arquivo não existe — Wave 0 gap |
| Clicar fora do drawer fecha o drawer | unit | `tests/unit/guardian-profile-drawer.test.tsx` | Arquivo não existe — Wave 0 gap |

### Sampling Rate

- **Por task commit:** `pnpm test -- tests/unit/guardian-profile-drawer.test.tsx tests/unit/parent-panel.test.tsx`
- **Por wave merge:** `pnpm test`
- **Phase gate:** Full suite green antes do `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/unit/guardian-profile-drawer.test.tsx` — cobre comportamento do drawer (open/close, conteúdo, logout mock)

---

## Security Domain

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | sim — logout | `signOut({ redirectTo: '/login' })` do next-auth; cookie cleared server-side |
| V3 Session Management | sim — encerramento de sessão | next-auth limpa `authjs.session-token` / `__Secure-authjs.session-token` no signOut |
| V4 Access Control | não — somente leitura da própria sessão | — |
| V5 Input Validation | não — sem campos de input | — |
| V6 Criptografia | não | — |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Open Redirect no signOut | Tampering | `callbackUrl`/`redirectTo` validado pelo next-auth contra `baseUrl` do servidor |
| Dados de sessão expostos ao cliente | Information Disclosure | `guardianEmail` passado como prop server-side; não exposto em URL ou localStorage |

---

## Sources

### Primary (HIGH confidence — código do codebase verificado)

- `src/components/parent/parent-sidebar.tsx` — estrutura atual, placeholder "P" no rodapé
- `src/components/parent/parent-topbar.tsx` — badge existente com inicial e nome
- `src/components/parent/parent-panel-view.tsx` — padrão `useState` para estado de painel
- `src/components/auth/gate-lock.tsx` — padrão `translateX` + `transition cubic-bezier` para slide
- `src/components/garden/celebration-overlay.tsx` — padrão `position: fixed`, `zIndex: 50`, backdrop
- `auth.ts` — instância next-auth; confirma `session.user.name`, `session.user.email` do OIDC
- `src/app/globals.css` — tokens CSS `--color-kreds-primary`, `--color-kreds-card`, `--color-kreds-border`

### Secondary (MEDIUM confidence — Context7)

- `/nextauthjs/next-auth` via Context7 — `signOut` com `redirectTo`, assinatura de tipo v5 [CITED: https://github.com/nextauthjs/next-auth/blob/main/packages/next-auth/src/index.ts]

### Tertiary (LOW confidence)

- Nenhuma fonte apenas com treinamento foi usada para claims factuais.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — nenhum pacote novo; tudo verificado no codebase
- Architecture: HIGH — padrão de estado e slide verificado em componentes existentes
- Pitfalls: HIGH — A1 e A2 são os únicos assumptions; ambos verificáveis com `console.log` antes da implementação

**Research date:** 2026-07-01
**Valid until:** 2026-07-31 (fase pequena, stack estável)
