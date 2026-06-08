import { requireChildInFamily, requireCurrentFamilyContext } from '@/lib/auth/family-context'
import { getBalance } from '@/modules/ledger/queries'
import { listGoals } from '@/modules/goals/queries'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import GoalCard from './GoalCard'

type ChildBalancePageProps = {
  params: Promise<{ childId: string }>
}

export default async function ChildBalancePage({ params }: ChildBalancePageProps) {
  const { childId } = await params

  let familyId: string
  try {
    const ctx = await requireCurrentFamilyContext()
    familyId = ctx.familyId
    await requireChildInFamily(childId, familyId)
  } catch {
    redirect('/api/auth/signin')
  }

  const [available, firstfruits, goals] = await Promise.all([
    getBalance(childId, 'available'),
    getBalance(childId, 'firstfruits'),
    listGoals(childId, familyId),
  ])

  const totalSaved = available + firstfruits
  const activeGoals = goals.filter((g) => g.status === 'active')
  const achievedGoals = goals.filter((g) => g.status === 'achieved')

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
          href="/family/dashboard"
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
          ⚙️
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
            Cultivando o seu futuro, uma semente de cada vez.
          </p>
        </div>

        {/* Hero Glass Card: Total Saved */}
        <div style={{
          background: 'rgba(255,255,255,0.4)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '0.5px solid rgba(45,90,39,0.1)',
          boxShadow: '0 8px 32px rgba(45,90,39,0.05)',
          borderRadius: '32px',
          padding: '32px 24px',
          textAlign: 'center',
          marginBottom: '40px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top right, rgba(255,255,255,0.4), transparent)',
            pointerEvents: 'none',
          }} />
          <p style={{
            margin: '0 0 8px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#42493e',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}>
            Total Guardado
          </p>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50% 50% 30% 70% / 60% 30% 70% 40%',
              background: 'rgba(210,165,1,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.05)',
            }}>
              🌿
            </div>
            <h3 style={{
              margin: 0,
              fontSize: '40px',
              fontWeight: 700,
              color: '#154212',
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}>
              {totalSaved}{' '}
              <span style={{ fontSize: '24px', color: '#72796e', fontWeight: 400 }}>
                Kreds
              </span>
            </h3>
          </div>
          {available !== totalSaved && (
            <p style={{ margin: '12px 0 0', fontSize: '13px', color: '#72796e' }}>
              {available} disponível · {firstfruits} primícias
            </p>
          )}
        </div>

        {/* Goals Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>

          {activeGoals.length === 0 && achievedGoals.length === 0 ? (
            <div style={{
              background: 'rgba(255,255,255,0.4)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '0.5px solid rgba(45,90,39,0.1)',
              borderRadius: '28px',
              padding: '40px 24px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🌱</div>
              <p style={{ margin: '0 0 4px', fontSize: '17px', fontWeight: 700, color: '#2d5a27' }}>
                Nenhum sonho plantado ainda
              </p>
              <p style={{ margin: 0, fontSize: '14px', color: '#72796e' }}>
                Plante seu primeiro sonho abaixo!
              </p>
            </div>
          ) : (
            <>
              {activeGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  childId={childId}
                  availableBalance={available}
                />
              ))}
              {achievedGoals.length > 0 && (
                <>
                  <p style={{
                    margin: '8px 0 0',
                    fontSize: '12px',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: '#72796e',
                  }}>
                    Conquistados 🏆
                  </p>
                  {achievedGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      childId={childId}
                      availableBalance={available}
                    />
                  ))}
                </>
              )}
            </>
          )}

          {/* Plant New Dream */}
          <Link href={`/child/${childId}/new-goal`} style={{ textDecoration: 'none' }}>
            <div style={{
              width: '100%',
              minHeight: '160px',
              borderRadius: '28px',
              border: '2px dashed rgba(161,212,148,0.6)',
              background: 'rgba(255,255,255,0.3)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              boxSizing: 'border-box',
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '9999px',
                background: 'rgba(202,236,125,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                color: '#506b03',
                boxShadow: '0 4px 12px rgba(45,90,39,0.1)',
              }}>
                +
              </div>
              <span style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#154212',
                letterSpacing: '0.04em',
              }}>
                Plantar Novo Sonho
              </span>
            </div>
          </Link>
        </div>

        {/* History link */}
        <div style={{ textAlign: 'center' }}>
          <Link href={`/child/${childId}/history`} style={{
            fontSize: '14px',
            color: '#154212',
            fontWeight: 600,
            textDecoration: 'none',
          }}>
            Ver histórico completo →
          </Link>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: 'rgba(255,241,233,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 -4px 20px rgba(45,90,39,0.08)',
        borderRadius: '20px 20px 0 0',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '10px 16px 20px',
      }}>
        <a href="/family/dashboard" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
          color: '#72796e', opacity: 0.7, textDecoration: 'none', fontSize: '10px', fontWeight: 700,
        }}>
          <span style={{ fontSize: '20px' }}>🌳</span>
          Forest
        </a>
        <a href="/family/tasks" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
          color: '#72796e', opacity: 0.7, textDecoration: 'none', fontSize: '10px', fontWeight: 700,
        }}>
          <span style={{ fontSize: '20px' }}>✅</span>
          Missions
        </a>
        <a href={`/child/${childId}/balance`} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
          background: 'rgba(202,236,125,0.5)', color: '#506b03',
          borderRadius: '9999px', padding: '6px 18px', textDecoration: 'none', fontSize: '10px', fontWeight: 700,
        }}>
          <span style={{ fontSize: '20px' }}>🌸</span>
          Sonhos
        </a>
        <a href={`/child/${childId}/profile`} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
          color: '#72796e', opacity: 0.7, textDecoration: 'none', fontSize: '10px', fontWeight: 700,
        }}>
          <span style={{ fontSize: '20px' }}>🌿</span>
          Legacy
        </a>
      </nav>
    </>
  )
}
