import { redirect } from 'next/navigation'
import Link from 'next/link'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { requireChildSession } from '@/lib/auth/child-guard'
import { AVATAR_PRESETS } from '@/lib/families/avatar-presets'

export const dynamic = 'force-dynamic'

const ACCENT_CSS: Record<string, string> = {
  moss: '#3b6934',
  gold: '#d2a501',
  sky: '#0369a1',
  berry: '#9333ea',
  clay: '#c2410c',
  sage: '#65a30d',
}

export default async function ChildHomePage() {
  const session = await requireChildSession()

  const [profile] = await db
    .select({
      displayName: schema.childProfiles.displayName,
      avatarPreset: schema.childProfiles.avatarPreset,
      accentColor: schema.childProfiles.accentColor,
    })
    .from(schema.childProfiles)
    .where(eq(schema.childProfiles.id, session.childProfileId))
    .limit(1)

  if (!profile) {
    redirect('/')
  }

  const accentColor = ACCENT_CSS[profile.accentColor] ?? '#154212'

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '32px 24px 64px',
        maxWidth: '480px',
        margin: '0 auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '16px',
            display: 'grid',
            placeItems: 'center',
            fontSize: '24px',
            background: 'radial-gradient(circle, #fff3b8, #d2a501 58%, #8b6a08)',
            boxShadow: '0 8px 20px rgba(210,165,1,.2)',
            flexShrink: 0,
          }}
        >
          🧺
        </div>
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-heading, "Plus Jakarta Sans", system-ui, sans-serif)',
              fontWeight: 800,
              fontSize: '1.4rem',
              letterSpacing: '-0.02em',
              color: 'var(--color-primary, #154212)',
              margin: 0,
            }}
          >
            {profile.displayName}
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-soft, #72796e)', margin: 0 }}>
            Welcome, {profile.displayName}!
          </p>
        </div>
      </div>

      <section
        style={{
          padding: '20px',
          background: 'var(--color-card, rgba(255,255,255,0.64))',
          border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
          borderRadius: '24px',
          boxShadow: '0 4px 16px rgba(45,90,39,0.06)',
          backdropFilter: 'blur(12px)',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '20px',
              display: 'grid',
              placeItems: 'center',
              background: accentColor,
              color: '#fff',
              fontWeight: 800,
              fontSize: '1.25rem',
            }}
          >
            {profile.displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary, #154212)', margin: 0 }}>
              {profile.displayName}
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-soft, #72796e)', margin: 0 }}>
              {AVATAR_PRESETS[profile.avatarPreset as keyof typeof AVATAR_PRESETS] ?? profile.avatarPreset}
            </p>
          </div>
        </div>
      </section>

      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          padding: '20px',
          background: 'var(--color-card, rgba(255,255,255,0.64))',
          border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
          borderRadius: '24px',
          boxShadow: '0 4px 16px rgba(45,90,39,0.06)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1rem', color: 'var(--color-primary, #154212)', margin: '0 0 4px' }}>My Kreds</h2>
          <Link href={`/child/${session.childProfileId}/balance`} style={{ color: accentColor, fontWeight: 600, textDecoration: 'none' }}>
            View my balance and history
          </Link>
        </div>
        <div>
          <h2 style={{ fontSize: '1rem', color: 'var(--color-primary, #154212)', margin: '0 0 4px' }}>My tasks</h2>
          <Link href={`/child/${session.childProfileId}/tasks`} style={{ color: accentColor, fontWeight: 600, textDecoration: 'none' }}>
            View my tasks
          </Link>
        </div>
        <form action="/api/child/logout" method="post" style={{ marginTop: '8px' }}>
          <button
            type="submit"
            style={{
              border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
              background: 'rgba(255,255,255,0.82)',
              color: 'var(--color-text-soft, #72796e)',
              borderRadius: '999px',
              padding: '10px 16px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </form>
      </section>
    </main>
  )
}
