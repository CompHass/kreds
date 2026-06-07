import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'

/**
 * Parameters for creating a family audit event.
 * Sanitized — no raw technical diffs or sensitive payloads in metadata (D-18).
 */
export interface CreateAuditEventInput {
  familyId: string
  actorIdentityId: string | null
  eventType: string
  subjectType: string
  subjectId: string
  summary: string
  metadata?: Record<string, unknown>
}

export interface AuditEvent {
  id: string
  familyId: string
  actorIdentityId: string | null
  eventType: string
  subjectType: string
  subjectId: string
  summary: string
  metadata: Record<string, unknown> | null
}

/**
 * Creates a sanitized audit event for the parent-readable timeline.
 * Does NOT store raw technical diffs or full identity payloads (D-18).
 *
 * The optional `tx` parameter accepts either the app DB or a Drizzle
 * transaction, enabling audit writes inside transactional commands.
 */
export async function createAuditEvent(
  input: CreateAuditEventInput,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: any = db,
): Promise<AuditEvent> {
  const [row] = await tx
    .insert(schema.familyAuditEvents)
    .values({
      familyId: input.familyId,
      actorIdentityId: input.actorIdentityId,
      eventType: input.eventType,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      summary: input.summary,
      metadata: input.metadata ?? {},
    })
    .returning({
      id: schema.familyAuditEvents.id,
      familyId: schema.familyAuditEvents.familyId,
      actorIdentityId: schema.familyAuditEvents.actorIdentityId,
      eventType: schema.familyAuditEvents.eventType,
      subjectType: schema.familyAuditEvents.subjectType,
      subjectId: schema.familyAuditEvents.subjectId,
      summary: schema.familyAuditEvents.summary,
      metadata: schema.familyAuditEvents.metadata,
    })

  return row as AuditEvent
}
