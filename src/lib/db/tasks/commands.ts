import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

/**
 * Creates a new task template for a specific child in the guardian's family.
 *
 * Validates that assignedChildId belongs to the family before inserting (T-04-03).
 * The title is trimmed to remove accidental leading/trailing whitespace.
 *
 * @throws {Error} If the child does not belong to the family
 */
export async function createTaskTemplate(input: {
  familyId: string
  assignedChildId: string
  title: string
  description?: string
  kredsValue: number
}): Promise<{ id: string }> {
  // Validate that the child belongs to this family (T-04-03: prevent forged assignedChildId)
  const [child] = await db
    .select({ id: schema.childProfiles.id })
    .from(schema.childProfiles)
    .where(
      and(
        eq(schema.childProfiles.id, input.assignedChildId),
        eq(schema.childProfiles.familyId, input.familyId),
      ),
    )
    .limit(1)

  if (!child) {
    throw new Error('Child not found in this family')
  }

  const [row] = await db
    .insert(schema.taskTemplates)
    .values({
      familyId: input.familyId,
      assignedChildId: input.assignedChildId,
      title: input.title.trim(),
      description: input.description,
      kredsValue: input.kredsValue,
    })
    .returning({ id: schema.taskTemplates.id })

  return row
}

/**
 * Updates an existing task template — D-01: free edits, no versioning in Phase 4.
 * Always scopes by familyId in the WHERE clause (FAM-05).
 */
export async function updateTaskTemplate(input: {
  id: string
  familyId: string
  title?: string
  description?: string
  kredsValue?: number
}): Promise<void> {
  const updates: Partial<{
    title: string
    description: string | undefined
    kredsValue: number
    updatedAt: Date
  }> = { updatedAt: new Date() }

  if (input.title !== undefined) updates.title = input.title.trim()
  if (input.description !== undefined) updates.description = input.description
  if (input.kredsValue !== undefined) updates.kredsValue = input.kredsValue

  await db
    .update(schema.taskTemplates)
    .set(updates)
    .where(
      and(
        eq(schema.taskTemplates.id, input.id),
        eq(schema.taskTemplates.familyId, input.familyId),
      ),
    )
}

/**
 * Deactivates a task template by setting is_active=false and recording deactivated_at.
 *
 * Scoped by family_id — if the template does not belong to the family,
 * the update affects 0 rows silently (T-04-08: no cross-family information leak).
 *
 * Per D-08: deactivation takes effect immediately. Phase 5 checks is_active before
 * accepting new completion submissions.
 */
export async function deactivateTaskTemplate(
  templateId: string,
  familyId: string,
): Promise<void> {
  await db
    .update(schema.taskTemplates)
    .set({
      isActive: false,
      deactivatedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.taskTemplates.id, templateId),
        eq(schema.taskTemplates.familyId, familyId),
      ),
    )
}

/**
 * Reactivates a previously deactivated template.
 * Sets is_active=true and clears deactivated_at (D-06: null clears the timestamp).
 */
export async function reactivateTaskTemplate(
  templateId: string,
  familyId: string,
): Promise<void> {
  await db
    .update(schema.taskTemplates)
    .set({
      isActive: true,
      deactivatedAt: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.taskTemplates.id, templateId),
        eq(schema.taskTemplates.familyId, familyId),
      ),
    )
}
