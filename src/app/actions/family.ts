'use server'

// Server Action for the Settings panel (Phase 10) — same convention as
// src/app/actions/children.ts: auth() check, familyId in the WHERE clause,
// revalidatePath after mutation.

import { revalidatePath } from 'next/cache'
import { auth } from '../../../auth'
import { db } from '@/lib/db'
import { families } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const UpdateFamilyNameSchema = z.object({
  name: z.string().trim().min(1, 'Nome obrigatório').max(80, 'Nome muito longo'),
})

export async function updateFamilyName(
  familyId: string,
  name: string,
): Promise<typeof families.$inferSelect> {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const parsed = UpdateFamilyNameSchema.parse({ name })

  const [family] = await db
    .update(families)
    .set({ name: parsed.name, updatedAt: new Date() })
    .where(eq(families.id, familyId))
    .returning()

  if (!family) throw new Error('Family not found')

  revalidatePath(`/family/${familyId}/settings`)

  return family
}
