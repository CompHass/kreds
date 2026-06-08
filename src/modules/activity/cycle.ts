/**
 * getCycleForDate — pure function for computing Sunday–Saturday activity cycle boundaries.
 *
 * Zero external dependencies — uses only the Intl API available in Node.js v18+.
 * Sunday is always Day 0 regardless of locale or regional calendar conventions (D-04).
 *
 * @param date - Any UTC Date object representing a moment in time
 * @param timezone - IANA timezone string (e.g. 'America/Sao_Paulo', 'UTC')
 * @returns { cycleStart: Date, cycleEnd: Date } — both are UTC Date objects where:
 *   cycleStart = Sunday 00:00:00.000 local time expressed in UTC
 *   cycleEnd = Saturday 23:59:59.999 local time expressed in UTC
 */
export function getCycleForDate(
  date: Date,
  timezone: string,
): { cycleStart: Date; cycleEnd: Date } {
  // Step 1: extract local date components in the target timezone
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

  // Step 2: extract UTC offset for this timezone on this date
  // Uses shortOffset which handles DST and half-hour offsets (e.g. UTC+5:30)
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

  // Step 3: midnight local Sunday in UTC
  // Date.UTC normalizes month/day arithmetic across month and year boundaries
  // (e.g. day=-2 normalizes to the correct previous-month date)
  const cycleStart = new Date(
    Date.UTC(localYear, localMonth0, localDay - localDow) - offsetMs,
  )

  // Step 4: Saturday 23:59:59.999 = cycleStart + 7 days - 1ms
  const cycleEnd = new Date(cycleStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1)

  return { cycleStart, cycleEnd }
}
