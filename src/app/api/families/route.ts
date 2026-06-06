import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'

export async function GET() {
  const rows = await db.select().from(schema.families)
  return NextResponse.json(rows)
}
