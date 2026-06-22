---
phase: 03-child-garden
reviewed: 2026-06-22T00:00:00Z
depth: standard
files_reviewed: 23
files_reviewed_list:
  - drizzle/0008_abandoned_scourge.sql
  - drizzle/seed/bible-verses.sql
  - src/app/(child)/child/[childId]/garden/page.tsx
  - src/components/garden/celebration-overlay.tsx
  - src/components/garden/confetti-field.tsx
  - src/components/garden/decorative-flowers.tsx
  - src/components/garden/garden-header.tsx
  - src/components/garden/garden-hero.tsx
  - src/components/garden/garden-view.tsx
  - src/components/garden/harvest-button.tsx
  - src/components/garden/harvest-glow.tsx
  - src/components/garden/plant-stage.tsx
  - src/components/garden/season-badge.tsx
  - src/components/garden/speech-bubble.tsx
  - src/components/garden/water-drops.tsx
  - src/components/garden/water-tracker.tsx
  - src/lib/db/schema/index.ts
  - src/lib/seed/garden-seed.ts
  - tests/unit/garden-bubble.test.ts
  - tests/unit/garden-celebration.test.tsx
  - tests/unit/garden-header.test.tsx
  - tests/unit/garden-hero.test.tsx
  - tests/unit/garden-season.test.ts
  - tests/unit/garden-stage.test.ts
  - tests/unit/garden-view.test.tsx
findings:
  critical: 3
  warning: 5
  info: 3
  total: 11
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-06-22T00:00:00Z
**Depth:** standard
**Files Reviewed:** 23
**Status:** issues_found

## Summary

Revisão do módulo de jardim da criança (Phase 3 — child-garden). O escopo cobre a migração de banco de dados, seed de versículos bíblicos, componentes de UI do jardim (Server + Client Components), biblioteca de seed/lógica pura e suíte de testes unitários.

A base de código é coesa e bem estruturada. Foram identificados **3 blockers** e **5 warnings** que exigem correção antes de produção. O blocker mais grave é uma inversão de prop crítica em `GardenView` que faz o tracker de água e o glow de colheita exibirem estado incorreto após o harvest. Os outros dois blockers envolvem: um `childId` recebido via props mas ignorado silenciosamente (acoplamento futuro quebrado), e um seed de banco de dados não atômico (DELETE sem transação que permite janela de inconsistência em produção).

---

## Critical Issues

### CR-01: `canHarvest` prop de `GardenHero` recebe `harvested` em vez da variável derivada correta

**File:** `src/components/garden/garden-view.tsx:93`

**Issue:** O componente calcula `canHarvest = doneCount === tasks.length && !harvested` na linha 41, mas na linha 93 passa `canHarvest={harvested}` para `GardenHero`. `harvested` é o state booleano "jardim já foi colhido", que é o oposto semântico de `canHarvest`. Consequências concretas:

1. Enquanto o usuário ainda não colheu (`harvested=false`), `GardenHero` recebe `canHarvest=false` mesmo quando todas as tarefas estão concluídas — logo `HarvestGlow` nunca acende e `WaterTracker` aparece quando deveria ser substituído pelo glow.
2. Após colher (`harvested=true`), `GardenHero` recebe `canHarvest=true` — `HarvestGlow` fica aceso permanentemente e `WaterTracker` fica oculto.

O `HarvestButton` em linha 103 usa `canHarvest` (variável correta) e por isso funciona — mas o visual do hero fica invertido.

**Fix:**
```tsx
// linha 93 — substituir `harvested` pela variável derivada correta
canHarvest={canHarvest}
```

---

### CR-02: `childId` declarado em `GardenViewProps` mas descartado silenciosamente no destructuring

**File:** `src/components/garden/garden-view.tsx:24,29`

**Issue:** A interface declara `childId: string` (linha 24) e a page passa `childId={childId}` (derivado do URL param), mas o destructuring na linha 29 ignora completamente a prop: `export function GardenView({ seed, verse }: GardenViewProps)`. O `childId` nunca é utilizado dentro do componente.

Isso cria dois problemas simultâneos:
- **Dado de segurança silenciado:** O childId do URL deveria ser usado para autorizar a exibição dos dados da criança correta. Ao ignorá-lo, qualquer criança autenticada pode ver o jardim de qualquer `childId` — a page busca o versículo aleatório sem filtrar por criança e passa o seed mockado global. Quando o seed for substituído por dados reais do banco, o `childId` precisará estar vinculado, e se a prop continuar sendo ignorada, haverá fuga de dados entre crianças.
- **TypeScript não alerta:** A prop está no tipo mas não no destructuring — o compilador não emite erro, o bug passa sem aviso.

**Fix:**
```tsx
// Incluir childId no destructuring mesmo que ainda não usado (fase mockada),
// adicionando um comentário explícito de uso futuro e lint-suppress se necessário:
export function GardenView({ seed, verse, childId }: GardenViewProps) {
  // TODO(Phase 4): usar childId para buscar tarefas reais do banco
  // e validar que a criança pertence à família do guardian autenticado
  void childId // previne "unused variable" até Phase 4
  ...
}
```

---

### CR-03: Seed SQL destrói dados sem transação — janela de inconsistência em produção

**File:** `drizzle/seed/bible-verses.sql:3`

**Issue:** O script executa `DELETE FROM bible_verses;` seguido pelo `INSERT INTO bible_verses ...` sem envolver em transação (`BEGIN` / `COMMIT`). Se a conexão cair, o processo for interrompido, ou o INSERT falhar parcialmente após o DELETE, a tabela ficará vazia. Em produção, uma re-execução do seed (e.g., durante deploy CI/CD) pode deixar a tabela sem versículos entre o DELETE e o INSERT, fazendo a GardenPage servir `verse = null` para todos os usuários nesse intervalo — o overlay de celebração ficará sem versículo.

**Fix:**
```sql
BEGIN;

DELETE FROM bible_verses;

INSERT INTO bible_verses (id, reference, text) VALUES
  (gen_random_uuid(), 'Colossenses 3:23', 'Tudo o que fizerem, façam de todo o coração, como para o Senhor.'),
  (gen_random_uuid(), 'Provérbios 3:9', 'Honra ao Senhor com os teus bens e com as primícias de todos os teus frutos.'),
  (gen_random_uuid(), '2 Coríntios 9:7', 'Cada um dê conforme determinou em seu coração, pois Deus ama quem dá com alegria.'),
  (gen_random_uuid(), 'Lucas 6:38', 'Dai, e ser-vos-á dado.'),
  (gen_random_uuid(), 'Provérbios 11:24', 'Há quem dê generosamente e fique mais rico; há quem retenha o que é seu e fique mais pobre.'),
  (gen_random_uuid(), 'Gálatas 6:9', 'Não nos cansemos de fazer o bem, pois a seu tempo colheremos, se não desanimarmos.'),
  (gen_random_uuid(), 'Mateus 6:20', 'Acumulem para si tesouros no céu, onde a traça e a ferrugem não destroem.');

COMMIT;
```

---

## Warnings

### WR-01: `WaterTracker` hardcodado para 4 dots mas `waterCount` pode exceder 4 sem clamp

**File:** `src/components/garden/water-tracker.tsx:10,17` e `src/components/garden/garden-view.tsx:40`

**Issue:** `WaterTracker` renderiza sempre `Array.from({ length: 4 }, ...)` e o `aria-label` afirma "de 4 tarefas". O `waterCount` em `GardenView` é calculado como `doneCount` (linha 40), que pode ser qualquer valor entre 0 e `tasks.length`. Se `tasks.length !== 4` (e.g., em fase futura quando o seed vier do banco), todos os dots ficam preenchidos mesmo antes de completar todas as tarefas porque `i < filled` com `filled > 4` satisfaz todos os 4 índices. O `aria-label` também fica incorreto. Não há validação ou clamp em nenhum dos dois arquivos.

**Fix:**
```tsx
// water-tracker.tsx — aceitar total como prop
interface WaterTrackerProps {
  filled: number
  total: number  // número real de tarefas
}

export function WaterTracker({ filled, total }: WaterTrackerProps) {
  const clamped = Math.min(filled, total)
  return (
    <div aria-label={`Tracker de água: ${clamped} de ${total} tarefas concluídas`} ...>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{ background: i < clamped ? '...' : '...' }} />
      ))}
    </div>
  )
}

// garden-view.tsx — passar total
<WaterTracker filled={waterCount} total={tasks.length} />
```

---

### WR-02: `CelebrationOverlay` — dialog sem `aria-labelledby` viola WCAG 2.1 AA

**File:** `src/components/garden/celebration-overlay.tsx:28-29`

**Issue:** O elemento tem `role="dialog"` e `aria-modal="true"` mas não possui `aria-labelledby` apontando para o `<h2>` interno. Leitores de tela não anunciam o título do dialog quando o foco entra nele, tornando o overlay inacessível para usuários de tecnologia assistiva. WCAG 2.1 AA (critério 4.1.2) exige que dialogs tenham nome acessível. Além disso, o foco não é preso dentro do overlay — ao pressionar Tab, o usuário pode focar elementos atrás do overlay.

**Fix:**
```tsx
// Adicionar id ao h2 e aria-labelledby ao dialog
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="celebration-title"
  ...
>
  ...
  <h2 id="celebration-title" style={{ ... }}>
    Parabéns! Você colheu seu jardim!
  </h2>
```

---

### WR-03: `SpeechBubble` com `whiteSpace: 'nowrap'` provoca overflow em textos longos

**File:** `src/components/garden/speech-bubble.tsx:25`

**Issue:** O estilo `whiteSpace: 'nowrap'` impede quebra de linha no texto. O texto mais longo em `getBubbleText` é `"Seu jardim está esperando por você! Complete uma tarefa para começar."` (70 caracteres). Com `maxWidth: 240` e `fontSize: 14`, esse texto transborda o container e pode ultrapassar as bordas do hero (360px de largura máxima no GardenView). Em dispositivos com fonte maior (acessibilidade de sistema), o overflow é mais severo.

**Fix:**
```tsx
// Remover whiteSpace: 'nowrap' ou substituir por 'normal'
// whiteSpace: 'normal' permite quebra de linha e respeita maxWidth: 240
style={{
  ...
  // remover: whiteSpace: 'nowrap',
  whiteSpace: 'normal',  // ou simplesmente omitir (default é 'normal')
  ...
}}
```

---

### WR-04: `handleTaskComplete` não previne race condition com `setTimeout` em desmontes

**File:** `src/components/garden/garden-view.tsx:51-52`

**Issue:** `handleTaskComplete` chama `setShowPop(true)` e agenda `setTimeout(() => setShowPop(false), 650)`. Se o componente for desmontado antes dos 650ms (e.g., navegação rápida), a callback tenta chamar `setShowPop` em um componente desmontado. Em React 18 com Strict Mode, isso não gera crash mas produz warning no console. O problema mais real é que clicar em múltiplas tarefas em sequência rápida acumula timeouts — o último a completar 650ms vence e pode cancelar o pop animation do clique mais recente, criando comportamento visual inconsistente.

**Fix:**
```tsx
import { useRef, useEffect } from 'react'

// dentro do componente:
const popTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

useEffect(() => {
  return () => {
    if (popTimerRef.current) clearTimeout(popTimerRef.current)
  }
}, [])

function handleTaskComplete(taskId: string) {
  setTasks((prev) =>
    prev.map((t) => (t.id === taskId ? { ...t, done: true } : t)),
  )
  setWaterTick((tick) => tick + 1)
  setShowPop(true)
  if (popTimerRef.current) clearTimeout(popTimerRef.current)
  popTimerRef.current = setTimeout(() => setShowPop(false), 650)
}
```

---

### WR-05: `getPlantStage` retorna `'d'` quando `totalTasks === 0` e `doneCount === 0`

**File:** `src/lib/seed/garden-seed.ts:96-104`

**Issue:** Com `totalTasks = 0`, a condição `doneCount === 0` satisfaz o primeiro `if` e retorna `'a'` corretamente. Porém com `totalTasks = 0` e `doneCount = 0`, a condição `doneCount < totalTasks` é `0 < 0 = false`, portanto cai no `return 'd'`. Mas `doneCount === 0` já retorna `'a'` antes. O problema real aparece com `doneCount === tasks.length` quando `tasks.length === 0`: `canHarvest = 0 === 0 && !harvested` = `true` — um jardim sem tarefas ficaria "pronto para colher" imediatamente ao montar o componente. O `HarvestButton` ficaria visível sem que a criança tenha feito qualquer tarefa.

**Fix:**
```ts
export function getPlantStage(
  doneCount: number,
  totalTasks: number,
): 'a' | 'b' | 'c' | 'd' {
  if (totalTasks === 0 || doneCount === 0) return 'a'
  if (doneCount === 1) return 'b'
  if (doneCount < totalTasks) return 'c'
  return 'd'
}

// Em GardenView, proteger canHarvest também:
const canHarvest = tasks.length > 0 && doneCount === tasks.length && !harvested
```

---

## Info

### IN-01: `GardenPage` não valida se `childId` é um UUID válido antes da query

**File:** `src/app/(child)/child/[childId]/garden/page.tsx:15,19`

**Issue:** O `childId` extraído dos params é passado diretamente para `GardenView` sem qualquer validação de formato (UUID). Atualmente o `childId` não é usado na query do banco, então não há risco imediato de SQL injection (Drizzle usa parâmetros preparados). Mas quando a integração real com o banco for implementada na Phase 4, se o `childId` for passado para queries sem validação prévia, haverá superfície de ataque. Recomenda-se validar o formato do UUID logo na entrada da page.

**Fix:**
```tsx
import { redirect } from 'next/navigation'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function GardenPage({ params }) {
  const { childId } = await params
  if (!UUID_REGEX.test(childId)) redirect('/not-found')
  ...
}
```

---

### IN-02: `BASE_TASKS` é um array compartilhado por referência entre seeds exportados

**File:** `src/lib/seed/garden-seed.ts:21-26,33`

**Issue:** `SEED_STAGE_A` referencia `tasks: BASE_TASKS` diretamente (sem cópia). Se qualquer código consumidor mutar o array `tasks` de `SEED_STAGE_A` (e.g., `seed.tasks[0].done = true`), a mutação afeta `BASE_TASKS` e portanto todos os outros seeds na mesma sessão. Em testes, isso pode causar vazamento de estado entre testes se um teste reutiliza `SEED_STAGE_A` sem clonar. Os outros seeds usam `.map()` que cria novos arrays, mas `SEED_STAGE_A.tasks` é a referência direta.

**Fix:**
```ts
export const SEED_STAGE_A: GardenSeed = {
  ...
  tasks: BASE_TASKS.map((t) => ({ ...t })), // cópia rasa consistente com os outros seeds
  ...
}
```

---

### IN-03: Comentário obsoleto em `garden-celebration.test.tsx` indica arquivo implementado

**File:** `tests/unit/garden-celebration.test.tsx:4`

**Issue:** O comentário na linha 4 diz `"CelebrationOverlay ainda não implementado — Wave 0 (RED)"` mas o componente foi implementado em `src/components/garden/celebration-overlay.tsx`. Comentários de estado "RED/GREEN" do TDD que não são removidos após a implementação adicionam ruído e podem confundir futuros mantenedores sobre o estado real do código. O mesmo padrão aparece nos arquivos `garden-header.test.tsx:4` e `garden-view.test.tsx:5`.

**Fix:** Remover os comentários de Wave 0 dos três arquivos de teste:
- `tests/unit/garden-celebration.test.tsx:3-5`
- `tests/unit/garden-header.test.tsx:3-5`
- `tests/unit/garden-view.test.tsx:4-6`

---

_Reviewed: 2026-06-22T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
