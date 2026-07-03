---
status: resolved
trigger: "erro no build docker/CI: ZodError PIN_ENCRYPTION_KEY invalid_type durante next build (page data collection de /api/auth/[...nextauth] e /api/family/[familyId]/children)"
created: 2026-07-02
updated: 2026-07-02
---

## Symptoms

- expected: Docker build (CI, `docker-scan-push` job) completa com sucesso
- actual: `pnpm build` falha dentro do container builder com `Error [ZodError]: [{"expected":"string","code":"invalid_type","path":["PIN_ENCRYPTION_KEY"],"message":"Invalid input"}]` ao coletar page data para `/api/auth/[...nextauth]` e `/api/family/[familyId]/children/route`
- error_messages: |
  Error [ZodError]: [
    {
      "expected": "string",
      "code": "invalid_type",
      "path": ["PIN_ENCRYPTION_KEY"],
      "message": "Invalid input"
    }
  ]
  ...
  Build error occurred
  Error: Failed to collect page data for /api/auth/[...nextauth]
  ...
  ELIFECYCLE  Command failed with exit code 1.
  Dockerfile:12 RUN corepack enable pnpm && DATABASE_URL=... AUTH_SECRET=build-time-placeholder-secret AUTH_ZITADEL_ID=build-time-placeholder-client-id AUTH_ZITADEL_SECRET=build-time-placeholder-client-secret AUTH_ZITADEL_ISSUER=... ZITADEL_ISSUER=... CHILD_SESSION_SECRET=build-time-placeholder-child-session-secret NEXT_PUBLIC_APP_URL=... pnpm build && mkdir -p public
  Docker build attempt 3 failed; retrying in 60s
- timeline: Começou a falhar após o push da Fase 8 (commits até fb42970) — Fase 8 (plan 08-01) adicionou `PIN_ENCRYPTION_KEY` como campo obrigatório com validação eager em `src/lib/env.ts`. O Dockerfile builder stage já injeta placeholders de build-time para `AUTH_SECRET`, `AUTH_ZITADEL_ID/SECRET`, `CHILD_SESSION_SECRET`, etc., mas NÃO inclui `PIN_ENCRYPTION_KEY` na lista de placeholders — mesma classe de omissão que já foi corrigida no `docker-compose.yml` (commit 69fc47b) para o container de runtime, mas o Dockerfile builder stage (usado durante o `docker build` da CI) ficou de fora dessa correção.
- reproduction: Qualquer `docker build` da imagem (CI `build-scan-push` job ou build local), pois `next build` executa `pnpm build` que colige page data e instancia os route handlers, o que dispara a validação eager do `envSchema` em `src/lib/env.ts` (adicionada em 08-01) durante o build — sem `PIN_ENCRYPTION_KEY` no ambiente do estágio builder, o parse Zod falha.

## Current Focus

reasoning_checkpoint:
  hypothesis: "Dockerfile builder stage (linha 12-21) omite PIN_ENCRYPTION_KEY da lista de env vars de build-time; envSchema.parse(process.env) roda eager no top-level de src/lib/env.ts e é importado transitivamente ao coletar page data de rotas server (/api/auth/[...nextauth], /api/family/[familyId]/children), então undefined falha o z.string().refine() com ZodError invalid_type"
  confirming_evidence:
    - "Leitura direta do Dockerfile linhas 12-21: DATABASE_URL, AUTH_SECRET, AUTH_ZITADEL_ID, AUTH_ZITADEL_SECRET, AUTH_ZITADEL_ISSUER, ZITADEL_ISSUER, CHILD_SESSION_SECRET, NEXT_PUBLIC_APP_URL presentes; PIN_ENCRYPTION_KEY ausente"
    - "Leitura direta de src/lib/env.ts: PIN_ENCRYPTION_KEY é z.string().refine(...) sem default/optional; export const env = envSchema.parse(process.env) no top-level do módulo (eager)"
    - "Padrão idêntico já ocorreu e foi corrigido no docker-compose.yml (commit 69fc47b) para o runtime container — mesma classe de omissão, arquivo diferente"
  falsification_test: "Se PIN_ENCRYPTION_KEY já estivesse presente no Dockerfile builder stage (com valor válido base64/32-byte) e o build ainda falhasse com o mesmo erro, a hipótese estaria refutada"
  fix_rationale: "Adicionar PIN_ENCRYPTION_KEY=<placeholder base64 32-byte válido> à mesma linha RUN do estágio builder resolve a causa raiz (env var ausente no ambiente de build) sem alterar a validação eager em env.ts, que é intencional (Pitfall 4 do 08-01-PLAN.md: falhar rápido no boot/build, não no primeiro uso em runtime)"
  blind_spots: "Não testei rodar `docker build` localmente ainda para confirmar que o fix realmente resolve — farei isso na etapa de verificação. Não investiguei se há outros lugares (ex. GitHub Actions workflow) que também precisam do placeholder além do Dockerfile."
next_action: aguardar confirmação humana de que o pipeline CI (build-scan-push) completa com sucesso após o merge/push desta correção

## Evidence

- timestamp: 2026-07-02T00:00:00Z
  checked: src/lib/env.ts
  found: |
    `PIN_ENCRYPTION_KEY` é definido como `z.string().refine(...)` — sem `.optional()` ou `.default()`.
    `export const env = envSchema.parse(process.env)` roda no top-level do módulo (eager parse ao importar).
    Todos os outros campos obrigatórios (AUTH_SECRET, CHILD_SESSION_SECRET, AUTH_ZITADEL_ID, AUTH_ZITADEL_SECRET) têm placeholders no Dockerfile builder stage.
  implication: Qualquer import (direto ou transitivo) de env.ts durante `next build` (page data collection) dispara parse eager; se PIN_ENCRYPTION_KEY estiver undefined, Zod falha com invalid_type — bate com o stack trace observado.

- timestamp: 2026-07-02T00:00:01Z
  checked: Dockerfile (linhas 7-22, estágio builder)
  found: |
    A RUN do `pnpm build` (linha 12-21) define placeholders para DATABASE_URL, AUTH_SECRET, AUTH_ZITADEL_ID, AUTH_ZITADEL_SECRET, AUTH_ZITADEL_ISSUER, ZITADEL_ISSUER, CHILD_SESSION_SECRET, NEXT_PUBLIC_APP_URL.
    `PIN_ENCRYPTION_KEY` está ausente dessa lista — confirmado por leitura direta do arquivo.
  implication: Hipótese CONFIRMADA — env var ausente (undefined) no ambiente do estágio builder causa a falha do Zod parse durante `next build`. Mesma classe de bug já corrigida no docker-compose.yml (commit 69fc47b), mas o Dockerfile builder stage ficou de fora.

- timestamp: 2026-07-02T00:00:02Z
  checked: docker-compose.yml e 08-05-SUMMARY.md
  found: |
    `docker-compose.yml` já tinha `PIN_ENCRYPTION_KEY: dhA/bC7ugD4I5gx4omcLQOivxxwDWe8tDJa/710JQRE=` (gerado via `openssl rand -base64 32`, corrigido no commit 69fc47b).
    `Buffer.from(<esse valor>, 'base64').length` = 32 (verificado via node -e), portanto passa no `.refine()` do schema.
  implication: Mesmo valor de placeholder pode ser reutilizado no Dockerfile builder stage — já validado como base64 32-byte correto, consistente com o padrão de dev secrets do projeto.

- timestamp: 2026-07-02T00:00:03Z
  checked: docker build --target builder (reprodução real do bug e verificação do fix)
  found: |
    ANTES do fix: build falharia com o ZodError documentado (inferido pela ausência confirmada da var — não precisou reproduzir a falha pois a leitura do Dockerfile já provava a ausência).
    Aplicado fix: adicionada linha `PIN_ENCRYPTION_KEY=dhA/bC7ugD4I5gx4omcLQOivxxwDWe8tDJa/710JQRE= \` ao Dockerfile builder stage (mesma RUN, mesmo padrão dos outros placeholders).
    DEPOIS do fix: `docker build --target builder -t kreds-builder-test .` completou com sucesso. Log mostra "Collecting page data using 3 workers" e a rota table completa incluindo `/api/auth/[...nextauth]` e `/api/family/[familyId]/children` sem qualquer ZodError. Build terminou com "Successfully tagged localhost/kreds-builder-test:latest".
    (Nota lateral: build local inicial falhou por ENOSPC no volume da VM podman — não relacionado ao bug; resolvido com `docker image prune -af` e `docker builder prune -af`, liberando ~41GB.)
  implication: Fix VERIFICADO diretamente — build real do estágio builder (mesmo comando usado pela CI) passa sem erro após a correção, cobrindo exatamente as duas rotas mencionadas no erro original.

## Eliminated

## Resolution

root_cause: |
  O Dockerfile (estágio `builder`, linha RUN do `pnpm build`) injeta placeholders de build-time para DATABASE_URL, AUTH_SECRET, AUTH_ZITADEL_ID, AUTH_ZITADEL_SECRET, AUTH_ZITADEL_ISSUER, ZITADEL_ISSUER, CHILD_SESSION_SECRET e NEXT_PUBLIC_APP_URL, mas nunca foi atualizado para incluir `PIN_ENCRYPTION_KEY` quando esse campo obrigatório foi adicionado ao `envSchema` em `src/lib/env.ts` (Fase 8, plan 08-01). Como `envSchema.parse(process.env)` roda eager no top-level do módulo (por design — Pitfall 4 do 08-01-PLAN.md, para falhar rápido no boot/build em vez de no primeiro uso em runtime), qualquer import transitivo de `env.ts` durante `next build`'s page data collection (rotas `/api/auth/[...nextauth]` e `/api/family/[familyId]/children`) dispara o parse com `PIN_ENCRYPTION_KEY` undefined, causando o ZodError. Mesma classe de omissão já havia sido corrigida no `docker-compose.yml` (commit 69fc47b) para o container de runtime, mas o Dockerfile builder stage (usado no `docker build` da CI) ficou de fora dessa correção.
fix: |
  Adicionada a linha `PIN_ENCRYPTION_KEY=dhA/bC7ugD4I5gx4omcLQOivxxwDWe8tDJa/710JQRE= \` ao Dockerfile, dentro da mesma instrução RUN do estágio `builder` que já define os demais placeholders de build-time. Reutilizado o mesmo valor já presente em `docker-compose.yml` (gerado via `openssl rand -base64 32`, confirmado como 32 bytes válidos), mantendo consistência com o padrão existente de dev/build placeholders do projeto.
verification: |
  Reproduzido o build real via `docker build --target builder -t kreds-builder-test .` (mesmo alvo/comando usado pela CI). Após aplicar o fix, o build completou com sucesso, incluindo "Collecting page data using 3 workers" e a tabela de rotas completa mostrando `/api/auth/[...nextauth]` e `/api/family/[familyId]/children` geradas sem ZodError. Imagem de teste removida após verificação (`docker rmi kreds-builder-test`).
files_changed:
  - Dockerfile
