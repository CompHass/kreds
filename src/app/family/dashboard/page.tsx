import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '../../../../auth'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireAuthenticatedIdentity, resolveKredsIdentityId } from '@/lib/auth/authorization'

export const dynamic = 'force-dynamic'

export default async function FamilyDashboardPage() {
  const session = await auth()

  let identity
  try {
    identity = requireAuthenticatedIdentity(session)
  } catch {
    redirect('/api/auth/signin')
  }

  let kredsIdentityId: string
  try {
    kredsIdentityId = await resolveKredsIdentityId(identity.zitadelSub)
  } catch {
    redirect('/family/onboarding')
  }

  const [membership] = await db
    .select({ familyId: schema.familyMemberships.familyId })
    .from(schema.familyMemberships)
    .where(eq(schema.familyMemberships.identityId, kredsIdentityId))
    .limit(1)

  if (!membership) redirect('/family/onboarding')

  const [family] = await db
    .select({ name: schema.families.name })
    .from(schema.families)
    .where(eq(schema.families.id, membership.familyId))
    .limit(1)

  return (
    <main style={{ minHeight: '100vh', maxWidth: '480px', margin: '0 auto', padding: '32px 24px 64px' }}>
      <div style={{
        background: 'var(--color-card, rgba(255,255,255,0.72))',
        border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
        borderRadius: '36px',
        boxShadow: 'var(--shadow-soft, 0 18px 55px rgba(45,90,39,0.1))',
        backdropFilter: 'blur(22px)',
        padding: '32px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
      }}>
        <p style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--color-text-muted, #42493e)',
          margin: 0,
        }}>
          Dashboard
        </p>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary, #154212)' }}>
          {family?.name ?? 'Sua família'}
        </h1>
        <p style={{ margin: 0, fontSize: '1rem', lineHeight: 1.5, color: 'var(--color-text-soft, #72796e)' }}>
          Sua família está pronta. A partir daqui você poderá acompanhar os filhos e continuar os próximos fluxos do Kreds.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link
            href="/family/children"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '52px',
              borderRadius: '9999px',
              background: 'linear-gradient(135deg, #3b6934, #154212)',
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 700,
            }}
          >
            Gerenciar filhos
          </Link>
        </div>
      </div>
    </main>
  )
}
