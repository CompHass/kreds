import { redirect } from 'next/navigation'
import { auth } from '../../../../../../auth'
import { requireAuthenticatedIdentity } from '@/lib/auth/authorization'
import { acceptInvitation, declineInvitation } from '@/lib/families/invitations'

export const dynamic = 'force-dynamic'

interface AcceptPageProps {
  params: Promise<{ token: string }>
}

/**
 * Authenticated invitation acceptance page (D-05, D-08).
 *
 * - Invitee must authenticate through ZITADEL before accepting (T-02-11)
 * - Shows accept and decline options
 * - Never reveals family data unless acceptance succeeds
 * - Decline path marks invitation declined and does not create membership
 * - On acceptance, creates active guardian membership atomically
 */
export default async function AcceptInvitationPage({ params }: AcceptPageProps) {
  const { token } = await params
  const session = await auth()

  // Guard: must be authenticated (T-02-11)
  let identity
  try {
    identity = requireAuthenticatedIdentity(session)
  } catch {
    // Redirect to sign-in, then back to this page
    const callbackUrl = `/family/invitations/accept/${encodeURIComponent(token)}`
    redirect(`/api/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`)
  }

  return (
    <main>
      <h1>Family Invitation</h1>
      <p>
        You&apos;ve been invited to join a family on Kreds as a guardian.
        As a guardian, you&apos;ll help manage stewardship for the family.
      </p>

      <section>
        <h2>Accept or Decline</h2>

        <form action="/api/families/invitations" method="POST">
          <input type="hidden" name="action" value="accept" />
          <input type="hidden" name="token" value={token} />
          <p>
            By accepting, you&apos;ll gain guardian access to the family&apos;s
            stewardship tools and child profiles.
          </p>
          <button type="submit">Accept Invitation</button>
        </form>

        <form
          action="/api/families/invitations"
          method="POST"
          style={{ marginTop: '1rem' }}
        >
          <input type="hidden" name="action" value="decline" />
          <input type="hidden" name="token" value={token} />
          <button type="submit" style={{ background: 'transparent', border: '1px solid #ccc' }}>
            Decline Invitation
          </button>
        </form>
      </section>

      <p>
        <a href="/">Return home</a>
      </p>
    </main>
  )
}
