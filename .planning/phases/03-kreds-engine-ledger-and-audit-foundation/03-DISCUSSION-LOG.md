# Phase 03: Kreds Engine Ledger and Audit Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-07
**Phase:** 03-kreds-engine-ledger-and-audit-foundation
**Areas discussed:** Regra de arredondamento, Cálculo de saldo, Granularidade das linhas de ledger, Histórico filho vs guardian

---

## Regra de Arredondamento

| Option | Description | Selected |
|--------|-------------|----------|
| Floor (arredonda pra baixo) | 7 Kreds → 0 firstfruits, filho fica com 7 disponíveis. | |
| Ceiling (arredonda pra cima) | 7 Kreds → 1 firstfruits, filho fica com 6. Honra o princípio dos firstfruits mesmo em valores pequenos. | ✓ |
| Round (arredondamento convencional) | 7 Kreds → 1 firstfruits (0.7 → 1). | |

**User's choice:** Ceiling (Math.ceil) para todas as operações de 10%.

| Option | Description | Selected |
|--------|-------------|----------|
| Mesmo ceiling para matching de doação | Uma política única para todo o engine. | ✓ |
| Floor para matching | Política diferente por tipo de transação. | |

**User's choice:** Mesma regra (ceiling) aplicada ao 10% de matching de doação voluntária.

---

## Cálculo de Saldo

| Option | Description | Selected |
|--------|-------------|----------|
| SUM em tempo real do ledger | Balance = SUM(ledger_lines). Append-only puro, zero drift. | ✓ |
| Coluna de saldo mantida | Tabela separada atualizada a cada posting. | |

**User's choice:** SUM em tempo real — sem coluna de saldo mantida.

| Option | Description | Selected |
|--------|-------------|----------|
| Tipo de linha no mesmo ledger | Firstfruits = `account_type: firstfruits`. Um ledger, múltiplas contas. | ✓ |
| Tabela ou ledger separado | Treasury vive em estrutura própria. | |

**User's choice:** Firstfruits Treasury é apenas um `account_type` dentro do mesmo ledger.

---

## Granularidade das Linhas de Ledger

| Option | Description | Selected |
|--------|-------------|----------|
| 1 transação, 2+ linhas | Transação agrupa o evento + todas as linhas (available + firstfruits). | ✓ |
| 2 transações separadas | Uma para ganho, outra para firstfruits. | |

**User's choice:** Uma transação com múltiplas linhas por evento de postagem.

| Option | Description | Selected |
|--------|-------------|----------|
| UUID de comando na transação | `command_id` UUID com UNIQUE constraint no DB. Retry seguro. | ✓ |
| Hash do payload | Hash de (child_id + source_type + source_id + amount). | |

**User's choice:** UUID de comando com UNIQUE constraint no banco de dados.

---

## Histórico Filho vs Guardian

| Option | Description | Selected |
|--------|-------------|----------|
| Visão simplificada para filho | Filho vê linguagem amigável; guardian vê razões de ajuste, command_id, notas de correção. | ✓ |
| Mesmo histórico para todos | Uma view só, guardian e filho veem igual. | |

**User's choice:** Visões diferenciadas — filho vê versão simplificada e encorajadora.

**Notes:** Usuário perguntou o que significa "corrigir um erro" no ledger. Explicado que LEDG-08 significa que erros de posting são corrigidos por entradas de reversal + nova entrada correta, nunca editando histórico. Exemplo dado: guardian aprova +10 Kreds errado → reversal de -10 → nova entrada de +15.

| Option | Description | Selected |
|--------|-------------|----------|
| Filho vê com marcação "corrigido" | Correção visível como "Correction applied" sem expor razão interna. | ✓ |
| Filho vê só resultado líquido | Esconde a mecânica da correção. | |

**User's choice:** Filho vê entradas de correção com label simplificado "Correction applied".

---

## Área extra: Ajustes Negativos

**Contexto:** Usuário levantou o tema de gerenciamento de valores de Kreds pelos guardians. Esclarecido que valores de tarefas pertencem à Phase 4 (task templates). Capturado o que é relevante para Phase 3: como ajustes negativos funcionam mecanicamente.

| Option | Description | Selected |
|--------|-------------|----------|
| Guardian digita valor livre + razão | Flexibilidade máxima. Engine valida apenas que é inteiro positivo. | ✓ |
| Presets de valor + razão | Lista pré-definida de valores. | |

**User's choice:** Valor livre com razão obrigatória. Presets pertencem à Phase 4.

---

## Claude's Discretion

- Nomes exatos de colunas e tabelas no schema Drizzle.
- Valores do enum `account_type` (ex: `available`, `firstfruits`) e `transaction_type`.
- Layout e design visual da timeline de auditoria (segue Sylvan Growth direction).
- Estrutura das rotas da API de ledger.

## Deferred Ideas

- Configuração de valores de tarefas pelo guardian → Phase 4 (task templates).
- Presets de ajuste negativo → Phase 4.
- Integração do matching de doação Kreds do Bem → Phase 7.
- Alocação de Kreds para wishlist goals → Phase 6.
- Configuração de quais tipos de Kreds management o guardian pode fazer além do definido → future phase.
