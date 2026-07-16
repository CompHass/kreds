import 'server-only'

/**
 * Returns the ISO date string ('YYYY-MM-DD') of the most recent Sunday in UTC.
 * If today is Sunday, returns today. Weekly cycle runs Sunday through Saturday.
 */
export function getCurrentCycleStart(): string {
  const now = new Date()
  const dayOfWeek = now.getUTCDay() // 0=Sunday, 6=Saturday
  const sunday = new Date(now)
  sunday.setUTCDate(now.getUTCDate() - dayOfWeek)
  return sunday.toISOString().slice(0, 10)
}

/**
 * Returns the [start, endExclusive) UTC Date range for a cycle, given its
 * Sunday 'YYYY-MM-DD' start. Used to bucket timestamped rows (e.g. ledger
 * lines) into the Sunday–Saturday weekly cycle.
 */
export function getCycleRange(cycleStart: string): { start: Date; endExclusive: Date } {
  const start = new Date(`${cycleStart}T00:00:00.000Z`)
  const endExclusive = new Date(start)
  endExclusive.setUTCDate(start.getUTCDate() + 7)
  return { start, endExclusive }
}

/**
 * Returns the `count` most recent cycle starts (Sundays), newest first,
 * ending at (and including) the current cycle.
 */
export function listRecentCycleStarts(count: number): string[] {
  const current = getCurrentCycleStart()
  const currentSunday = new Date(`${current}T00:00:00.000Z`)
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(currentSunday)
    d.setUTCDate(currentSunday.getUTCDate() - 7 * i)
    return d.toISOString().slice(0, 10)
  })
}

/** Cycle start of the week immediately before the given cycle. */
export function getPreviousCycleStart(cycleStart: string): string {
  const d = new Date(`${cycleStart}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() - 7)
  return d.toISOString().slice(0, 10)
}

/** Cycle start of the week immediately after the given cycle. */
export function getNextCycleStart(cycleStart: string): string {
  const d = new Date(`${cycleStart}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + 7)
  return d.toISOString().slice(0, 10)
}
