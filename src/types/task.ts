// Task types and Zod schemas — Phase 6 (API-01, API-02)
// Single source of truth for ParentTask type shared by parent-seed.ts,
// Route Handlers (src/app/api/family/.../tasks/route.ts),
// and Server Actions (src/app/actions/tasks.ts).

import { z } from 'zod'

export interface ParentTask {
  id: string
  title: string
  category: 'quarto' | 'higiene' | 'estudos' | 'casa' | 'espiritual' | 'pet'
  reward: number       // inteiro em R$; 0 = mordomia
  days: number[]       // índices 0-6 (D=0 S=1 T=2 Q=3 Q=4 S=5 S=6)
  assigned: string[]   // childProfile ids
  active: boolean
  approval: boolean
}

export type Category = ParentTask['category']

export const VALID_CATEGORIES: Category[] = [
  'quarto',
  'higiene',
  'estudos',
  'casa',
  'espiritual',
  'pet',
]

// Zod schemas for Route Handler validation (API-01, API-02)
// Used in route.ts files to validate incoming request bodies.

export const CreateTaskSchema = z.object({
  title: z.string().min(1, 'Title required'),
  assignedChildId: z.string().uuid('assignedChildId must be UUID'),
  kredsValue: z.number().int().positive('kredsValue must be positive integer'),
  days: z.array(z.number().int().min(0).max(6)),
  category: z
    .enum(['quarto', 'higiene', 'estudos', 'casa', 'espiritual', 'pet'])
    .optional(),
  approval: z.boolean().default(false),
  description: z.string().optional(),
})

export const UpdateTaskSchema = CreateTaskSchema.partial().omit({
  assignedChildId: true,
})
