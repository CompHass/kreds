import 'server-only'
import { db } from '@/lib/db'
import { childProfiles } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

export async function createChildProfile(input: {
  familyId: string
  displayName: string
  ageYears: number
  accentColor: string
  avatarPreset?: string
}) {
  const [created] = await db
    .insert(childProfiles)
    .values({
      familyId: input.familyId,
      displayName: input.displayName,
      ageYears: input.ageYears,
      accentColor: input.accentColor,
      // Phase 14 (supersedes D-08): selectable preset, 'initial' when omitted
      avatarPreset: input.avatarPreset ?? 'initial',
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
  patch: {
    displayName?: string
    ageYears?: number
    accentColor?: string
    avatarPreset?: string
  },
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
