import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'

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
 * Sanitized timeline item returned to guardians (D-18).
 * No raw tokens, token hashes, raw diffs, or full identity payloads.
 */
export interface AuditTimelineItem {
  id: string
  familyId: string
  eventType: string
  subjectType: string
  subjectId: string
  summary: string
  metadata: Record<string, unknown>
  actorIdentityId: string | null
  createdAt: Date
}

/**
 * Sensitive metadata keys that must NEVER be exposed to guardians (D-18, T-02-16).
 */
const FORBIDDEN_METADATA_KEYS = new Set([
  'rawToken',
  'tokenHash',
  'rawDiff',
  'fullIdentityPayload',
  'token',
  'hash',
])

/**
 * Strips sensitive metadata before parent-visible display (D-18, T-02-16).
 *
 * - Removes: rawToken, tokenHash, rawDiff, fullIdentityPayload, token, hash
 * - Preserves: displayName, avatarPreset, accentColor, timezone, summary, safe fields
 * - Returns empty object for null/undefined metadata
 */
export function sanitizeAuditMetadata(
  metadata: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!metadata || metadata === null) {
    return {}
  }

  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(metadata)) {
    if (!FORBIDDEN_METADATA_KEYS.has(key)) {
      sanitized[key] = value
    }
  }

  return sanitized
}

/**
 * Lists all audit events for a family, scoped to an active guardian (FAM-07, D-17, T-02-15).
 *
 * Requires the identity be an active guardian member of the family.
 * Returns chronological timeline filtered by family_id.
 * Sanitizes metadata before returning.
 *
 * @throws {Error} If identity is not an active guardian member of the family
 */
export async function listFamilyAuditTimeline(
  identityId: string,
  familyId: string,
): Promise<AuditTimelineItem[]> {
  if (!identityId || !familyId) {
    throw new Error('identityId and familyId are required')
  }

  // Verify active guardian membership (T-02-15, T-02-18)
  const [membership] = await db
    .select({
      role: schema.familyMemberships.role,
      status: schema.familyMemberships.status,
    })
    .from(schema.familyMemberships)
    .where(
      and(
        eq(schema.familyMemberships.familyId, familyId),
        eq(schema.familyMemberships.identityId, identityId),
      ),
    )
    .limit(1)

  if (!membership) {
    throw new Error(`Not a member of family ${familyId}`)
  }

  if (membership.role !== 'guardian') {
    throw new Error('Guardian role required to view audit timeline')
  }

  if (membership.status !== 'active') {
    throw new Error('Active guardian membership required to view audit timeline')
  }

  // Query audit events for this family, newest first
  const rows = await db
    .select({
      id: schema.familyAuditEvents.id,
      familyId: schema.familyAuditEvents.familyId,
      eventType: schema.familyAuditEvents.eventType,
      subjectType: schema.familyAuditEvents.subjectType,
      subjectId: schema.familyAuditEvents.subjectId,
      summary: schema.familyAuditEvents.summary,
      metadata: schema.familyAuditEvents.metadata,
      actorIdentityId: schema.familyAuditEvents.actorIdentityId,
      createdAt: schema.familyAuditEvents.createdAt,
    })
    .from(schema.familyAuditEvents)
    .where(eq(schema.familyAuditEvents.familyId, familyId))
    .orderBy(desc(schema.familyAuditEvents.createdAt))

  // Sanitize each event's metadata before returning (T-02-16)
  return rows.map((row) => ({
    ...row,
    metadata: sanitizeAuditMetadata(row.metadata as Record<string, unknown> | null),
    createdAt: row.createdAt,
  })) as AuditTimelineItem[]
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
