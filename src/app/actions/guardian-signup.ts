'use server'

import { signIn } from '../../../auth'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { families, familyMemberships, guardianInvitations, identities } from '@/lib/db/schema'
import { createGuardianUser, ZitadelApiError } from '@/lib/zitadel/login-client'
import { issueProvisionalSignupToken } from '@/lib/auth/provisional-signup'

const INVALID = 'Não foi possível criar a conta. Verifique os dados e tente novamente.'
const DUPLICATE = 'Não foi possível criar a conta. Verifique os dados e tente novamente.'

export type GuardianSignupResult = { ok: true } | { ok: false; error: string }

export async function signupGuardian(formData: FormData): Promise<GuardianSignupResult> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const confirmation = String(formData.get('confirmPassword') ?? '')
  if (!email || !email.includes('@') || !password || password !== confirmation) return { ok: false, error: INVALID }

  let created: { userId: string }
  try {
    created = await createGuardianUser(email, password)
  } catch (error) {
    if (error instanceof ZitadelApiError && error.status === 409) return { ok: false, error: DUPLICATE }
    if (error instanceof ZitadelApiError && error.status === 400 && error.publicMessage) {
      return { ok: false, error: error.publicMessage }
    }
    return { ok: false, error: INVALID }
  }

  let identityId: string
  try {
    identityId = await db.transaction(async (tx) => {
      const [identity] = await tx.insert(identities).values({
        zitadelSubject: created.userId,
        email,
        emailVerified: false,
        displayName: email.split('@')[0] || 'Guardian',
      }).onConflictDoUpdate({
        target: identities.zitadelSubject,
        set: { email, updatedAt: new Date() },
      }).returning({ id: identities.id })

      const [invite] = await tx.select().from(guardianInvitations).where(and(
        eq(guardianInvitations.email, email),
        eq(guardianInvitations.status, 'pending'),
      )).limit(1)

      let familyId = invite?.familyId
      if (!familyId) {
        const [family] = await tx.insert(families).values({ name: 'Família', createdByIdentityId: identity.id }).returning({ id: families.id })
        familyId = family.id
      }
      await tx.insert(familyMemberships).values({ familyId, identityId: identity.id, role: 'guardian', status: 'active' }).onConflictDoNothing()
      if (invite) {
        await tx.update(guardianInvitations).set({ status: 'accepted', acceptedByIdentityId: identity.id, updatedAt: new Date() }).where(eq(guardianInvitations.id, invite.id))
      }
      return identity.id
    })
  } catch {
    // Zitadel user creation is intentionally not rolled back. The next successful
    // Credentials login runs the same identity/family sync and self-heals it.
    return { ok: false, error: INVALID }
  }

  const provisionalSignupToken = await issueProvisionalSignupToken(identityId)
  await signIn('credentials', { email, password, provisionalSignupToken, redirectTo: '/family' })
  return { ok: true }
}
