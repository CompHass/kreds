import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '../../../../../auth'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuthenticatedIdentity, resolveKredsIdentityId } from '@/lib/auth/authorization'
import { getActiveTasksForFamily } from '@/lib/db/tasks/queries'
import { getCycleForDate } from '@/modules/activity/cycle'

export const dynamic = 'force-dynamic'

/**
 * FamilyTasksCurrentPage — SSR server component showing the current cycle's active tasks.
 *
 * - Computes current Sunday-Saturday cycle using getCycleForDate (D-03, D-04, D-05)
 * - Shows only active tasks for active children
 * - Exports getCycleForDate for Phase 5 consumption (D-05)
 *
 * Auth: redirects to /api/auth/signin if unauthenticated, /family/onboarding if no family.
 */
export default async function FamilyTasksCurrentPage() {
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
        eq(schema.familyMemberships.role, 'guardian'),
        eq(schema.familyMemberships.status, 'active'),
      ),
    )
    .limit(1)

  if (!membership) redirect('/family/onboarding')

  const familyId = membership.familyId

  // Get family timezone for cycle computation (D-03, D-04)
  const [family] = await db
    .select({ timezone: schema.families.timezone })
    .from(schema.families)
    .where(eq(schema.families.id, familyId))
    .limit(1)

  const timezone = family?.timezone ?? 'America/Sao_Paulo'
  const { cycleStart, cycleEnd } = getCycleForDate(new Date(), timezone)

  // Format cycle boundaries for display in the family timezone
  const formatDate = (d: Date) =>
    new Intl.DateTimeFormat('pt-BR', {
      timeZone: timezone,
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d)

  const tasks = await getActiveTasksForFamily(familyId)

  // Group tasks by child
  const tasksByChild = tasks.reduce<Record<string, typeof tasks>>(
    (acc, task) => {
      const key = task.assignedChildId
      if (!acc[key]) acc[key] = []
      acc[key].push(task)
      return acc
    },
    {},
  )

  return (
    <main style={{
      minHeight: '100vh',
      padding: '32px 24px 64px',
      maxWidth: '520px',
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '32px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '16px',
            display: 'grid',
            placeItems: 'center',
            fontSize: '24px',
            background: 'radial-gradient(circle, #e8f5e9, #3b6934 58%, #154212)',
            boxShadow: '0 8px 20px rgba(59,105,52,.2)',
            flexShrink: 0,
          }}>
            🗓
          </div>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-heading, "Plus Jakarta Sans", system-ui, sans-serif)',
              fontWeight: 800,
              fontSize: '1.25rem',
              letterSpacing: '-0.02em',
              color: 'var(--color-primary, #154212)',
              margin: 0,
            }}>
              Ciclo Atual
            </h1>
            <p style={{
              fontSize: '0.8125rem',
              color: 'var(--color-text-soft, #72796e)',
              margin: 0,
            }}>
              {formatDate(cycleStart)} — {formatDate(cycleEnd)}
            </p>
          </div>
        </div>

        <Link
          href="/family/tasks"
          style={{
            fontSize: '0.8125rem',
            color: 'var(--color-text-soft, #72796e)',
            textDecoration: 'none',
            padding: '8px 14px',
            borderRadius: '99px',
            border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
          }}
        >
          Todas as tarefas
        </Link>
      </div>

      {/* Task list grouped by child */}
      {Object.keys(tasksByChild).length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '32px 24px',
          background: 'var(--color-card, rgba(255,255,255,0.64))',
          borderRadius: '20px',
          border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
        }}>
          <p style={{
            fontSize: '0.95rem',
            color: 'var(--color-text-soft, #72796e)',
            margin: '0 0 16px',
          }}>
            Nenhuma tarefa ativa para esta semana.
          </p>
          <Link
            href="/family/tasks"
            style={{
              fontSize: '0.875rem',
              color: 'var(--color-primary, #154212)',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Criar tarefas
          </Link>
        </div>
      ) : (
        Object.entries(tasksByChild).map(([, childTasks]) => {
          const childName = 'childName' in childTasks[0] ? childTasks[0].childName : 'Filho'
          return (
            <div key={childTasks[0].assignedChildId} style={{ marginBottom: '24px' }}>
              <p style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--color-text-muted, #42493e)',
                margin: '0 0 8px',
              }}>
                {childName} ({childTasks.length} {childTasks.length === 1 ? 'tarefa' : 'tarefas'})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {childTasks.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      padding: '14px 18px',
                      background: 'var(--color-card, rgba(255,255,255,0.64))',
                      border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
                      borderRadius: '16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <p style={{
                        fontWeight: 600,
                        fontSize: '0.9375rem',
                        color: 'var(--color-primary, #154212)',
                        margin: '0 0 2px',
                      }}>
                        {task.title}
                      </p>
                      {'description' in task && task.description && (
                        <p style={{
                          fontSize: '0.8125rem',
                          color: 'var(--color-text-soft, #72796e)',
                          margin: 0,
                        }}>
                          {task.description}
                        </p>
                      )}
                    </div>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      color: 'var(--color-success, #3b6934)',
                      background: 'rgba(59,105,52,0.08)',
                      borderRadius: '99px',
                      padding: '4px 12px',
                      whiteSpace: 'nowrap',
                    }}>
                      {task.kredsValue} Kreds
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })
      )}

      {/* Biblical verse */}
      <div style={{
        marginTop: '32px',
        padding: '20px 24px',
        background: 'rgba(210,165,1,0.06)',
        borderRadius: '16px',
        borderLeft: '3px solid rgba(210,165,1,0.4)',
      }}>
        <p style={{
          fontSize: '0.875rem',
          color: 'var(--color-text-soft, #72796e)',
          fontStyle: 'italic',
          margin: 0,
          lineHeight: 1.6,
        }}>
          &ldquo;E tudo o que fizerdes, fazei-o de todo o coração, como ao Senhor, e não aos
          homens.&rdquo; — Colossenses 3:23
        </p>
      </div>
    </main>
  )
}
