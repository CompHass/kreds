'use server'

import { redirect } from 'next/navigation'
import { auth } from '../../../../auth'
import { requireAuthenticatedIdentity } from '@/lib/auth/authorization'
import { createFamilyForGuardian } from '@/lib/families/commands'
import { isValidTimezone } from '@/lib/families/timezones'

/**
 * Server Action: create family and redirect to /family/children.
 *
 * Called by the onboarding form via the `action` prop.
 * Runs on the server — no client-side fetch or body parsing needed.
 * Redirects on success (D-04). Returns an error message on failure.
 */
export async function createFamilyAction(
  _prevState: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await auth()

  let identity
  try {
    identity = requireAuthenticatedIdentity(session)
  } catch {
    redirect('/api/auth/signin')
  }

  const familyName = formData.get('familyName')?.toString()?.trim()
  const timezone = formData.get('timezone')?.toString()

  if (!familyName || !timezone) {
    return { error: 'Nome da família e fuso horário são obrigatórios.' }
  }

  if (!isValidTimezone(timezone)) {
    return { error: 'Fuso horário inválido.' }
  }

  try {
    await createFamilyForGuardian({
      zitadelSub: identity.zitadelSub,
      email: identity.email ?? '',
      familyName,
      timezone,
    })
  } catch (err) {
    console.error('[createFamilyAction] error:', err)
    return { error: 'Não foi possível criar a família. Tente novamente.' }
  }

  redirect('/family/children')
}
