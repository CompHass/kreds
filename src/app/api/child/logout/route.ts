import { NextResponse } from 'next/server'

function createLogoutResponse() {
  const response = NextResponse.redirect(new URL('/', process.env.NEXTAUTH_URL ?? 'http://localhost:3000'))

  response.cookies.set('child-session', '', {
    httpOnly: true,
    maxAge: 0,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })

  return response
}

export async function POST() {
  return createLogoutResponse()
}

export async function GET() {
  return createLogoutResponse()
}
