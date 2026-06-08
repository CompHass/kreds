import { and, asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import ChildAccessForm from './ChildAccessForm'

export const dynamic = 'force-dynamic'

export default async function FamilyChildAccessPage({
  params,
}: {
  params: Promise<{ familyId: string }>
}) {
  const { familyId } = await params

  const [family] = await db
    .select({ name: schema.families.name })
    .from(schema.families)
    .where(eq(schema.families.id, familyId))
    .limit(1)

  if (!family) {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ color: 'var(--color-primary, #154212)' }}>Family not found.</h1>
        </div>
      </main>
    )
  }

  const activeProfiles = await db
    .select({
      id: schema.childProfiles.id,
      displayName: schema.childProfiles.displayName,
      avatarPreset: schema.childProfiles.avatarPreset,
      accentColor: schema.childProfiles.accentColor,
    })
    .from(schema.childProfiles)
    .where(
      and(
        eq(schema.childProfiles.familyId, familyId),
        eq(schema.childProfiles.active, true),
      ),
    )
    .orderBy(asc(schema.childProfiles.displayName))

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '40px 20px 64px',
        maxWidth: '520px',
        margin: '0 auto',
        display: 'grid',
        gap: '24px',
      }}
    >
      <section
        style={{
          background: 'var(--color-card, rgba(255,255,255,0.64))',
          border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
          borderRadius: '24px',
          boxShadow: 'var(--shadow-soft, 0 12px 32px rgba(45,90,39,0.10))',
          backdropFilter: 'blur(12px)',
          padding: '28px 22px',
          display: 'grid',
          gap: '24px',
        }}
      >
        <header style={{ display: 'grid', gap: '10px', justifyItems: 'center', textAlign: 'center' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '20px',
              display: 'grid',
              placeItems: 'center',
              fontSize: '28px',
              background: 'radial-gradient(circle, #fff3b8, #d2a501 58%, #8b6a08)',
            }}
          >
            🧺
          </div>
          <div style={{ display: 'grid', gap: '4px' }}>
            <h1
              style={{
                margin: 0,
                color: 'var(--color-primary, #154212)',
                fontFamily: 'var(--font-heading, "Plus Jakarta Sans", system-ui, sans-serif)',
                fontWeight: 800,
                letterSpacing: '-0.02em',
              }}
            >
              {family.name}
            </h1>
            <p style={{ margin: 0, color: 'var(--color-text-soft, #72796e)' }}>Select your profile</p>
          </div>
        </header>

        {activeProfiles.length === 0 ? (
          <p style={{ margin: 0, textAlign: 'center', color: 'var(--color-text-soft, #72796e)' }}>
            No active profiles found.
          </p>
        ) : (
          <ChildAccessForm familyId={familyId} profiles={activeProfiles} />
        )}
      </section>
    </main>
  )
}
