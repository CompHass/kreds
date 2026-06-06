import { describe, it, expect } from 'vitest'
import { TERMS } from '../../src/modules/glossary/terms'

describe('Glossary terms', () => {
  it('should have at least 17 defined terms', () => {
    const keys = Object.keys(TERMS)
    expect(keys.length).toBeGreaterThanOrEqual(17)
  })

  it('should have all required terms', () => {
    expect(TERMS.KREDS).toBe('Kreds')
    expect(TERMS.FIRSTFRUITS).toBe('Firstfruits')
    expect(TERMS.KREDS_DO_BEM).toBe('Kreds do Bem')
    expect(TERMS.WEEKLY_CYCLE).toBe('Weekly Cycle')
    expect(TERMS.SEVENTY_TWO_HOUR_RULE).toBe('72-Hour Rule')
  })

  it('should have all non-empty string values', () => {
    const values = Object.values(TERMS)
    values.forEach(value => {
      expect(typeof value).toBe('string')
      expect(value.length).toBeGreaterThan(0)
    })
  })
})
