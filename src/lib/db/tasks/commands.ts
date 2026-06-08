/**
 * Task template commands — write operations for task_templates table (ACT-01, ACT-03).
 *
 * Design decisions:
 * - FAM-05: All mutations include family_id in WHERE — never trust a bare template id.
 * - D-01: Guardian can freely edit title, description, kredsValue — no immutability.
 * - D-06: Deactivation sets is_active=false and records deactivated_at; reactivation clears it.
 * - T-04-03: createTaskTemplate validates assignedChildId belongs to familyId before insert.
 */
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

/**
 * Creates a new task template for a family.
 *
 * Validates that assignedChildId belongs to the given familyId before inserting.
 * This prevents cross-family child forgery (T-04-03).
 *
 * @throws {Error} If the child profile does not belong to the family.
 */
export async function createTaskTemplate(input: {
  familyId: string
  assignedChildId: string
  title: string
  description?: string
  kredsValue: number
}): Promise<{ id: string }> {
  // T-04-03: Validate that assignedChildId belongs to familyId before insert.
  const [child] = await db
    .select({ id: schema.childProfiles.id })
    .from(schema.childProfiles)
    .where(
      and(
        eq(schema.childProfiles.id, input.assignedChildId),
        eq(schema.childProfiles.familyId, input.familyId),
        eq(schema.childProfiles.active, true),
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
 * Updates a task template's editable fields.
 *
 * Always scopes the update by family_id (FAM-05) — D-01 allows free edits.
 * Only fields provided in the input are updated.
 */
export async function updateTaskTemplate(input: {
  id: string
  familyId: string
  title?: string
  description?: string
  kredsValue?: number
}): Promise<void> {
  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
  }

  if (input.title !== undefined) {
    updates.title = input.title.trim()
  }
  if (input.description !== undefined) {
    updates.description = input.description
  }
  if (input.kredsValue !== undefined) {
    updates.kredsValue = input.kredsValue
  }

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
 * Deactivates a task template (D-06, D-08).
 *
 * Sets is_active=false and records deactivated_at. Deactivation is immediate — Phase 5
 * must check is_active before accepting completion submissions.
 * Always scoped by family_id (FAM-05).
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
 * Reactivates a previously deactivated task template (D-06).
 *
 * Sets is_active=true and clears deactivated_at.
 * Always scoped by family_id (FAM-05).
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
