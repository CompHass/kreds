import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    version: process.env.npm_package_version || 'dev',
    timestamp: new Date().toISOString(),
  })
}
