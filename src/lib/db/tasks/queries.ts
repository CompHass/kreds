/**
 * Task template queries — read operations for task_templates table (ACT-01, ACT-03).
 *
 * Design decisions:
 * - FAM-05: All queries include family_id in WHERE — never omit tenant scope.
 * - D-07: Active-only view is the default; getAllTasksForFamily exposes all for audit (toggle D-07).
 * - getActiveTasksForFamily joins childProfiles to expose displayName and avatarPreset for the UI.
 */
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

/**
 * Returns active task templates for a family with their assigned child details.
 *
 * Filters: is_active=true on the template AND active=true on the child profile.
 * This ensures deactivated templates and deactivated children are excluded.
 * Used by the guardian task list (default view) and the current-cycle page.
 *
 * FAM-05: familyId is required and included in every WHERE clause.
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
 * Returns all task templates for a family, including inactive ones.
 *
 * Used for the audit/toggle view (D-07) — guardian can see inactive templates
 * to understand deactivation history.
 *
 * FAM-05: familyId is required and included in every WHERE clause.
 */
export async function getAllTasksForFamily(familyId: string) {
  return db
    .select()
    .from(schema.taskTemplates)
    .where(eq(schema.taskTemplates.familyId, familyId))
}
