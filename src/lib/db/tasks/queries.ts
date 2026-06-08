import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

/**
 * Returns active task templates for a family joined with child profile data.
 *
 * Filters by:
 * - familyId: tenant isolation (FAM-05)
 * - isActive=true: only templates the guardian has not deactivated (D-07)
 * - childProfiles.active=true: excludes deactivated children
 */
export async function getActiveTasksForFamily(familyId: string) {
  return db
    .select({
      id: schema.taskTemplates.id,
      title: schema.taskTemplates.title,
      description: schema.taskTemplates.description,
      kredsValue: schema.taskTemplates.kredsValue,
      assignedChildId: schema.taskTemplates.assignedChildId,
      isActive: schema.taskTemplates.isActive,
      deactivatedAt: schema.taskTemplates.deactivatedAt,
      childName: schema.childProfiles.displayName,
      childAvatarPreset: schema.childProfiles.avatarPreset,
    })
    .from(schema.taskTemplates)
    .innerJoin(
      schema.childProfiles,
      eq(schema.taskTemplates.assignedChildId, schema.childProfiles.id),
    )
    .where(
      and(
        eq(schema.taskTemplates.familyId, familyId),
        eq(schema.taskTemplates.isActive, true),
        eq(schema.childProfiles.active, true),
      ),
    )
}

/**
 * Returns all task templates for a family including inactive ones.
 * Used for the D-07 toggle in the guardian task list (showInactive view).
 */
export async function getAllTasksForFamily(familyId: string) {
  return db
    .select({
      id: schema.taskTemplates.id,
      title: schema.taskTemplates.title,
      description: schema.taskTemplates.description,
      kredsValue: schema.taskTemplates.kredsValue,
      assignedChildId: schema.taskTemplates.assignedChildId,
      isActive: schema.taskTemplates.isActive,
      deactivatedAt: schema.taskTemplates.deactivatedAt,
    })
    .from(schema.taskTemplates)
    .where(eq(schema.taskTemplates.familyId, familyId))
}
