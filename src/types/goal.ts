// Goal types and Zod schemas — Phase 11 (savings goals)

import { z } from 'zod'

export const GoalFormSchema = z.object({
  title: z.string().trim().min(1, 'Nome obrigatório').max(80, 'Nome muito longo'),
  targetAmount: z.number().int().positive('Valor deve ser positivo'),
  // ISO date string 'YYYY-MM-DD', optional — display-only, no enforcement.
  // <input type="date"> emits '' (not null/undefined) when left blank —
  // normalize that to null before the regex check.
  dueDate: z.preprocess(
    (v) => (v === '' ? null : v),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida').nullable().optional(),
  ),
})

export type GoalFormData = z.infer<typeof GoalFormSchema>

// Client-safe shape for the guardian goals panel and the child garden view.
export interface GoalView {
  id: string
  childId: string
  title: string
  targetAmount: number
  allocatedAmount: number
  status: 'active' | 'achieved' | 'archived'
  dueDate: string | null
}
