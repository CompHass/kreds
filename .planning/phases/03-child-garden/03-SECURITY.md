---
phase: 03
slug: child-garden
status: verified
threats_open: 0
asvs_level: 1
created: 2026-06-22
---

# Phase 03 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| browser → /child/[childId]/garden | Rota protegida por JWT child-session; middleware verifica role='child' e redireciona sem sessão | JWT child-session (HttpOnly cookie) |
| Server Component → banco (bible_verses) | Query Drizzle roda server-side; tabela sem dados sensíveis | Texto bíblico público |
| Client (GardenView) → estado local | Colheita e estado local apenas (D-09 — sem POST ao backend nesta fase) | Nenhum dado sensível |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-03-01 | Elevation of Privilege | Acesso direto a /child/[id]/garden sem sessão | mitigate | Middleware `/child/*` verifica JWT child-session, redireciona para `/` — `src/middleware.ts` + `tests/unit/middleware.test.ts` | closed |
| T-03-02 | Information Disclosure | Conteúdo de bible_verses | accept | Tabela contém apenas texto bíblico público; sem PII, sem dado por-criança | closed |
| T-03-03 | Tampering | drizzle-kit push / seed SQL | accept | Sem novos pacotes npm nesta fase; push aplica apenas DDL gerado pelo schema versionado | closed |
| T-03-04 | Information Disclosure | Props dos componentes (nome/coins da criança) | accept | Dados são seed mockado nesta fase (não dados reais); página protegida por middleware | closed |
| T-03-05 | Tampering | Assets PNG servidos de public/ | accept | Imagens estáticas públicas (planta decorativa); sem conteúdo sensível | closed |
| T-03-06 | Spoofing | childId na URL diferente do JWT | accept | Dados são seed mockado (não dados reais por-criança); validateChildSessionScope definido para Fase 6 | closed |
| T-03-07 | Information Disclosure | Versículo retornado ao cliente | accept | Conteúdo bíblico público; sem dado sensível | closed |
| T-03-08 | Tampering | Estado de colheita manipulado no cliente | accept | Sem efeito no backend nesta fase (D-09 — colheita visual; POST real e ledger na Fase 6) | closed |

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-03-01 | T-03-02 | bible_verses é texto bíblico público sem PII | plan-time | 2026-06-22 |
| AR-03-02 | T-03-03 | Sem novos pacotes npm; DDL versionado pelo schema | plan-time | 2026-06-22 |
| AR-03-03 | T-03-04 | Props usam seed mockado nesta fase; proteção real na Fase 6 | plan-time | 2026-06-22 |
| AR-03-04 | T-03-05 | Assets PNG estáticos públicos sem conteúdo sensível | plan-time | 2026-06-22 |
| AR-03-05 | T-03-06 | childId scope validation (validateChildSessionScope) deferido para Fase 6 | plan-time | 2026-06-22 |
| AR-03-06 | T-03-07 | Versículo bíblico público; sem dado sensível | plan-time | 2026-06-22 |
| AR-03-07 | T-03-08 | Colheita visual client-only nesta fase; persistência real na Fase 6 | plan-time | 2026-06-22 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-06-22 | 8 | 8 | 0 | gsd-secure-phase (auto — register_authored_at_plan_time: true) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-06-22
