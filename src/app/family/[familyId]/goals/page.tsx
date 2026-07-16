// Phase 11 — Rota SSR /family/[familyId]/goals — mesma forma de children/page.tsx.
// Auth gate executado pelo layout.tsx compartilhado.
// Um filho pode ter várias metas simultâneas (active/achieved) — arquivadas
// ficam ocultas do painel do responsável.

import { auth } from '../../../../../auth'
import { db } from '@/lib/db'
import { childProfiles, families, wishlistGoals } from '@/lib/db/schema'
import { and, eq, ne } from 'drizzle-orm'
import { GoalsPanelView } from '@/components/parent/goals-panel-view'
import type { GoalView } from '@/types/goal'

export default async function GoalsPage({
  params,
}: {
  params: Promise<{ familyId: string }>
}) {
  const { familyId } = await params
  const session = await auth()

  const [children, goals, familyResult] = await Promise.all([
    db
      .select({ id: childProfiles.id, displayName: childProfiles.displayName, accentColor: childProfiles.accentColor })
      .from(childProfiles)
      .where(and(eq(childProfiles.familyId, familyId), eq(childProfiles.active, true))),

    db
      .select()
      .from(wishlistGoals)
      .where(and(eq(wishlistGoals.familyId, familyId), ne(wishlistGoals.status, 'archived'))),

    db.select({ name: families.name }).from(families).where(eq(families.id, familyId)),
  ])

  const goalsByChildId = new Map<string, GoalView[]>()
  for (const g of goals) {
    const list = goalsByChildId.get(g.childProfileId) ?? []
    list.push({
      id: g.id,
      childId: g.childProfileId,
      title: g.title,
      targetAmount: g.targetAmount,
      allocatedAmount: g.allocatedAmount,
      status: g.status,
      dueDate: g.dueDate,
    })
    goalsByChildId.set(g.childProfileId, list)
  }

  const initialGoals: Record<string, GoalView[]> = Object.fromEntries(
    children.map((c) => [c.id, goalsByChildId.get(c.id) ?? []]),
  )

  const familyName = familyResult[0]?.name ?? 'Família'

  return (
    <GoalsPanelView
      familyId={familyId}
      familyName={familyName}
      currentUserName={session?.user?.name ?? ''}
      guardianEmail={session?.user?.email ?? ''}
      children={children}
      initialGoals={initialGoals}
    />
  )
}
