import 'server-only'

interface ChildSession {
  childProfileId: string
  familyId: string
  role: 'child'
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
