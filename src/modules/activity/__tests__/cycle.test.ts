import { describe, it, expect } from 'vitest'
import { getCycleForDate } from '../cycle'

describe('getCycleForDate', () => {
  it('returns Sunday 00:00 through Saturday 23:59:59.999 for SP timezone (Wednesday input)', () => {
    // Wednesday 2026-06-10 09:00 SP (12:00 UTC) → cycle starts Sun 2026-06-07
    const { cycleStart, cycleEnd } = getCycleForDate(
      new Date('2026-06-10T12:00:00Z'),
      'America/Sao_Paulo'
    )
    const startDay = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      weekday: 'short',
    }).format(cycleStart)
    const endDay = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      weekday: 'short',
    }).format(cycleEnd)
    expect(startDay).toBe('Sun')
    expect(endDay).toBe('Sat')
    // cycleStart = 2026-06-07T03:00:00Z (SP midnight Sunday)
    expect(cycleStart.toISOString()).toBe('2026-06-07T03:00:00.000Z')
    expect(cycleEnd.toISOString()).toBe('2026-06-14T02:59:59.999Z')
  })

  it('returns same cycle when input IS the Sunday midnight', () => {
    // Input is exactly Sunday 00:00:00 SP (= 2026-06-07T03:00:00Z)
    const { cycleStart } = getCycleForDate(
      new Date('2026-06-07T03:00:00Z'),
      'America/Sao_Paulo'
    )
    expect(cycleStart.toISOString()).toBe('2026-06-07T03:00:00.000Z')
  })

  it('returns next cycle when input is next Sunday midnight', () => {
    // Next Sunday 2026-06-14T03:00:00Z → advances to next cycle
    const { cycleStart } = getCycleForDate(
      new Date('2026-06-14T03:00:00Z'),
      'America/Sao_Paulo'
    )
    expect(cycleStart.toISOString()).toBe('2026-06-14T03:00:00.000Z')
  })

  it('handles half-hour UTC offset (Asia/Kolkata UTC+5:30)', () => {
    const { cycleStart, cycleEnd } = getCycleForDate(
      new Date('2026-06-10T12:00:00Z'),
      'Asia/Kolkata'
    )
    const startDay = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
    }).format(cycleStart)
    const endDay = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
    }).format(cycleEnd)
    expect(startDay).toBe('Sun')
    expect(endDay).toBe('Sat')
  })

  it('handles year boundary — Thursday Jan 1 2026 in SP → cycle starts Dec 2025', () => {
    const { cycleStart } = getCycleForDate(
      new Date('2026-01-01T12:00:00Z'),
      'America/Sao_Paulo'
    )
    const startDay = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      weekday: 'short',
    }).format(cycleStart)
    expect(startDay).toBe('Sun')
    expect(cycleStart.getUTCFullYear()).toBe(2025)
    expect(cycleStart.getUTCMonth()).toBe(11) // December (month index 11)
  })

  it('handles America/New_York UTC-4 summer offset', () => {
    const { cycleStart } = getCycleForDate(
      new Date('2026-06-10T12:00:00Z'),
      'America/New_York'
    )
    const startDay = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      weekday: 'short',
    }).format(cycleStart)
    expect(startDay).toBe('Sun')
  })

  it('handles UTC/GMT+0 timezone', () => {
    const { cycleStart } = getCycleForDate(
      new Date('2026-06-10T12:00:00Z'),
      'UTC'
    )
    const startDay = new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      weekday: 'short',
    }).format(cycleStart)
    expect(startDay).toBe('Sun')
  })

  it('handles Europe/Berlin UTC+2 summer offset', () => {
    const { cycleStart } = getCycleForDate(
      new Date('2026-06-10T12:00:00Z'),
      'Europe/Berlin'
    )
    const startDay = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Berlin',
      weekday: 'short',
    }).format(cycleStart)
    expect(startDay).toBe('Sun')
  })

  it('handles month boundary — Monday 2026-07-06 in SP → cycle starts Sunday 2026-07-05', () => {
    // 2026-07-06T05:00:00Z = Sunday 2026-07-05 22:00 SP? No.
    // SP is UTC-3 in winter: 2026-07-06T05:00Z = 2026-07-06T02:00 SP → Monday
    const { cycleStart } = getCycleForDate(
      new Date('2026-07-06T05:00:00Z'),
      'America/Sao_Paulo'
    )
    const startDay = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      weekday: 'short',
    }).format(cycleStart)
    expect(startDay).toBe('Sun')
  })
})
