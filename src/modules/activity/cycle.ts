/**
 * getCycleForDate — pure function for computing the Sunday-Saturday activity cycle.
 *
 * Design decisions:
 * - D-03: Cycles are computed dynamically; no activity_cycle table.
 * - D-04: Sunday is always Day 0 of the cycle (biblical stewardship week).
 * - Zero external dependencies — uses only the native Intl API (Node.js v18+).
 * - Function is pure: no DB access, no network calls, no side effects.
 */

export function getCycleForDate(
  date: Date,
  timezone: string
): { cycleStart: Date; cycleEnd: Date } {
  // Step 1: Extract local date components in the target timezone using Intl API.
  const dateParts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const p: Record<string, string> = {}
  dateParts.forEach(({ type, value }) => {
    p[type] = value
  })

  // Step 2: Map weekday string to day-of-week index (Sunday = 0, Saturday = 6).
  const dayOfWeek: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }
  const localDow = dayOfWeek[p.weekday]
  const localYear = Number(p.year)
  const localMonth0 = Number(p.month) - 1
  const localDay = Number(p.day)

  // Step 3: Extract the UTC offset for this timezone on this date.
  // Uses 'shortOffset' which produces 'GMT+X' or 'GMT-X:YY', correctly handles
  // DST and half-hour offsets (e.g. Asia/Kolkata UTC+5:30).
  const offsetPart = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'shortOffset',
  })
    .formatToParts(date)
    .find((part) => part.type === 'timeZoneName')

  const offsetStr = offsetPart?.value ?? 'GMT+0'
  const match = offsetStr.match(/GMT([+-])(\d+)(?::(\d+))?/)
  const sign = match ? (match[1] === '+' ? 1 : -1) : 0
  const hours = match ? Number(match[2]) : 0
  const mins = match ? Number(match[3] ?? '0') : 0
  const offsetMs = sign * (hours * 60 + mins) * 60 * 1000

  // Step 4: Compute midnight local Sunday in UTC.
  // Date.UTC normalizes negative day values automatically across month and year
  // boundaries — e.g. Date.UTC(2026, 0, -2) → Dec 29 2025 (not an error).
  const cycleStart = new Date(
    Date.UTC(localYear, localMonth0, localDay - localDow) - offsetMs
  )

  // Step 5: cycleEnd is 1ms before the next cycle starts (Saturday 23:59:59.999 local).
  const cycleEnd = new Date(cycleStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1)

  return { cycleStart, cycleEnd }
}
