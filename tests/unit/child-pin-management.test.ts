import { beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

let hashPin: typeof import('../../src/lib/families/child-pin').hashPin
let validatePinFormat: typeof import('../../src/lib/families/child-pin').validatePinFormat
let verifyPin: typeof import('../../src/lib/families/child-pin').verifyPin

beforeAll(async () => {
  ;({ hashPin, validatePinFormat, verifyPin } = await import('../../src/lib/families/child-pin'))
})

describe('child PIN management', () => {
  it('accepts 4-digit PINs', () => {
    expect(validatePinFormat('1234')).toBe(true)
  })

  it('accepts 6-digit PINs', () => {
    expect(validatePinFormat('123456')).toBe(true)
  })

  it('rejects PINs shorter than 4 digits', () => {
    expect(validatePinFormat('123')).toBe(false)
  })

  it('rejects PINs longer than 6 digits', () => {
    expect(validatePinFormat('1234567')).toBe(false)
  })

  it('rejects non-numeric PINs', () => {
    expect(validatePinFormat('abcd')).toBe(false)
  })

  it('rejects PINs with whitespace', () => {
    expect(validatePinFormat('12 34')).toBe(false)
  })

  it('hashes PINs with bcrypt', async () => {
    const hash = await hashPin('1234')
    expect(hash.startsWith('$2')).toBe(true)
  })

  it('verifies a matching PIN', async () => {
    const hash = await hashPin('1234')
    await expect(verifyPin('1234', hash)).resolves.toBe(true)
  })

  it('rejects a non-matching PIN', async () => {
    const hash = await hashPin('1234')
    await expect(verifyPin('5678', hash)).resolves.toBe(false)
  })
})
