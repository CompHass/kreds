// PTASK-01, PTASK-02: Rota SSR /family/[familyId]/tasks
// Server Component — auth() + redirect('/login') sem sessão (D-01, T-05-08 mitigado).
// API-01, API-02: Query real de taskTemplates do banco (sem MOCK_PARENT_TASKS).
// T-06-15: familyId isolado em todas as queries — nenhum dado vaza entre famílias.

import { redirect } from 'next/navigation'
import { auth } from '../../../../../auth'
import { db } from '@/lib/db'
import { childProfiles, families, taskTemplates } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { ParentPanelView } from '@/components/parent/parent-panel-view'
import type { ParentTask, Category } from '@/types/task'

export default async function ParentTasksPage({
  params,
}: {
  params: Promise<{ familyId: string }>
}) {
  // CRÍTICO: params é Promise no Next.js 15+ — await obrigatório (Pitfall 1)
  const { familyId } = await params

  // Auth gate — T-05-08 mitigado: redireciona sem sessão (D-01)
  const session = await auth()
  if (!session) redirect('/login')

  // Queries paralelas: childProfiles, taskTemplates e nome da família (API-01, API-02)
  // T-06-15: todas as queries filtradas por familyId do URL (scoping por família)
  const [children, tasks, familyResult] = await Promise.all([
    db
      .select({
        id: childProfiles.id,
        displayName: childProfiles.displayName,
        accentColor: childProfiles.accentColor,
        avatarPreset: childProfiles.avatarPreset,
      })
      .from(childProfiles)
      .where(and(eq(childProfiles.familyId, familyId), eq(childProfiles.active, true))),

    db
      .select()
      .from(taskTemplates)
      .where(and(eq(taskTemplates.familyId, familyId), eq(taskTemplates.isActive, true))),

    db
      .select({ name: families.name })
      .from(families)
      .where(eq(families.id, familyId)),
  ])

  const familyName = familyResult[0]?.name ?? 'Família'

  // Mapear rows do banco para o shape ParentTask (API-02)
  const mappedTasks: ParentTask[] = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    category: (t.category ?? 'quarto') as Category,
    reward: t.kredsValue,
    days: (t.days ?? []) as number[],
    assigned: [t.assignedChildId],
    active: t.isActive,
    approval: t.approval,
  }))

  return (
    <ParentPanelView
      familyId={familyId}
      familyName={familyName}
      currentUserName={session.user?.name ?? ''}
      familyChildren={children}          // ATENÇÃO: NÃO usar 'children' como prop name (Pitfall 2)
      initialTasks={mappedTasks}
    />
  )
}
