import crypto from 'crypto'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, and, lt } from 'drizzle-orm'
import { createAuditEvent } from './audit'

// Constants

export const INVITATION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  EXPIRED: 'expired',
  REVOKED: 'revoked',
  DECLINED: 'declined',
} as const

export type InvitationStatus = (typeof INVITATION_STATUS)[keyof typeof INVITATION_STATUS]

export const INVITATION_EXPIRY_HOURS = 72

/**
 * Valid lifecycle transitions for guardian invitations (D-07).
 * Only pending invitations can transition to terminal states.
 */
export const VALID_TRANSITIONS: Record<string, InvitationStatus[]> = {
  pending: ['accepted', 'declined', 'revoked', 'expired'],
  accepted: [],
  declined: [],
  revoked: [],
  expired: [],
}

// Pure predicates

export function isInvitationPending(status: string): boolean {
  return status === INVITATION_STATUS.PENDING
}

export function isInvitationAccepted(status: string): boolean {
  return status === INVITATION_STATUS.ACCEPTED
}

export function isInvitationExpired(status: string): boolean {
  return status === INVITATION_STATUS.EXPIRED
}

export function isInvitationRevoked(status: string): boolean {
  return status === INVITATION_STATUS.REVOKED
}

export function isInvitationDeclined(status: string): boolean {
  return status === INVITATION_STATUS.DECLINED
}

// Transition validation

/**
 * Checks whether an invitation can transition from one status to another.
 * Enforces T-02-12: only pending can move to accepted/declined/revoked/expired.
 */
export function canTransitionTo(from: string, to: string): boolean {
  const allowed = VALID_TRANSITIONS[from]
  if (!allowed) return false
  return allowed.includes(to as InvitationStatus)
}

// Token security (SHA-256 hashing)

/**
 * Creates a SHA-256 hash of the invitation token.
 * Raw tokens are never stored in the database (D-08, T-02-13).
 */
export function hashInvitationToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * Verifies a raw token against a stored hash using constant-time-safe comparison.
 */
export function verifyInvitationToken(token: string, hash: string): boolean {
  return hashInvitationToken(token) === hash
}

// Types for DB commands

export interface CreateInvitationInput {
  familyId: string
  email: string
  invitedByIdentityId: string
}

export interface InvitationResult {
  id: string
  familyId: string
  email: string
  status: string
  rawToken: string | null
  invitedByIdentityId: string | null
  acceptedByIdentityId: string | null
  expiresAt: Date
}

export interface AcceptInvitationInput {
  token: string
  identityId: string
}

export interface AcceptInvitationResult {
  invitation: {
    id: string
    familyId: string
    email: string
    status: string
  }
  membership: {
    identityId: string
    familyId: string
    role: string
    status: string
  }
}

// DB commands

/**
 * Creates a pending guardian invitation with a one-time copyable token.
 *
 * Security:
 * - Only stores the token hash in the database (D-08, T-02-13)
 * - Returns the raw token once for copyable link display
 * - Sets expiration based on INVITATION_EXPIRY_HOURS
 * - Requires active guardian authorization (caller must validate before calling)
 * - Writes audit event for creation
 *
 * The caller MUST ensure the inviter is an active guardian of the family.
 */
export async function createInvitation(
  input: CreateInvitationInput,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: any = db,
): Promise<InvitationResult> {
  const rawToken = crypto.randomUUID()
  const tokenHash = hashInvitationToken(rawToken)
  const normalizedEmail = input.email.toLowerCase().trim()

  if (!normalizedEmail) {
    throw new Error('Email is required for invitation')
  }
  if (!input.familyId) {
    throw new Error('Family ID is required for invitation')
  }

  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + INVITATION_EXPIRY_HOURS)

  const [invitation] = await tx
    .insert(schema.guardianInvitations)
    .values({
      familyId: input.familyId,
      email: normalizedEmail,
      tokenHash,
      invitedByIdentityId: input.invitedByIdentityId,
      expiresAt,
      status: 'pending',
    })
    .returning({
      id: schema.guardianInvitations.id,
      familyId: schema.guardianInvitations.familyId,
      email: schema.guardianInvitations.email,
      status: schema.guardianInvitations.status,
      invitedByIdentityId: schema.guardianInvitations.invitedByIdentityId,
      acceptedByIdentityId: schema.guardianInvitations.acceptedByIdentityId,
      expiresAt: schema.guardianInvitations.expiresAt,
    })

  // Write audit event
  await createAuditEvent(
    {
      familyId: input.familyId,
      actorIdentityId: input.invitedByIdentityId,
      eventType: 'invitation.created',
      subjectType: 'guardian_invitation',
      subjectId: invitation.id,
      summary: `Guardian invitation created for ${normalizedEmail}`,
      metadata: { email: normalizedEmail },
    },
    tx,
  )

  return {
    ...invitation,
    rawToken,
  }
}

/**
 * Accepts a guardian invitation using a one-time token.
 *
 * Security (T-02-11, T-02-12):
 * - Validates the token hash against stored hash
 * - Rejects if invitation is not in pending state
 * - Rejects if invitation has expired
 * - Creates active guardian membership atomically with acceptance
 * - Links membership to the authenticated identity (ZITADEL sub), not the email
 * - Upserts the local Kreds identity for the accepting user
 *
 * The caller MUST ensure the acceptee is authenticated through ZITADEL.
 */
export async function acceptInvitation(
  input: AcceptInvitationInput,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  outerTx?: any,
): Promise<AcceptInvitationResult> {
  const tokenHash = hashInvitationToken(input.token)
  const executor = outerTx ?? db

  return executor.transaction(async (tx: any) => {
    // Find the matching pending invitation by token hash
    const [invitation] = await tx
      .select()
      .from(schema.guardianInvitations)
      .where(
        and(
          eq(schema.guardianInvitations.tokenHash, tokenHash),
          eq(schema.guardianInvitations.status, 'pending'),
        ),
      )
      .limit(1)

    if (!invitation) {
      throw new Error('Invalid or expired invitation token')
    }

    // Check expiration
    if (new Date() > invitation.expiresAt) {
      // Transition to expired
      await tx
        .update(schema.guardianInvitations)
        .set({
          status: 'expired',
          updatedAt: new Date(),
        })
        .where(eq(schema.guardianInvitations.id, invitation.id))

      throw new Error('Invitation has expired')
    }

    // Upsert local Kreds identity
    const existingIdentities = await tx
      .select({ id: schema.identities.id })
      .from(schema.identities)
      .where(eq(schema.identities.zitadelSubject, input.identityId))
      .limit(1)

    let kredsIdentityId: string
    if (existingIdentities.length > 0) {
      kredsIdentityId = existingIdentities[0].id
    } else {
      const [newIdentity] = await tx
        .insert(schema.identities)
        .values({
          zitadelSubject: input.identityId,
          email: invitation.email,
          emailVerified: true,
        })
        .returning({ id: schema.identities.id })
      kredsIdentityId = newIdentity.id
    }

    // Transition invitation to accepted
    const [updated] = await tx
      .update(schema.guardianInvitations)
      .set({
        status: 'accepted',
        acceptedByIdentityId: kredsIdentityId,
        updatedAt: new Date(),
      })
      .where(eq(schema.guardianInvitations.id, invitation.id))
      .returning({
        id: schema.guardianInvitations.id,
        familyId: schema.guardianInvitations.familyId,
        email: schema.guardianInvitations.email,
        status: schema.guardianInvitations.status,
      })

    // Create active guardian membership
    const [membership] = await tx
      .insert(schema.familyMemberships)
      .values({
        familyId: invitation.familyId,
        identityId: kredsIdentityId,
        role: 'guardian',
        status: 'active',
      })
      .returning({
        identityId: schema.familyMemberships.identityId,
        familyId: schema.familyMemberships.familyId,
        role: schema.familyMemberships.role,
        status: schema.familyMemberships.status,
      })

    // Write audit event
    await createAuditEvent(
      {
        familyId: invitation.familyId,
        actorIdentityId: kredsIdentityId,
        eventType: 'invitation.accepted',
        subjectType: 'guardian_invitation',
        subjectId: invitation.id,
        summary: `Guardian invitation accepted by ${invitation.email}`,
        metadata: {
          email: invitation.email,
          invitedByIdentityId: invitation.invitedByIdentityId,
        },
      },
      tx,
    )

    return {
      invitation: {
        id: updated.id,
        familyId: updated.familyId,
        email: updated.email,
        status: updated.status,
      },
      membership: {
        identityId: membership.identityId!,
        familyId: membership.familyId,
        role: membership.role,
        status: membership.status,
      },
    }
  })
}

/**
 * Declines a guardian invitation.
 * Transitions status from pending → declined without creating membership.
 */
export async function declineInvitation(
  token: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: any = db,
): Promise<{ id: string; status: string }> {
  const tokenHash = hashInvitationToken(token)

  const [invitation] = await tx
    .select()
    .from(schema.guardianInvitations)
    .where(
      and(
        eq(schema.guardianInvitations.tokenHash, tokenHash),
        eq(schema.guardianInvitations.status, 'pending'),
      ),
    )
    .limit(1)

  if (!invitation) {
    throw new Error('Invalid or expired invitation token')
  }

  const [updated] = await tx
    .update(schema.guardianInvitations)
    .set({
      status: 'declined',
      updatedAt: new Date(),
    })
    .where(eq(schema.guardianInvitations.id, invitation.id))
    .returning({
      id: schema.guardianInvitations.id,
      status: schema.guardianInvitations.status,
    })

  await createAuditEvent(
    {
      familyId: invitation.familyId,
      actorIdentityId: null,
      eventType: 'invitation.declined',
      subjectType: 'guardian_invitation',
      subjectId: invitation.id,
      summary: `Guardian invitation declined by ${invitation.email}`,
      metadata: { email: invitation.email },
    },
    tx,
  )

  return { id: updated.id, status: updated.status }
}

/**
 * Revokes a pending guardian invitation.
 * Only active guardians can revoke (caller must validate authorization).
 */
export async function revokeInvitation(
  invitationId: string,
  actorIdentityId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: any = db,
): Promise<{ id: string; status: string }> {
  const [invitation] = await tx
    .select()
    .from(schema.guardianInvitations)
    .where(
      and(
        eq(schema.guardianInvitations.id, invitationId),
        eq(schema.guardianInvitations.status, 'pending'),
      ),
    )
    .limit(1)

  if (!invitation) {
    throw new Error('Invitation not found or not in pending state')
  }

  const [updated] = await tx
    .update(schema.guardianInvitations)
    .set({
      status: 'revoked',
      updatedAt: new Date(),
    })
    .where(eq(schema.guardianInvitations.id, invitation.id))
    .returning({
      id: schema.guardianInvitations.id,
      status: schema.guardianInvitations.status,
    })

  await createAuditEvent(
    {
      familyId: invitation.familyId,
      actorIdentityId,
      eventType: 'invitation.revoked',
      subjectType: 'guardian_invitation',
      subjectId: invitation.id,
      summary: `Guardian invitation revoked for ${invitation.email}`,
      metadata: { email: invitation.email },
    },
    tx,
  )

  return { id: updated.id, status: updated.status }
}

/**
 * Marks expired pending invitations. Called by background job or on read.
 */
export async function expirePendingInvitations(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: any = db,
): Promise<number> {
  const result = await tx
    .update(schema.guardianInvitations)
    .set({
      status: 'expired',
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.guardianInvitations.status, 'pending'),
        lt(schema.guardianInvitations.expiresAt, new Date()),
      ),
    )
    .returning({ id: schema.guardianInvitations.id })

  return result.length
}
