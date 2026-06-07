import { describe, expect, it, vi } from 'vitest'

vi.mock('../../src/lib/db', () => {
  const db = {
    select(selection: Record<string, unknown>) {
      return {
        from() {
          const finalize = () => {
            if ('total' in selection) {
              return Promise.resolve([{ total: 10 }])
            }

            if ('commandId' in selection) {
              return Promise.resolve([
                {
                  transactionId: 'tx-1',
                  commandId: 'cmd-1',
                  transactionType: 'task_earning',
                  note: 'visible note',
                  correctsTransactionId: 'tx-0',
                  createdAt: new Date('2026-01-01T00:00:00Z'),
                  lineId: 'line-1',
                  accountType: 'available',
                  amount: 10,
                },
              ])
            }

            return Promise.resolve([
              {
                transactionId: 'tx-1',
                transactionType: 'task_earning',
                createdAt: new Date('2026-01-01T00:00:00Z'),
                lineId: 'line-1',
                accountType: 'available',
                amount: 10,
              },
            ])
          }

          return {
            leftJoin() {
              return this
            },
            where() {
              if ('total' in selection) {
                return finalize()
              }

              return {
                orderBy() {
                  return finalize()
                },
              }
            },
          }
        },
      }
    },
  }

  return { db }
})

import {
  getBalance,
  getChildLedgerHistory,
  getGuardianLedgerHistory,
} from '../../src/modules/ledger/queries'

describe('ledger queries', () => {
  it('does not expose commandId or note in child ledger history', async () => {
    const history = await getChildLedgerHistory(
      '11111111-1111-4111-8111-111111111111',
      '11111111-1111-4111-8111-111111111111',
    )

    expect(Array.isArray(history)).toBe(true)
    history.forEach((entry) => {
      expect(Object.keys(entry)).not.toContain('commandId')
      expect(Object.keys(entry)).not.toContain('note')
    })
  })

  it('exposes audit fields in guardian ledger history', async () => {
    const history = await getGuardianLedgerHistory(
      '11111111-1111-4111-8111-111111111111',
      '11111111-1111-4111-8111-111111111111',
    )

    expect(Array.isArray(history)).toBe(true)
    expect(history[0]).toHaveProperty('commandId')
    expect(history[0]).toHaveProperty('note')
    expect(history[0]).toHaveProperty('correctsTransactionId')
  })

  it('returns summed balance for an account', async () => {
    const balance = await getBalance(
      '11111111-1111-4111-8111-111111111111',
      'available',
    )

    expect(balance).toBe(10)
  })
})
