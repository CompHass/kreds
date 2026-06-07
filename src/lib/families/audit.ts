// Stub — implemented in GREEN phase of Task 2

export interface CreateAuditEventInput {
  familyId: string
  actorIdentityId: string
  eventType: string
  subjectType: string
  subjectId: string
  summary: string
  metadata?: Record<string, unknown>
}

export interface AuditEvent {
  familyId: string
  actorIdentityId: string
  eventType: string
  subjectType: string
  subjectId: string
  summary: string
  metadata: Record<string, unknown> | null
}

export function createAuditEvent(_input: CreateAuditEventInput): AuditEvent {
  throw new Error('Not implemented — stub for RED phase')
}
