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
      const result = await postEarning()

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
      await postEarning()
      await expect(postEarning()).rejects.toMatchObject({ code: '23505' })
    })
  })

  describe('postNegativeAdjustment', () => {
    it('creates a negative available ledger line with a reason', async () => {
      await postNegativeAdjustment()

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
      await postEarning()
      await postReversal()

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
      await postEarning()

      await expect(
        db.update(schema.ledgerLines).set({ amount: 100 }),
      ).rejects.toThrow()
    })
  })
})
