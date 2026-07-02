// @vitest-environment node

import { beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

// Stub PIN_ENCRYPTION_KEY with a valid deterministic 32-byte base64 value
process.env.PIN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64')

// Also stub other required env vars to avoid eager parse failures
process.env.DATABASE_URL ??= 'postgresql://kreds:kreds@localhost:5432/kreds_dev'
process.env.AUTH_SECRET ??= 'test-auth-secret-32-chars-at-minimum!!'
process.env.CHILD_SESSION_SECRET ??= '0123456789abcdef0123456789abcdef'
process.env.AUTH_ZITADEL_ID ??= 'test-id'
process.env.AUTH_ZITADEL_SECRET ??= 'test-secret'

let encryptPin: typeof import('../../src/lib/crypto/pin-cipher').encryptPin
let decryptPin: typeof import('../../src/lib/crypto/pin-cipher').decryptPin

beforeAll(async () => {
  ;({ encryptPin, decryptPin } = await import('../../src/lib/crypto/pin-cipher'))
})

describe('pin-cipher AES-256-GCM', () => {
  it('round-trip: encryptPin then decryptPin returns the original PIN', () => {
    const original = '1234'
    const encrypted = encryptPin(original)
    const decrypted = decryptPin(encrypted)
    expect(decrypted).toBe(original)
  })

  it('IV uniqueness: two encryptPin calls produce different ciphertext strings', () => {
    const pin = '1234'
    const first = encryptPin(pin)
    const second = encryptPin(pin)
    expect(first).not.toBe(second)
  })

  it('tamper detection: decryptPin throws on mutated auth-tag segment', () => {
    const encrypted = encryptPin('1234')
    const parts = encrypted.split(':')
    // Mutate the auth tag (second segment)
    const mutatedTag = Buffer.from(parts[1], 'base64')
    mutatedTag[0] ^= 0xff // flip all bits in first byte
    const tampered = [parts[0], mutatedTag.toString('base64'), parts[2]].join(':')
    expect(() => decryptPin(tampered)).toThrow()
  })

  it('format: encryptPin output has exactly three colon-joined base64 segments', () => {
    const encrypted = encryptPin('1234')
    const parts = encrypted.split(':')
    expect(parts).toHaveLength(3)
    // Each part should be a valid non-empty base64 string
    for (const part of parts) {
      expect(part.length).toBeGreaterThan(0)
      expect(() => Buffer.from(part, 'base64')).not.toThrow()
    }
  })
})
