/**
 * taskTemplateSchema — Zod validation schema for task template input (ACT-01).
 *
 * Design decisions:
 * - D-07: kredsValue must be a positive integer (enforced by z.coerce.number().int().positive()).
 * - D-02: assignedChildId must be a valid UUID (one child per template in v1).
 * - This file imports only 'zod' — no drizzle-orm, no @/lib/db.
 * - Threat T-04-01: Zod schema is the first line of defense before any DB write.
 */
import { z } from 'zod'

export const taskTemplateSchema = z.object({
  title: z.string().min(1, 'Título obrigatório').max(100),
  description: z.string().max(500).optional(),
  assignedChildId: z.string().uuid('Selecione um filho válido'),
  kredsValue: z
    .coerce
    .number()
    .int('Valor deve ser número inteiro')
    .positive('Valor deve ser positivo'),
})

export type TaskTemplateInput = z.infer<typeof taskTemplateSchema>
