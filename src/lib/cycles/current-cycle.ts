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
