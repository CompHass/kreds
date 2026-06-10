import { redirect } from 'next/navigation'
import Link from 'next/link'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { requireChildSession } from '@/lib/auth/child-guard'
import { ChildBottomNav } from '@/components/ChildBottomNav'
import { getBalance } from '@/modules/ledger/queries'
import { getActiveTasksForFamily } from '@/lib/db/tasks/queries'

export const dynamic = 'force-dynamic'

const ACCENT_CSS: Record<string, string> = {
  moss: '#3b6934',
  gold: '#d2a501',
  sky: '#0369a1',
  berry: '#9333ea',
  clay: '#c2410c',
  sage: '#65a30d',
}

export default async function ChildDashboardPage({
  params,
}: {
  params: Promise<{ childId: string }>
}) {
  const { childId } = await params
  const session = await requireChildSession()

  // Verify scope: child can only access their own dashboard
  if (session.childProfileId !== childId) {
    redirect(`/child/${session.childProfileId}/dashboard`)
  }

  // Fetch child profile, balance, family timezone, and active tasks in parallel
  const [profile, balance, familyData, allTasks] = await Promise.all([
    db
      .select({
        displayName: schema.childProfiles.displayName,
        avatarPreset: schema.childProfiles.avatarPreset,
        accentColor: schema.childProfiles.accentColor,
      })
      .from(schema.childProfiles)
      .where(eq(schema.childProfiles.id, session.childProfileId))
      .limit(1),
    getBalance(session.childProfileId, 'available'),
    db
      .select({ timezone: schema.families.timezone })
      .from(schema.families)
      .innerJoin(
        schema.childProfiles,
        eq(schema.childProfiles.familyId, schema.families.id),
      )
      .where(eq(schema.childProfiles.id, session.childProfileId))
      .limit(1),
    getActiveTasksForFamily(session.familyId),
  ])

  if (!profile || !profile[0]) {
    redirect('/')
  }

  const profileData = profile[0]
  const accentColor = ACCENT_CSS[profileData.accentColor] ?? '#154212'
  const timezone = familyData[0]?.timezone ?? 'America/Sao_Paulo'

  // Filter tasks assigned to this child
  const tasksForThisChild = allTasks.filter(
    (task) => task.assignedChildId === session.childProfileId,
  )
  const taskCount = tasksForThisChild.length

  const taskMessage =
    taskCount === 0
      ? 'Nenhuma tarefa ativa'
      : taskCount === 1
        ? '1 tarefa ativa'
        : `${taskCount} tarefas ativas`

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '32px 24px 100px',
        maxWidth: '480px',
        margin: '0 auto',
        background: 'rgba(255,248,245,1)',
      }}
    >
      {/* Top bar: avatar initial + name + balance badge */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '16px',
              display: 'grid',
              placeItems: 'center',
              fontSize: '20px',
              fontWeight: 800,
              background: accentColor,
              color: '#fff',
              flexShrink: 0,
            }}
          >
            {profileData.displayName.charAt(0).toUpperCase()}
          </div>
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
            {profileData.displayName}
          </h1>
        </div>

        {/* Kreds balance badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'radial-gradient(circle, #fff3b8, #d2a501 58%, #8b6a08)',
            color: '#4c2e04',
            padding: '6px 16px',
            borderRadius: '9999px',
            fontWeight: 700,
            fontSize: '14px',
            boxShadow: '0 4px 12px rgba(210,165,1,0.2)',
          }}
        >
          <span>🪙</span>
          <span>{balance}</span>
        </div>
      </div>

      {/* Hero section: Garden image with overlay */}
      <section
        style={{
          marginBottom: '20px',
          borderRadius: '24px',
          overflow: 'hidden',
          aspectRatio: '4 / 3',
          background: 'linear-gradient(135deg, rgba(59,105,52,0.1), rgba(210,165,1,0.05))',
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'flex-start',
          backgroundImage: 'url(/garden-isometric.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          boxShadow: '0 4px 16px rgba(45,90,39,0.06)',
        }}
      >
        {/* Overlay content */}
        <div
          style={{
            padding: '20px',
            background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 100%)',
            width: '100%',
          }}
        >
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: '#fff',
              margin: '0 0 4px 0',
              textShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            Meu Jardim
          </h2>
          <p
            style={{
              fontSize: '0.9rem',
              color: 'rgba(255,255,255,0.9)',
              margin: 0,
              textShadow: '0 1px 4px rgba(0,0,0,0.2)',
            }}
          >
            {taskMessage}
          </p>
        </div>
      </section>

      {/* Quick links section */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <Link
          href={`/child/${childId}/tasks`}
          style={{
            padding: '20px',
            background: 'rgba(255,255,255,0.64)',
            border: '1px solid rgba(45,90,39,0.16)',
            borderRadius: '24px',
            boxShadow: '0 4px 16px rgba(45,90,39,0.06)',
            backdropFilter: 'blur(12px)',
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--color-primary, #154212)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.8)'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.64)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <span style={{ fontSize: '24px' }}>📋</span>
          <span style={{ fontWeight: 700, fontSize: '13px' }}>Minhas Tarefas</span>
        </Link>

        <Link
          href={`/child/${childId}/dreams`}
          style={{
            padding: '20px',
            background: 'rgba(255,255,255,0.64)',
            border: '1px solid rgba(45,90,39,0.16)',
            borderRadius: '24px',
            boxShadow: '0 4px 16px rgba(45,90,39,0.06)',
            backdropFilter: 'blur(12px)',
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--color-primary, #154212)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.8)'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.64)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <span style={{ fontSize: '24px' }}>✨</span>
          <span style={{ fontWeight: 700, fontSize: '13px' }}>Meus Sonhos</span>
        </Link>
      </section>

      {/* Bottom Nav */}
      <ChildBottomNav active="jardim" childId={childId} />
    </main>
  )
}
