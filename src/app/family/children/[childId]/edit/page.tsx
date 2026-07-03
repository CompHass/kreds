import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '../../../../../../auth'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuthenticatedIdentity, resolveKredsIdentityId } from '@/lib/auth/authorization'
import { AVATAR_PRESETS, ACCENT_COLORS, type AvatarPreset, type AccentColor } from '@/lib/families/avatar-presets'
import EditChildForm from './EditChildForm'

export default async function EditChildPage({
  params,
}: {
  params: Promise<{ childId: string }>
}) {
  const { childId } = await params

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

  const [child] = await db
    .select({
      id: schema.childProfiles.id,
      displayName: schema.childProfiles.displayName,
      ageYears: schema.childProfiles.ageYears,
      avatarPreset: schema.childProfiles.avatarPreset,
      accentColor: schema.childProfiles.accentColor,
      active: schema.childProfiles.active,
    })
    .from(schema.childProfiles)
    .where(
      and(
        eq(schema.childProfiles.id, childId),
        eq(schema.childProfiles.familyId, membership.familyId),
      ),
    )
    .limit(1)

  if (!child || !child.active) {
    redirect('/family/children')
  }

  const avatarOptions = (Object.entries(AVATAR_PRESETS) as [AvatarPreset, string][]).map(
    ([key, label]) => ({ key, label }),
  )
  const accentOptions = (Object.entries(ACCENT_COLORS) as [AccentColor, string][]).map(
    ([key, label]) => ({ key, label }),
  )

  return (
    <main style={{
      minHeight: '100vh',
      padding: '32px 24px 64px',
      maxWidth: '480px',
      margin: '0 auto',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '32px',
      }}>
        <h1 style={{
          fontFamily: 'var(--font-heading, "Plus Jakarta Sans", system-ui, sans-serif)',
          fontWeight: 800,
          fontSize: '1.25rem',
          letterSpacing: '-0.02em',
          color: 'var(--color-primary, #154212)',
          margin: 0,
        }}>
          Editar filho
        </h1>
        <Link
          href="/family/children"
          style={{
            fontSize: '0.8125rem',
            color: 'var(--color-text-soft, #72796e)',
            textDecoration: 'none',
            padding: '8px 14px',
            borderRadius: '99px',
            border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
            fontWeight: 600,
          }}
        >
          Cancelar
        </Link>
      </div>

      <div style={{
        background: 'var(--color-card, rgba(255,255,255,0.64))',
        border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
        borderRadius: 'var(--radius-xl, 36px)',
        boxShadow: 'var(--shadow-soft, 0 18px 55px rgba(45,90,39,0.1))',
        backdropFilter: 'blur(22px)',
        padding: '28px 24px',
      }}>
        <EditChildForm
          childProfileId={child.id}
          initialDisplayName={child.displayName}
          initialAgeYears={child.ageYears}
          initialAvatarPreset={child.avatarPreset}
          initialAccentColor={child.accentColor}
          avatarOptions={avatarOptions}
          accentOptions={accentOptions}
        />
      </div>
    </main>
  )
}
