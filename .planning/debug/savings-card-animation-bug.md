---
status: investigating
trigger: "Progress bar do SavingsCard ainda não anima de 0→25% no mount mesmo após fix com setTimeout(0)"
created: 2026-06-22T14:00:00Z
updated: 2026-06-22T14:20:00Z
---

## Current Focus

hypothesis: "setTimeout(0) é insuficiente: o React 19 pode batchar o render inicial (width: 0%) e o update de setTimeout no mesmo frame visual do browser, impedindo que a CSS transition observe a transição de 0% → 25%. A solução é double-rAF (requestAnimationFrame aninhado), que garante que o browser comitou exatamente um frame com width: 0% antes de aplicar o target."
test: "Substituir setTimeout(0) por double-rAF e verificar animação no browser"
next_action: "Aplicar fix em src/components/tasks/savings-card.tsx"
reasoning_checkpoint:
  hypothesis: "setTimeout(0) agenda uma macrotask, mas o React 19 scheduler pode processar o commit inicial + o update de estado no mesmo ciclo de pintura do browser — especialmente em Next.js 16 App Router com SSR+hydration, onde a 'hydration frame' pode coincidir com a frame de animação. double-rAF garante que o browser comite um frame com width:0% antes de aplicar width:25%, dando à CSS transition um estado inicial visível para partir."
  confirming_evidence:
    - "O componente usa 'use client' mas é renderizado via RSC page.tsx — o SSR entrega HTML com width:0% e a hydration acontece em seguida"
    - "React 19 (19.2.7) tem scheduler melhorado que pode consolidar microtasks e a primeira macrotask (setTimeout 0) em uma única pintura"
    - "O comentário no código menciona 'double-rAF em React 18 Strict Mode dispara antes do browser comitar' — indicando que double-rAF foi considerado mas descartado incorretamente; o problema com double-rAF era específico do Strict Mode do React 18, que não existe mais no React 19"
    - "React 19 removeu o double-invocation do Strict Mode, então o bloqueio original que motivou setTimeout(0) não existe mais — double-rAF agora é seguro e correto"
  falsification_test: "Se após trocar para double-rAF a animação ainda não funcionar, significa que o problema é no CSS transition em si (e.g., a propriedade 'width' não está sendo reconhecida, ou o overflow:hidden está interferindo)"
  fix_rationale: "double-rAF (rAF dentro de rAF) garante que: frame 1 = browser pinta width:0%, frame 2 = browser pinta width:25% com transition ativa. setTimeout(0) não garante separação de frames visuais."
  blind_spots: "Não foi possível verificar em browser ao vivo — a confirmação visual depende do checkpoint humano"

## Symptoms

expected: "Progress bar anima de 0% → 25% com ~0.6s cubic-bezier ao montar o componente"
actual: "Progress bar já aparece em 25% sem animação"
error_messages: "Nenhum erro visível"
timeline: "Problema original + fix tentado com setTimeout(0) + animated state, mas problema persiste"
reproduction: "Carregar /child/[childId]/garden e observar o SavingsCard"

## Evidence

- timestamp: 2026-06-22T14:10:00Z
  checked: "src/components/tasks/savings-card.tsx — mecanismo de animação completo"
  found: "usa useState(false) + useEffect com setTimeout(0) para setar animated=true; width é '${animated ? targetWidth : 0}%' com transition: 'width .6s cubic-bezier'"
  implication: "setTimeout(0) é uma macrotask — não há garantia de separação de frames visuais do browser"

- timestamp: 2026-06-22T14:10:00Z
  checked: "package.json — versões React e Next.js"
  found: "React 19.2.7, Next.js 16.2.7"
  implication: "React 19 tem scheduler melhorado; o comentário no código menciona que double-rAF foi descartado por causa do Strict Mode do React 18, mas React 19 não tem mais double-invocation no Strict Mode — double-rAF é agora a abordagem correta"

- timestamp: 2026-06-22T14:10:00Z
  checked: "src/app/(child)/child/[childId]/garden/page.tsx — contexto de renderização"
  found: "Server Component (RSC) que importa GardenView ('use client'). SSR entrega HTML com animated=false (width:0%), hydration acontece e setTimeout(0) é agendado"
  implication: "O fluxo SSR+hydration cria janela onde React 19 pode consolidar a hydration + o primeiro setTimeout(0) na mesma frame de pintura"

- timestamp: 2026-06-22T14:10:00Z
  checked: "src/components/garden/garden-view.tsx — uso do SavingsCard"
  found: "SavingsCard renderizado com savings={seed.savings} goal={seed.goal}, seed.savings=25, seed.goal=100 → targetWidth=25%"
  implication: "targetWidth nunca é 0 — a animação 0→25% precisa de estado inicial correto"

## Eliminated

## Resolution

root_cause: "setTimeout(0) agenda uma macrotask mas não garante separação de frames visuais do browser. Em React 19 (scheduler melhorado) + Next.js 16 App Router com SSR+hydration, o React pode consolidar o commit de hydration e o callback do setTimeout(0) na mesma frame de pintura, impedindo que o browser veja o estado width:0% antes de aplicar width:25%. Assim a CSS transition nunca tem dois estados distintos para interpolar e a barra já aparece em 25% sem animação."
fix: "Substituído setTimeout(0) por double-rAF (requestAnimationFrame aninhado): o rAF externo aguarda o browser comitar um frame com width:0%, o rAF interno agenda setAnimated(true) para o frame seguinte. Isso garante dois frames visuais separados para a CSS transition funcionar corretamente."
verification: "Aguardando confirmação humana no browser"
files_changed:
  - src/components/tasks/savings-card.tsx
