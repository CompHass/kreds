import { redirect } from 'next/navigation'
import { auth } from '../../../../auth'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireAuthenticatedIdentity, resolveKredsIdentityId } from '@/lib/auth/authorization'
import { getTimezoneOptions } from '@/lib/families/timezones'
import OnboardingForm from './OnboardingForm'

export const dynamic = 'force-dynamic'

/**
 * Family onboarding page — Sylvan style.
 *
 * Per D-01: authenticated guardian with no Kreds family creates the family tenant before child data.
 * Per D-03: family name and canonical IANA timezone with readable locality display.
 * Per D-04: successful family creation redirects to /family/children.
 * Per D-24: same Sylvan style as landing page.
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
    redirect('/family/children')
  }

  const timezoneOptions = getTimezoneOptions()

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '32px',
      }}>
        {/* Firstfruits symbol */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '28px',
          display: 'grid',
          placeItems: 'center',
          fontSize: '40px',
          background: 'radial-gradient(circle, #fff3b8, #d2a501 58%, #8b6a08)',
          boxShadow: '0 18px 38px rgba(210,165,1,.24), inset 0 3px 0 rgba(255,255,255,.46)',
        }}>
          🧺
        </div>

        {/* Heading */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontFamily: 'var(--font-heading, "Plus Jakarta Sans", system-ui, sans-serif)',
            fontWeight: 800,
            fontSize: '2rem',
            letterSpacing: '-0.025em',
            color: 'var(--color-primary, #154212)',
            margin: '0 0 8px',
          }}>
            Crie sua família
          </h1>
          <p style={{
            fontSize: '1rem',
            color: 'var(--color-text-muted, #42493e)',
            margin: 0,
            lineHeight: 1.5,
          }}>
            Configure sua conta familiar para começar a ensinar mordomia.
          </p>
        </div>

        {/* Glass card with form */}
        <div style={{
          width: '100%',
          background: 'var(--color-card, rgba(255,255,255,0.64))',
          border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
          borderRadius: 'var(--radius-xl, 36px)',
          boxShadow: 'var(--shadow-soft, 0 18px 55px rgba(45,90,39,0.1))',
          backdropFilter: 'blur(22px)',
          padding: '32px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}>
          <OnboardingForm timezoneOptions={timezoneOptions} />
        </div>

        <p style={{
          fontSize: '0.8125rem',
          color: 'var(--color-text-soft, #72796e)',
          margin: 0,
          textAlign: 'center',
        }}>
          Você poderá adicionar filhos após criar a família.
        </p>
      </div>
    </main>
  )
}
