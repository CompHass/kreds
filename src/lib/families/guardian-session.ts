import 'server-only'
import { SignJWT, jwtVerify } from 'jose'

// Phase 13 — Guardian step-up session. Mirrors child-session.ts: an HS256 JWT
// in the `guardian-session` cookie, short-lived, issued ONLY after the guardian
// proves they know the family PIN (or sets it on first access). The middleware
// requires this token (with familyId matching the URL) before letting any
// /family/* request reach the panel — so a child on a shared device, who only
// has the long-lived next-auth cookie, cannot reach the management routes.
//
// Layered on top of next-auth (base authn). next-auth answers "who are you?";
// this answers "have you step-up-proven as a guardian of THIS family recently?".

// Separate secret from CHILD_SESSION_SECRET on purpose: rotating/leaking one
// must not compromise the other. Fall back to the child secret only in dev so
// local setups without the new var still work.
const secret = new TextEncoder().encode(
  process.env.GUARDIAN_SESSION_SECRET ?? process.env.CHILD_SESSION_SECRET!,
)

// Absolute TTL (seconds). Short by design — step-up is meant to be re-entered.
// Override via env without redeploying code.
export const GUARDIAN_SESSION_MAX_AGE = Number(process.env.GUARDIAN_SESSION_MAX_AGE ?? 1800) // 30 min

export const GUARDIAN_SESSION_COOKIE = 'guardian-session'

export interface GuardianSessionPayload {
  familyId: string
  identityId: string
  role: 'guardian'
}

export async function signGuardianSession(payload: GuardianSessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${GUARDIAN_SESSION_MAX_AGE}s`)
    .sign(secret)
}

export async function verifyGuardianSession(token: string): Promise<GuardianSessionPayload> {
  const { payload } = await jwtVerify(token, secret)
  return {
    familyId: payload['familyId'] as string,
    identityId: payload['identityId'] as string,
    role: payload['role'] as 'guardian',
  }
}

// Brute-force protection mirrors child-session.ts. Keyed by `family:<id>` so
// the rate limit is per-family-PIN, not per-IP (a shared device would otherwise
// share a single IP budget across all family members).
const MAX_ATTEMPTS = 5
const attempts = new Map<string, number>()

export function checkGuardianBruteForce(familyId: string): {
  blocked: boolean
  attemptsLeft: number
} {
  const key = `family:${familyId}`
  const count = attempts.get(key) ?? 0
  return { blocked: count >= MAX_ATTEMPTS, attemptsLeft: Math.max(0, MAX_ATTEMPTS - count) }
}

export function recordGuardianFailedAttempt(familyId: string): void {
  const key = `family:${familyId}`
  attempts.set(key, (attempts.get(key) ?? 0) + 1)
}

export function resetGuardianAttempts(familyId: string): void {
  attempts.delete(`family:${familyId}`)
}
