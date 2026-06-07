import Link from 'next/link'
import { auth } from '../../auth'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const session = await auth()

  // Not authenticated — public landing
  if (!session?.user?.id) {
    return (
      <main>
        <h1>Kreds</h1>
        <p>Christian stewardship and allowance management for families.</p>
        <Link href="/api/auth/signin">Sign in with ZITADEL</Link>
      </main>
    )
  }

  // Authenticated — check for existing family membership
  const memberships = await db
    .select({
      familyId: schema.familyMemberships.familyId,
      role: schema.familyMemberships.role,
    })
    .from(schema.familyMemberships)
    .where(eq(schema.familyMemberships.identityId, session.user.id))
    .limit(1)

  if (memberships.length === 0) {
    // Authenticated but no family — show onboarding CTA
    return (
      <main>
        <h1>Welcome to Kreds</h1>
        <p>You're signed in. Let's set up your family to get started.</p>
        <Link href="/family/onboarding">Create Your Family</Link>
      </main>
    )
  }

  const membership = memberships[0]

  // Query the family
  const families = await db
    .select({
      id: schema.families.id,
      name: schema.families.name,
      timezone: schema.families.timezone,
    })
    .from(schema.families)
    .where(eq(schema.families.id, membership.familyId))
    .limit(1)

  if (families.length === 0) {
    return (
      <main>
        <h1>Kreds</h1>
        <p>Family not found. Please contact support.</p>
      </main>
    )
  }

  const family = families[0]

  // Authenticated with active family
  return (
    <main>
      <h1>{family.name}</h1>
      <p>Welcome back, {membership.role}.</p>
      <nav>
        <ul>
          <li><Link href="/family/children">Children</Link></li>
          <li><Link href="/api/auth/signout">Sign out</Link></li>
        </ul>
      </nav>
    </main>
  )
}
