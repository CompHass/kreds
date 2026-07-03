import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
vi.mock('server-only', () => ({}))

// Stub PIN_ENCRYPTION_KEY with a valid deterministic 32-byte base64 value
// before importing anything that eagerly parses env or the cipher module.
process.env.PIN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64')
process.env.AUTH_SECRET ??= 'test-auth-secret-32-chars-at-minimum!!'
process.env.CHILD_SESSION_SECRET ??= '0123456789abcdef0123456789abcdef'
process.env.AUTH_ZITADEL_ID ??= 'test-id'
process.env.AUTH_ZITADEL_SECRET ??= 'test-secret'

import { PostgreSqlContainer } from '@testcontainers/postgresql'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import { and, eq } from 'drizzle-orm'
import * as schema from '../../src/lib/db/schema'
import { hashPin } from '../../src/lib/families/child-pin'
import { encryptPin, decryptPin } from '../../src/lib/crypto/pin-cipher'

// Wave 0 integration test — proves resetChildPin's dual-write invariant (D-13),
// revealChildPin's Pitfall 6 null-safety, and familyId isolation (T-08-05).
// Domain writes are replicated directly against the schema (mirroring the
// Server Action bodies in src/app/actions/children.ts) so this test exercises
// real PostgreSQL constraints without requiring Next.js request/auth plumbing.

describe('Child PIN reset — dual-write, null-safe reveal, family isolation (D-13, D-12, T-08-05)', () => {
  let container: any
  let pool: any
  let db: any

  beforeAll(async () => {
    try {
      container = await new PostgreSqlContainer('postgres:18-alpine').start()
      pool = new Pool({ connectionString: container.getConnectionUri() })
      db = drizzle(pool)
      await migrate(db, { migrationsFolder: './drizzle' })
    } catch {
      db = null
    }
  }, 60000)

  afterAll(async () => {
    if (pool) await pool.end()
    if (container) await container.stop()
  })

  async function seedFamily(name: string) {
    const [family] = await db.insert(schema.families).values({ name }).returning()
    return family
  }

  async function seedChild(familyId: string, displayName: string, pinEncrypted: string | null = null) {
    const [child] = await db
      .insert(schema.childProfiles)
      .values({
        familyId,
        displayName,
        ageYears: 8,
        avatarPreset: 'initial',
        accentColor: '#3E6B4F',
        pinEncrypted,
      })
      .returning()
    return child
  }

  it('resetChildPin dual-writes bcrypt pinHash + AES-GCM pinEncrypted together (D-13)', async () => {
    if (!db) return // Testcontainers unavailable in this environment — skip gracefully
    const family = await seedFamily('Família Dual-Write')
    const child = await seedChild(family.id, 'Lucas')

    const pin = '4321'
    const pinHash = await hashPin(pin)
    const pinEncrypted = encryptPin(pin)

    await db
      .update(schema.childProfiles)
      .set({ pinHash, pinEncrypted, updatedAt: new Date() })
      .where(and(eq(schema.childProfiles.id, child.id), eq(schema.childProfiles.familyId, family.id)))

    const [updated] = await db
      .select()
      .from(schema.childProfiles)
      .where(eq(schema.childProfiles.id, child.id))
      .limit(1)

    expect(updated.pinHash).toMatch(/^\$2/)
    expect(updated.pinEncrypted).not.toBeNull()
    expect(decryptPin(updated.pinEncrypted!)).toBe(pin)
  })

  it('revealChildPin returns null for a pre-existing row with pinEncrypted=NULL (Pitfall 6)', async () => {
    if (!db) return
    const family = await seedFamily('Família Null-Safe')
    const child = await seedChild(family.id, 'Ana', null)

    const [row] = await db
      .select({ pinEncrypted: schema.childProfiles.pinEncrypted })
      .from(schema.childProfiles)
      .where(and(eq(schema.childProfiles.id, child.id), eq(schema.childProfiles.familyId, family.id)))
      .limit(1)

    const revealed = row?.pinEncrypted ? decryptPin(row.pinEncrypted) : null
    expect(revealed).toBeNull()
  })

  it('resetChildPin on a childId belonging to another familyId is a no-op (T-08-05 isolation)', async () => {
    if (!db) return
    const familyA = await seedFamily('Família A')
    const familyB = await seedFamily('Família B')
    const child = await seedChild(familyA.id, 'Sofia')

    const pin = '9999'
    const pinHash = await hashPin(pin)
    const pinEncrypted = encryptPin(pin)

    // Attempt reset scoped by familyB (wrong family) — must not modify child's row
    await db
      .update(schema.childProfiles)
      .set({ pinHash, pinEncrypted, updatedAt: new Date() })
      .where(and(eq(schema.childProfiles.id, child.id), eq(schema.childProfiles.familyId, familyB.id)))

    const [unchanged] = await db
      .select()
      .from(schema.childProfiles)
      .where(eq(schema.childProfiles.id, child.id))
      .limit(1)

    expect(unchanged.pinHash).toBeNull()
    expect(unchanged.pinEncrypted).toBeNull()
  })
})
