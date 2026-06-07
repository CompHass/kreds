import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('ledger migration append-only guards', () => {
  it('prevents update and delete on ledger tables', () => {
    const migration = readFileSync(
      join(process.cwd(), 'drizzle/0003_append_only_ledger_guards.sql'),
      'utf8',
    )

    expect(migration).toContain('prevent_ledger_mutation')
    expect(migration).toContain('BEFORE UPDATE OR DELETE ON "ledger_transactions"')
    expect(migration).toContain('BEFORE UPDATE OR DELETE ON "ledger_lines"')
    expect(migration).toContain('ledger tables are append-only')
  })
})
