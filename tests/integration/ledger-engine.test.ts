import { describe, it, expect, beforeAll, afterAll } from 'vitest'
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
const childProfileId = '22222222-2222-4222-8222-222222222222'
const guardianIdentityId = '33333333-3333-4333-8333-333333333333'

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

// Requires Docker daemon for Testcontainers. With Podman: kubectl port-forward
// svc/postgres 5432:5432 -n kreds and set DATABASE_URL before running.

describe('ledger engine integration', () => {
  let container: any
  let pool: any
  let db: any

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:18-alpine').start()
    pool = new Pool({ connectionString: container.getConnectionUri() })
    db = drizzle(pool)
    await migrate(db, { migrationsFolder: './drizzle' })
  }, 60000)

  afterAll(async () => {
    await pool.end()
    await container.stop()
  })

  describe('postEarning', () => {
    it('creates one header and two ledger lines atomically', async () => {
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
      const command = earningCommand()
      await postEarning(command)
      await expect(postEarning(command)).rejects.toMatchObject({ code: '23505' })
    })
  })

  describe('postNegativeAdjustment', () => {
    it('creates a negative available ledger line with a reason', async () => {
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
      await postEarning(earningCommand())
      await postReversal(reversalCommand())

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
  })

  describe('append-only ledger lines', () => {
    it('does not allow ledger lines to be updated after insert', async () => {
      await postEarning(earningCommand())

      await expect(
        db.update(schema.ledgerLines).set({ amount: 100 }),
      ).rejects.toThrow()
    })
  })
})
