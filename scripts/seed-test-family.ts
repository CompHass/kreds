/**
 * Seed script — cria família de teste + criança com PIN 1234
 * Uso: npx tsx scripts/seed-test-family.ts
 */
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from '../src/lib/db/schema'
import { hashPin } from '../src/lib/families/child-pin'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const db = drizzle(pool, { schema })

async function main() {
  const pinHash = await hashPin('1234')

  const [family] = await db
    .insert(schema.families)
    .values({ name: 'Família Teste' })
    .returning()

  const [child] = await db
    .insert(schema.childProfiles)
    .values({
      familyId: family.id,
      displayName: 'Ana',
      ageYears: 8,
      avatarPreset: 'sprout',
      accentColor: '#5A8A66',
      pinHash,
      active: true,
    })
    .returning()

  console.log('\n✓ Dados de teste criados:')
  console.log(`  familyId : ${family.id}`)
  console.log(`  childId  : ${child.id}`)
  console.log(`  PIN      : 1234`)
  console.log(`\nURLs para testar:`)
  console.log(`  http://localhost:3000/family/access/${family.id}`)
  console.log(`  http://localhost:3000/child/${child.id}/login`)

  await pool.end()
}

main().catch(console.error)
