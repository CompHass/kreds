import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '../../../../auth'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireAuthenticatedIdentity, resolveKredsIdentityId } from '@/lib/auth/authorization'
import { listActiveChildProfiles } from '@/lib/families/child-profiles'
import {
  AVATAR_PRESETS,
  ACCENT_COLORS,
  type AvatarPreset,
  type AccentColor,
} from '@/lib/families/avatar-presets'

export const dynamic = 'force-dynamic'

/**
 * Children page — guardian-managed child profiles (FAM-03, D-09 through D-12).
 *
 * Shows active child profiles with their Sylvan avatar and accent color.
 * Provides a form to create new child profiles with explicit consent checkbox.
 * Each child has a deactivation action.
 */
export default async function FamilyChildrenPage() {
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

  // Get the guardian's family membership
  const [membership] = await db
    .select({
      familyId: schema.familyMemberships.familyId,
      role: schema.familyMemberships.role,
    })
    .from(schema.familyMemberships)
    .where(eq(schema.familyMemberships.identityId, kredsIdentityId))
    .limit(1)

  if (!membership) {
    redirect('/family/onboarding')
  }

  const familyId = membership.familyId

  // Fetch active child profiles
  const children = await listActiveChildProfiles(familyId)

  // Fetch family info for display
  const [family] = await db
    .select({ name: schema.families.name })
    .from(schema.families)
    .where(eq(schema.families.id, familyId))
    .limit(1)

  const avatarOptions: [AvatarPreset, string][] = Object.entries(AVATAR_PRESETS) as [AvatarPreset, string][]
  const accentOptions: [AccentColor, string][] = Object.entries(ACCENT_COLORS) as [AccentColor, string][]

  return (
    <main>
      <h1>{family?.name ?? 'Family'} — Children</h1>
      <nav>
        <Link href="/">Home</Link>
        {' | '}
        <Link href="/api/auth/signout">Sign out</Link>
      </nav>

      {/* Create child profile form */}
      <section>
        <h2>Add a Child</h2>
        <p>Create a profile for each child. All information stays within your family account.</p>

        <form action="/api/families/children" method="POST">
          <div>
            <label htmlFor="displayName">Display Name</label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              required
              placeholder="e.g., Lucas"
              minLength={1}
            />
          </div>

          <div>
            <label htmlFor="ageYears">Age (years)</label>
            <input
              id="ageYears"
              name="ageYears"
              type="number"
              required
              min={0}
              max={120}
              placeholder="e.g., 8"
            />
            <small>Only age in years is stored — not full date of birth.</small>
          </div>

          <div>
            <label htmlFor="avatarPreset">Avatar</label>
            <select id="avatarPreset" name="avatarPreset" required>
              <option value="">Choose an avatar</option>
              {avatarOptions.map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="accentColor">Accent Color</label>
            <select id="accentColor" name="accentColor" required>
              <option value="">Choose a color</option>
              {accentOptions.map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>
              <input type="checkbox" name="consentGiven" value="true" required />
              I confirm that I am the parent or legal guardian of this child and consent to creating
              this profile in Kreds. I understand the profile contains a display name, age in years,
              avatar, and accent color only.
            </label>
          </div>

          <button type="submit">Add Child</button>
        </form>
      </section>

      {/* Active children list */}
      <section>
        <h2>Active Children ({children.length})</h2>
        {children.length === 0 ? (
          <p>No children added yet. Use the form above to add your first child.</p>
        ) : (
          <ul>
            {children.map((child) => (
              <li key={child.id}>
                <strong>{child.displayName}</strong> — Age {child.ageYears}
                <br />
                Avatar: {child.avatarPreset} | Color: {child.accentColor}
                <form
                  action="/api/families/children/deactivate"
                  method="POST"
                  style={{ display: 'inline' }}
                >
                  <input type="hidden" name="childProfileId" value={child.id} />
                  <button type="submit" style={{ color: 'red' }}>
                    Deactivate
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
