# Plano 11-05: Páginas Filho (Dreams, Balance, Donations)

**Status**: ✅ Concluído

**Wave**: 3 (Paralelo)

**Data de Conclusão**: 2026-06-10

---

## Resumo Executivo

Implementado com sucesso o conjunto completo de três páginas filho requeridas (D-08, D-09, D-10):

1. **`/child/[childId]/dreams`** — Página de metas wishlist com GoalCard e novo sonho
2. **`/child/[childId]/balance`** — Página de saldo disponível e histórico de ledger
3. **`/child/[childId]/donations`** — Página de doações com formulário "Doe Kreds"
4. **`POST /api/child/[childId]/donations`** — API route com auth guard para criar doações

Todas as páginas implementam `requireChildSession()` com verificação `session.childProfileId === childId`, utilizam `ChildBottomNav` com guias apropriadas, e reutilizam componentes existentes (GoalCard, getBalance, getChildLedgerHistory).

---

## Artifacts Entregues

### Páginas Servidor

| Arquivo | Descrição |
|---------|-----------|
| `src/app/child/[childId]/dreams/page.tsx` | Página de metas wishlist do filho com GoalCard, saldo alocado total, seções ativas/conquistadas |
| `src/app/child/[childId]/balance/page.tsx` | Página de saldo com balance hero card, primícias badge, histórico de transações formatado |
| `src/app/child/[childId]/donations/page.tsx` | Página de doações com DonationFormClient integrado e lista de doações com status badges |

### API Route

| Arquivo | Descrição |
|---------|-----------|
| `src/app/api/child/[childId]/donations/route.ts` | POST handler com getChildSession auth, validação de amountKreds > 0, insert em donations table |

### Componentes Cliente

| Arquivo | Descrição |
|---------|-----------|
| `src/app/child/[childId]/donations/DonationFormClient.tsx` | Form interativo com campos targetLabel + amountKreds, validação inline, fetch POST com router.refresh |
| `src/components/GoalCard.tsx` | Componente reutilizável de meta wishlist com progresso, botão Alocar Kreds, form inline |

---

## Requisitos Atendidos

### D-08: Página de Metas (/child/[childId]/dreams)

✅ **Implementado**:
- `requireChildSession()` antes de queries, `session.childProfileId === childId` verificado
- `GoalCard` importado de `@/components/GoalCard`
- Seção "Plantando Sonhos" para metas ativas
- Seção "Conquistados 🏆" para metas alcançadas
- Hero card mostrando total alocado + saldo disponível
- Empty state "Nenhum sonho plantado ainda" com botão "Plantar Novo Sonho"
- `ChildBottomNav` com `active="sonhos"`
- Padding-bottom: 100px (com ChildBottomNav fixed)
- `export const dynamic = 'force-dynamic'`

### D-09: Página de Saldo (/child/[childId]/balance)

✅ **Implementado**:
- `requireChildSession()` antes de queries, `session.childProfileId === childId` verificado
- `getBalance(session.childProfileId, 'available')` e `getBalance(..., 'firstfruits')`
- `getChildLedgerHistory(session.childProfileId, session.familyId)`
- Hero card mostrando saldo disponível em grande font size (48px)
- Badge de primícias se `firstfruits > 0`
- Histórico de ledger com:
  - `getChildLabel(row)` inline para tradução de transactionType/accountType
  - `formatTimestamp(row.createdAt)`
  - Cores verde (>=0) e vermelho (<0) para amounts
- Empty state: "Seu histórico aparecerá aqui."
- `ChildBottomNav` com `active="saldo"`
- Padding-bottom: 100px
- `export const dynamic = 'force-dynamic'`

### D-10: Página de Doações (/child/[childId]/donations) + API

✅ **Implementado**:
- **Página**:
  - `requireChildSession()` antes de queries, `session.childProfileId === childId` verificado
  - `DonationFormClient` renderizado com childId
  - Lista de doações do filho ordenada por `desc(schema.donations.requestedAt)`
  - Status badges: "Pendente" (amarelo), "✓ Aprovada" (verde), "Recusada" (vermelho)
  - Empty state: "Nenhuma doação registrada ainda."
  - `ChildBottomNav` com `active="saldo"` (doações acessível via saldo)
  - Padding-bottom: 100px
  - `export const dynamic = 'force-dynamic'`

- **API Route (POST /api/child/[childId]/donations)**:
  - `getChildSession(cookieStore)` + auth guard `session.childProfileId === childId` (status 401 if fail)
  - Validação `targetLabel`: string não vazio (status 400 if invalid)
  - Validação `amountKreds`: inteiro > 0 (status 400 if invalid)
  - Insert em `schema.donations.values({...})`com:
    - `familyId: session.familyId` (extraído de JWT, não do body)
    - `childProfileId: session.childProfileId`
    - `status: 'pending'`
  - Return 201 com `{ ok: true }`
  - Try/catch com erro 500

- **DonationFormClient**:
  - `'use client'` component
  - Campos: `targetLabel` (text), `amountKreds` (number, min=1)
  - Validação inline: ambos required, amountKreds inteiro > 0
  - Fetch POST a `/api/child/${childId}/donations` com JSON body
  - Após sucesso: `router.refresh()` e limpeza de fields
  - Erros mostrados inline
  - Loading state desabilita submit

---

## Padrões Reutilizados

| Padrão | Detalhes |
|--------|----------|
| Sylvan Design System | Header fixed, hero glassmorphism cards, atmospheric background blobs, ChildBottomNav fixed bottom |
| Auth Guard | `requireChildSession()` em todas as três páginas com `session.childProfileId === childId` |
| getBalance / getChildLedgerHistory | Queries paralelas em Promise.all, reutilização de padrão existing |
| GoalCard | Componente client-side com form inline, alocação com fetch, progress bar |
| DonationFormClient | Componente client isolado, validação client + server, router.refresh após sucesso |
| API Auth Pattern | getChildSession + sessão check antes de insert, familyId extraído de JWT |

---

## Verificações Implementadas

### Testes Automatizados

```bash
# Verificação de requireChildSession em dreams
grep -c "requireChildSession" src/app/child/[childId]/dreams/page.tsx  # >= 1

# Verificação de ChildBottomNav em dreams
grep -c "ChildBottomNav" src/app/child/[childId]/dreams/page.tsx      # >= 1

# Verificação de GoalCard em dreams
grep -c "GoalCard" src/app/child/[childId]/dreams/page.tsx             # >= 1

# Verificação de requireChildSession em balance
grep -c "requireChildSession" src/app/child/[childId]/balance/page.tsx # >= 1

# Verificação de getChildLedgerHistory em balance
grep -c "getChildLedgerHistory" src/app/child/[childId]/balance/page.tsx # >= 1

# Verificação de getChildSession em donations route
grep -c "getChildSession" src/app/api/child/[childId]/donations/route.ts # >= 1
```

### Build Verification

```bash
pnpm build
# ✅ Compiled successfully
# ✅ All pages listed in output:
#   ├ ƒ /child/[childId]/balance
#   ├ ƒ /child/[childId]/donations
#   ├ ƒ /child/[childId]/dreams
```

---

## Diagrama de Fluxo

```
Child Session → requireChildSession() → session.childProfileId === childId
                     ↓
        ┌────────────┼────────────┐
        ↓            ↓            ↓
    DREAMS      BALANCE      DONATIONS
        ↓            ↓            ↓
    GoalCard    getBalance   Donations DB
    listGoals   getHistory   DonationForm
        ↓            ↓            ↓
    ChildNav   ChildNav    ChildNav+API
```

---

## Threat Model Mitigated

| Threat | Mitigação |
|--------|-----------|
| **T-11-12: Spoofing** (dreams/balance/donations pages) | `requireChildSession() + session.childProfileId === childId` em todas as três páginas |
| **T-11-13: Tampering** (familyId em donations) | `familyId` extraído de `session.familyId` (JWT assinado), não do body do request |
| **T-11-14: Tampering** (amountKreds) | Validação server-side `amount > 0` antes do insert + check constraint no banco |
| **T-11-15: Information Disclosure** (ledger history) | Filho vê apenas seu próprio histórico — `getChildLedgerHistory` scoped por `session.childProfileId` |

---

## Próximos Passos

- **Wave 3 Restante**: Executar planos 11-06 (Guardian Pages), 11-07 (Share/Invite)
- **Wave 4**: Implementar feedback/revisão de doações (approvals na aba guardian)
- **UAT**: Verificar fluxo end-to-end de child login → dreams/balance/donations → API calls

---

## Notas Técnicas

- **GoalCard**: Reutilização do padrão existing com client form inline, fetch para `/api/child/[childId]/goals/[goalId]/allocate` (route existente)
- **DonationFormClient**: Isolado para não fazer lifting-state, apenas chama API e refresha
- **ChildBottomNav**: `active="saldo"` para donations (sem aba dedicada per D-05)
- **Dynamic Rendering**: Todas as três páginas usam `export const dynamic = 'force-dynamic'` (dados child session são fresh por request)
- **Styling**: Inline styles com Sylvan design tokens (cores, spacing, glassmorphism)

---

**Executor**: Claude Haiku 4.5  
**Contexto**: Wave 3 (Parallel) do Plano 11-05  
**Completo**: 2026-06-10
