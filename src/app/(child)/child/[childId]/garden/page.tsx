// D-04: Server Component para rota /child/[childId]/garden
// Busca versículo aleatório do banco (D-08) e renderiza GardenView com seed mockado (D-01)

import { db } from '@/lib/db'
import { bibleVerses } from '@/lib/db/schema'
import { sql } from 'drizzle-orm'
import { GardenView } from '@/components/garden/garden-view'
import { SEED_STAGE_C } from '@/lib/seed/garden-seed'

export default async function GardenPage({
  params,
}: {
  params: Promise<{ childId: string }>
}) {
  const { childId } = await params

  // Query versículo aleatório (D-08) — Pitfall 4: ORDER BY RANDOM() via sql tag
  const [verse] = await db
    .select()
    .from(bibleVerses)
    .orderBy(sql`RANDOM()`)
    .limit(1)

  return (
    <GardenView
      childId={childId}
      seed={SEED_STAGE_C}
      verse={verse ?? null}
    />
  )
}
