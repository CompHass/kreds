import 'server-only'
import { SignJWT, jwtVerify, decodeJwt } from 'jose'
import type { cookies } from 'next/headers'

const secret = new TextEncoder().encode(process.env.CHILD_SESSION_SECRET!)

export async function signChildSession(payload: {
  childProfileId: string
  familyId: string
  role: 'child'
}): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(secret)
}

export async function verifyChildSession(token: string): Promise<{
  childProfileId: string
  familyId: string
  role: 'child'
}> {
  const { payload } = await jwtVerify(token, secret)
  return {
    childProfileId: payload['childProfileId'] as string,
    familyId: payload['familyId'] as string,
    role: payload['role'] as 'child',
  }
}

export async function getChildSession(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
): Promise<{ childProfileId: string; familyId: string; role: 'child' } | null> {
  const token = cookieStore.get('child-session')?.value
  if (!token) return null
  try {
    return await verifyChildSession(token)
  } catch {
    return null
  }
}

const MAX_ATTEMPTS = 5
const attempts = new Map<string, number>()

export function checkBruteForce(childId: string): { blocked: boolean; attemptsLeft: number } {
  const count = attempts.get(childId) ?? 0
  return { blocked: count >= MAX_ATTEMPTS, attemptsLeft: Math.max(0, MAX_ATTEMPTS - count) }
}

export function recordFailedAttempt(childId: string): void {
  attempts.set(childId, (attempts.get(childId) ?? 0) + 1)
}

export function resetAttempts(childId: string): void {
  attempts.delete(childId)
}

// Exported for use in middleware (02-02)
export { decodeJwt }
