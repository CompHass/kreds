'use server'

// Server Actions for ParentPanelView mutations — Phase 6 (API-01, API-02)
// These actions are called by ParentPanelView client component.
//
// Security: auth() check before any DB access (T-06-05).
// CSRF: Next.js Server Actions have built-in Origin header check (T-06-08).
// revalidatePath: called with concrete path after each mutation (Pitfall 4).
// Return value: real DB row with UUID from .returning() (Pitfall 6 — prevents fake-id desync).

import { revalidatePath } from 'next/cache'
import { auth } from '../../../auth'
import { db } from '@/lib/db'
import { taskTemplates } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { CreateTaskSchema } from '@/types/task'

// ─── createTask ──────────────────────────────────────────────────────────────
// Inserts a new task template and returns the persisted row (with real UUID).
// ParentPanelView replaces the optimistic local UUID with the real one (Pitfall 6).

export async function createTask(
  data: z.infer<typeof CreateTaskSchema> & { familyId: string },
): Promise<typeof taskTemplates.$inferSelect> {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  // Validate — throws ZodError if invalid
  CreateTaskSchema.parse(data)

  const [task] = await db
    .insert(taskTemplates)
    .values({
      title: data.title,
      familyId: data.familyId,
      assignedChildId: data.assignedChildId,
      kredsValue: data.kredsValue,
      days: data.days,
      category: data.category ?? null,
      approval: data.approval ?? false,
      description: data.description ?? null,
    })
    .returning()

  // revalidatePath called AFTER insert with concrete path (not pattern) — Pitfall 4
  revalidatePath(`/family/${data.familyId}/tasks`)

  return task
}

// ─── updateTask ──────────────────────────────────────────────────────────────
// Updates task fields and returns the updated row.

export async function updateTask(
  taskId: string,
  familyId: string,
  data: Partial<z.infer<typeof CreateTaskSchema>>,
): Promise<typeof taskTemplates.$inferSelect> {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  // updatedAt set explicitly — Drizzle does not auto-update timestamp columns
  const [task] = await db
    .update(taskTemplates)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(
        eq(taskTemplates.id, taskId),
        eq(taskTemplates.familyId, familyId),
      ),
    )
    .returning()

  if (!task) throw new Error('Task not found')

  revalidatePath(`/family/${familyId}/tasks`)

  return task
}

// ─── toggleTaskActive ─────────────────────────────────────────────────────────
// Toggles isActive flag (used by ParentTaskCard toggle switch).

export async function toggleTaskActive(
  taskId: string,
  familyId: string,
  active: boolean,
): Promise<void> {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  await db
    .update(taskTemplates)
    .set({ isActive: active, updatedAt: new Date() })
    .where(
      and(
        eq(taskTemplates.id, taskId),
        eq(taskTemplates.familyId, familyId),
      ),
    )

  revalidatePath(`/family/${familyId}/tasks`)
}

// ─── deactivateTask ───────────────────────────────────────────────────────────
// Soft-delete: sets isActive=false and deactivatedAt=now().
// History row preserved (D-06). Used by TaskFormPanel delete button.

export async function deactivateTask(
  taskId: string,
  familyId: string,
): Promise<void> {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  await db
    .update(taskTemplates)
    .set({
      isActive: false,
      deactivatedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(taskTemplates.id, taskId),
        eq(taskTemplates.familyId, familyId),
      ),
    )

  revalidatePath(`/family/${familyId}/tasks`)
}
