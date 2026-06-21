import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify, decodeJwt } from 'jose'

const CHILD_SESSION_COOKIE = 'child-session'

// HTTP vs HTTPS — next-auth v5 usa __Secure- prefix em HTTPS
function nextAuthCookieName(url: string): string {
  return url.startsWith('https') ? '__Secure-authjs.session-token' : 'authjs.session-token'
}

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl
  const url = req.url

  // Rotas públicas — pass-through sem verificação de sessão
  // ORDEM IMPORTA: /family/access/ deve ser avaliado ANTES de /family/
  // /child/*/login é a tela de entrada do PIN — sem sessão ainda
  if (
    pathname === '/' ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/child/') ||
    pathname.startsWith('/family/access/') ||
    pathname.startsWith('/login') ||
    /^\/child\/[^/]+\/login$/.test(pathname)
  ) {
    return NextResponse.next()
  }

  // Branch /child/* — verificação de child-session JWT
  if (pathname.startsWith('/child/')) {
    const cookieValue = req.cookies.get(CHILD_SESSION_COOKIE)?.value

    if (!cookieValue) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    try {
      const secret = new TextEncoder().encode(process.env.CHILD_SESSION_SECRET!)
      const { payload } = await jwtVerify(cookieValue, secret)

      // Verificar role — deve ser 'child'
      if (payload.role !== 'child') {
        const familyId = (payload as Record<string, unknown>).familyId as string
        return NextResponse.redirect(new URL(`/family/access/${familyId}`, req.url))
      }

      return NextResponse.next()
    } catch {
      // Token expirado mas possivelmente decodificável — extrair familyId para redirect contextual
      try {
        const decoded = decodeJwt(cookieValue)
        const familyId = (decoded as Record<string, unknown>).familyId as string | undefined
        if (familyId) {
          return NextResponse.redirect(new URL(`/family/access/${familyId}`, req.url))
        }
      } catch {
        // Token malformado — não decodificável
      }
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  // Branch /family/* e /guardian/* — verificação de cookie next-auth (cookie-check heurístico)
  if (pathname.startsWith('/family/') || pathname.startsWith('/guardian/')) {
    const cookieName = nextAuthCookieName(url)
    const sessionToken = req.cookies.get(cookieName)?.value

    if (!sessionToken) {
      return NextResponse.redirect(new URL('/api/auth/signin', req.url))
    }

    return NextResponse.next()
  }

  // Fallback — rotas não mapeadas passam livremente
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg|sw\\.js).*)'],
}
