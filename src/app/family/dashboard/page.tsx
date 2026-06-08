import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { auth } from '../../../../auth'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuthenticatedIdentity, resolveKredsIdentityId } from '@/lib/auth/authorization'
import { getActiveTasksForFamily } from '@/lib/db/tasks/queries'
import { BottomNav } from '@/components/BottomNav'

export const dynamic = 'force-dynamic'

const GROWTH_STAGES = [
  { label: 'Semente Plantada', color: '#8B5A2B', bgColor: '#f8efe6', borderColor: '#e8d5c4', icon: '🌱', barWidth: '10%' },
  { label: 'Brotando', color: '#2d5a27', bgColor: 'rgba(161,212,148,0.3)', borderColor: 'rgba(161,212,148,0.8)', icon: '🌿', barWidth: '50%' },
  { label: 'Árvore Forte', color: '#4c6700', bgColor: 'rgba(202,236,125,0.4)', borderColor: 'rgba(178,210,102,0.8)', icon: '🌳', barWidth: '90%' },
]

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
    .where(
      and(
        eq(schema.familyMemberships.identityId, kredsIdentityId),
        eq(schema.familyMemberships.status, 'active'),
      ),
    )
    .limit(1)

  if (!membership) redirect('/family/onboarding')

  const [family] = await db
    .select({ name: schema.families.name })
    .from(schema.families)
    .where(eq(schema.families.id, membership.familyId))
    .limit(1)

  const tasks = await getActiveTasksForFamily(membership.familyId)
  const previewTasks = tasks.slice(0, 3)

  const familyName = family?.name ?? 'Família'

  return (
    <>
      {/* Fixed TopAppBar */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        background: 'rgba(255,248,245,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(45,90,39,0.1)',
        boxShadow: '0 1px 8px rgba(45,90,39,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
      }}>
        {/* Avatar + Greeting */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '9999px',
            background: 'linear-gradient(135deg, #a1d494, #2d5a27)',
            border: '2px solid rgba(161,212,148,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            flexShrink: 0,
          }}>
            🌿
          </div>
          <h1 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--color-primary)',
            lineHeight: 1.2,
            maxWidth: '180px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            Olá, {familyName}!
          </h1>
        </div>

        {/* Kreds counter */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(45,90,39,0.15)',
          borderRadius: '9999px',
          padding: '6px 14px',
        }}>
          <span style={{ fontSize: '16px' }}>🪙</span>
          <span style={{ fontSize: '17px', fontWeight: 700, color: '#755b00' }}>
            {tasks.length * 10}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        paddingTop: '74px',
        paddingBottom: '100px',
        maxWidth: '640px',
        margin: '0 auto',
        padding: '74px 20px 100px',
      }}>

        {/* Hero Garden Canvas */}
        <section style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '4/3',
          borderRadius: '2.5rem',
          overflow: 'hidden',
          boxShadow: '0 16px 48px rgba(45,90,39,0.18)',
          border: '1px solid rgba(255,255,255,0.5)',
          marginTop: '16px',
          marginBottom: '32px',
        }}>
          {/* Gradient background */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, #e8f4e5 0%, #cbe4c5 100%)',
          }} />

          {/* Isometric garden image */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Image
              src="/garden-isometric.png"
              alt="Jardim isométrico"
              width={480}
              height={360}
              style={{ objectFit: 'contain', width: '100%', height: '100%' }}
              priority
            />
          </div>

          {/* Overlay text */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '24px',
            right: '24px',
          }}>
            <h2 style={{
              margin: 0,
              fontSize: '28px',
              fontWeight: 800,
              color: '#154212',
              textShadow: '0 2px 8px rgba(255,255,255,0.6)',
              lineHeight: 1.2,
            }}>
              Meu Jardim
            </h2>
            <p style={{
              margin: '8px 0 0',
              fontSize: '13px',
              lineHeight: 1.5,
              color: '#2d5a27',
              background: 'rgba(255,255,255,0.5)',
              backdropFilter: 'blur(8px)',
              borderRadius: '12px',
              padding: '8px 12px',
              maxWidth: '260px',
            }}>
              {tasks.length > 0
                ? `Você tem ${tasks.length} ${tasks.length === 1 ? 'missão ativa' : 'missões ativas'} crescendo. Continue cuidando!`
                : 'Sua família está pronta. Plante novas missões para começar!'}
            </p>
          </div>

          {/* Weekly progress badge */}
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '24px',
          }}>
            <Link
              href="/family/tasks/current"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255,255,255,0.75)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(45,90,39,0.2)',
                borderRadius: '9999px',
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: 700,
                color: '#154212',
                textDecoration: 'none',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              📊 Progresso Semanal
            </Link>
          </div>
        </section>

        {/* Missões Ativas */}
        <section>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            padding: '0 4px',
          }}>
            <h3 style={{
              margin: 0,
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--color-primary-strong)',
            }}>
              Missões Ativas
            </h3>
            <Link
              href="/family/tasks/current"
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--color-primary)',
                textDecoration: 'none',
                letterSpacing: '0.02em',
              }}
            >
              Ver todos
            </Link>
          </div>

          {previewTasks.length === 0 ? (
            <div style={{
              background: 'rgba(255,255,255,0.6)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.4)',
              borderRadius: '1.5rem',
              padding: '32px 24px',
              textAlign: 'center',
              color: 'var(--color-text-soft)',
            }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🌱</div>
              <p style={{ margin: 0, fontSize: '15px' }}>Nenhuma missão ativa ainda.</p>
              <p style={{ margin: '4px 0 0', fontSize: '13px' }}>Plante a primeira missão!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {previewTasks.map((task, idx) => {
                const stage = GROWTH_STAGES[idx % GROWTH_STAGES.length]
                return (
                  <div
                    key={task.id}
                    style={{
                      background: 'rgba(255,255,255,0.6)',
                      backdropFilter: 'blur(24px)',
                      WebkitBackdropFilter: 'blur(24px)',
                      border: '1px solid rgba(255,255,255,0.4)',
                      boxShadow: '0 4px 16px rgba(45,90,39,0.06)',
                      borderRadius: '1.5rem',
                      padding: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                    }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '16px',
                      background: stage.bgColor,
                      border: `1px solid ${stage.borderColor}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '28px',
                      flexShrink: 0,
                    }}>
                      {stage.icon}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{
                        margin: '0 0 4px',
                        fontSize: '17px',
                        fontWeight: 700,
                        color: 'var(--color-text)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {task.title}
                      </h4>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '10px',
                      }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '9999px',
                          background: stage.color,
                        }} />
                        <span style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: stage.color,
                          letterSpacing: '0.04em',
                        }}>
                          {stage.label}
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div style={{
                        width: '100%',
                        height: '6px',
                        background: 'rgba(45,90,39,0.1)',
                        borderRadius: '9999px',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          width: stage.barWidth,
                          height: '100%',
                          background: stage.color,
                          borderRadius: '9999px',
                        }} />
                      </div>
                    </div>

                    {/* Kreds badge */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px',
                      flexShrink: 0,
                    }}>
                      <span style={{ fontSize: '16px' }}>🪙</span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#755b00' }}>
                        {task.kredsValue}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section style={{ marginTop: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link
              href="/family/children"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                background: 'rgba(255,255,255,0.6)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.4)',
                borderRadius: '16px',
                textDecoration: 'none',
                color: 'var(--color-text)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>👨‍👩‍👧‍👦</span>
                <span style={{ fontWeight: 600, fontSize: '15px' }}>Gerenciar filhos</span>
              </div>
              <span style={{ color: 'var(--color-text-soft)', fontSize: '18px' }}>›</span>
            </Link>

            <Link
              href="/family/invitations"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                background: 'rgba(255,255,255,0.6)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.4)',
                borderRadius: '16px',
                textDecoration: 'none',
                color: 'var(--color-text)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>🛡️</span>
                <span style={{ fontWeight: 600, fontSize: '15px' }}>Gerenciar guardiões</span>
              </div>
              <span style={{ color: 'var(--color-text-soft)', fontSize: '18px' }}>›</span>
            </Link>

            <Link
              href="/family/audit"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                background: 'rgba(255,255,255,0.6)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.4)',
                borderRadius: '16px',
                textDecoration: 'none',
                color: 'var(--color-text)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>📋</span>
                <span style={{ fontWeight: 600, fontSize: '15px' }}>Trilha de auditoria</span>
              </div>
              <span style={{ color: 'var(--color-text-soft)', fontSize: '18px' }}>›</span>
            </Link>
          </div>
        </section>
      </main>

      {/* Floating Action Button */}
      <Link
        href="/family/tasks"
        style={{
          position: 'fixed',
          bottom: '90px',
          right: '20px',
          zIndex: 40,
          width: '56px',
          height: '56px',
          borderRadius: '18px',
          background: 'linear-gradient(135deg, #a1d494 0%, #2d5a27 100%)',
          boxShadow: '0 8px 20px rgba(45,90,39,0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '26px',
          textDecoration: 'none',
          color: '#fff',
          fontWeight: 700,
          border: 'none',
        }}
        aria-label="Plantar nova missão"
      >
        +
      </Link>

      <BottomNav active="jardim" />
    </>
  )
}
