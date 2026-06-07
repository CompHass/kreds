import { describe, it, expect } from 'vitest'
import {
  calculateFirstfruits,
  FIRSTFRUITS_RATE,
} from '../../src/modules/ledger/calculate'

describe('calculateFirstfruits', () => {
  it('returns 1 for amount 1', () => {
    expect(FIRSTFRUITS_RATE).toBe(0.10)
    expect(calculateFirstfruits(1)).toBe(1)
  })

  it('returns 1 for amount 7', () => {
    expect(calculateFirstfruits(7)).toBe(1)
  })

  it('returns 1 for amount 10', () => {
    expect(calculateFirstfruits(10)).toBe(1)
  })

  it('returns 2 for amount 11', () => {
    expect(calculateFirstfruits(11)).toBe(2)
  })

  it('returns 10 for amount 100', () => {
    expect(calculateFirstfruits(100)).toBe(10)
  })

  it('throws for floating point amounts', () => {
    expect(() => calculateFirstfruits(3.5)).toThrow(
      'amount must be a positive integer',
    )
  })

  it('throws for zero', () => {
    expect(() => calculateFirstfruits(0)).toThrow(
      'amount must be a positive integer',
    )
  })

  it('throws for negative amounts', () => {
    expect(() => calculateFirstfruits(-5)).toThrow(
      'amount must be a positive integer',
    )
  })
})
