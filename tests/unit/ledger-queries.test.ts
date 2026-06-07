import { describe, it, expect } from 'vitest'
import {
  getBalance,
  getChildLedgerHistory,
  getGuardianLedgerHistory,
} from '../../src/modules/ledger/queries'

describe('ledger queries', () => {
  it('does not expose commandId or note in child ledger history', async () => {
    const history = await getChildLedgerHistory()

    expect(Array.isArray(history)).toBe(true)
    history.forEach((entry) => {
      expect(Object.keys(entry)).not.toContain('commandId')
      expect(Object.keys(entry)).not.toContain('note')
    })
  })

  it('exposes audit fields in guardian ledger history', async () => {
    const history = await getGuardianLedgerHistory()

    expect(Array.isArray(history)).toBe(true)
    expect(history[0]).toHaveProperty('commandId')
    expect(history[0]).toHaveProperty('note')
    expect(history[0]).toHaveProperty('correctsTransactionId')
  })

  it('returns summed balance for an account', async () => {
    const balance = await getBalance()

    expect(balance).toBe(10)
  })
})
