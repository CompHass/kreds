# Requirements: Kreds

**Defined:** 2026-06-20
**Core Value:** A criança completa tarefas, vê seu jardim florescer e aprende mordomia — o loop de engajamento gamificado deve funcionar sem fricção.

## v2.0 Requirements — Redesign Jardim Kreds

Requirements para o redesign completo do frontend. Cada um mapeia para fases do roadmap.

### Design System

- [x] **DS-01**: Tokens de cor implementados como variáveis CSS/Tailwind (verde primário `#3E6B4F`, fundos, bordas, estados)
- [x] **DS-02**: Tipografia Plus Jakarta Sans importada e configurada com pesos 400/500/600/700/800
- [x] **DS-03**: Animações CSS nomeadas implementadas (kredsBreath, kredsPop, kredsNew, kredsDrift, kredsSun, etc.)
- [x] **DS-04**: Border-radius, sombras e espaçamentos como tokens reutilizáveis no Tailwind config

### Autenticação Criança

- [x] **CAUTH-01**: Criança vê tela de PIN com 4 dots, teclado numérico 3×4, logo e plant hero animada
- [x] **CAUTH-02**: Erro de PIN dispara animação shake nos dots e reseta automaticamente após 950ms
- [x] **CAUTH-03**: PIN correto abre animação de portão (dois painéis + cubic-bezier 1s) revelando jardim
- [x] **CAUTH-04**: Link "Trocar perfil" reseta completamente a tela de PIN
- [x] **CAUTH-05**: Cada dot preenchido exibe SVG de brotinho com animação kredsSprout

### Autenticação Responsável

- [x] **GAUTH-01**: Responsável vê tela de login com campo e-mail, senha e botão Entrar via Zitadel OIDC
- [x] **GAUTH-02**: Botões de login social (Google, Apple) e opção Passkey disponíveis
- [x] **GAUTH-03**: Checkbox "Lembrar-me" funcional com estilo customizado (verde `#3E6B4F`)
- [x] **GAUTH-04**: Botão de login exibe spinner CSS branco durante loading
- [x] **GAUTH-05**: Tela de redefinição de senha com form e estado de confirmação (e-mail mascarado + reenviar)

### Jardim da Criança

- [x] **GARD-01**: Header com avatar inicial, nome da criança, saudação e badge de moedas (SVG coin)
- [x] **GARD-02**: Hero jardim 316px com céu gradiente, sol animado (kredsSun), 2 nuvens (kredsDrift1/2)
- [x] **GARD-03**: Planta exibida em 4 estágios (plant-a→d) baseada na contagem de tarefas concluídas
- [x] **GARD-04**: Tracker de água com 4 dots (azul `#6E9BA0` se rega feita, branco semi-transparente se não)
- [ ] **GARD-05**: Ao concluir tarefa: 5 drops animados (kredsDrop) + pop na planta (kredsPop) + avanço de estágio
- [x] **GARD-06**: Badge de estação no hero com dot colorido e nome da estação
- [x] **GARD-07**: Speech bubble contextual aparece conforme estado do jardim (animação kredsBubble)
- [ ] **GARD-08**: Botão "Colher" laranja com animação kredsFruit aparece somente quando todas tarefas concluídas
- [x] **GARD-09**: Flores decorativas SVG aparecem no jardim ao separar dízimo
- [ ] **GARD-10**: Overlay de celebração com 20 confetes (kredsConfetti), card de versículo bíblico e botão voltar

### Tarefas da Criança

- [ ] **CTASK-01**: Lista de task cards com visual distinto para pendente (branco) e concluído (verde suave `#EEF3EA`)
- [ ] **CTASK-02**: Botão check circular 38×38px toggle — desmarcado (borda `#D7DBCC`) e marcado (bg `#3E6B4F` + check branco)
- [ ] **CTASK-03**: Card de dízimo com ícone flor, botão "Plantar" gradiente rosa, estado "Feito ✓" após clicar
- [ ] **CTASK-04**: Card de cofrinho com meta, valor salvo e progress bar animada (`.6s cubic-bezier`)
- [ ] **CTASK-05**: Bottom nav fixo (80px) com 4 ícones: Jardim, Tarefas, Cofrinho, Doar — ativo verde `#3E6B4F`

### Painel de Tarefas dos Pais

- [ ] **PTASK-01**: Layout 1180px com sidebar (80px) + área principal flex-col + painel lateral direito fixo (336px)
- [ ] **PTASK-02**: Topbar 64px com breadcrumb (família em verde), badge de usuário logado com nome e avatar
- [ ] **PTASK-03**: Filter chips "Todas" + chip por criança com mini avatar — selecionado em verde, normal em off-white
- [ ] **PTASK-04**: Task cards com ícone de categoria, toggle ativo/inativo (switch 42×24px), botão lápis editar
- [ ] **PTASK-05**: 5 categorias com cores e ícones distintos (quarto, higiene, estudos, casa, espiritual)
- [ ] **PTASK-06**: Painel direito com form criar/editar: título, categoria chips, recompensa, recorrência, atribuição, aprovação
- [ ] **PTASK-07**: Stepper de recompensa com botões ± — valor zero mostra "Mordomia" em verde, valor > 0 mostra "R$ X"
- [ ] **PTASK-08**: Pills de recorrência D/S/T/Q/Q/S/S + botão "Todos os dias" — selecionado em verde
- [ ] **PTASK-09**: Flash kredsNew (glow ring verde 1.2s) no card após adicionar ou salvar tarefa
- [ ] **PTASK-10**: Botão excluir (laranja/vermelho) aparece somente em modo edição de tarefa existente

### Ajustes de API

- [ ] **API-01**: Campo `approval` em tasks persistido no banco e exposto via API (GET/POST/PATCH)
- [ ] **API-02**: Endpoints de tasks retornam `category` e `days` (array de recorrência) no payload
- [ ] **API-03**: Endpoint de colheita (`POST /api/child/[childId]/harvest`) registra evento de colheita no ledger

## Fora do Escopo (v2.0)

| Feature | Reason |
|---------|--------|
| Fluxo de aprovação de tarefas (notificação → confirmar → creditar) | Não prototipado no handoff — alinhar com produto antes |
| App nativo React Native | Web/PWA-first neste milestone |
| Notificações push | Fora do design handoff v2.0 |
| Onboarding passo 2 (perfil da criança) | Passo 2 não prototipado |
| Card de credenciais da criança (Frame C do login) | Funcionalidade admin — prioridade menor |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DS-01 | Phase 1 | Complete |
| DS-02 | Phase 1 | Complete |
| DS-03 | Phase 1 | Complete |
| DS-04 | Phase 1 | Complete |
| CAUTH-01 | Phase 2 | Complete |
| CAUTH-02 | Phase 2 | Complete |
| CAUTH-03 | Phase 2 | Complete |
| CAUTH-04 | Phase 2 | Complete |
| CAUTH-05 | Phase 2 | Complete |
| GAUTH-01 | Phase 2 | Complete |
| GAUTH-02 | Phase 2 | Complete |
| GAUTH-03 | Phase 2 | Complete |
| GAUTH-04 | Phase 2 | Complete |
| GAUTH-05 | Phase 2 | Complete |
| GARD-01 | Phase 3 | Complete |
| GARD-02 | Phase 3 | Complete |
| GARD-03 | Phase 3 | Complete |
| GARD-04 | Phase 3 | Complete |
| GARD-05 | Phase 3 | Pending |
| GARD-06 | Phase 3 | Complete |
| GARD-07 | Phase 3 | Complete |
| GARD-08 | Phase 3 | Pending |
| GARD-09 | Phase 3 | Complete |
| GARD-10 | Phase 3 | Pending |
| CTASK-01 | Phase 4 | Pending |
| CTASK-02 | Phase 4 | Pending |
| CTASK-03 | Phase 4 | Pending |
| CTASK-04 | Phase 4 | Pending |
| CTASK-05 | Phase 4 | Pending |
| PTASK-01 | Phase 5 | Pending |
| PTASK-02 | Phase 5 | Pending |
| PTASK-03 | Phase 5 | Pending |
| PTASK-04 | Phase 5 | Pending |
| PTASK-05 | Phase 5 | Pending |
| PTASK-06 | Phase 5 | Pending |
| PTASK-07 | Phase 5 | Pending |
| PTASK-08 | Phase 5 | Pending |
| PTASK-09 | Phase 5 | Pending |
| PTASK-10 | Phase 5 | Pending |
| API-01 | Phase 6 | Pending |
| API-02 | Phase 6 | Pending |
| API-03 | Phase 6 | Pending |

**Coverage:**

- v2.0 requirements: 42 total
- Mapped to phases: 42/42 ✓
- Unmapped: 0

---
*Requirements defined: 2026-06-20*
*Last updated: 2026-06-20 — roadmap v2.0 criado, traceability completa*
