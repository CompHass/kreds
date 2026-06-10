import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify, decodeJwt } from 'jose'

const CHILD_SESSION_COOKIE = 'child-session'
const NEXTAUTH_COOKIE_DEV = 'authjs.session-token'
const NEXTAUTH_COOKIE_PROD = '__Secure-authjs.session-token'

const PUBLIC_PREFIXES = ['/', '/api/auth', '/api/child', '/family/access']

/**
 * Check if a pathname is public (no auth required).
 * Exact match on '/' or startsWith for prefixes.
 */
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'))
}

/**
 * Extract familyId from a JWT token without verifying signature.
 * Used only for redirect routing when token is invalid/expired.
 * Returns null if token is malformed or familyId missing.
 */
function extractFamilyIdFromToken(token: string): string | null {
  try {
    const payload = decodeJwt(token)
    if (typeof payload.familyId === 'string') {
      return payload.familyId
    }
    return null
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public paths pass through without verification
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // Child routes require child-session JWT
  if (pathname.startsWith('/child/')) {
    const token = request.cookies.get(CHILD_SESSION_COOKIE)?.value

    if (!token) {
      // No token → redirect to home
      return NextResponse.redirect(new URL('/', request.url))
    }

    try {
      const secret = new TextEncoder().encode(process.env.CHILD_SESSION_SECRET!)
      const { payload } = await jwtVerify(token, secret)

      // Verify token has correct role
      if (payload.role !== 'child') {
        throw new Error('Token role is not child')
      }

      // Token is valid → allow request
      return NextResponse.next()
    } catch {
      // Token invalid/expired → try to extract familyId for redirect
      const familyId = extractFamilyIdFromToken(token)
      if (familyId) {
        return NextResponse.redirect(new URL(`/family/access/${familyId}`, request.url))
      }
      // Cannot extract familyId → redirect to home
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Family and Guardian routes require NextAuth session
  if (pathname.startsWith('/family/') || pathname.startsWith('/guardian/')) {
    const isSecure = request.url.startsWith('https')
    const cookieName = isSecure ? NEXTAUTH_COOKIE_PROD : NEXTAUTH_COOKIE_DEV
    const sessionToken = request.cookies.get(cookieName)?.value

    if (!sessionToken) {
      return NextResponse.redirect(new URL('/api/auth/signin', request.url))
    }

    return NextResponse.next()
  }

  // Fallthrough for any other routes
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.ico$|sw\\.js$).*)'],
}
