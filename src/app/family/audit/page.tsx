import { auth } from '../../../../auth'
import { listFamilyAuditTimeline } from '@/lib/families/audit'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

/**
 * Human-readable labels for audit event types (D-18).
 */
function eventLabel(eventType: string): string {
  const labels: Record<string, string> = {
    'family.created': 'Family Created',
    'membership.created': 'Membership Added',
    'invitation.created': 'Invitation Sent',
    'invitation.accepted': 'Invitation Accepted',
    'invitation.declined': 'Invitation Declined',
    'invitation.revoked': 'Invitation Revoked',
    'role.changed': 'Role Changed',
    'consent.granted': 'Consent Granted',
    'child_profile.created': 'Child Profile Created',
    'child_profile.updated': 'Child Profile Updated',
    'child_profile.deactivated': 'Child Profile Deactivated',
  }
  return labels[eventType] ?? eventType
}

/**
 * Formats a Date to a readable timestamp string.
 */
function formatTimestamp(date: Date): string {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function AuditPage() {
  const session = await auth()

  if (!session?.user?.id) {
    return (
      <main>
        <h1>Audit Timeline</h1>
        <p>Please sign in to view your family audit history.</p>
        <Link href="/api/auth/signin">Sign in with ZITADEL</Link>
      </main>
    )
  }

  const identityId = session.user.id as string

  // Find the guardian's active family membership
  const [membership] = await db
    .select({
      familyId: schema.familyMemberships.familyId,
    })
    .from(schema.familyMemberships)
    .where(eq(schema.familyMemberships.identityId, identityId))
    .limit(1)

  if (!membership) {
    return (
      <main>
        <h1>Audit Timeline</h1>
        <p>You are not a member of any family yet.</p>
        <Link href="/family/onboarding">Create Your Family</Link>
      </main>
    )
  }

  let timeline: Awaited<ReturnType<typeof listFamilyAuditTimeline>>
  try {
    timeline = await listFamilyAuditTimeline(identityId, membership.familyId)
  } catch (err: any) {
    return (
      <main>
        <h1>Audit Timeline</h1>
        <p>Unable to load audit history.</p>
        <p>{err.message}</p>
        <Link href="/">Back to Home</Link>
      </main>
    )
  }

  return (
    <main>
      <h1>Audit Timeline</h1>
      <p>
        History of changes to your family&apos;s identity, membership,
        invitations, roles, and profiles.
      </p>

      {timeline.length === 0 ? (
        <section>
          <h2>No Audit Events</h2>
          <p>No changes have been recorded for your family yet.</p>
          <nav>
            <Link href="/">Back to Home</Link>
          </nav>
        </section>
      ) : (
        <section>
          <ol>
            {timeline.map((event) => (
              <li key={event.id}>
                <article>
                  <header>
                    <strong>{eventLabel(event.eventType)}</strong>
                    {' — '}
                    <span>{event.subjectType}</span>
                  </header>
                  <p>{event.summary}</p>
                  <footer>
                    <time dateTime={event.createdAt.toISOString()}>
                      {formatTimestamp(event.createdAt)}
                    </time>
                  </footer>
                </article>
              </li>
            ))}
          </ol>
        </section>
      )}

      <nav>
        <Link href="/">Back to Home</Link>
      </nav>
    </main>
  )
}
