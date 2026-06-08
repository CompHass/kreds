import 'server-only'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getChildSession, type ChildSessionPayload } from '@/lib/families/child-session'

export function validateChildSessionScope(
  session: ChildSessionPayload | null,
  childProfileId: string,
): boolean {
  return session !== null && session.role === 'child' && session.childProfileId === childProfileId
}

export function extractChildProfileId(session: ChildSessionPayload): string {
  return session.childProfileId
}

export function extractFamilyId(session: ChildSessionPayload): string {
  return session.familyId
}

/**
 * Child session scope is strictly limited to childProfileId. All child route DB
 * queries MUST use childProfileId (from the returned payload) as the primary
 * filter. Never use familyId from the child session to enumerate family-wide
 * data — use it only to confirm the child belongs to the correct family.
 */
export async function requireChildSession(): Promise<ChildSessionPayload> {
  const cookieStore = await cookies()
  const session = await getChildSession(cookieStore)

  if (!session) {
    redirect('/')
  }

  return session
}
