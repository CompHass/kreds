import { redirect } from 'next/navigation'
import { auth } from '../../../../auth'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireAuthenticatedIdentity, resolveKredsIdentityId } from '@/lib/auth/authorization'
import { getTimezoneOptions } from '@/lib/families/timezones'

export const dynamic = 'force-dynamic'

/**
 * Family onboarding page.
 *
 * Per D-01: authenticated guardian with no Kreds family creates the family tenant before child data.
 * Per D-03: family name and canonical IANA timezone with readable locality display.
 * Per D-04: successful family creation redirects to /family/children.
 * Does NOT collect child profile fields — those go on the children page.
 */
export default async function FamilyOnboardingPage() {
  const session = await auth()

  // Guard: must be authenticated
  let identity
  try {
    identity = requireAuthenticatedIdentity(session)
  } catch {
    redirect('/api/auth/signin')
  }

  // Resolve Kreds UUID from ZITADEL sub (if the identity exists already)
  // On first visit (before family creation), the identity may not exist yet — that's OK
  let kredsIdentityId: string | null = null
  try {
    kredsIdentityId = await resolveKredsIdentityId(identity.zitadelSub)
  } catch {
    // Identity not yet in kreds_identities — this is the first onboarding visit
  }

  // Check if already has a family
  const existingMemberships =
    kredsIdentityId
      ? await db
          .select({ familyId: schema.familyMemberships.familyId })
          .from(schema.familyMemberships)
          .where(eq(schema.familyMemberships.identityId, kredsIdentityId))
          .limit(1)
      : []

  if (existingMemberships.length > 0) {
    // Already has a family — redirect to children setup
    redirect('/family/children')
  }

  const timezoneOptions = getTimezoneOptions()

  return (
    <main>
      <h1>Create Your Family</h1>
      <p>Set up your family account to begin teaching stewardship.</p>

      <form action="/api/families" method="POST">
        <div>
          <label htmlFor="familyName">Family Name</label>
          <input
            id="familyName"
            name="familyName"
            type="text"
            required
            placeholder="e.g., Silva Family"
            minLength={2}
          />
        </div>

        <div>
          <label htmlFor="timezone">Timezone</label>
          <select id="timezone" name="timezone" required>
            <option value="">Select your timezone</option>
            {timezoneOptions.map((tz) => (
              <option key={tz.iana} value={tz.iana}>
                {tz.locality}
              </option>
            ))}
          </select>
        </div>

        <button type="submit">Create Family</button>
      </form>
    </main>
  )
}
