import 'server-only'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getChildSession } from '@/lib/families/child-session'

interface ChildSession {
  childProfileId: string
  familyId: string
  role: 'child'
}

export async function requireChildSession(): Promise<ChildSession> {
  const cookieStore = await cookies()
  const session = await getChildSession(cookieStore)
  if (!session) redirect('/')
  return session
}

export function validateChildSessionScope(
  session: ChildSession | null | { childProfileId: string; familyId: string; role: string },
  requestedChildId: string,
): boolean {
  if (!session) return false
  if (session.role !== 'child') return false
  return session.childProfileId === requestedChildId
}

export function extractChildProfileId(session: ChildSession): string {
  return session.childProfileId
}

export function extractFamilyId(session: ChildSession): string {
  return session.familyId
}
