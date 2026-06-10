import { requireChildSession } from '@/lib/auth/child-guard'
import { getBalance } from '@/modules/ledger/queries'
import { listGoals } from '@/modules/goals/queries'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import GoalCard from '@/components/GoalCard'
import { ChildBottomNav } from '@/components/ChildBottomNav'

type ChildDreamsPageProps = {
  params: Promise<{ childId: string }>
}

export const dynamic = 'force-dynamic'

export default async function ChildDreamsPage({ params }: ChildDreamsPageProps) {
  const { childId } = await params
  const session = await requireChildSession()

  if (session.childProfileId !== childId) {
    redirect(`/child/${session.childProfileId}/dreams`)
  }

  const [available, goals] = await Promise.all([
    getBalance(session.childProfileId, 'available'),
    listGoals(session.childProfileId, session.familyId),
  ])

  const activeGoals = goals.filter((g) => g.status === 'active')
  const achievedGoals = goals.filter((g) => g.status === 'achieved')
  const totalAllocated = goals.reduce((sum, g) => sum + g.allocatedAmount, 0)

  return (
    <>
      {/* Fixed TopAppBar */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: 'rgba(255,248,245,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(194,201,187,0.2)',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '9999px',
          overflow: 'hidden',
          background: 'rgba(255,241,233,0.9)',
          border: '2px solid rgba(188,240,174,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
        }}>
          🌿
        </div>
        <h1 style={{
          margin: 0,
          fontSize: '20px',
          fontWeight: 700,
          color: '#154212',
        }}>
          Kreds
        </h1>
        <Link
          href={`/child/${childId}/dashboard`}
          style={{
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '9999px',
            color: '#154212',
            textDecoration: 'none',
            fontSize: '18px',
          }}
        >
          🏠
        </Link>
      </header>

      {/* Atmospheric background */}
      <div style={{
        position: 'fixed',
        zIndex: -1,
        width: '300px',
        height: '300px',
        borderRadius: '9999px',
        background: 'rgba(161,212,148,0.4)',
        filter: 'blur(40px)',
        top: '-100px',
        left: '-100px',
        opacity: 0.4,
      }} />
      <div style={{
        position: 'fixed',
        zIndex: -1,
        width: '250px',
        height: '250px',
        borderRadius: '9999px',
        background: 'rgba(255,223,144,0.4)',
        filter: 'blur(40px)',
        bottom: '100px',
        right: '-50px',
        opacity: 0.4,
      }} />

      <main style={{
        padding: '96px 24px 100px',
        maxWidth: '480px',
        margin: '0 auto',
      }}>

        {/* Page Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{
            margin: '0 0 8px',
            fontSize: '40px',
            fontWeight: 700,
            color: '#2d5a27',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}>
            Meus Sonhos
          </h2>
          <p style={{
            margin: 0,
            fontSize: '16px',
            color: '#42493e',
            lineHeight: 1.5,
          }}>
            Cultivando o seu futuro
          </p>
        </div>

        {/* Hero Glass Card: Total Allocated */}
        <div style={{
          background: 'rgba(255,255,255,0.4)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '0.5px solid rgba(45,90,39,0.1)',
          boxShadow: '0 8px 32px rgba(45,90,39,0.05)',
          borderRadius: '28px',
          padding: '24px',
          marginBottom: '24px',
        }}>
          <div style={{ marginBottom: '16px' }}>
            <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#72796e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Alocado
            </p>
            <p style={{ margin: 0, fontSize: '32px', fontWeight: 800, color: '#2d5a27' }}>
              {totalAllocated}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#72796e' }}>
              Disponível: {available} Kreds
            </p>
          </div>
        </div>

        {/* Active Goals Section */}
        {activeGoals.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: '#2d5a27' }}>
              Plantando Sonhos
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activeGoals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} childId={childId} availableBalance={available} />
              ))}
            </div>
          </div>
        )}

        {/* Achieved Goals Section */}
        {achievedGoals.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: '#2d5a27' }}>
              Conquistados 🏆
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {achievedGoals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} childId={childId} availableBalance={available} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {activeGoals.length === 0 && achievedGoals.length === 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.4)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '0.5px solid rgba(45,90,39,0.1)',
            boxShadow: '0 8px 32px rgba(45,90,39,0.05)',
            borderRadius: '28px',
            padding: '48px 24px',
            textAlign: 'center',
            marginBottom: '24px',
          }}>
            <p style={{ margin: '0 0 8px', fontSize: '32px' }}>🌱</p>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#2d5a27' }}>
              Nenhum sonho plantado ainda
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#72796e' }}>
              Crie seu primeiro sonho para começar a cultivar!
            </p>
          </div>
        )}

        {/* New Dream Button */}
        <Link
          href={`/child/${childId}/new-goal`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '14px 24px',
            borderRadius: '9999px',
            background: 'rgba(59,105,52,0.12)',
            border: '1px solid rgba(59,105,52,0.3)',
            color: '#3b6934',
            fontWeight: 700,
            fontSize: '14px',
            textDecoration: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          ✨ Plantar Novo Sonho
        </Link>

      </main>

      <ChildBottomNav active="sonhos" childId={childId} />
    </>
  )
}
