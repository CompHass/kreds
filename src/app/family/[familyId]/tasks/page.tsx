// PTASK-01, PTASK-02: Rota SSR /family/[familyId]/tasks
// Server Component — auth() + redirect('/login') sem sessão (D-01, T-05-08 mitigado).
// Query de childProfiles incluindo avatarPreset (necessário para FilterChips e AssigneeSelector).
// Sem lookup de familyMemberships (Pitfall 5 — banco dev sem memberships; verificação Fase 6).

import { redirect } from 'next/navigation'
import { auth } from '../../../../../auth'
import { db } from '@/lib/db'
import { childProfiles, families } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { ParentPanelView } from '@/components/parent/parent-panel-view'
import { MOCK_PARENT_TASKS } from '@/lib/seed/parent-seed'

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

  // Query de childProfiles ativos (avatarPreset incluído para FilterChips)
  // Sem lookup de familyMemberships (Pitfall 5 — banco dev sem memberships)
  const children = await db
    .select({
      id: childProfiles.id,
      displayName: childProfiles.displayName,
      accentColor: childProfiles.accentColor,
      avatarPreset: childProfiles.avatarPreset,
    })
    .from(childProfiles)
    .where(and(eq(childProfiles.familyId, familyId), eq(childProfiles.active, true)))

  // Query opcional do nome da família para o breadcrumb (Open Question 1)
  // Fallback 'Família Teste' se nenhum resultado (T-05-09: Drizzle usa queries parametrizadas)
  const familyResult = await db
    .select({ name: families.name })
    .from(families)
    .where(eq(families.id, familyId))

  const familyName = familyResult[0]?.name ?? 'Família'

  // Atribuir o primeiro childId ao mock para que FilterChips funcione na demo
  // (MOCK_PARENT_TASKS tem assigned:[] — atribuir children[0]?.id quando disponível)
  const firstChildId = children[0]?.id ?? null
  const tasksWithAssignees = MOCK_PARENT_TASKS.map((task, index) => ({
    ...task,
    // Alternamos a atribuição entre children[0] e children[1] para demonstrar o filtro
    assigned:
      firstChildId !== null
        ? [children[index % children.length]?.id ?? firstChildId]
        : [],
  }))

  return (
    <ParentPanelView
      familyId={familyId}
      familyName={familyName}
      currentUserName={session.user?.name ?? ''}
      familyChildren={children}          // ATENÇÃO: NÃO usar 'children' como prop name (Pitfall 2)
      initialTasks={tasksWithAssignees}
    />
  )
}
