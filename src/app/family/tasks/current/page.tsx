import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '../../../../../auth'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { requireAuthenticatedIdentity, resolveKredsIdentityId } from '@/lib/auth/authorization'
import { getCycleForDate } from '@/modules/activity/cycle'
import { getActiveTasksForFamily } from '@/lib/db/tasks/queries'
import { BottomNav } from '@/components/BottomNav'

export const dynamic = 'force-dynamic'

export default async function FamilyCurrentCyclePage() {
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

  // T-04-10: timezone is read from DB (server-side), never from the client request
  const [family] = await db
    .select({ timezone: schema.families.timezone })
    .from(schema.families)
    .where(eq(schema.families.id, familyId))
    .limit(1)

  const timezone = family?.timezone ?? 'UTC'

  // D-03: cycles computed dynamically via pure function — no activity_cycle table
  // D-04: Sunday is always Day 0
  const { cycleStart, cycleEnd } = getCycleForDate(new Date(), timezone)

  // T-04-11: getActiveTasksForFamily always filters by familyId from session
  const tasks = await getActiveTasksForFamily(familyId)

  const cycleStartStr = cycleStart.toISOString().split('T')[0]

  // Query completions for current cycle across all active tasks
  const taskIds = tasks.map((t) => t.id)
  const completions =
    taskIds.length > 0
      ? await db
          .select({
            taskTemplateId: schema.taskCompletions.taskTemplateId,
            childProfileId: schema.taskCompletions.childProfileId,
            status: schema.taskCompletions.status,
          })
          .from(schema.taskCompletions)
          .where(
            and(
              inArray(schema.taskCompletions.taskTemplateId, taskIds),
              eq(schema.taskCompletions.cycleStart, cycleStartStr),
            ),
          )
      : []

  // Build lookup: `${taskId}:${childId}` → 'completed' | 'pending'
  const completionMap = new Map(
    completions.map((c) => [`${c.taskTemplateId}:${c.childProfileId}`, c.status]),
  )

  // T-04-12: format dates with Intl using family timezone — never .toLocaleDateString() alone
  const formatCycleDate = (d: Date) =>
    new Intl.DateTimeFormat('pt-BR', {
      timeZone: timezone,
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
    }).format(d)

  // Group tasks by child
  const grouped = tasks.reduce<
    Record<string, { childName: string; childAvatarPreset: string; tasks: typeof tasks }>
  >((acc, task) => {
    const key = task.assignedChildId
    if (!acc[key]) {
      acc[key] = {
        childName: task.childName,
        childAvatarPreset: task.childAvatarPreset,
        tasks: [],
      }
    }
    acc[key].tasks.push(task)
    return acc
  }, {})

  const childGroups = Object.entries(grouped)

  return (
    <main style={{
      minHeight: '100vh',
      padding: '32px 24px 100px',
      maxWidth: '560px',
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
            background: 'radial-gradient(circle, #c3f3d8, #3b6934 58%, #154212)',
            boxShadow: '0 8px 20px rgba(59,105,52,.2)',
            flexShrink: 0,
          }}>
            🌿
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
              Semana atual
            </h1>
            <p style={{
              fontSize: '0.8125rem',
              color: 'var(--color-text-soft, #72796e)',
              margin: 0,
            }}>
              {/* T-04-10: always formatted with family timezone, never UTC raw */}
              De {formatCycleDate(cycleStart)} a {formatCycleDate(cycleEnd)}
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
          Voltar para tarefas
        </Link>
      </div>

      {/* Empty state */}
      {tasks.length === 0 ? (
        <div style={{
          background: 'var(--color-card, rgba(255,255,255,0.64))',
          border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
          borderRadius: '20px',
          padding: '32px 24px',
          textAlign: 'center',
        }}>
          <p style={{
            fontSize: '1.5rem',
            margin: '0 0 12px',
          }}>
            🌱
          </p>
          <p style={{
            fontSize: '0.9375rem',
            color: 'var(--color-primary, #154212)',
            fontWeight: 600,
            margin: '0 0 8px',
          }}>
            Nenhuma tarefa ativa esta semana
          </p>
          <p style={{
            fontSize: '0.8125rem',
            color: 'var(--color-text-soft, #72796e)',
            margin: '0 0 20px',
          }}>
            Adicione responsabilidades para seus filhos cultivarem bons hábitos.
          </p>
          <Link
            href="/family/tasks"
            style={{
              display: 'inline-flex',
              padding: '10px 20px',
              borderRadius: '99px',
              background: 'linear-gradient(135deg, #3b6934, #154212)',
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '0.875rem',
            }}
          >
            Adicionar tarefas
          </Link>
        </div>
      ) : (
        // Tasks grouped by child
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {childGroups.map(([childId, group]) => (
            <section key={childId}>
              {/* Child header */}
              {(() => {
                const completedCount = group.tasks.filter(
                  (t) => completionMap.get(`${t.id}:${childId}`) === 'completed',
                ).length
                const total = group.tasks.length
                const allDone = completedCount === total
                return (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '12px',
                  }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #3b6934, #154212)',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: '18px',
                      color: '#fff',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}>
                      {group.childName.charAt(0).toUpperCase()}
                    </div>
                    <h2 style={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: 'var(--color-primary, #154212)',
                      margin: 0,
                    }}>
                      {group.childName}
                    </h2>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: allDone ? '#3b6934' : 'var(--color-text-soft, #72796e)',
                      background: allDone ? 'rgba(59,105,52,0.1)' : 'rgba(45,90,39,0.08)',
                      padding: '2px 8px',
                      borderRadius: '99px',
                    }}>
                      {completedCount}/{total} {allDone ? '✓' : ''}
                    </span>
                  </div>
                )
              })()}

              {/* Task list for this child */}
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {group.tasks.map((task) => {
                  const status = completionMap.get(`${task.id}:${childId}`) ?? 'pending'
                  const done = status === 'completed'
                  return (
                      <li
                        key={task.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '14px 18px',
                          background: done
                            ? 'rgba(59,105,52,0.06)'
                            : 'var(--color-card, rgba(255,255,255,0.64))',
                          border: done
                            ? '1px solid rgba(59,105,52,0.2)'
                            : '1px solid var(--color-border, rgba(45,90,39,0.16))',
                          borderRadius: '14px',
                          boxShadow: '0 2px 8px rgba(45,90,39,0.04)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                          <span style={{ fontSize: '1.1rem', marginTop: '1px' }}>
                            {done ? '✅' : '⬜'}
                          </span>
                          <div>
                            <p style={{
                              fontWeight: 600,
                              fontSize: '0.9375rem',
                              color: done ? '#3b6934' : 'var(--color-primary, #154212)',
                              margin: '0 0 2px',
                              textDecoration: done ? 'line-through' : 'none',
                              opacity: done ? 0.7 : 1,
                            }}>
                              {task.title}
                            </p>
                            {task.description && (
                              <p style={{
                                fontSize: '0.75rem',
                                color: 'var(--color-text-soft, #72796e)',
                                margin: '0 0 2px',
                              }}>
                                {task.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          flexShrink: 0,
                          marginLeft: '12px',
                        }}>
                          <span style={{
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            color: 'var(--color-gold, #d2a501)',
                            background: 'var(--color-gold-soft, rgba(255, 223, 144, 0.48))',
                            border: '1px solid rgba(210,165,1,0.2)',
                            borderRadius: '99px',
                            padding: '4px 10px',
                            whiteSpace: 'nowrap',
                          }}>
                            {task.kredsValue} Kreds
                          </span>
                        </div>
                      </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {/* Back link */}
      <BottomNav active="missoes" />
    </main>
  )
}
