import 'server-only'

import bcrypt from 'bcryptjs'

const PIN_PATTERN = /^\d{4,6}$/

export function validatePinFormat(pin: string): boolean {
  return PIN_PATTERN.test(pin)
}

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 12)
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash)
}
