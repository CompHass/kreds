---
phase: 04-child-tasks
reviewed: 2026-06-22T00:00:00Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - src/components/garden/garden-view.tsx
  - src/components/tasks/bottom-nav.tsx
  - src/components/tasks/savings-card.tsx
  - src/components/tasks/task-card.tsx
  - src/components/tasks/tithe-card.tsx
  - src/lib/seed/garden-seed.ts
  - tests/setup.ts
  - tests/unit/bottom-nav.test.tsx
  - tests/unit/child-tasks.test.tsx
findings:
  critical: 3
  warning: 4
  info: 2
  total: 9
status: issues_found
---

# Phase 04: Code Review Report

**Reviewed:** 2026-06-22T00:00:00Z
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

Nine source files were reviewed covering the child-tasks UI phase: the four new task/savings/tithe/nav components, the GardenView orchestrator, the garden seed data module, the test setup, and both test suites. The implementation is mostly coherent but contains three critical defects — a wrong prop value producing a permanently invisible component, an invalid ARIA role assignment, and a division-by-zero crash — plus four quality warnings and two info items.

---

## Critical Issues

### CR-01: `canHarvest` prop em `GardenHero` recebe `harvested` em vez de `canHarvest`

**File:** `src/components/garden/garden-view.tsx:105`
**Issue:** A variável local `canHarvest` (linha 48) contém a lógica correta — `doneCount === tasks.length && !harvested`. Porém, o JSX passa `canHarvest={harvested}` para `GardenHero` em vez de `canHarvest={canHarvest}`. O resultado é que `GardenHero` recebe `true` **depois** da colheita e `false` antes, invertendo o estado de "pronto para colher" vs "já colhido". Visualmente: o glow e a animação de colheita em `GardenHero` nunca aparecem quando o jardim está pronto para colher; eles aparecem apenas quando o jardim já foi colhido (estado pós-colheita). O `HarvestButton` (linha 115) usa a variável correta `canHarvest`, criando comportamento contraditório: o botão aparece mas o efeito visual do hero não corresponde.

**Fix:**
```tsx
// linha 105 — substituir:
canHarvest={harvested}
// por:
canHarvest={canHarvest}
```

---

### CR-02: ARIA inválido — `role="checkbox"` em elemento `<button>`

**File:** `src/components/tasks/task-card.tsx:15-16`
**Issue:** O componente renderiza um `<button>` com `role="checkbox"` e `aria-pressed`. Esses dois atributos se contradizem: `role="checkbox"` sobreescreve o papel nativo de `button`, mas `aria-pressed` é um atributo válido apenas para `role="button"`. Além disso, `role="checkbox"` exige `aria-checked` (não `aria-pressed`) e tem expectativas de teclado diferentes (Space para alternar, sem ativação por Enter). Leitores de tela anunciarão o elemento como "checkbox" mas responderão ao estado `aria-pressed`, produzindo anúncio confuso. O teste `child-tasks.test.tsx` confirma esse padrão ao consultar `screen.getByRole('checkbox')`, tornando o bug parte do contrato de teste.

**Fix:** Escolher uma semântica consistente. A opção mais simples (preserva o comportamento `disabled` nativo do button):
```tsx
// Remover role="checkbox" e usar aria-checked no lugar de aria-pressed:
<button
  // sem role="checkbox" — mantém role nativo "button"
  onClick={() => !task.done && onComplete(task.id)}
  disabled={task.done}
  aria-pressed={task.done}   // correto para role="button" toggle
  aria-label={...}
>
```
Se a semântica de checkbox for desejada, o elemento deve ser um `<input type="checkbox">` ou um elemento com `role="checkbox"` + `aria-checked` + gerenciamento manual de foco e teclado (Space key).

**Nota:** O teste `bottom-nav.test.tsx` e `child-tasks.test.tsx` precisarão ser atualizados se `role="checkbox"` for removido — mas isso é corretamente reflexo da correção, não uma limitação.

---

### CR-03: Divisão por zero quando `goal === 0` em `SavingsCard`

**File:** `src/components/tasks/savings-card.tsx:14`
**Issue:** `const targetWidth = Math.min(100, (savings / goal) * 100)` produz `Infinity` (ou `NaN` se `savings` também for 0) quando `goal === 0`. O valor `Infinity` é propagado para o estilo inline `width: "Infinity%"`, que browsers ignoram silenciosamente (a barra fica com `width: 0`). Porém, `aria-valuemax={goal}` passará `0` para o progressbar, o que viola a spec ARIA (valuemax deve ser maior que valuemin). Embora os seeds de teste usem sempre `goal: 100`, a interface `SavingsCardProps` não restringe valores e o dado eventualmente virá de banco, tornando o caso real.

**Fix:**
```tsx
const targetWidth = goal > 0
  ? Math.min(100, (savings / goal) * 100)
  : 0
```

---

## Warnings

### WR-01: `childId` declarado na interface mas nunca usado no corpo do componente

**File:** `src/components/garden/garden-view.tsx:29, 34`
**Issue:** `GardenViewProps` declara `childId: string` e o parâmetro é desestruturado implicitamente (não aparece no destructuring da linha 34: `{ seed, verse }`). Portanto `childId` é recebido do pai mas completamente ignorado. O comentário indica que a fase atual usa seed mockado, mas a prop pendura sem uso, não há `TODO` explícito, e compiladores TypeScript com `noUnusedLocals` podem emitir warning dependendo da config. Mais importante: a prop falsa dá a impressão de que `childId` está sendo consumido, quando a integração real está ausente.

**Fix:** Ou remover `childId` da interface até que a integração real seja implementada, ou adicionar um `TODO` explícito e `// eslint-disable-next-line` justificado:
```tsx
interface GardenViewProps {
  // TODO(phase-05): usar childId para buscar dados reais do banco
  childId: string
  seed: GardenSeed
  verse: Verse | null
}
// No destructuring, nomear explicitamente para evitar confusão:
export function GardenView({ childId: _childId, seed, verse }: GardenViewProps) {
```

---

### WR-02: `SEED_STAGE_A` compartilha referência direta de `BASE_TASKS` sem cópia

**File:** `src/lib/seed/garden-seed.ts:35`
**Issue:** `SEED_STAGE_A.tasks = BASE_TASKS` (referência direta, sem `.map()` ou spread). Todos os outros seeds criam cópias via `.map()`. Se qualquer consumidor mutar o array `SEED_STAGE_A.tasks` em runtime (ex.: push, splice), os objetos em `BASE_TASKS` serão mutados, afetando qualquer código que referencie `BASE_TASKS` depois. O `GardenView` usa `useState(seed.tasks)` — o state inicial é a referência, mas como React inicializa o state uma única vez, mutação posterior do state interno não afeta `BASE_TASKS`. O risco real está em testes: se dois testes compartilharem `SEED_STAGE_A` e um deles mutar `tasks[0].done`, o segundo teste verá o estado sujo.

**Fix:**
```ts
export const SEED_STAGE_A: GardenSeed = {
  // ...
  tasks: BASE_TASKS.map((t) => ({ ...t })),  // cópia rasa, igual aos outros seeds
  // ...
}
```

---

### WR-03: `IntersectionObserver` no mock de teste não implementa `takeRecords` nem `root`/`rootMargin`/`thresholds`

**File:** `tests/setup.ts:5-10`
**Issue:** O mock de `IntersectionObserver` omite as propriedades de instância `root`, `rootMargin`, `thresholds` e o método `takeRecords()` exigidos pela spec da interface. Se algum código futuro (ou a própria `BottomNav`) acessar essas propriedades, o teste lançará `TypeError: observer.takeRecords is not a function`. Atualmente os testes passam porque `BottomNav` só chama `observe()` e `disconnect()`, mas o mock está incompleto como ponto de extensão.

**Fix:**
```ts
globalThis.IntersectionObserver = class IntersectionObserver {
  root = null
  rootMargin = ''
  thresholds = []
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = vi.fn(() => [])
  constructor(public callback: IntersectionObserverCallback, public options?: IntersectionObserverInit) {}
} as unknown as typeof IntersectionObserver
```

---

### WR-04: `scrollTo` local shadowing de `window.scrollTo`

**File:** `src/components/tasks/bottom-nav.tsx:100`
**Issue:** A função local `scrollTo(id: string)` tem o mesmo nome que `window.scrollTo`. Dentro do escopo do componente, qualquer referência a `scrollTo` resolverá para a função local, não para `window.scrollTo`. Enquanto o comportamento atual é intencional, o shadowing pode causar confusão durante manutenção: um desenvolvedor que adicionar `scrollTo(x, y)` acidentalmente dentro do componente chamará a função local (que espera uma string `id`) em vez de `window.scrollTo`. TypeScript não emitirá erro porque a função local aceita qualquer string.

**Fix:** Renomear a função local para evitar o shadowing:
```ts
function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
// e atualizar o onClick:
onClick={() => item.section && scrollToSection(item.section)}
```

---

## Info

### IN-01: Valores monetários exibidos sem formatação decimal (`R$ 25` em vez de `R$ 25,00`)

**File:** `src/components/tasks/savings-card.tsx:64, 77`
**Issue:** `R$ {goal}` e `R$ {savings}` interpolam números diretamente. Para valores inteiros como `25` e `100` o resultado é `R$ 25` e `R$ 100`, omitindo os centavos. Se o banco retornar `25.5`, será renderizado `R$ 25.5` (ponto decimal em vez de vírgula, conforme padrão pt-BR). Não é um crash, mas é inconsistente com convenções monetárias brasileiras.

**Fix:**
```tsx
const fmt = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
// e usar: {fmt(savings)} e {fmt(goal)}
```

---

### IN-02: Botão "Doar" desabilitado usa `onClick={() => {}}` em vez de omitir o handler

**File:** `src/components/tasks/bottom-nav.tsx:137`
**Issue:** O item desabilitado renderiza `onClick={() => {}}` — um handler vazio que não faz nada. O `tabIndex={-1}` e `aria-disabled="true"` estão corretos, mas o handler vazio é código desnecessário que pode induzir futuros mantenedores a pensar que a função está "por ser implementada". A ausência de handler é mais explícita sobre a intenção.

**Fix:**
```tsx
// Remover o onClick do botão desabilitado — ou comentar explicitamente:
// onClick não definido intencionalmente; botão desabilitado
```

---

_Reviewed: 2026-06-22T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
