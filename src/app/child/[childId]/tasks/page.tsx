import { redirect } from 'next/navigation'
import { eq, and } from 'drizzle-orm'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { requireChildSession } from '@/lib/auth/child-guard'
import { ChildBottomNav } from '@/components/ChildBottomNav'
import { getActiveTasksForFamily } from '@/lib/db/tasks/queries'
import { getCycleForDate } from '@/modules/activity/cycle'
import { TaskToggleButton } from './TaskToggleButton'

export const dynamic = 'force-dynamic'

export default async function ChildTasksPage({
  params,
}: {
  params: Promise<{ childId: string }>
}) {
  const { childId } = await params
  const session = await requireChildSession()

  // Verify scope: child can only access their own tasks
  if (session.childProfileId !== childId) {
    redirect(`/child/${session.childProfileId}/tasks`)
  }

  // Fetch family timezone and active tasks in parallel
  const [familyRow, allTasks] = await Promise.all([
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

  const timezone = familyRow?.[0]?.timezone ?? 'America/Sao_Paulo'
  const { cycleStart } = getCycleForDate(new Date(), timezone)
  const cycleStartStr = cycleStart.toISOString().split('T')[0] // 'YYYY-MM-DD'

  // Fetch task completions for current cycle
  const completions = await db
    .select({
      taskTemplateId: schema.taskCompletions.taskTemplateId,
      status: schema.taskCompletions.status,
    })
    .from(schema.taskCompletions)
    .where(
      and(
        eq(schema.taskCompletions.childProfileId, session.childProfileId),
        eq(schema.taskCompletions.cycleStart, cycleStartStr),
      ),
    )

  // Create a map of taskId -> status
  const completionMap = new Map<string, 'pending' | 'completed'>()
  completions.forEach((completion) => {
    completionMap.set(completion.taskTemplateId, completion.status)
  })

  // Filter tasks assigned to this child
  const childTasks = allTasks.filter(
    (task) => task.assignedChildId === session.childProfileId,
  )

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
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1
          style={{
            fontFamily: 'var(--font-heading, "Plus Jakarta Sans", system-ui, sans-serif)',
            fontWeight: 800,
            fontSize: '1.8rem',
            letterSpacing: '-0.02em',
            color: 'var(--color-primary, #154212)',
            margin: '0 0 8px 0',
          }}
        >
          Minhas Tarefas
        </h1>
        <p
          style={{
            fontSize: '13px',
            color: '#72796e',
            margin: 0,
            fontWeight: 500,
          }}
        >
          Ciclo atual
        </p>
      </div>

      {/* Empty state */}
      {childTasks.length === 0 ? (
        <div
          style={{
            padding: '40px 20px',
            background: 'rgba(255,255,255,0.64)',
            border: '1px solid rgba(45,90,39,0.16)',
            borderRadius: '24px',
            textAlign: 'center',
            marginBottom: '20px',
          }}
        >
          <p
            style={{
              fontSize: '32px',
              margin: '0 0 12px 0',
            }}
          >
            🌱
          </p>
          <p
            style={{
              fontSize: '14px',
              color: '#72796e',
              margin: '0',
              fontWeight: 500,
            }}
          >
            Nenhuma tarefa ativa esta semana.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {childTasks.map((task) => {
            const status = completionMap.get(task.id) ?? 'pending'
            return (
              <div
                key={task.id}
                style={{
                  padding: '16px',
                  background: 'rgba(255,255,255,0.64)',
                  border: '1px solid rgba(45,90,39,0.16)',
                  borderRadius: '16px',
                  boxShadow: '0 4px 16px rgba(45,90,39,0.06)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div style={{ marginBottom: '12px' }}>
                  <h3
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#154212',
                      margin: '0 0 8px 0',
                    }}
                  >
                    {task.title}
                  </h3>
                  <div
                    style={{
                      display: 'inline-block',
                      background:
                        'radial-gradient(circle, #fff3b8, #d2a501 58%, #8b6a08)',
                      color: '#4c2e04',
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    <span>🪙</span> {task.kredsValue} Kreds
                  </div>
                </div>
                <TaskToggleButton
                  taskId={task.id}
                  childId={childId}
                  initialStatus={status}
                />
              </div>
            )
          })}
        </div>
      )}

      {/* Bottom Nav */}
      <ChildBottomNav active="tarefas" childId={childId} />
    </main>
  )
}
