import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PostgreSqlContainer } from '@testcontainers/postgresql'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import * as schema from '../../src/lib/db/schema'

describe('PostgreSQL Connection with Migrations', () => {
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

  it('should connect and execute a query', async () => {
    const result = await db.execute('SELECT 1 as value')
    expect(result.rows[0].value).toBe(1)
  })

  it('should have families table queryable after migration', async () => {
    const rows = await db.select().from(schema.families)
    expect(Array.isArray(rows)).toBe(true)
    expect(rows.length).toBe(0)
  })
})
