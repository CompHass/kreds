import { z } from 'zod'

/**
 * Zod validation schema for task template input (ACT-01).
 *
 * kredsValue must be a positive integer (D-07: integer-only Kreds arithmetic).
 * Uses z.coerce.number().int().positive() to catch floats at the validation layer
 * before any DB write.
 */
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
