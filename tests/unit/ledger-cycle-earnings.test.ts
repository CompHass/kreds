import { describe, expect, it, vi } from 'vitest'

vi.mock('../../src/lib/db', () => {
  const db = {
    select() {
      return {
        from() {
          return {
            innerJoin() {
              return {
                where() {
                  return {
                    groupBy() {
                      return Promise.resolve([
                        { accountType: 'available', total: 90 },
                        { accountType: 'firstfruits', total: 10 },
                      ])
                    },
                  }
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

import { getEarningsForCycle } from '../../src/modules/ledger/queries'

describe('getEarningsForCycle', () => {
  it('splits summed lines by accountType', async () => {
    const result = await getEarningsForCycle(
      '11111111-1111-4111-8111-111111111111',
      new Date('2026-07-12T00:00:00Z'),
      new Date('2026-07-19T00:00:00Z'),
    )

    expect(result).toEqual({ available: 90, firstfruits: 10 })
  })

  it('defaults missing account types to 0', async () => {
    const db = await import('../../src/lib/db')
    vi.spyOn(db.db, 'select').mockReturnValueOnce({
      from: () => ({
        innerJoin: () => ({
          where: () => ({
            groupBy: () => Promise.resolve([{ accountType: 'available', total: 5 }]),
          }),
        }),
      }),
    } as never)

    const result = await getEarningsForCycle(
      '11111111-1111-4111-8111-111111111111',
      new Date('2026-07-12T00:00:00Z'),
      new Date('2026-07-19T00:00:00Z'),
    )

    expect(result).toEqual({ available: 5, firstfruits: 0 })
  })
})
