import { z } from 'zod'

export const EarningCommandSchema = z.object({
  commandId: z.string().uuid(),
  familyId: z.string().uuid(),
  childProfileId: z.string().uuid(),
  guardianIdentityId: z.string().uuid(),
  amount: z.number().int().positive(),
  note: z.string().max(500).optional(),
})

export const AdjustmentCommandSchema = EarningCommandSchema.extend({
  reason: z.string().min(1).max(500),
  restorationNote: z.string().max(500).optional(),
})

export const ReversalCommandSchema = z.object({
  commandId: z.string().uuid(),
  familyId: z.string().uuid(),
  childProfileId: z.string().uuid(),
  guardianIdentityId: z.string().uuid(),
  correctsTransactionId: z.string().uuid(),
  correctionNote: z.string().min(1).max(500),
})

export type EarningCommand = z.infer<typeof EarningCommandSchema>
export type AdjustmentCommand = z.infer<typeof AdjustmentCommandSchema>
export type ReversalCommand = z.infer<typeof ReversalCommandSchema>
