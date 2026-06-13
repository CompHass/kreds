import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../auth'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuthenticatedIdentity, resolveKredsIdentityId } from '@/lib/auth/authorization'
import {
  createInvitation,
  acceptInvitation,
  declineInvitation,
  revokeInvitation,
} from '@/lib/families/invitations'

/**
 * Parses request body from either JSON or form-encoded submissions.
 *
 * Node.js 22+ (undici) marks the body stream as consumed after any read attempt,
 * even a failed one. Calling json() and then formData() on the same request will
 * always throw "Body is unusable: Body has already been read" on the second call,
 * producing a 500 instead of the intended response.
 *
 * Fix: inspect Content-Type first, then call only one read method.
 */
async function parseBody(request: NextRequest): Promise<Record<string, string>> {
  const contentType = request.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return request.json()
  }

  if (
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('multipart/form-data')
  ) {
    const formData = await request.formData()
    const body: Record<string, string> = {}
    formData.forEach((value, key) => {
      body[key] = value.toString()
    })
    return body
  }

  // Fallback: try JSON, then return empty object if body is absent/unknown.
  // If json() consumed the stream, formData() would throw too — return {} and
  // let the caller's field-validation produce a 400.
  try {
    return await request.json()
  } catch {
    return {}
  }
}

/**
 * POST /api/families/invitations
 *
 * Handles guardian invitation lifecycle actions.
 * Requires authentication for all actions.
 * Requires active guardian membership for create and revoke.
 *
 * Actions:
 * - create: Creates a pending invitation (guardian-only, D-06)
 * - revoke: Revokes a pending invitation (guardian-only, D-07)
 * - accept: Accepts an invitation (any authenticated user, D-05)
 * - decline: Declines an invitation (any authenticated user)
 */
export async function POST(request: NextRequest) {
  const session = await auth()

  // Parse body — supports both JSON (fetch/XHR) and form-encoded (HTML form submit)
  const body = await parseBody(request)

  const action = body.action

  if (!action) {
    return NextResponse.json({ error: 'Action is required' }, { status: 400 })
  }

  try {
    switch (action) {
      case 'create': {
        // Requires active guardian (T-02-14)
        let identity
        try {
          identity = requireAuthenticatedIdentity(session)
        } catch {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Resolve Kreds UUID from ZITADEL sub — membership columns use the DB UUID, not the sub string
        let kredsIdentityId: string
        try {
          kredsIdentityId = await resolveKredsIdentityId(identity.zitadelSub)
        } catch {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const email = body.email
        if (!email) {
          return NextResponse.json({ error: 'Email is required' }, { status: 400 })
        }

        // Validate email format at the API boundary (WR-06)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
          return NextResponse.json({ error: 'Invalid email address format' }, { status: 400 })
        }

        // Get the guardian's active family membership
        const memberships = await db
          .select({
            familyId: schema.familyMemberships.familyId,
            role: schema.familyMemberships.role,
            status: schema.familyMemberships.status,
          })
          .from(schema.familyMemberships)
          .where(
            and(
              eq(schema.familyMemberships.identityId, kredsIdentityId),
              eq(schema.familyMemberships.role, 'guardian'),
              eq(schema.familyMemberships.status, 'active'),
            ),
          )
          .limit(1)

        if (memberships.length === 0) {
          return NextResponse.json(
            { error: 'Only active guardians can create invitations' },
            { status: 403 },
          )
        }

        const membership = memberships[0]

        let invitation
        try {
          invitation = await createInvitation({
            familyId: membership.familyId,
            email,
            invitedByIdentityId: kredsIdentityId,
          })
        } catch (inviteErr) {
          // PG unique_pending_invite constraint: 23505 = unique_violation
          const cause = (inviteErr as any)?.cause as any
          if (cause?.code === '23505' || (inviteErr as Error)?.message?.includes('unique_pending_invite')) {
            return NextResponse.json(
              { error: 'Já existe um convite pendente para este e-mail nesta família.' },
              { status: 409 },
            )
          }
          throw inviteErr
        }

        // Generate the copyable invitation link
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const inviteLink = `${appUrl}/family/invitations/accept/${encodeURIComponent(invitation.rawToken!)}`

        return NextResponse.json(
          {
            invitation: {
              id: invitation.id,
              email: invitation.email,
              status: invitation.status,
              expiresAt: invitation.expiresAt,
            },
            inviteLink,
          },
          { status: 201 },
        )
      }

      case 'revoke': {
        // Requires active guardian (T-02-14)
        let identity
        try {
          identity = requireAuthenticatedIdentity(session)
        } catch {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Resolve Kreds UUID from ZITADEL sub — membership columns use the DB UUID, not the sub string
        let kredsIdentityId: string
        try {
          kredsIdentityId = await resolveKredsIdentityId(identity.zitadelSub)
        } catch {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const invitationId = body.invitationId
        if (!invitationId) {
          return NextResponse.json(
            { error: 'Invitation ID is required' },
            { status: 400 },
          )
        }

        // Verify the requester is an active guardian and get their family
        const memberships = await db
          .select({
            familyId: schema.familyMemberships.familyId,
          })
          .from(schema.familyMemberships)
          .where(
            and(
              eq(schema.familyMemberships.identityId, kredsIdentityId),
              eq(schema.familyMemberships.role, 'guardian'),
              eq(schema.familyMemberships.status, 'active'),
            ),
          )
          .limit(1)

        if (memberships.length === 0) {
          return NextResponse.json(
            { error: 'Only active guardians can revoke invitations' },
            { status: 403 },
          )
        }

        // Verify the invitation belongs to the guardian's family (cross-family revoke prevention)
        const guardianFamilyId = memberships[0].familyId
        const [targetInvitation] = await db
          .select({
            id: schema.guardianInvitations.id,
            familyId: schema.guardianInvitations.familyId,
          })
          .from(schema.guardianInvitations)
          .where(
            and(
              eq(schema.guardianInvitations.id, invitationId),
              eq(schema.guardianInvitations.familyId, guardianFamilyId),
            ),
          )
          .limit(1)

        if (!targetInvitation) {
          return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
        }

        const result = await revokeInvitation(invitationId, kredsIdentityId)

        return NextResponse.json({
          id: result.id,
          status: result.status,
        })
      }

      case 'accept': {
        // Requires authentication (T-02-11)
        let identity
        try {
          identity = requireAuthenticatedIdentity(session)
        } catch {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = body.token
        if (!token) {
          return NextResponse.json({ error: 'Token is required' }, { status: 400 })
        }

        try {
          const result = await acceptInvitation({
            token,
            identityId: identity.zitadelSub,
          })

          // Redirect to family dashboard after successful acceptance
          return NextResponse.json(
            {
              invitation: result.invitation,
              membership: result.membership,
              redirectTo: '/',
            },
            { status: 200 },
          )
        } catch (err) {
          if (err instanceof Error) {
            return NextResponse.json({ error: err.message }, { status: 400 })
          }
          throw err
        }
      }

      case 'decline': {
        // Must be authenticated — prevents anonymous token-guessing attacks
        try {
          requireAuthenticatedIdentity(session)
        } catch {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = body.token
        if (!token) {
          return NextResponse.json({ error: 'Token is required' }, { status: 400 })
        }

        try {
          const result = await declineInvitation(token)

          return NextResponse.json(
            {
              id: result.id,
              status: result.status,
              message: 'Invitation declined.',
            },
            { status: 200 },
          )
        } catch (err) {
          if (err instanceof Error) {
            return NextResponse.json({ error: err.message }, { status: 400 })
          }
          throw err
        }
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 },
        )
    }
  } catch (err) {
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
