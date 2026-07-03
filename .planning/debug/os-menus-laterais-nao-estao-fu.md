---
status: awaiting_human_verify
trigger: "os menus laterais nao estao funcionando no menu do responsavel"
created: 2026-07-03
updated: 2026-07-03
---

# Debug Session: os-menus-laterais-nao-estao-fu

## Symptoms

- **Expected:** Sidebar do painel do responsável deveria navegar entre seções (tarefas, filhos, etc) ao clicar nos itens.
- **Actual:** Nada acontece ao clicar nos itens da sidebar — clique não responde.
- **Errors:** Nenhum erro visível no console do navegador.
- **Timeline:** Já estava quebrado antes do último deploy (Fase 13 — editar filho). Não é regressão desse deploy.
- **Reproduction:** Rota `/family/[familyId]/tasks` (painel de tarefas do responsável) — clicar em qualquer item da sidebar.

## Current Focus

reasoning_checkpoint:
  hypothesis: "ParentSidebar (src/components/parent/parent-sidebar.tsx) nunca implementou navegação — os 5 <button> não têm onClick/Link/href porque a spec original (05-UI-SPEC.md, PTASK-01) só exigia requisitos visuais ('Claude's Discretion para os ícones exatos'), e nenhuma fase subsequente conectou os ícones a rotas. Root cause = funcionalidade ausente, não erro de lógica."
  confirming_evidence:
    - "Leitura completa de parent-sidebar.tsx (256 linhas): zero onClick, zero Link, zero useRouter em todo o arquivo"
    - "Único ponto de uso é parent-panel-view.tsx:186 `<ParentSidebar />` sem props — nenhum callback de navegação é injetado de fora"
    - "05-UI-SPEC.md e 05-02-PLAN.md (PTASK-01) especificam apenas dimensões, aria-label e cor do estado ativo — não mencionam onClick/navegação como requisito"
    - "git log do arquivo: só 2 commits (criação em ab2199d, rota SSR em 3b39b2f), nenhum commit posterior adicionou handlers"
    - "Dentro de ParentPanelView só existe a seção Tarefas implementada; não há componentes 'Crianças'/'Jardim'/'Relatórios'/'Configurações' no diretório src/components/parent/"
    - "src/app/family/dashboard/page.tsx tem comentário explícito: 'The real guardian panel is /family/[familyId]/tasks... every home/Jardim link still points here' — confirma que só a seção Tarefas foi migrada para o painel novo"
  falsification_test: "Se existisse algum onClick/Link no arquivo, ou algum callback prop passado de fora para ParentSidebar, a hipótese seria refutada. Não é o caso — confirmado por leitura completa do arquivo e grep global por 'ParentSidebar'."
  fix_rationale: "Adicionar navegação real aos 5 ícones usando next/link (padrão já usado em outras páginas legadas como family/audit e family/wishes) apontando para as rotas existentes e funcionais (/family/[familyId]/tasks, /family/children, /family/dashboard->jardim redirect, /family/audit) evita inventar rotas inexistentes, resolve o sintoma relatado (clique não responde) com o menor escopo possível, e usa usePathname para estado ativo dinâmico em vez do hardcode atual (Tarefas sempre ativo)."
  blind_spots: "Não testei em produção real (kreds.hasslab.pro) - apenas análise estática de código, conforme preferência do usuário de verificar via checkpoint. 'Configurações' e 'Relatórios' não têm rota implementada em lugar nenhum do app — vou aplicar Claude's Discretion (mesma cláusula da spec original) e deixá-los como aria-disabled/no-op documentado, evitando linkar para páginas que não existem, ao invés de forçar um destino incorreto."

- next_action: aguardando confirmação do usuário em produção (kreds.hasslab.pro) de que os itens "Tarefas" e "Crianças" da sidebar agora navegam corretamente ao clicar.

## Evidence

- timestamp: 2026-07-03
  checked: src/components/parent/parent-sidebar.tsx (arquivo completo, 256 linhas)
  found: Componente client ('use client') renderiza aside com 5 `<button>` (Tarefas, Crianças, Jardim, Relatórios, Configurações), cada um com apenas aria-label e estilos inline. Nenhum botão possui onClick, nenhum uso de next/link ou useRouter/usePathname em todo o arquivo. Botão "Tarefas" está hardcoded como visualmente ativo (background #E7EFE8) independente da rota atual.
  implication: Cliques nos itens da sidebar não executam nenhum código — comportamento é 100% decorativo por design incompleto, não por erro de runtime. Confirma "nenhum erro no console" do sintoma (não há handler para lançar erro).

- timestamp: 2026-07-03
  checked: grep por "ParentSidebar" em todo src/
  found: Único ponto de uso é src/components/parent/parent-panel-view.tsx linha 186 (`<ParentSidebar />`), sem props passadas.
  implication: Não há injeção de callback de navegação via prop em nenhum outro lugar — elimina hipótese de "handler existe mas não foi conectado no componente pai".

- timestamp: 2026-07-03
  checked: src/app/family/[familyId]/tasks/page.tsx e listagem de rotas em src/app/family/**
  found: A página `/family/[familyId]/tasks` é a única rota construída com o layout novo (ParentPanelView + ParentSidebar) usando familyId dinâmico na URL. Rotas legadas existem soltas sem familyId: /family/dashboard, /family/children, /family/wishes, /family/audit, /family/invitations.
  implication: Não existe ainda um conjunto de rotas /family/[familyId]/{children,dashboard,...} equivalente para os outros 4 ícones da sidebar navegarem via familyId dinâmico — navegação real dependeria de decisão de produto sobre mapear ícones para rotas legadas (sem familyId) ou aguardar rotas novas.

- timestamp: 2026-07-03
  checked: git log --oneline -- src/components/parent/parent-sidebar.tsx
  found: Dois commits: ab2199d "criar ParentSidebar (80px) e ParentTopbar (64px)" e 3b39b2f "rota SSR /family/[familyId]/tasks + suite GREEN". Nenhum commit subsequente adicionou navegação.
  implication: Confirma sintoma "já estava quebrado antes do último deploy" — sidebar nunca teve navegação implementada desde a criação inicial (fase 05), não é regressão.

## Eliminated

## Resolution

- root_cause: ParentSidebar (src/components/parent/parent-sidebar.tsx) foi construída na Fase 5 apenas com requisitos visuais (spec PTASK-01 exigia dimensões, aria-label, cor ativa — "Claude's Discretion para os ícones exatos"). Nenhum dos 5 botões de navegação recebeu onClick, Link ou href, e nenhuma fase posterior conectou a navegação. É funcionalidade nunca implementada, não regressão.
- fix: Reescrito ParentSidebar para receber prop `familyId` e usar `next/link` + `usePathname` (padrão já usado em pin-screen.tsx e nas páginas legadas family/audit, family/wishes). "Tarefas" navega para `/family/${familyId}/tasks` (rota real, SSR já existente) e "Crianças" navega para `/family/children` (rota legada funcional). "Jardim", "Relatórios" e "Configurações" não têm seção implementada em nenhum lugar do app (nem no painel novo, nem como rota standalone equivalente) — ficam com `aria-disabled="true"` + `tabIndex={-1}` + `onClick={() => {}}`, mesmo padrão já usado em src/components/tasks/bottom-nav.tsx para itens sem destino, evitando linkar para uma rota que não representa a funcionalidade esperada (ex.: /family/dashboard é só redirect stub de volta para tasks). Estado "ativo" (bg #E7EFE8, stroke verde) agora é calculado dinamicamente via `pathname === item.href` em vez de hardcoded no primeiro botão. `parent-panel-view.tsx` atualizado para passar `familyId` (antes recebido como `_familyId`, não utilizado) para `<ParentSidebar familyId={familyId} />`.
- verification: (1) `npx tsc --noEmit` — zero erros de TypeScript em todo o projeto. (2) `npx vitest run` — 201 passed / 2 failed / 65 skipped, idêntico ao baseline antes do fix (confirmado via git stash) — as 2 falhas são em tests/unit/child-tasks.test.tsx (TaskCard — CTASK-02), não relacionadas a ParentSidebar/ParentPanelView, pré-existentes. Nenhuma regressão introduzida. (3) tests/unit/parent-panel.test.tsx falha ao importar 'next/server' via next-auth em ambos antes/depois do fix — erro de ambiente de teste pré-existente, não causado por esta mudança. (4) Leitura do código final confirma: cada item de navItems agora renderiza `<Link href>` (Tarefas, Crianças) ou `<button aria-disabled>` (Jardim, Relatórios, Configurações), eliminando a causa raiz (ausência de onClick/href).
- files_changed: [src/components/parent/parent-sidebar.tsx, src/components/parent/parent-panel-view.tsx]
