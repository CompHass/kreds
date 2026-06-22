---
phase: 03-child-garden
plan: 01
subsystem: garden-data-layer
tags: [drizzle, schema, seed, test-stubs, nyquist, bible-verses, garden]
dependency_graph:
  requires: []
  provides:
    - bibleVerses Drizzle table (src/lib/db/schema/index.ts)
    - bible_verses SQL table no banco (7 versículos)
    - GardenSeed / GardenTask interfaces TypeScript
    - SEED_STAGE_A..SEED_TITHE constantes
    - getPlantStage função pura
    - getBubbleText função pura
    - SEASON_DOT_COLORS record
    - public/garden/plant-{a,b,c,d}.png assets
    - 7 arquivos de teste Nyquist Wave 0
  affects: []
tech_stack:
  added: []
  patterns:
    - Drizzle pgTable sem FK (tabela standalone de conteúdo público)
    - Seed SQL idempotente com DELETE + INSERT
    - Funções puras testadas independentemente de componentes
    - Nyquist Wave 0 — test stubs escritos antes dos componentes
key_files:
  created:
    - src/lib/seed/garden-seed.ts
    - drizzle/seed/bible-verses.sql
    - drizzle/0008_abandoned_scourge.sql
    - public/garden/plant-a.png
    - public/garden/plant-b.png
    - public/garden/plant-c.png
    - public/garden/plant-d.png
    - tests/unit/garden-stage.test.ts
    - tests/unit/garden-season.test.ts
    - tests/unit/garden-bubble.test.ts
    - tests/unit/garden-header.test.tsx
    - tests/unit/garden-hero.test.tsx
    - tests/unit/garden-view.test.tsx
    - tests/unit/garden-celebration.test.tsx
  modified:
    - src/lib/db/schema/index.ts
decisions:
  - "getPlantStage mapping: 0→a, 1→b, 2..n-1→c, n→d (4 tarefas no seed)"
  - "getBubbleText: prioridade harvested > titheDone > stage"
  - "garden-season.test.ts: arquivo .ts puro para funções puras (sem JSX); SeasonBadge testado em garden-hero.test.tsx no Plano 02"
  - "Seed SQL idempotente: DELETE FROM bible_verses antes do INSERT"
  - "psql localizado em /opt/homebrew/Cellar/postgresql@16/16.14/bin/psql — psql não está no PATH padrão do agente"
metrics:
  duration: "6 min"
  completed_date: "2026-06-22"
  tasks_completed: 3
  files_created: 14
  files_modified: 1
---

# Phase 03 Plan 01: Garden Data Layer Summary

Infraestrutura de dados e testes da Fase 3 do jardim entregue: tabela `bible_verses` criada via migração Drizzle com 7 versículos bíblicos sobre mordomia/generosidade, constantes de seed TypeScript cobrindo todos os estados visuais do jardim, funções puras `getPlantStage`/`getBubbleText` e `SEASON_DOT_COLORS`, 4 assets PNG em `public/garden/`, e 7 arquivos de teste Nyquist Wave 0 (funções puras verdes, componentes RED — esperado).

## Tasks Executadas

| Task | Nome | Commit | Status |
|------|------|--------|--------|
| 1 | Schema bibleVerses + seed SQL | 8c672fe | DONE |
| 2 | drizzle-kit generate + db:push + seed | 4448b9d | DONE |
| 3 | Seed TS + funções puras + 7 test stubs | 2df131c | DONE |

## Artifacts Entregues

### Schema e Banco (Tasks 1-2)

- `src/lib/db/schema/index.ts`: export `bibleVerses = pgTable('bible_verses', {...})` adicionado ao final (4 colunas: id uuid PK, reference text, text text, created_at timestamp)
- `drizzle/seed/bible-verses.sql`: INSERT idempotente de 7 versículos (Colossenses, Provérbios ×2, 2 Coríntios, Lucas, Gálatas, Mateus)
- `drizzle/0008_abandoned_scourge.sql`: migração gerada por drizzle-kit — `CREATE TABLE "bible_verses"`
- Banco: `SELECT count(*) FROM bible_verses` = **7** verificado

### Seed TypeScript (Task 3)

- `src/lib/seed/garden-seed.ts`: 6 constantes + 2 funções puras + 1 record de cores
  - `SEED_STAGE_A` (0 done), `SEED_STAGE_B` (1 done), `SEED_STAGE_C` (3 done), `SEED_STAGE_D` (4 done), `SEED_HARVESTED` (harvested=true), `SEED_TITHE` (titheDone=true)
  - `getPlantStage(0,4)='a'`, `(1,4)='b'`, `(2,4)='c'`, `(4,4)='d'` ✓
  - `getBubbleText`: prioridade harvested > titheDone > stage
  - `SEASON_DOT_COLORS`: primavera=#5A8A66, verao=#E3C57C, outono=#B5623F, inverno=#6E9BA0

### Assets PNG (Task 3)

4 arquivos copiados de `design_handoff_kreds/garden/` para `public/garden/`:
- `plant-a.png` (28KB), `plant-b.png` (62KB), `plant-c.png` (124KB), `plant-d.png` (229KB)

### Test Stubs — Nyquist Wave 0 (Task 3)

| Arquivo | Req | Status Wave 0 |
|---------|-----|----------------|
| garden-stage.test.ts | GARD-03 | VERDE (16 testes passam) |
| garden-season.test.ts | GARD-06 | VERDE (SEASON_DOT_COLORS puras) |
| garden-bubble.test.ts | GARD-07 | VERDE (getBubbleText pura) |
| garden-header.test.tsx | GARD-01 | RED (GardenHeader ausente — esperado) |
| garden-hero.test.tsx | GARD-02,04,09 | RED (GardenHero ausente — esperado) |
| garden-view.test.tsx | GARD-05,08 | RED (GardenView ausente — esperado) |
| garden-celebration.test.tsx | GARD-10 | RED (CelebrationOverlay ausente — esperado) |

## Deviações do Plano

### Auto-fixed Issues

**1. [Rule 1 - Bug] Arquivo garden-season.test.ts usa JSX mas extensão .ts**

- **Encontrado em:** Task 3 (verificação de teste)
- **Problema:** O PLAN.md lista `garden-season.test.ts` (sem x) mas a ação pedia importar SeasonBadge e usar JSX. Arquivo `.ts` não compila JSX.
- **Correção:** Manteve `garden-season.test.ts` com apenas as funções puras (verde), sem JSX. O teste de SeasonBadge como componente ficará no `garden-hero.test.tsx` no Plano 02 quando o componente existir. Isso respeita o critério do plano de que `garden-season.test.ts` deve PASSAR no Wave 0.
- **Arquivos modificados:** `tests/unit/garden-season.test.ts`
- **Commit:** 2df131c

**2. [Rule 3 - Blocking] psql não no PATH — localizado manualmente**

- **Encontrado em:** Task 2 (seed do banco)
- **Problema:** `psql: command not found` — o binário existe em `/opt/homebrew/Cellar/postgresql@16/16.14/bin/psql` mas não está no PATH do agente
- **Correção:** Usado path absoluto do psql no comando de seed. `pnpm dlx dotenv-cli` carregou `DATABASE_URL` do `.env.local`
- **Commit:** 4448b9d

**3. [Rule 3 - Blocking] DATABASE_URL não disponível via pnpm db:push diretamente**

- **Encontrado em:** Task 2
- **Problema:** `pnpm db:push` falhou com "Either connection url or host required" — DATABASE_URL não estava no ambiente do agente
- **Correção:** `pnpm dlx dotenv-cli -e .env.local pnpm db:push` carregou as variáveis corretamente

## Verificação Final

```
pnpm test tests/unit/garden-stage.test.ts tests/unit/garden-season.test.ts tests/unit/garden-bubble.test.ts
→ Test Files  3 passed (3), Tests  16 passed (16)

psql "$DATABASE_URL" -tAc "SELECT count(*) FROM bible_verses;"
→ 7

ls public/garden/plant-*.png
→ plant-a.png plant-b.png plant-c.png plant-d.png (4 arquivos)

ls tests/unit/garden-*.test.*
→ 7 arquivos
```

## Known Stubs

Nenhum stub de dados hardcoded ou placeholder. As constantes SEED_* são intencionalmente mock (D-01 do CONTEXT.md) — dados reais do backend na Fase 6.

## Threat Flags

Nenhuma nova superfície de ameaça além do mapeado no threat_model do plano. `bible_verses` contém apenas texto bíblico público (sem PII, sem dados por-criança — T-03-02 aceito como no threat register).

## Self-Check: PASSED

Arquivos criados:
- FOUND: src/lib/db/schema/index.ts (modificado — export bibleVerses presente)
- FOUND: drizzle/seed/bible-verses.sql
- FOUND: drizzle/0008_abandoned_scourge.sql
- FOUND: src/lib/seed/garden-seed.ts
- FOUND: public/garden/plant-a.png, plant-b.png, plant-c.png, plant-d.png
- FOUND: tests/unit/garden-stage.test.ts, garden-season.test.ts, garden-bubble.test.ts
- FOUND: tests/unit/garden-header.test.tsx, garden-hero.test.tsx, garden-view.test.tsx, garden-celebration.test.tsx

Commits:
- FOUND: 8c672fe (Task 1)
- FOUND: 4448b9d (Task 2)
- FOUND: 2df131c (Task 3)
