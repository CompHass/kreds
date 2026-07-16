// Pure calendar math — no DB/secrets involved, safe to import from both
// Server Components (garden/page.tsx, reports/page.tsx) and Client
// Components (reports-panel-view.tsx cycle nav), so no 'server-only' guard.

/**
 * Returns the ISO date string ('YYYY-MM-DD') of the most recent cycle-start
 * weekday in UTC. If today is the cycle-start weekday, returns today.
 * `cycleStartDay` is 0=Sunday..6=Saturday (Phase 10 — configurable per
 * family, `families.cycleStartDay`); defaults to Sunday for callers that
 * don't yet have the family row loaded.
 */
export function getCurrentCycleStart(cycleStartDay: number = 0): string {
  const now = new Date()
  const dayOfWeek = now.getUTCDay() // 0=Sunday, 6=Saturday
  const diff = (dayOfWeek - cycleStartDay + 7) % 7
  const start = new Date(now)
  start.setUTCDate(now.getUTCDate() - diff)
  return start.toISOString().slice(0, 10)
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
 * Returns the `count` most recent cycle starts, newest first, ending at
 * (and including) the current cycle.
 */
export function listRecentCycleStarts(count: number, cycleStartDay: number = 0): string[] {
  const current = getCurrentCycleStart(cycleStartDay)
  const currentStart = new Date(`${current}T00:00:00.000Z`)
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(currentStart)
    d.setUTCDate(currentStart.getUTCDate() - 7 * i)
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
