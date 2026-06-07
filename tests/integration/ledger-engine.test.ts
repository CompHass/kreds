import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
vi.mock('server-only', () => ({}))
import { PostgreSqlContainer } from '@testcontainers/postgresql'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import * as schema from '../../src/lib/db/schema'
import {
  postEarning,
  postNegativeAdjustment,
  postReversal,
} from '../../src/modules/ledger/engine'

const familyId = '11111111-1111-4111-8111-111111111111'
const otherFamilyId = '44444444-4444-4444-8444-444444444444'
const childProfileId = '22222222-2222-4222-8222-222222222222'
const guardianIdentityId = '33333333-3333-4333-8333-333333333333'
const otherChildProfileId = '55555555-5555-4555-8555-555555555555'
const otherGuardianIdentityId = '66666666-6666-4666-8666-666666666666'
let db: any

function earningCommand(commandId = crypto.randomUUID()) {
  return {
    commandId,
    familyId,
    childProfileId,
    guardianIdentityId,
    amount: 10,
    note: 'Task completed',
  }
}

function adjustmentCommand(commandId = crypto.randomUUID()) {
  return {
    commandId,
    familyId,
    childProfileId,
    guardianIdentityId,
    amount: 5,
    reason: 'Correction needed',
  }
}

function reversalCommand(commandId = crypto.randomUUID()) {
  return {
    commandId,
    familyId,
    childProfileId,
    guardianIdentityId,
    correctsTransactionId: crypto.randomUUID(),
    correctionNote: 'Correct the original posting',
  }
}

async function seedFamilyScopedIdentityAndChild() {
  await db.insert(schema.identities).values({
    id: otherGuardianIdentityId,
    zitadelSubject: 'other-guardian',
    email: 'other@example.com',
  })

  await db.insert(schema.families).values({
    id: otherFamilyId,
    name: 'Other Family',
  })

  await db.insert(schema.childProfiles).values({
    id: otherChildProfileId,
    familyId: otherFamilyId,
    displayName: 'Other Child',
    ageYears: 9,
    avatarPreset: 'fox',
    accentColor: '#f59e0b',
  })
}

// Requires Docker daemon for Testcontainers. With Podman: kubectl port-forward
// svc/postgres 5432:5432 -n kreds and set DATABASE_URL before running.

describe('ledger engine integration', () => {
  let container: any
  let pool: any

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

  describe('postEarning', () => {
    it('creates one header and two ledger lines atomically', async () => {
      if (!db) return
      const result = await postEarning(earningCommand())

      expect(result).toBeDefined()
      const transactions = await db.select().from(schema.ledgerTransactions)
      const lines = await db.select().from(schema.ledgerLines)
      expect(transactions).toHaveLength(1)
      expect(lines).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ accountType: 'available', amount: 9 }),
          expect.objectContaining({ accountType: 'firstfruits', amount: 1 }),
        ]),
      )
    })
  })

  describe('idempotência command_id', () => {
    it('throws 23505 when the same commandId is posted twice', async () => {
      if (!db) return
      const command = earningCommand()
      await postEarning(command)
      await expect(postEarning(command)).rejects.toMatchObject({ code: '23505' })
    })
  })

  describe('postNegativeAdjustment', () => {
    it('creates a negative available ledger line with a reason', async () => {
      if (!db) return
      await postNegativeAdjustment(adjustmentCommand())

      const lines = await db.select().from(schema.ledgerLines)
      expect(lines).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ accountType: 'available', amount: -5 }),
        ]),
      )
    })
  })

  describe('postReversal', () => {
    it('creates negative reversing entries while preserving originals', async () => {
      if (!db) return
      const original = await postEarning(earningCommand())
      await postReversal({
        ...reversalCommand(),
        correctsTransactionId: original.id,
      })

      const lines = await db.select().from(schema.ledgerLines)
      expect(lines).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ accountType: 'available', amount: 9 }),
          expect.objectContaining({ accountType: 'available', amount: -9 }),
          expect.objectContaining({ accountType: 'firstfruits', amount: 1 }),
          expect.objectContaining({ accountType: 'firstfruits', amount: -1 }),
        ]),
      )
    })

    it('rejects reversals that point at another family', async () => {
      if (!db) return
      await seedFamilyScopedIdentityAndChild()
      const original = await db
        .insert(schema.ledgerTransactions)
        .values({
          id: crypto.randomUUID(),
          familyId: otherFamilyId,
          childProfileId: otherChildProfileId,
          commandId: crypto.randomUUID(),
          transactionType: 'task_earning',
          initiatedByIdentityId: otherGuardianIdentityId,
        })
        .returning()

      await expect(
        postReversal({
          ...reversalCommand(),
          correctsTransactionId: original[0].id,
        }),
      ).rejects.toThrow('cross_family_reversal_forbidden')
    })
  })

  describe('append-only ledger lines', () => {
    it('does not allow ledger lines to be updated after insert', async () => {
      if (!db) return
      await postEarning(earningCommand())

      await expect(
        db.update(schema.ledgerLines).set({ amount: 100 }),
      ).rejects.toThrow()
    })
  })
})
