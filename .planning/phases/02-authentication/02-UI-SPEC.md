---
phase: 2
slug: authentication
status: draft
shadcn_initialized: false
preset: none
created: 2026-06-20
---

# Phase 2 — UI Design Contract: Authentication

> Visual and interaction contract para as telas de autenticação da criança e do responsável.
> Gerado por gsd-ui-researcher. Verificado por gsd-ui-checker.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none — design system customizado via Tailwind v4 `@theme` |
| Preset | not applicable |
| Component library | none (componentes próprios) |
| Icon library | SVGs inline — nenhuma biblioteca externa |
| Font | Plus Jakarta Sans — pesos 400, 500, 600, 700, 800 |

**Fonte:** `globals.css` @theme + `design_handoff_kreds/README.md`

shadcn gate: não aplicável — projeto usa Tailwind v4 com tokens CSS customizados já implementados (DS-01..DS-04 completos na Fase 1).

---

## Spacing Scale

Declarado: escala 4-point. Todas as medidas do protótipo já mapeadas para a escala.

| Token | Value | Usage in Phase 2 |
|-------|-------|------------------|
| xs | 4px | Gap entre dots do PIN, espaço ícone/texto nos inputs |
| sm | 8px | Padding interno de chips, gap entre elementos compactos |
| md | 16px | Padding padrão de cards, gap entre seções do form |
| lg | 24px | Padding lateral das telas, gap entre logo e formulário |
| xl | 32px | Separação entre blocos (form → divisor → botões sociais) |
| 2xl | 48px | Padding vertical da tela de PIN (topo/baixo) |
| 3xl | 64px | Não usado nesta fase |

Exceções:
- Dots do PIN: 16px diâmetro, gap 12px entre dots (valor do protótipo, mantido literalmente)
- Botões do teclado numérico: 62px altura × 62px largura (touch target > 44px mínimo — correto)
- Inputs do responsável: 50px altura (exato do protótipo)
- Botão Entrar: 52px altura (exato do protótipo)
- Checkbox "Lembrar-me": 18×18px (exato do protótipo)

**Fonte:** `design_handoff_kreds/README.md` §Frame A e §Frame B

---

## Typography

Todos os tamanhos são em px, fonte Plus Jakarta Sans.

| Role | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| Display | 24–26px | 800 | 1.2 | Título principal ("Olá, Ana!"), heading do form responsável |
| Heading | 18–20px | 700 | 1.25 | Label de seção, título do card de redefinição de senha |
| Body | 15px | 500 | 1.5 | Texto de inputs, copy de estados, copy do form |
| Label | 12px | 600 | 1.4 | Captions, links ("Trocar perfil", "Esqueci minha senha"), labels de checkbox |

Letter-spacing para Display e Heading: `-0.01em`.

Wordmark "kreds" no logo: 17px, weight 800.

**Fonte:** `design_handoff_kreds/README.md` §Tipografia

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#F2F0E7` / `#F6F4EC` (var: `--color-kreds-bg`) | Background das telas, superfícies de página |
| Secondary (30%) | `#FBFAF5` (var: `--color-kreds-card`) | Inputs, cards, botões do teclado numérico |
| Accent (10%) | `#3E6B4F` (var: `--color-kreds-primary`) | Ver lista de reserva abaixo |
| Accent-light | `#5A8A66` (var: `--color-kreds-primary-lt`) | Gradiente do logo, gradiente de avatar |
| Destructive | `#B14A2E` (var: `--color-kreds-error`) | Dot de erro no PIN, mensagem de erro |

Accent `#3E6B4F` reservado EXCLUSIVAMENTE para:
1. Dot do PIN no estado preenchido (`bg #3E6B4F`, borda `#3E6B4F`)
2. Botão "Entrar" (background primário do CTA)
3. Checkbox "Lembrar-me" quando marcado (`bg #3E6B4F`)
4. Focus ring de inputs (`border-color #3E6B4F`, `box-shadow 0 0 0 3px rgba(62,107,79,.13)`)
5. Link "Trocar perfil" e "Esqueci minha senha" (cor do texto)
6. Gradiente da animação kredsBreath no plant hero

Cores adicionais declaradas nesta fase:

| Token | Value | Uso específico |
|-------|-------|----------------|
| `--color-kreds-border` | `#ECE7DB` | Borda padrão de cards e separadores |
| `--color-kreds-border-alt` | `#E2DECF` | Borda de inputs no estado default |
| `--color-kreds-error` | `#B14A2E` | Dot de PIN em erro (`bg #D8916B`, borda `#C06B4A`) |
| `--color-kreds-text` | `#27372C` | Texto principal (input values, títulos) |
| `--color-kreds-muted` | `#7C8676` | Texto secundário (labels, placeholders) |
| `--color-kreds-hint` | `#9AA092` | Hint text, link "Trocar perfil" |
| Apple button bg | `#23302A` | Botão Apple Sign-in exclusivamente |
| Success bg | `#4F9B57` | Botão Entrar em estado success (após Zitadel OK) |

**Fundo do teclado numérico (tela de PIN):** gradiente `radial-gradient(120% 100% at 50% 0%, #ECE7DB 0%, #E0DACB 100%)` — declarado explicitamente no README.

**Fonte:** `globals.css` @theme + `design_handoff_kreds/README.md` §Design Tokens > Cores

---

## Screens & Interaction Contract

### Screen 1 — Seleção de Perfil (`/family/[familyId]/select-profile`)

**Layout:** fullscreen mobile (392px). Fundo `--color-kreds-bg`. Coluna centralizada: logo topo, título "Quem está aqui?", grade de avatares, rodapé.

**Avatar card (por criança):**
- Círculo 72px diâmetro, gradiente `#5A8A66 → #3E6B4F`, `border-radius: 50%`
- Inicial do nome: 28px, weight 700, cor branco
- Nome abaixo: 14px, weight 600, `--color-kreds-text`
- Gap entre cards: 16px
- Grade: 2 colunas para ≥3 crianças; coluna única para 1-2

**Estado hover/press:**
- Transform `scale(0.96)`, transition `0.15s ease`
- Ring: `box-shadow: 0 0 0 3px rgba(62,107,79,.3)`

**Ação:** tap no avatar → navega para `/child/[childId]/login`

**Fonte:** D-01/D-02/D-03 em CONTEXT.md + discretion de layout do responsável

---

### Screen 2 — PIN da Criança (`/child/[childId]/login`) — CAUTH-01..05

**Layout:** fullscreen mobile (392×812px). Fundo: gradiente `radial-gradient(120% 100% at 50% 0%, #ECE7DB 0%, #E0DACB 100%)`. Coluna vertical centralizada.

**Ordem dos elementos (top → bottom):**
1. Logo (SVG folha bicolor + wordmark "kreds" 17px/800) — topo, 48px do topo
2. Plant hero SVG — 120px abaixo do logo — `animation: kredsBreath 5s ease-in-out infinite`
3. Saudação "Olá, [Nome]!" — 24px, weight 800, `--color-kreds-text`
4. Dots container — 24px abaixo da saudação
5. Teclado numérico — 32px abaixo dos dots
6. Link "Trocar perfil" — 24px abaixo do teclado

**Dots do PIN (4 unidades):**
- Diâmetro: 16px cada, gap: 12px
- Default: borda `2px solid #C3C9B7`, fundo transparente
- Preenchido: `bg #3E6B4F`, borda `#3E6B4F` + SVG brotinho sobreposto com `animation: kredsSprout 0.45s cubic-bezier(.2,.85,.3,1.3)` (CAUTH-05)
- Erro: `bg #D8916B`, borda `#C06B4A` (todos os 4 dots ao mesmo tempo)
- Shake no container: `animation: kredsShake 0.5s cubic-bezier(.36,.07,.19,.97)` disparado no container dos dots (CAUTH-02)
- Reset automático: após 950ms do shake, limpar todos os dots e voltar ao estado default

**Teclado numérico (grid 3×4):**
- Colunas: 1, 2, 3 / 4, 5, 6 / 7, 8, 9 / *, 0, ⌫
- Botões 1–9 e 0: 62×62px, `border-radius: 50%`, `bg #FBFAF5`, `box-shadow: 0 3px 0 #E6E1D4`, texto 22px/700
- Botão `*`: sem função visual (célula vazia, sem render)
- Botão `⌫`: sem fundo, sem borda, ícone SVG backspace 22px, `--color-kreds-text`
- Gap grid: 8px entre colunas, 12px entre linhas

**Animação de portão (PIN correto — CAUTH-03):**
- Dois painéis `.kreds-gateL` (esquerda) e `.kreds-gateR` (direita): cada um ocupa 50% da largura × 100% da altura, `bg #27372C` (escuro)
- Estado fechado: `translateX(0)` para ambos
- Estado aberto: `.kreds-gateL { transform: translateX(-101%) }` / `.kreds-gateR { transform: translateX(101%) }`
- Transição: `transform 1s cubic-bezier(.76,0,.24,1)`
- `.kreds-emblem` (logo central sobreposto): `opacity 0; transform: scale(.55)` ao abrir — transição `opacity 0.4s, transform 0.4s ease`
- Jardim atrás: `transition: transform 1.1s, opacity 0.8s`
- Sequência: PIN 4 → validação Server Action → sucesso → acionar classe `.open` nos painéis → redirect para `/child/[childId]/garden` após 1.1s

**Link "Trocar perfil" (CAUTH-04):**
- 12px, weight 600, cor `--color-kreds-hint` (`#9AA092`)
- Underline on hover
- Ação: limpar state local do PIN + navegar para `/family/[familyId]/select-profile`

**Fonte:** `design_handoff_kreds/README.md` §Frame A + REQUIREMENTS.md CAUTH-01..05 + CONTEXT.md §Specifics

---

### Screen 3 — Login do Responsável (`/login`) — GAUTH-01..04

**Layout:** fullscreen mobile (392×812px). Fundo `--color-kreds-bg`. Coluna com padding lateral 24px.

**Ordem dos elementos:**
1. Logo (SVG + wordmark) — topo, 48px do topo
2. Título "Bem-vindo de volta" — 24px/800
3. Subtítulo "Entre com sua conta familiar" — 15px/500, `--color-kreds-muted`
4. Campo e-mail (50px)
5. Campo senha (50px) com toggle olho
6. Linha: Checkbox "Lembrar-me" (esquerda) + Link "Esqueci minha senha" (direita)
7. Botão "Entrar" (52px)
8. Divisor "ou continue com" — linha `#ECE7DB` com texto 12px/600 `--color-kreds-muted` centralizado
9. Botão Google (44px)
10. Botão Apple (44px)
11. Botão Passkey (44px)
12. Rodapé: "Não tem conta? Criar conta" — 13px/600

**Input e-mail e senha:**
- Altura: 50px, `border-radius: 13px`, `border: 1.5px solid #E2DECF`, `bg #fff`
- Padding: 14px horizontal (ícone à esquerda a 14px da borda interna)
- Ícone SVG à esquerda: 16px, `--color-kreds-muted`
- Placeholder: 15px/500, `--color-kreds-hint`
- Focus: `border-color: #3E6B4F; box-shadow: 0 0 0 3px rgba(62,107,79,.13)`
- Campo senha: ícone olho toggle à direita — clique alterna `type="password"` ↔ `type="text"`

**Checkbox "Lembrar-me" (GAUTH-03):**
- 18×18px, `border-radius: 6px`, `border: 1.5px solid #E2DECF`
- Marcado: `bg #3E6B4F`, checkmark SVG branco inline
- Label: 13px/600, `--color-kreds-text`

**Botão "Entrar" (GAUTH-01, GAUTH-04):**
- 52px altura, `border-radius: 13px`, `bg #3E6B4F`, texto 15px/700 branco
- `box-shadow: 0 12px 24px -12px rgba(62,107,79,.6)`
- Loading (GAUTH-04): spinner CSS — `div 20×20px, border: 2.5px solid rgba(255,255,255,.3), border-top-color: #fff, border-radius: 50%, animation: kredsSpin 0.7s linear infinite`
- Success: `bg #4F9B57` + banner verde de confirmação Zitadel aparece acima do botão (12px/600 branco, `bg #4F9B57`, `border-radius: 8px`, padding 8px 12px)
- Disabled: `bg #C2C9BC; cursor: not-allowed` (se campos vazios)

**Botão Google:**
- 44px, `border-radius: 13px`, `border: 1.5px solid #E2DECF`, `bg #fff`
- Logo SVG Google à esquerda (20px), texto "Continuar com Google" 14px/600 `--color-kreds-text`

**Botão Apple:**
- 44px, `border-radius: 13px`, `bg #23302A`, texto branco
- Logo SVG Apple à esquerda (20px), texto "Continuar com Apple" 14px/600

**Botão Passkey:**
- 44px, `border-radius: 13px`, `border: 1.5px solid #E2DECF`, `bg #FBFAF5`
- Ícone chave SVG à esquerda (20px), texto "Entrar com Passkey" 14px/600 `--color-kreds-text`

**Ações dos botões sociais (D-04, D-05, D-06):**
- Google: `signIn('zitadel', {}, { identity_provider: 'google' })`
- Apple: `signIn('zitadel', {}, { identity_provider: 'apple' })`
- Passkey: `signIn('zitadel')` — Zitadel oferece passkey como opção interna

**Fonte:** `design_handoff_kreds/README.md` §Frame B + REQUIREMENTS.md GAUTH-01..04 + CONTEXT.md D-04..D-06

---

### Screen 4 — Redefinição de Senha (`/login/reset`) — GAUTH-05

**Layout:** fullscreen mobile (392px). Mesmo fundo `--color-kreds-bg`. Padding lateral 24px.

**Estado 1 — Formulário:**
- Seta voltar (topo esquerdo): 40×40px, `border-radius: 12px`, `border: 1.5px solid #E2DECF`, ícone ← SVG 16px
- Título "Redefinir senha" — 24px/800
- Subtítulo "Digite seu e-mail para receber o link" — 15px/500, `--color-kreds-muted`
- Campo e-mail (50px) — mesmo estilo dos inputs do login
- Botão "Enviar link" (52px) — mesmo estilo do Botão "Entrar"

**Estado 2 — Confirmação (após envio):**
- Ícone check verde: círculo 56px `bg #E7EFE8`, checkmark SVG 24px `#3E6B4F`
- Título "E-mail enviado!" — 24px/800
- Copy: "Enviamos o link para [e-mail mascarado]" — 15px/500, `--color-kreds-muted`
  - Mascaramento: `ana***@email.com` — manter 3 caracteres antes de `***`, domínio completo
- Botão "Reenviar e-mail" — 52px, `border-radius: 13px`, `border: 1.5px solid #E2DECF`, `bg transparent`, texto `#3E6B4F`, 15px/600
- Link "Voltar ao login" — 13px/600, `--color-kreds-hint`, underline on hover

**Transição entre estados:** troca de visibilidade (sem animação específica — apenas `display` ou condicional React)

**Fonte:** `design_handoff_kreds/README.md` §Frame E + REQUIREMENTS.md GAUTH-05

---

## Copywriting Contract

| Element | Copy | Screen |
|---------|------|--------|
| Seleção de perfil — título | "Quem está aqui?" | Select Profile |
| PIN — saudação | "Olá, [Nome]!" | Child PIN |
| PIN — link reset | "Trocar perfil" | Child PIN |
| PIN — erro | (sem texto — apenas shake visual + reset dots) | Child PIN |
| Login — título | "Bem-vindo de volta" | Guardian Login |
| Login — subtítulo | "Entre com sua conta familiar" | Guardian Login |
| Login — CTA primário | "Entrar" | Guardian Login |
| Login — CTA Google | "Continuar com Google" | Guardian Login |
| Login — CTA Apple | "Continuar com Apple" | Guardian Login |
| Login — CTA Passkey | "Entrar com Passkey" | Guardian Login |
| Login — divisor | "ou continue com" | Guardian Login |
| Login — footer | "Não tem conta? Criar conta" | Guardian Login |
| Login — link senha | "Esqueci minha senha" | Guardian Login |
| Login — checkbox | "Lembrar-me" | Guardian Login |
| Login — banner sucesso | "Login realizado com sucesso!" | Guardian Login |
| Login — loading state | (spinner apenas, sem texto) | Guardian Login |
| Redefinição — título | "Redefinir senha" | Password Reset |
| Redefinição — subtítulo | "Digite seu e-mail para receber o link" | Password Reset |
| Redefinição — CTA | "Enviar link" | Password Reset |
| Redefinição — sucesso título | "E-mail enviado!" | Password Reset |
| Redefinição — sucesso body | "Enviamos o link para [e-mail mascarado]. Verifique sua caixa de entrada." | Password Reset |
| Redefinição — reenviar | "Reenviar e-mail" | Password Reset |
| Redefinição — voltar | "Voltar ao login" | Password Reset |
| Erro de autenticação (OIDC) | "E-mail ou senha incorretos. Tente novamente." | Guardian Login |
| Erro de rede | "Não foi possível conectar. Verifique sua conexão." | Guardian Login |
| Brute force PIN (3 tentativas) | (sem texto na tela da criança — tratar silenciosamente com shake) | Child PIN |

Ações destrutivas nesta fase: **nenhuma**. Não há deleção de dados ou ação irreversível nas telas de autenticação da Fase 2.

**Fonte:** `design_handoff_kreds/README.md` §Frame A, B, E + REQUIREMENTS.md CAUTH-01..05, GAUTH-01..05

---

## Animation Contract

Todas as animações estão implementadas em `globals.css` desde a Fase 1. Esta seção declara como aplicá-las nesta fase.

| Animação | Trigger | Elemento | Duração |
|----------|---------|----------|---------|
| `kredsBreath` | sempre ativo | Plant hero SVG na tela de PIN | 5s infinite |
| `kredsSprout` | dot preenchido | SVG brotinho sobre cada dot | 0.45s one-shot |
| `kredsShake` | PIN incorreto | Container dos 4 dots | 0.5s one-shot, dispara 1x por erro |
| Gate L/R `transform` | PIN correto | `.kreds-gateL` e `.kreds-gateR` | 1s `cubic-bezier(.76,0,.24,1)` |
| Gate emblem | PIN correto | `.kreds-emblem` (logo central) | `opacity + scale` 0.4s ease |
| `kredsSpin` | loading state | Spinner no botão Entrar | 0.7s linear infinite |

Regras de timing:
- Shake (PIN errado): dispara → 950ms → limpar dots → remover classe shake
- Portão (PIN correto): `transform` inicia → 1.1s → redirect para `/child/[childId]/garden`
- Spinner (botão Entrar): aparece ao submeter → some ao receber resposta da OIDC

**Fonte:** `globals.css` keyframes + `design_handoff_kreds/README.md` §Animações + CONTEXT.md §Specifics

---

## Component Inventory

Componentes a criar nesta fase (todos em `src/components/auth/`):

| Componente | Arquivo | Descrição |
|------------|---------|-----------|
| `ProfileCard` | `profile-card.tsx` | Card de avatar para seleção de perfil |
| `PinDot` | `pin-dot.tsx` | Dot individual do PIN com estado (empty/filled/error) + brotinho |
| `PinDots` | `pin-dots.tsx` | Container dos 4 dots — gerencia shake state |
| `NumericKeypad` | `numeric-keypad.tsx` | Grid 3×4 com botões e backspace |
| `GateLock` | `gate-lock.tsx` | Overlay dos dois painéis do portão |
| `GuardianLoginForm` | `guardian-login-form.tsx` | Form completo e-mail + senha + checkbox |
| `SocialAuthButtons` | `social-auth-buttons.tsx` | Botões Google, Apple, Passkey |
| `AuthInput` | `auth-input.tsx` | Input estilizado (50px, radius 13px, ícone, focus ring) |
| `SpinnerButton` | `spinner-button.tsx` | Botão com estado loading (spinner CSS) |
| `PasswordResetForm` | `password-reset-form.tsx` | Form redefinição + estado confirmação |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none — projeto não usa shadcn | not applicable |
| third-party | none declared | not applicable |

Nenhum registry externo utilizado. Todos os componentes são implementados do zero seguindo o design system customizado da Fase 1.

---

## Accessibility Contract

- Touch targets mínimos: 44px — todos os botões do teclado numérico (62px) e inputs (50px) atendem
- Botão de backspace: `aria-label="Apagar"` obrigatório
- Dots do PIN: `role="status"` no container, `aria-label="PIN: X de 4 dígitos preenchidos"`
- Inputs do Guardian: `<label>` associado via `htmlFor`, não apenas placeholder
- Botão Entrar em loading: `aria-busy="true"`, `disabled` durante requisição
- Errors: `role="alert"` no container de erro de autenticação

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
