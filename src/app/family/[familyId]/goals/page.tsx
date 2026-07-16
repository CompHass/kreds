// Phase 11 — Rota SSR /family/[familyId]/goals — mesma forma de children/page.tsx.
// Auth gate executado pelo layout.tsx compartilhado.
// Um filho ativo por vez tem no máximo uma meta 'active' (D-01, ver goals.ts).

import { auth } from '../../../../../auth'
import { db } from '@/lib/db'
import { childProfiles, families, wishlistGoals } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { GoalsPanelView } from '@/components/parent/goals-panel-view'
import type { GoalView } from '@/types/goal'

export default async function GoalsPage({
  params,
}: {
  params: Promise<{ familyId: string }>
}) {
  const { familyId } = await params
  const session = await auth()

  const [children, activeGoals, familyResult] = await Promise.all([
    db
      .select({ id: childProfiles.id, displayName: childProfiles.displayName, accentColor: childProfiles.accentColor })
      .from(childProfiles)
      .where(and(eq(childProfiles.familyId, familyId), eq(childProfiles.active, true))),

    db
      .select()
      .from(wishlistGoals)
      .where(and(eq(wishlistGoals.familyId, familyId), eq(wishlistGoals.status, 'active'))),

    db.select({ name: families.name }).from(families).where(eq(families.id, familyId)),
  ])

  const goalByChildId = new Map(activeGoals.map((g) => [g.childProfileId, g]))

  const initialGoals: Record<string, GoalView | null> = Object.fromEntries(
    children.map((c) => {
      const g = goalByChildId.get(c.id)
      return [
        c.id,
        g
          ? {
              id: g.id,
              childId: c.id,
              title: g.title,
              targetAmount: g.targetAmount,
              allocatedAmount: g.allocatedAmount,
              status: g.status,
              dueDate: g.dueDate,
            }
          : null,
      ]
    }),
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
