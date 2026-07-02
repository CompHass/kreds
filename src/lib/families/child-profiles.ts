import 'server-only'
import { db } from '@/lib/db'
import { childProfiles } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

export async function createChildProfile(input: {
  familyId: string
  displayName: string
  ageYears: number
  accentColor: string
}) {
  const [created] = await db
    .insert(childProfiles)
    .values({
      familyId: input.familyId,
      displayName: input.displayName,
      ageYears: input.ageYears,
      accentColor: input.accentColor,
      avatarPreset: 'initial', // D-08: fixed value, NOT user-selectable
    })
    .returning()
  return created
}

export async function deactivateChildProfile(childId: string, familyId: string) {
  const [updated] = await db
    .update(childProfiles)
    .set({
      active: false,
      deactivatedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(childProfiles.id, childId), eq(childProfiles.familyId, familyId)))
    .returning()
  return updated
}

export async function updateChildProfile(
  childId: string,
  familyId: string,
  patch: { displayName?: string; ageYears?: number; accentColor?: string },
) {
  const [updated] = await db
    .update(childProfiles)
    .set({
      ...patch,
      updatedAt: new Date(),
    })
    .where(and(eq(childProfiles.id, childId), eq(childProfiles.familyId, familyId)))
    .returning()
  return updated
}
