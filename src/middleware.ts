import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const CHILD_SESSION_COOKIE = 'child-session'

// HTTP vs HTTPS — next-auth v5 usa __Secure- prefix em HTTPS
//
// NÃO usar apenas `url.startsWith('https')`: atrás do nginx-ingress (TLS terminado
// no ingress, force-ssl-redirect:true, tráfego ingress->pod em HTTP puro), o
// NextRequest.url visto pelo processo Next.js (output:'standalone') reflete o
// esquema da CONEXÃO INTERNA (http://), não o esquema real usado pelo browser.
// Isso é comportamento documentado do Next.js: não existe "trust proxy" nativo
// para middleware/proxy — ver vercel/next.js#54450, #59904, nextauthjs/next-auth#13377.
// Auth.js resolve isso corretamente (via trustHost + x-forwarded-proto) e por isso
// SEMPRE emite cookies com prefixo __Secure-/__Host- em produção. O middleware deve
// usar o mesmo sinal (x-forwarded-proto), com fallback para o esquema de req.url
// apenas quando o header não estiver presente (dev local sem proxy).
function nextAuthCookieName(req: NextRequest): string {
  const forwardedProto = req.headers.get('x-forwarded-proto')
  const isHttps = forwardedProto ? forwardedProto.split(',')[0].trim() === 'https' : req.url.startsWith('https')
  return isHttps ? '__Secure-authjs.session-token' : 'authjs.session-token'
}

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl

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
      // Não confiar em nenhum campo de um token expirado ou inválido
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  // Branch /family/* e /guardian/* — verificação de cookie next-auth (cookie-check heurístico)
  // AVISO DE SEGURANÇA: apenas a presença do cookie é verificada aqui, não a assinatura ou expiração.
  // Cada Server Component sob /family/* e /guardian/* DEVE chamar auth() independentemente
  // para re-validar a sessão. Esse check só evita roundtrips desnecessários para usuários
  // sem cookie algum. Ver WR-05 no REVIEW.md para contexto.
  if (pathname.startsWith('/family/') || pathname.startsWith('/guardian/')) {
    // T-PR6-01/02: child-session guard roda ANTES do check de presença do next-auth.
    // Um child-session verificado (role=child) tem precedência mesmo com cookie next-auth
    // presente no mesmo dispositivo — impede escalonamento de privilégio. Tokens não
    // verificáveis (expirados/malformados) NUNCA são confiados e caem no fluxo existente.
    const childSessionValue = req.cookies.get(CHILD_SESSION_COOKIE)?.value

    if (childSessionValue) {
      try {
        const secret = new TextEncoder().encode(process.env.CHILD_SESSION_SECRET!)
        const { payload } = await jwtVerify(childSessionValue, secret)

        if (payload.role === 'child') {
          const familyId = (payload as Record<string, unknown>).familyId as string
          return NextResponse.redirect(new URL(`/family/access/${familyId}`, req.url))
        }
      } catch {
        // Não confiar em nenhum campo de um token expirado ou inválido — cair no check next-auth
      }
    }

    const cookieName = nextAuthCookieName(req)
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
