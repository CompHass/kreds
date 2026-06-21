'use server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { childProfiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import {
  checkBruteForce,
  recordFailedAttempt,
  resetAttempts,
  signChildSession,
} from '@/lib/families/child-session'
import { verifyPin, validatePinFormat } from '@/lib/families/child-pin'

export async function verifyChildPin(
  childId: string,
  pin: string,
): Promise<{ success: true } | { error: 'blocked' | 'no-pin' | 'invalid' }> {
  if (!validatePinFormat(pin)) return { error: 'invalid' as const }

  const bf = checkBruteForce(childId)
  if (bf.blocked) return { error: 'blocked' as const }

  const [child] = await db
    .select({ pinHash: childProfiles.pinHash, familyId: childProfiles.familyId })
    .from(childProfiles)
    .where(eq(childProfiles.id, childId))
    .limit(1)

  if (!child?.pinHash) return { error: 'no-pin' as const }

  const valid = await verifyPin(pin, child.pinHash)
  if (!valid) {
    recordFailedAttempt(childId)
    return { error: 'invalid' as const }
  }

  const jwt = await signChildSession({
    childProfileId: childId,
    familyId: child.familyId,
    role: 'child',
  })
  resetAttempts(childId)

  const cookieStore = await cookies()
  cookieStore.set('child-session', jwt, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 8 * 60 * 60, // 8 horas (D-14)
  })

  return { success: true as const }
}
