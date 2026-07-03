# Handoff: Gamificação do Jardim — Kreds

## Visão Geral

**Kreds** é um app de educação financeira e mordomia para famílias cristãs. Os pais criam e gerenciam tarefas com recompensas financeiras; as crianças completam as tarefas e veem seu "jardim" crescer como metáfora visual do progresso. O produto tem duas interfaces distintas:

- **Área dos Pais** — painel web/desktop para gerenciar tarefas, crianças e aprovações
- **Área das Crianças** — app mobile com jardim interativo, lista de tarefas do dia e cofrinho

A autenticação dos pais é feita via **Zitadel** (OIDC). As crianças entram com um **PIN de 4 dígitos**.

---

## Sobre os Arquivos de Design

Os arquivos `.dc.html` neste pacote são **protótipos de design em HTML** — eles mostram a aparência e o comportamento desejados, mas **não são código de produção**. A tarefa do desenvolvedor é **recriar estas telas no ambiente de destino** (React Native, Next.js, etc.) usando os padrões e bibliotecas já estabelecidos no projeto. Não copie o HTML diretamente.

Para visualizar os protótipos localmente, abra os `.dc.html` no navegador via servidor local (ex: `npx serve .`).

---

## Fidelidade

**Alta fidelidade (hifi).** Os protótipos têm cores, tipografia, espaçamento e interações finais. O desenvolvedor deve recriar a UI pixel a pixel, respeitando os tokens de design documentados abaixo.

---

## Telas / Views

### 1. `Kreds Login.dc.html` — Autenticação

Contém **5 frames** lado a lado (scroll horizontal no protótipo):

#### Frame A — Login da Criança (PIN)
- **Propósito:** A criança entra com PIN de 4 dígitos para acessar seu jardim.
- **Layout:** Fullscreen mobile (392×812). Fundo gradiente verde claro. Centralizado verticalmente em coluna: logo, plant hero SVG animado, saudação, 4 dots de PIN, teclado numérico 3×4, link "Trocar perfil".
- **Componentes:**
  - **Logo:** SVG folha bicolor (`#3E6B4F` / `#5A8A66`) + wordmark "kreds" 17px/800
  - **Plant hero:** SVG animado com `animation: kredsBreath 5s ease-in-out infinite` (translateY 0→-5px)
  - **PIN dots:** 4 círculos 16px, `border: 2px solid #C3C9B7`. Preenchido: `bg #3E6B4F`, borda `#3E6B4F`. Erro: `bg #D8916B`, borda `#C06B4A`. Cada dot ganha um SVG de brotinho ao ser preenchido (animação `kredsSprout`).
  - **Shake on error:** container dos dots recebe `animation: kredsShake 0.5s` ao errar o PIN.
  - **Teclado:** Grid 3×4. Botões numéricos 62px altura, `border-radius: 50%`, `bg #FBFAF5`, `box-shadow: 0 3px 0 #E6E1D4`. Botão 0 centralizado. Backspace `⌫` sem fundo.
  - **PIN correto (teste):** `1234`. Abre animação "portão" — dois painéis escuros dividem a tela (`translateX ±101%`) revelando um jardim atrás.
- **Transição do portão:**
  - `.kreds-gateL` e `.kreds-gateR`: `transition: transform 1s cubic-bezier(.76,0,.24,1)`
  - `.kreds-emblem`: logo central some com `opacity 0 + scale .55`
  - Glimpse do jardim atrás: `transition: transform 1.1s + opacity .8s`

#### Frame B — Login do Responsável (Zitadel)
- **Propósito:** Pai/mãe entra com e-mail + senha via Zitadel OIDC.
- **Layout:** Fullscreen mobile (392×812). Fundo off-white quente. Coluna com logo, título, form, divisor "ou continue com", botões sociais, passkey.
- **Componentes:**
  - **Input e-mail/senha:** 50px altura, `border-radius: 13px`, `border: 1.5px solid #E2DECF`, `bg #fff`. Focus: `border-color #3E6B4F + box-shadow 0 0 0 3px rgba(62,107,79,.13)`. Ícone SVG à esquerda (14px da borda), olho toggle à direita na senha.
  - **Checkbox "Lembrar":** 18×18px, `border-radius: 6px`. Marcado: `bg #3E6B4F`, checkmark SVG branco.
  - **Botão Entrar:** 52px, `border-radius: 13px`, `bg #3E6B4F`, shadow `0 12px 24px -10px rgba(62,107,79,.6)`. Loading: spinner CSS branco. Sucesso: `bg #4F9B57` + banner verde de confirmação Zitadel.
  - **Botão Google:** borda `#E2DECF`, bg branco. **Botão Apple:** bg `#23302A`, texto branco.

#### Frame C — Card de Credenciais da Criança (visão do pai)
- **Propósito:** Pai visualiza e gerencia o PIN da criança no painel.
- **Layout:** Card 420px dentro do painel desktop. Fundo `#F6F5F1`, `border-radius: 24px`.
- **Componentes:**
  - Avatar inicial 52×52px, `border-radius: 14px`, gradiente `#5A8A66→#3E6B4F`
  - Linha de username e linha de PIN separadas por `border-top: 1px solid #F4F1E9`
  - PIN oculto: `• • • •` — botão "Mostrar/Ocultar" com ícone olho
  - Ações: "Redefinir PIN" (bg verde) + "Ver atividade" (border off-white)

#### Frame D — Criar Conta (Onboarding Responsável)
- **Propósito:** Cadastro novo de família — Passo 1 de 2.
- **Layout:** Fullscreen mobile. Form com nome completo, e-mail, senha, checkbox de termos, botões sociais.
- **Fluxo:** Checkbox termos habilita botão. Loading 1.3s → "Conta criada!" (bg `#4F9B57`). Passo 2 (não prototipado) adiciona perfil da criança.

#### Frame E — Redefinir Senha
- **Propósito:** Recuperação de senha via e-mail.
- **Estados:**
  1. Formulário com campo de e-mail + botão "Enviar link"
  2. Confirmação: ícone check verde, texto mascarado `ana***@email.com`, botão "Reenviar"
- **Transição:** `sendReset()` alterna entre os dois estados (sem animação específica).

---

### 2. `Kreds Kids Garden.dc.html` — Jardim da Criança

- **Propósito:** Tela principal da criança. Completar tarefas "rega" o jardim. Completar todas faz o jardim florescer e libera colheita.
- **Layout:** Fullscreen mobile (392×812). Scroll vertical. Header, hero jardim (316px), lista de tarefas, card dízimo, card cofrinho. Bottom nav fixo (80px).

#### Header
- Avatar inicial 46×46px (`border-radius: 15px`, gradiente verde) + nome + subtítulo
- Badge de moedas: ícone SVG coin + valor `R$ XX` em `#9A7320`

#### Hero — Jardim
- Container 316px altura, `border-radius: 28px`, overflow hidden
- **Céu:** gradiente `#CFE0D8 → #DCE6CC → #CCD8AF`
- **Sol:** círculo 58px, radial-gradient amarelo, `animation: kredsSun 5s ease-in-out infinite`
- **Nuvens:** 2 divs pill brancas com `animation: kredsDrift1/2` (translateX alternado)
- **Morros:** 2 círculos grandes `#BBCB9E` / `#A9BA8B` posicionados abs nos cantos
- **Chão:** div 52px height, gradiente `#AFC289 → #96AB71`, border-radius top elíptico
- **Badge estação:** pill branco top-left com dot colorido + nome da estação
- **Tracker de água:** pill branco com ícone gota + 4 dots (azul `#6E9BA0` se rega feita, branco semi-transparente se não)
- **Speech bubble:** aparece quando `bubbleShow = true` — texto contextual sobre o estado do jardim. Animação `kredsBubble`.
- **Planta:** `<img>` com `drop-shadow`, posicionada `abs bottom 30px`, centrada. Arquivos: `garden/plant-a.png` (semente), `garden/plant-b.png` (broto), `garden/plant-c.png` (planta jovem), `garden/plant-d.png` (árvore). Progresso = número de tarefas concluídas (0→4).
  - Droop: `rotate(-2.5deg)` quando há tarefas pendentes (`transform-origin: 50% 94%`)
  - Pop: `animation: kredsPop 0.6s ease` ao regar
- **Respingos d'água:** 5 drops abs animados (`animation: kredsDrop 0.72s`) ao regar. Montados dinamicamente.
- **Flores da generosidade:** SVG de flores aparecem quando o dízimo é marcado
- **Botão Colher:** `position: absolute top right`, gradiente laranja `#C77F52→#B5623F`, só aparece quando todas as tarefas estão completas. `animation: kredsFruit 1.4s ease-in-out infinite`
- **Glow de colheita:** circle radial amarelo abs ao redor da planta, só quando `canHarvest = true`

#### Lista de Tarefas
- Cards 18px radius, padding 12px 13px
- Pendente: `bg #fff`, `border #EDE9DF`, título `#27372C`, sub `#A7AD9C`
- Concluída: `bg #EEF3EA`, `border #D6E2CC`, título `#4E6E3E`, sub `#7A9A6C`
- Botão check: 38×38px, `border-radius: 50%`. Desmarcado: borda `#D7DBCC`, bg branco. Marcado: bg `#3E6B4F`, checkmark SVG branco
- Transição: `background .3s ease, border-color .3s ease`

#### Card Dízimo
- Ícone flor 4 pétalas SVG rosa/roxo com centro dourado
- Botão "Plantar": gradiente rosa `#C98AA0→#A55E76`. Após clicar: `bg #B07E91`, label "Feito ✓", flores aparecem no jardim

#### Card Cofrinho (Meta)
- Progress bar 12px height, `border-radius: 999px`, gradiente verde `#5A8A66→#3E6B4F`
- Transição: `width .6s cubic-bezier(.2,.8,.3,1)`

#### Celebração (overlay)
- Cobre toda a tela, `z-index: 50`, fundo `rgba(244,241,232,.98)`
- Confetes: 20 divs `position: absolute`, `animation: kredsConfetti` com delays escalonados
- Card de versículo bíblico (Colossenses 3:23)
- Botão "Voltar ao jardim"

#### Bottom Nav
- 4 ícones: Jardim (ativo: `#3E6B4F`), Tarefas, Cofrinho, Doar
- Fundo `rgba(248,247,242,.93)`, `backdrop-filter: blur(8px)`, `border-top: 1px solid #E7E2D6`

---

### 3. `Kreds Tarefas (Pais).dc.html` — Painel de Tarefas (Desktop)

- **Propósito:** Pais criam, editam, ativam/desativam e excluem tarefas atribuídas às crianças.
- **Layout:** 1180×824px, `border-radius: 26px`. Sidebar (80px) + área principal (flex-col: topbar + content). Content = lista (flex:1) + painel lateral direito (336px fixo).

#### Sidebar
- Logo 40×40px, `border-radius: 12px`, gradiente `#5A8A66→#3E6B4F`
- 5 ícones de nav 44×44px, `border-radius: 13px`. Ativo: `bg #E7EFE8`, stroke `#3E6B4F`. Inativo: stroke `#9AA092`
- Avatar circular 38px no rodapé

#### Topbar
- Fundo `#FBFAF5`, `border-bottom: 1px solid #ECE7DB`, altura 64px
- Breadcrumb: família em `#3E6B4F/700`
- Badge usuário logado: pill branco com nome + avatar gradiente

#### Lista de Tarefas (coluna esquerda)
- **Filter chips:** "Todas" + chip por criança (com mini avatar). Selecionado: `bg #3E6B4F`, texto branco. Normal: `bg #FBFAF5`, borda `#E2DECF`
- **Task card:** `border-radius: 16px`, `border: 1.5px solid #ECE7DB`, `bg #fff`, padding 13.5px 15px. Flex row: ícone categoria (44×44px), conteúdo (título + badges), ações (avatares + edit + toggle)
  - **Em edição:** `bg #F4F8F2`, `border-color #3E6B4F`
  - **Inativa:** `opacity: 0.5`
  - **Animação "novo/salvo":** `animation: kredsNew 1.2s` — glow ring verde que desaparece
  - **Categorias e cores:**
    | Categoria | Label | Cor ícone/badge | Fundo suave |
    |---|---|---|---|
    | quarto | Quarto | `#3B6E8F` | `#E4EDF2` |
    | higiene | Higiene | `#2F8F8A` | `#E1F0EE` |
    | estudos | Estudos | `#B5623F` | `#F4E7E0` |
    | casa | Casa | `#8A6BB0` | `#EEE8F3` |
    | espiritual | Espiritual | `#3E6B4F` | `#E7EFE8` |
  - **Botão editar (lápis):** 34×34px, `border-radius: 10px`. Normal: `border #E2DECF`, `bg #FBFAF5`, stroke `#7C8676`. Ativo (editando essa tarefa): `border #3E6B4F`, `bg #EEF3EA`, stroke `#3E6B4F`
  - **Toggle ativo/inativo:** Switch 42×24px, `border-radius: 999px`. Ativo: `bg #3E6B4F`. Inativo: `bg #D7DBCC`. Knob 18×18px branco, transição `left .2s ease`

#### Painel Direito — Nova / Editar Tarefa
- Card `border-radius: 20px`, `bg #fff`, padding 20px, shadow `0 16px 36px -26px rgba(40,55,45,.5)`
- **Cabeçalho dinâmico:** ícone + título + subtítulo. Em modo edição: ícone lápis + "Editar tarefa" / "Ajuste e salve" + botão X para cancelar (30×30px, borda `#E2DECF`, hover laranja suave)
- **Campo título:** 46px, `border-radius: 12px`, `bg #FBFAF5`. Focus: `border-color #3E6B4F`, `bg #fff`
- **Chips de categoria:** 5 chips, selecionado usa a cor da categoria
- **Recompensa:** stepper com `−` / valor / `+`. Botões 38×38px. `R$ 0` mostra "Mordomia" em verde. Valor `> 0` mostra "R$ X" em `#27372C`
- **Recorrência:** 7 pills D/S/T/Q/Q/S/S. Selecionado: `bg #3E6B4F`, texto branco. Botão "Todos os dias" link verde
- **Atribuir a:** lista de crianças como botões toggle. Selecionado: `bg #EEF3EA`, `border #3E6B4F`, checkmark verde. Avatar colorido 32px por criança
- **Toggle aprovação:** switch 42×24px igual ao da lista
- **Botão principal:**
  - Nova tarefa: "Adicionar tarefa" — habilitado (verde) só se ≥1 criança selecionada
  - Edição: "Salvar alterações"
  - Desabilitado: "Selecione uma criança", `bg #C2C9BC`, `cursor: not-allowed`
- **Botão excluir (só em modo edição):** 44px, `bg #FBF1EC`, `border #E6CFC4`, texto `#B14A2E`. Hover: `bg #F6E4DC`. Ícone lixeira SVG.

---

## Interações & Comportamento

### Tarefas (Pais)
- Clicar no lápis de uma tarefa carrega seus dados no painel direito e destaca o card na lista
- Cancelar edição (X no topo) ou salvar restaura o painel para o estado "Nova tarefa"
- Toggle ativo/inativo não abre o painel de edição — é independente
- Flash de confirmação após adicionar ou salvar: `kredsNew` animation no card afetado
- Excluir remove o card imediatamente sem confirmação adicional (validar UX com produto)

### Jardim (Crianças)
- Cada tarefa completada "rega" a planta: efeito de respingo + pop + avanço de estágio
- Todas as tarefas completas → planta vai para estágio máximo + botão "Colher" aparece
- "Colher" abre overlay de celebração com confetes e versículo
- "Separar dízimo" ativa flores decorativas ao redor da planta
- Estações mudam a paleta de cores (tint layer + folhas + botões)

### Login (Criança)
- Erro de PIN: shake animation + reset automático após 950ms
- PIN correto (1234): animação do portão (1s) revela jardim por trás
- "Trocar perfil" reseta tudo

---

## Gerenciamento de Estado

### Área dos Pais (Tarefas)
```
state = {
  children: [{ id, name, initial, color }],
  tasks: [{
    id, title, category, reward (int R$),
    days ([0-6], 0=Dom), assigned ([childId]),
    active (bool), approval (bool)
  }],
  filter: "all" | childId,
  form: { title, category, reward, days, assigned, approval },
  editingId: null | taskId,
  justAdded: null | taskId  // controla flash de 1.2s
}
```

### Jardim (Criança)
```
state = {
  tasks: [{ id, emoji, title, done, chipBg }],
  titheDone: bool,
  harvested: bool,
  showCelebration: bool,
  coins: int,          // moedas acumuladas
  saved: int,          // R$ no cofrinho
  waterTick: int,      // key para remontar splash
  splashOn: bool,
  pop: bool
}
```
**Dependências de dados:**
- `doneCount` = tarefas completas → define estágio da planta (0–4)
- `canHarvest` = todas feitas && não colhido ainda
- `stage` mapeia para imagem da planta (`a`=semente, `b`=broto, `c`=planta, `d`=árvore)

---

## Design Tokens

### Cores
| Token | Hex | Uso |
|---|---|---|
| Verde primário | `#3E6B4F` | CTAs, seleção, ativo |
| Verde claro | `#5A8A66` | Gradientes, acento |
| Verde suave | `#E7EFE8` | Fundos selecionados |
| Verde hover | `#EEF3EA` | Hover em elementos verdes |
| Fundo app | `#F2F0E7` / `#F6F4EC` | Background principal |
| Fundo card | `#FBFAF5` | Inputs, cards |
| Borda padrão | `#ECE7DB` / `#E2DECF` | Bordas de cards e inputs |
| Laranja ação | `#B5623F` | Colheita, acento secundário |
| Amarelo moeda | `#E3C57C` / `#C99A3F` | Ícone de moedas |
| Dourado texto | `#9A7320` | Label de recompensa |
| Texto principal | `#27372C` | Títulos |
| Texto secundário | `#7C8676` / `#8A9384` | Subtítulos |
| Texto muted | `#9AA092` | Labels, placeholders |
| Erro/excluir | `#B14A2E` | Botão excluir, erro PIN |
| Rosa dízimo | `#C98AA0` | Elemento de generosidade |
| Gradiente fundo | `radial-gradient(120% 100% at 50% 0%, #ECE7DB 0%, #E0DACB 100%)` | Fundo da página |

### Tipografia
- **Família:** `Plus Jakarta Sans` (Google Fonts) — pesos 400, 500, 600, 700, 800
- **Fallback:** `system-ui, sans-serif`
- **Títulos principais:** 24–26px / 800
- **Títulos de seção:** 18–20px / 700–800
- **Body:** 14–15.5px / 500–700
- **Labels/captions:** 11–13px / 600–700
- **Letter-spacing títulos:** `-0.01em`

### Espaçamento & Radii
| Elemento | Border Radius |
|---|---|
| App container | 26px |
| Device bezel | 52px (externo), 42px (interno) |
| Cards grandes | 18–20px |
| Cards médios | 16px |
| Inputs | 12–13px |
| Chips/pills | 10px ou 999px |
| Avatares | 50% |
| Ícones de categoria | 13–15px |

### Sombras
- App container: `0 40px 90px -36px rgba(40,55,45,.55)`
- Cards: `0 16px 36px -26px rgba(40,55,45,.5)`
- Botão CTA: `0 12px 24px -12px rgba(62,107,79,.6)`
- Device: `0 34px 70px -22px rgba(40,55,45,.5)`

### Animações
| Nome | Duração | Easing | Uso |
|---|---|---|---|
| `kredsNew` | 1.2s | ease | Flash no card adicionado/editado |
| `kredsPop` | 0.6s | ease | Planta ao regar |
| `kredsBreath` | 5s | ease-in-out infinite | Plant hero no login |
| `kredsSun` | 5s | ease-in-out infinite | Sol pulsando |
| `kredsDrift1/2` | 16–20s | ease-in-out alternate | Nuvens flutuando |
| `kredsFlutter` | 3s | ease-in-out infinite | Borboleta |
| `kredsFruit` | 1.4s | ease-in-out infinite | Botão colher |
| `kredsDrop` | 0.72s | ease-in forwards | Gotas de água |
| `kredsConfetti` | 2.4–4s | linear infinite | Confetes na celebração |
| `kredsCele` | 0.5s | cubic-bezier(.2,.85,.3,1.3) | Entrada da celebração |
| `kredsBubble` | 0.4s | ease | Speech bubble |
| `kredsSprout` | 0.45s | cubic-bezier(.2,.85,.3,1.3) | Brotinho no dot do PIN |
| `kredsShake` | 0.5s | cubic-bezier(.36,.07,.19,.97) | Shake ao errar PIN |
| Gate L/R | 1s | `cubic-bezier(.76,0,.24,1)` | Portão abrindo |

---

## Assets

| Arquivo | Descrição |
|---|---|
| `garden/plant-a.png` | Planta estágio 0 (semente/broto inicial) |
| `garden/plant-b.png` | Planta estágio 1 (broto) |
| `garden/plant-c.png` | Planta estágio 2 (planta jovem) |
| `garden/plant-d.png` | Planta estágio 3 (árvore com frutas) |

Todos os ícones são SVGs inline. Nenhuma biblioteca de ícones externa é utilizada.

---

## Autenticação — Integração Zitadel

- **Pais:** OIDC / OAuth 2.0 via Zitadel. Suporta login por e-mail/senha, Google, Apple e Passkey.
- **Crianças:** PIN local de 4 dígitos. O PIN é armazenado e verificado no backend — o protótipo usa `"1234"` como PIN de teste.
- O Card de Credenciais (Frame C do Login) é a UI onde o pai pode ver/redefinir o PIN da criança no painel web.

---

## Arquivos

| Arquivo | Descrição |
|---|---|
| `Kreds Login.dc.html` | Autenticação — 5 telas (PIN, pai, card credencial, criar conta, redefinir senha) |
| `Kreds Kids Garden.dc.html` | App da criança — jardim interativo + tarefas + cofrinho |
| `Kreds Tarefas (Pais).dc.html` | Painel desktop dos pais — gerenciar tarefas (criar, editar, excluir, ativar) |
| `garden/plant-*.png` | Imagens das fases da planta |

---

## Notas para o Desenvolvedor

1. **Protótipos são interativos** — abra no navegador para entender o comportamento completo antes de implementar.
2. **Duas superfícies distintas:** mobile (React Native ou PWA) para as crianças; web desktop (Next.js/React) para os pais.
3. **Tipografia:** importe `Plus Jakarta Sans` do Google Fonts nos pesos 400/500/600/700/800.
4. **Planta SVG vs PNG:** o protótipo usa imagens PNG. Em produção, considere SVGs animados para melhor qualidade em diferentes densidades de tela.
5. **Aprovação de tarefas:** o campo `approval` existe no modelo de dados mas o fluxo de aprovação (notificação para o pai → confirmar → creditar recompensa) não está prototipado — alinhar com o produto.
6. **Persistência:** o protótipo é stateless (sem backend). O desenvolvedor deve conectar a API REST/GraphQL para tasks, children, coins e savings.
