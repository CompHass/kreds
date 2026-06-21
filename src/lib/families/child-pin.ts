import 'server-only'
import bcrypt from 'bcryptjs'

const COST_FACTOR = 10

export function validatePinFormat(pin: string): boolean {
  return /^\d{4,6}$/.test(pin)
}

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, COST_FACTOR)
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash)
}
