export const FIRSTFRUITS_RATE = 0.10 as const

export function calculateFirstfruits(amount: number): number {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error('amount must be a positive integer')
  }

  return Math.ceil(amount * FIRSTFRUITS_RATE)
}
