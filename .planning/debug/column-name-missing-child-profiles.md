---
status: investigating
trigger: "Login com guardian01, redirecionado para /family, erros: column name does not exist em child_profiles e task_templates"
created: 2026-06-30
updated: 2026-06-30
---

## Symptoms

- expected: Login como guardian01 carrega /family normalmente com perfis de filhos e tarefas
- actual: Página /family provavelmente falha silenciosamente ou mostra erro; logs do Postgres mostram `column "name" does not exist`
- errors: |
    ERROR: column "name" does not exist at character 12
    STATEMENT: SELECT id, name, family_id, pin_hash FROM child_profiles;
    ERROR: column "name" does not exist at character 12
    STATEMENT: SELECT id, name, assigned_child_id FROM task_templates;
    ERROR: column "name" does not exist at character 12
    STATEMENT: SELECT id, name, family_id, pin_hash FROM child_profiles ORDER BY created_at;
- timeline: Observado em 2026-06-27 02:50-02:54 UTC
- reproduction: Login com usuário guardian01, navegar para /family

## Current Focus

hypothesis: >
  As queries com SELECT id, name, family_id, pin_hash FROM child_profiles são
  geradas por um processo externo ao código do repositório principal (possivelmente
  uma ferramenta de administração, script não-commitado, ou uma versão de
  desenvolvimento com schema diferente que conectou ao banco de produção).
  O código do repositório SEMPRE usou display_name — nunca name — para child_profiles.
  O banco de produção está correto (tem display_name). O código que gerou as queries
  com name não foi encontrado em nenhum arquivo do repositório ou imagem Docker.

test: "Verificado exhaustivamente: schema TypeScript, migrações SQL, snapshots Drizzle, código compilado da imagem 0.1.0-44"
expecting: "A causa raiz é um processo externo ao repositório"
next_action: "Checkpoint — necessário input do usuário para identificar qual processo gerou as queries com name"

reasoning_checkpoint:
  hypothesis: >
    As queries SELECT id, name, family_id, pin_hash FROM child_profiles e
    SELECT id, name, assigned_child_id FROM task_templates vêm de um código
    que usava 'name' como coluna de child_profiles e task_templates, mas este
    código NÃO EXISTE no repositório git em nenhum commit, branch ou worktree.
    O banco tem display_name (correto). O código pedia name (incorreto). A fonte
    das queries não foi identificada nos artefatos disponíveis.
  confirming_evidence:
    - "Todos os 347 commits do repositório usam display_name para child_profiles (nunca name)"
    - "Todos os 8 snapshots Drizzle registram display_name como coluna de child_profiles"
    - "Todas as migrações SQL (0001 em diante) criam display_name, não name"
    - "O código compilado na imagem Docker 0.1.0-44 (commit 0b17ecc, 2026-06-13) usa schema.childProfiles.displayName"
    - "O erro é column name does not exist — banco tem display_name, algo pede name"
    - "Scripts seed-test-family.ts e .mts (não-commitados) também usam displayName corretamente"
    - "drizzle-kit push não gera queries SELECT id, name para tabelas de aplicação"
  falsification_test: >
    Se o repositório tivesse algum arquivo que gerasse SELECT id, name FROM child_profiles,
    o grep -rn em todos os commits e na imagem Docker teria encontrado.
  fix_rationale: >
    Não há fix para aplicar no código — o schema e o código estão corretos.
    O problema foi um processo externo. Ação necessária: identificar e remover/corrigir
    o processo externo.
  blind_spots: >
    - Não foi possível acessar o banco de produção diretamente (namespace kreds não existe no cluster)
    - Não foi possível verificar logs históricos do Kubernetes
    - Não foi verificado se há alguma ferramenta de BI/analytics ou pgAdmin conectada ao banco

## Evidence

- timestamp: 2026-06-30T00:00:00Z
  checked: src/lib/db/schema/index.ts (todos os commits)
  found: childProfiles sempre definido com displayName: text('display_name'), nunca name: text('name')
  implication: O schema TypeScript nunca gerou SELECT id, name FROM child_profiles

- timestamp: 2026-06-30T00:01:00Z
  checked: drizzle/0001_omniscient_scarlet_spider.sql e todos os 8 arquivos de migração
  found: CREATE TABLE child_profiles com display_name TEXT NOT NULL (nunca name)
  implication: O banco sempre foi criado com display_name desde a primeira migration

- timestamp: 2026-06-30T00:02:00Z
  checked: drizzle/meta/*.json (8 snapshots)
  found: Todos os snapshots registram display_name nas colunas de child_profiles e title em task_templates
  implication: Nenhuma versão histórica do schema Drizzle teve name para child_profiles

- timestamp: 2026-06-30T00:03:00Z
  checked: Imagem Docker 0.1.0-44 (código compilado em produção)
  found: label org.opencontainers.image.revision = 0b17ecc (commit de 2026-06-13); código compilado usa displayName:text('display_name')
  implication: O código em produção na época do erro usava display_name corretamente

- timestamp: 2026-06-30T00:04:00Z
  checked: Busca em todos os arquivos .js compilados da imagem Docker por SELECT id, name e pin_hash name
  found: Nenhum arquivo compilado contém a query SELECT id, name, family_id, pin_hash
  implication: O app Next.js não gerou as queries com name

- timestamp: 2026-06-30T00:05:00Z
  checked: scripts/seed-test-family.ts e scripts/seed-test-family.mts (arquivos não-commitados)
  found: Ambos usam displayName: 'Ana' e schema.childProfiles corretamente
  implication: Os scripts seed locais também não geram queries com name

- timestamp: 2026-06-30T00:06:00Z
  checked: drizzle-kit/bin.cjs (migration image node_modules)
  found: drizzle-kit não executa SELECT id, name FROM tabelas de aplicação durante push/introspect
  implication: O migration job (kreds-migrate) também não gerou as queries

- timestamp: 2026-06-30T00:07:00Z
  checked: git status (arquivos não-commitados no working tree)
  found: scripts/seed-test-family.ts e .mts são untracked mas usam schema correto
  implication: Nenhum arquivo local explica as queries com name

## Eliminated

- hypothesis: "O schema TypeScript do repositório tinha name ao invés de display_name"
  evidence: "Verificado em todos os 347 commits — sempre foi display_name para child_profiles"
  timestamp: 2026-06-30T00:00:00Z

- hypothesis: "As migrações SQL criaram coluna name que não foi renomeada"
  evidence: "Todas as migrations SQL desde 0001 criam display_name, nunca name"
  timestamp: 2026-06-30T00:01:00Z

- hypothesis: "O código compilado na imagem Docker gerou as queries"
  evidence: "Grep exhaustivo no código compilado não encontrou SELECT id, name para child_profiles"
  timestamp: 2026-06-30T00:03:00Z

- hypothesis: "Os scripts de seed locais geraram as queries"
  evidence: "seed-test-family.ts e .mts usam displayName corretamente"
  timestamp: 2026-06-30T00:05:00Z

- hypothesis: "drizzle-kit push gerou as queries durante migration"
  evidence: "drizzle-kit não faz SELECT para tabelas de aplicação durante introspect"
  timestamp: 2026-06-30T00:06:00Z

## Resolution

root_cause: >
  INCONCLUSIVO — As queries SELECT id, name, family_id, pin_hash FROM child_profiles
  e SELECT id, name, assigned_child_id FROM task_templates não foram encontradas em
  nenhum artefato do repositório. O banco de produção estava correto (com display_name).
  As queries com name vieram de um processo externo não identificado — possivelmente:
  (1) uma ferramenta de administração do banco (pgAdmin, DBeaver, Drizzle Studio) usando
  schema antigo/incorreto, (2) um script manual não-commitado com schema diferente, ou
  (3) código de uma versão de desenvolvimento nunca commitada.
fix: ""
verification: ""
files_changed: []
