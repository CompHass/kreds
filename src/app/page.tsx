import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const families = await db.select().from(schema.families)
  return (
    <main>
      <h1>Kreds</h1>
      <p>Christian stewardship and allowance management for families.</p>
      <p>{families.length} families registered</p>
    </main>
  )
}
