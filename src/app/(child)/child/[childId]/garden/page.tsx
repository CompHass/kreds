// API-02, API-03: Server Component para rota /child/[childId]/garden
// Queries reais de taskTemplates + taskCompletions + childProfiles do banco (sem SEED_STAGE_C).
// T-06-16: assignedChildId filter garante que a criança vê apenas suas próprias tarefas.
// getCurrentCycleStart(): ciclo semanal (Domingo-Sábado) em UTC.

import { db } from '@/lib/db'
import { bibleVerses, taskTemplates, taskCompletions, childProfiles, wishlistGoals } from '@/lib/db/schema'
import { sql, eq, and } from 'drizzle-orm'
import { GardenView } from '@/components/garden/garden-view'
import { type GardenSeed, type GardenTask } from '@/lib/seed/garden-seed'
import { getCurrentCycleStart } from '@/lib/cycles/current-cycle'

export default async function GardenPage({
  params,
}: {
  params: Promise<{ childId: string }>
}) {
  const { childId } = await params
  const cycleStart = getCurrentCycleStart()

  // Queries paralelas: tarefas, completions do ciclo atual, perfil da criança, meta ativa, versículo
  // T-06-16: todas filtradas por childId — sem vazamento de dados entre crianças
  const [tasks, completions, childResult, goals, verseResult] = await Promise.all([
    db
      .select()
      .from(taskTemplates)
      .where(and(eq(taskTemplates.assignedChildId, childId), eq(taskTemplates.isActive, true))),

    db
      .select()
      .from(taskCompletions)
      .where(and(eq(taskCompletions.childProfileId, childId), eq(taskCompletions.cycleStart, cycleStart))),

    db
      .select()
      .from(childProfiles)
      .where(eq(childProfiles.id, childId))
      .limit(1),

    db
      .select()
      .from(wishlistGoals)
      .where(and(eq(wishlistGoals.childProfileId, childId), eq(wishlistGoals.status, 'active')))
      .limit(1),

    db
      .select()
      .from(bibleVerses)
      .orderBy(sql`RANDOM()`)
      .limit(1),
  ])

  // Construir GardenSeed a partir dos dados reais do banco
  const completedIds = new Set(
    completions.filter((c) => c.status === 'completed').map((c) => c.taskTemplateId),
  )

  const gardenTasks: GardenTask[] = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    emoji: '✅',
    done: completedIds.has(t.id),
    kredsValue: t.kredsValue,   // necessário para somar o total na colheita (API-03)
  }))

  const child = childResult[0]
  const goal = goals[0]

  const seed: GardenSeed = {
    childName: child?.displayName ?? 'Criança',
    initial: (child?.displayName?.[0] ?? 'C').toUpperCase(),
    coins: 0,                                          // saldo calculado futuramente via ledger
    tasks: gardenTasks,
    titheDone: false,
    harvested: false,
    season: 'primavera',
    savings: goal?.allocatedAmount ?? 0,
    goal: goal?.targetAmount ?? 100,
  }

  return (
    <GardenView
      childId={childId}
      seed={seed}
      verse={verseResult[0] ?? null}
    />
  )
}
