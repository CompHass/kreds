import { describe, it, expect } from 'vitest'
import {
  getCycleRange,
  listRecentCycleStarts,
  getPreviousCycleStart,
  getNextCycleStart,
} from '../../src/lib/cycles/current-cycle'

describe('getCycleRange', () => {
  it('returns a 7-day UTC window starting at the given Sunday', () => {
    const { start, endExclusive } = getCycleRange('2026-07-12')
    expect(start.toISOString()).toBe('2026-07-12T00:00:00.000Z')
    expect(endExclusive.toISOString()).toBe('2026-07-19T00:00:00.000Z')
  })
})

describe('listRecentCycleStarts', () => {
  it('returns `count` Sundays, newest first, 7 days apart', () => {
    const cycles = listRecentCycleStarts(3)
    expect(cycles).toHaveLength(3)
    const [first, second, third] = cycles
    expect(getPreviousCycleStart(first)).toBe(second)
    expect(getPreviousCycleStart(second)).toBe(third)
  })
})

describe('getPreviousCycleStart / getNextCycleStart', () => {
  it('are inverses 7 days apart', () => {
    expect(getPreviousCycleStart('2026-07-19')).toBe('2026-07-12')
    expect(getNextCycleStart('2026-07-12')).toBe('2026-07-19')
  })
})
