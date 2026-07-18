'use server'

// Phase 13 — Guardian step-up PIN actions. Mirrors src/app/actions/child-auth.ts
// but targets the family-shared guardian PIN (families.guardian_pin_hash) and
// issues a short-lived guardian-session JWT that the middleware requires for
// every /family/* request.
//
// Kept separate from guardian-auth.ts (base-authn: Zitadel OIDC login) so the
// layering stays explicit: next-auth answers "who are you?"; these actions
// answer "have you step-up-proven as a guardian of THIS family?".
//
// SECURITY: every mutation calls resolveGuardianMembership() to confirm the
// next-auth user is an active guardian of `familyId` BEFORE touching the PIN
// hash. This is the deep authorization the old /family/* routes lacked.

import { cookies } from 'next/headers'
import { auth } from '../../../auth'
import { db } from '@/lib/db'
import { families } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { hashPin, verifyPin, validatePinFormat } from '@/lib/families/child-pin'
import { resolveGuardianMembership } from '@/lib/auth/guardian-membership'
import {
  GUARDIAN_SESSION_COOKIE,
  GUARDIAN_SESSION_MAX_AGE,
  checkGuardianBruteForce,
  recordGuardianFailedAttempt,
  resetGuardianAttempts,
  signGuardianSession,
} from '@/lib/families/guardian-session'

export type GuardianPinResult =
  | { success: true }
  | { error: 'blocked' | 'no-pin' | 'invalid' | 'unauthorized' }

export type GuardianPinSetupResult =
  | { success: true }
  | { error: 'unauthorized' | 'mismatch' | 'invalid' | 'failed' }

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: GUARDIAN_SESSION_MAX_AGE,
}

/**
 * Verify the family guardian PIN and issue a guardian-session cookie.
 * Called from /family/[familyId]/guardian-login.
 *
 * Authorization: the next-auth user must be an active guardian of `familyId`.
 * Without this, a logged-in guardian of family A could unlock family B's panel
 * by guessing B's PIN — the membership check binds the step-up to the caller.
 */
export async function verifyGuardianPin(
  familyId: string,
  pin: string,
): Promise<GuardianPinResult> {
  if (!validatePinFormat(pin)) return { error: 'invalid' as const }

  const session = await auth()
  const membership = await resolveGuardianMembership(session?.user?.id, familyId)
  if (!membership) return { error: 'unauthorized' as const }

  const bf = checkGuardianBruteForce(familyId)
  if (bf.blocked) return { error: 'blocked' as const }

  const [family] = await db
    .select({ guardianPinHash: families.guardianPinHash })
    .from(families)
    .where(eq(families.id, familyId))
    .limit(1)

  if (!family?.guardianPinHash) return { error: 'no-pin' as const }

  const valid = await verifyPin(pin, family.guardianPinHash)
  if (!valid) {
    recordGuardianFailedAttempt(familyId)
    return { error: 'invalid' as const }
  }

  const jwt = await signGuardianSession({
    familyId,
    identityId: membership.identityId,
    role: 'guardian',
  })
  resetGuardianAttempts(familyId)

  const cookieStore = await cookies()
  cookieStore.set(GUARDIAN_SESSION_COOKIE, jwt, cookieOptions)

  return { success: true as const }
}

/**
 * Set (first-time setup) or reset the family guardian PIN, then immediately
 * issue a guardian-session so the caller lands in the panel without a second
 * PIN entry. Called from /family/[familyId]/guardian-setup and Settings.
 *
 * Authorization: the next-auth user must be an active guardian of `familyId`.
 */
export async function setGuardianPin(
  familyId: string,
  pin: string,
  confirmPin: string,
): Promise<GuardianPinSetupResult> {
  if (pin !== confirmPin) return { error: 'mismatch' as const }
  if (!validatePinFormat(pin)) return { error: 'invalid' as const }

  const session = await auth()
  const membership = await resolveGuardianMembership(session?.user?.id, familyId)
  if (!membership) return { error: 'unauthorized' as const }

  const pinHash = await hashPin(pin)

  const [updated] = await db
    .update(families)
    .set({ guardianPinHash: pinHash, updatedAt: new Date() })
    .where(eq(families.id, familyId))
    .returning({ id: families.id })

  if (!updated) return { error: 'failed' as const }

  const jwt = await signGuardianSession({
    familyId,
    identityId: membership.identityId,
    role: 'guardian',
  })
  resetGuardianAttempts(familyId)

  const cookieStore = await cookies()
  cookieStore.set(GUARDIAN_SESSION_COOKIE, jwt, cookieOptions)

  return { success: true as const }
}

/**
 * Clear the guardian-session cookie. Used when the guardian explicitly leaves
 * the panel back to the profile picker, so the next entry requires the PIN
 * again. Does NOT touch the next-auth session — the guardian stays logged in.
 */
export async function exitGuardianSession(): Promise<{ success: true }> {
  const cookieStore = await cookies()
  cookieStore.delete(GUARDIAN_SESSION_COOKIE)
  return { success: true as const }
}
