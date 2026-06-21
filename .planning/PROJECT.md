# Kreds

## What This Is

Kreds é um app cristão de educação financeira e mordomia para famílias. Pais criam tarefas com recompensas; filhos completam as tarefas e veem seu "jardim" crescer como metáfora visual do progresso. Duas interfaces distintas: painel web/desktop para os pais e app mobile/PWA com jardim interativo para as crianças.

## Core Value

A criança completa tarefas, vê seu jardim florescer e aprende mordomia — o loop de engajamento gamificado deve funcionar sem fricção.

## Current Milestone: v2.0 Redesign — Jardim Kreds

**Goal:** Reconstruir o frontend completo do zero com o novo design system, cobrindo área dos pais e área das crianças em paralelo por fase.

**Target features:**
- Design system e tokens (cores, tipografia, animações do design handoff)
- Login criança (PIN de 4 dígitos + animação portão) e pai (Zitadel OIDC)
- Jardim interativo da criança (gamificação, estágios de planta, colheita)
- Lista de tarefas da criança com feedback visual (rega, celebração, dízimo)
- Painel de tarefas dos pais (criar, editar, ativar/desativar, filtrar por filho)
- Ajustes de API onde o design exigir (ex: campo `approval` em tasks)

## Requirements

### Validated

- [x] Design system implementado (tokens, tipografia Plus Jakarta Sans, animações) — Validated in Phase 1: Foundation
- [x] Autenticação criança via PIN de 4 dígitos com animação portão — Validated in Phase 2: Authentication
- [x] Autenticação responsável via Zitadel OIDC — Validated in Phase 2: Authentication (GAUTH-02 redirect pendente Zitadel prod)

### Active
- [ ] Jardim interativo com 4 estágios de planta e feedback de rega
- [ ] Lista de tarefas da criança com toggle e celebração ao completar todas
- [ ] Card de dízimo com flores decorativas
- [ ] Card de cofrinho (meta com progress bar)
- [ ] Painel de tarefas dos pais com CRUD completo
- [ ] Bottom nav mobile para crianças
- [ ] Sidebar desktop para pais

### Out of Scope

| Feature | Reason |
|---------|--------|
| Fluxo de aprovação de tarefas | Campo `approval` existe no modelo mas fluxo não prototipado — alinhar com produto |
| App nativo (React Native) | PWA/web-first por ora |
| Notificações push | Fora do design handoff v2.0 |
| Onboarding completo de família | Passo 2 não prototipado no handoff |

## Context

- **Design handoff completo** em `design_handoff_kreds/README.md` — tokens, animações, componentes e 3 protótipos interativos (`.dc.html`)
- **Backend mantido em git** — APIs REST em `src/app/api/`, schema Drizzle, módulos de ledger, tasks, goals, família, auth
- **src/ foi deletado** do working tree — rebuild total, não migração de código
- **Duas superfícies:** crianças (mobile-first, 392px, jardim gamificado) e pais (desktop, 1180px, painel administrativo)
- **Autenticação:** pais via Zitadel OIDC (next-auth v5), crianças via PIN de 4 dígitos com cookie JWT próprio
- **Assets de planta** em `design_handoff_kreds/garden/plant-{a,b,c,d}.png`

## Constraints

- **Tech stack:** Next.js 16, pnpm, Tailwind CSS, Drizzle ORM, next-auth v5, PostgreSQL
- **Tipografia:** Plus Jakarta Sans — pesos 400/500/600/700/800 (Google Fonts)
- **Fidelidade:** Alta fidelidade ao design handoff — pixel a pixel nos tokens documentados
- **Compatibilidade:** APIs existentes no git devem ser reaproveitadas sem quebra de schema
- **Mobile-first:** Área das crianças projetada para 392×812px

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Rebuild total (não migração) | Design novo incompatível com estrutura anterior; código antigo deletado | — Pending |
| Ambas superfícies em paralelo por fase | Evita divergência de tokens e componentes compartilhados | — Pending |
| Frontend + ajustes de API quando necessário | Campo `approval` e outros campos do design precisam de suporte backend | — Pending |
| PWA em vez de app nativo | Web-first mantém stack única; jardim funciona bem em PWA mobile | — Pending |

## Evolution

Este documento evolui a cada transição de fase e milestone.

**Após cada fase** (via `/gsd-transition`):
1. Requirements invalidados? → Mover para Out of Scope com motivo
2. Requirements validados? → Mover para Validated com referência de fase
3. Novos requirements? → Adicionar em Active
4. Decisões? → Adicionar em Key Decisions
5. "What This Is" ainda preciso? → Atualizar se mudou

**Após cada milestone** (via `/gsd-complete-milestone`):
1. Revisão completa de todas as seções
2. Core Value check — ainda a prioridade certa?
3. Auditar Out of Scope — motivos ainda válidos?
4. Atualizar Context com estado atual

---
**Current State:** Phase 2 complete — autenticação criança (PIN+portão) e responsável (Zitadel OIDC) entregues

*Last updated: 2026-06-21 — Phase 2: Authentication complete*
