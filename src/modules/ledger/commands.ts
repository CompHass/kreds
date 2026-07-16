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

// Phase 11 — child moves Kreds from their available balance into a savings
// goal. Child-initiated (no guardianIdentityId — initiatedByIdentityId stays
// null on the transaction, same as harvest/route.ts's task_earning writes).
export const GoalAllocationCommandSchema = z.object({
  commandId: z.string().uuid(),
  familyId: z.string().uuid(),
  childProfileId: z.string().uuid(),
  goalId: z.string().uuid(),
  amount: z.number().int().positive(),
})

export type EarningCommand = z.infer<typeof EarningCommandSchema>
export type AdjustmentCommand = z.infer<typeof AdjustmentCommandSchema>
export type ReversalCommand = z.infer<typeof ReversalCommandSchema>
export type GoalAllocationCommand = z.infer<typeof GoalAllocationCommandSchema>
