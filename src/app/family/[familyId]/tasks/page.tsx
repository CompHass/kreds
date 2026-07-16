// PTASK-01, PTASK-02: Rota SSR /family/[familyId]/tasks
// Server Component — auth gate agora executado pelo layout.tsx compartilhado (D-02/D-03, T-08-06).
// O redirect('/login') sem sessão é responsabilidade do layout pai; auth() aqui serve apenas
// para ler session.user?.name e session.user?.email para as props do ParentPanelView.
// API-01, API-02: Query real de taskTemplates do banco (sem MOCK_PARENT_TASKS).
// T-06-15: familyId isolado em todas as queries — nenhum dado vaza entre famílias.

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

  // Auth gate executado pelo layout.tsx pai (D-02/D-03, T-08-06).
  // auth() aqui é somente para obter session.user?.name / email (não faz redirect).
  const session = await auth()

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

  // Agrupar tasks idênticas (mesmo title, category, reward, days e status)
  // para permitir que sejam exibidas como uma única task atribuída a várias crianças (Multi-assignment)
  const groupedTasks = new Map<string, ParentTask>()

  tasks.forEach((t) => {
    const key = `${t.title}|${t.category}|${t.kredsValue}|${JSON.stringify(t.days)}|${t.isActive}|${t.approval}`
    if (!groupedTasks.has(key)) {
      groupedTasks.set(key, {
        id: t.id,
        taskIds: [t.id],
        title: t.title,
        category: (t.category ?? 'quarto') as Category,
        reward: t.kredsValue,
        days: (t.days ?? []) as number[],
        assigned: [t.assignedChildId],
        active: t.isActive,
        approval: t.approval,
      })
    } else {
      const group = groupedTasks.get(key)!
      group.assigned.push(t.assignedChildId)
      group.taskIds?.push(t.id)
    }
  })

  const mappedTasks: ParentTask[] = Array.from(groupedTasks.values())

  return (
    <ParentPanelView
      familyId={familyId}
      familyName={familyName}
      currentUserName={session?.user?.name ?? ''}
      guardianEmail={session?.user?.email ?? ''}
      familyChildren={children}          // ATENÇÃO: NÃO usar 'children' como prop name (Pitfall 2)
      initialTasks={mappedTasks}
    />
  )
}
