import { redirect } from 'next/navigation'
import { auth } from '../../../../auth'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { requireAuthenticatedIdentity, resolveKredsIdentityId } from '@/lib/auth/authorization'
import {
  createInvitation,
  revokeInvitation,
  INVITATION_STATUS,
  type InvitationResult,
} from '@/lib/families/invitations'

export const dynamic = 'force-dynamic'

/**
 * Guardian invitation management page (D-05, D-06).
 *
 * - Only active guardians can access this page
 * - Shows invitation creation form with email input
 * - Lists all invitations for the current family with status
 * - Provides revoke button for pending invitations
 * - Shows copyable invitation link on creation
 */
export default async function InvitationsPage() {
  const session = await auth()

  // Guard: must be authenticated
  let identity
  try {
    identity = requireAuthenticatedIdentity(session)
  } catch {
    redirect('/api/auth/signin')
  }

  // Resolve Kreds UUID from ZITADEL sub — membership columns use the DB UUID, not the sub string
  let kredsIdentityId: string
  try {
    kredsIdentityId = await resolveKredsIdentityId(identity.zitadelSub)
  } catch {
    redirect('/family/onboarding')
  }

  // Find the user's active guardian membership
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
    return (
      <main>
        <h1>Invitations</h1>
        <p>Only active guardians can manage invitations.</p>
        <a href="/">Return home</a>
      </main>
    )
  }

  const membership = memberships[0]
  const familyId = membership.familyId

  // Fetch existing invitations for this family
  const invitations = await db
    .select()
    .from(schema.guardianInvitations)
    .where(eq(schema.guardianInvitations.familyId, familyId))
    .orderBy(desc(schema.guardianInvitations.createdAt))

  return (
    <main>
      <h1>Guardian Invitations</h1>
      <p>Invite another guardian to help manage your family&apos;s stewardship.</p>

      {/* Invitation creation form */}
      <section>
        <h2>Invite a Guardian</h2>
        <form action="/api/families/invitations" method="POST">
          <input type="hidden" name="action" value="create" />
          <div>
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="guardian@example.com"
            />
          </div>
          <button type="submit">Send Invitation</button>
        </form>
      </section>

      {/* Existing invitations list */}
      <section>
        <h2>Sent Invitations</h2>
        {invitations.length === 0 ? (
          <p>No invitations sent yet.</p>
        ) : (
          <ul>
            {invitations.map((inv) => (
              <li key={inv.id}>
                <strong>{inv.email}</strong>
                {' — '}
                <span>{inv.status}</span>
                {inv.status === INVITATION_STATUS.PENDING && (
                  <>
                    {' '}
                    <form
                      action="/api/families/invitations"
                      method="POST"
                      style={{ display: 'inline' }}
                    >
                      <input type="hidden" name="action" value="revoke" />
                      <input type="hidden" name="invitationId" value={inv.id} />
                      <button type="submit">Revoke</button>
                    </form>
                  </>
                )}
                {inv.status === INVITATION_STATUS.ACCEPTED && inv.acceptedByIdentityId && (
                  <span> (accepted)</span>
                )}
                {inv.status === INVITATION_STATUS.EXPIRED && (
                  <span> (link expired)</span>
                )}
                <br />
                <small>
                  Invited:{' '}
                  {inv.createdAt instanceof Date
                    ? inv.createdAt.toLocaleDateString()
                    : String(inv.createdAt)}
                  {inv.expiresAt instanceof Date &&
                    inv.status === INVITATION_STATUS.PENDING &&
                    ` — Expires: ${inv.expiresAt.toLocaleDateString()}`}
                </small>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p>
        <a href="/">Return home</a>
      </p>
    </main>
  )
}
