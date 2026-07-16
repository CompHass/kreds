import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getCurrentCycleStart,
  getCycleRange,
  listRecentCycleStarts,
  getPreviousCycleStart,
  getNextCycleStart,
} from '../../src/lib/cycles/current-cycle'

describe('getCurrentCycleStart', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('defaults to Sunday (cycleStartDay=0)', () => {
    // 2026-07-16 is a Thursday (dayOfWeek=4)
    vi.setSystemTime(new Date('2026-07-16T12:00:00.000Z'))
    expect(getCurrentCycleStart()).toBe('2026-07-12')
  })

  it('respects a custom cycleStartDay (Phase 10 — configurable per family)', () => {
    // Same Thursday, but cycle starts on Wednesday (3) — most recent Wednesday is 2026-07-15
    vi.setSystemTime(new Date('2026-07-16T12:00:00.000Z'))
    expect(getCurrentCycleStart(3)).toBe('2026-07-15')
  })

  it('returns today when today is the cycle-start weekday', () => {
    vi.setSystemTime(new Date('2026-07-16T12:00:00.000Z')) // Thursday
    expect(getCurrentCycleStart(4)).toBe('2026-07-16')
  })
})

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
