import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const CHILD_SESSION_COOKIE = 'child-session'
const GUARDIAN_SESSION_COOKIE = 'guardian-session'

// Phase 13 — guardian step-up routes that bypass the guardian-session gate.
// They are the entry points to the gate itself, so they must be reachable
// without a guardian-session. The server components inside still call auth()
// to confirm the next-auth (base) identity before doing anything sensitive.
const GUARDIAN_STEPUP_PATH = /^\/family\/[^/]+\/(guardian-login|guardian-setup)$/

// HTTP vs HTTPS — next-auth v5 usa __Secure- prefix em HTTPS.
//
// Histórico (Phase ≤12): este helper resolvia o nome do cookie next-auth para o
// antigo check de PRESENÇA de sessão em /family/*. Phase 13 removeu esse check —
// o gate de /family/* agora é o guardian-session JWT, independente do nome do
// cookie next-auth. Mantemos a nota abaixo pelo contexto de deploy, mas a função
// em si foi removida por ficar sem chamadores.
//
// NÃO usar apenas `url.startsWith('https')`: atrás do nginx-ingress (TLS
// terminado no ingress, force-ssl-redirect:true, tráfego ingress->pod em HTTP
// puro), o NextRequest.url visto pelo processo Next.js (output:'standalone')
// reflete o esquema da CONEXÃO INTERNA (http://), não o real. Auth.js resolve
// isso via trustHost + x-forwarded-proto e por isso emite cookies com prefixo
// __Secure-/__Host- em produção.

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl

  // Rotas públicas — pass-through sem verificação de sessão
  // ORDEM IMPORTA: /family/access/ deve ser avaliado ANTES de /family/
  // /child/*/login é a tela de entrada do PIN — sem sessão ainda
  // Phase 13: /family/{id}/guardian-login|guardian-setup são a entrada do gate
  //   step-up do guardião — o server component interno chama auth().
  if (
    pathname === '/' ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/child/') ||
    pathname.startsWith('/family/access/') ||
    pathname.startsWith('/login') ||
    /^\/child\/[^/]+\/login$/.test(pathname) ||
    GUARDIAN_STEPUP_PATH.test(pathname)
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

  // Branch /family/* e /guardian/* — Phase 13: guardian step-up obrigatório.
  // Até a Phase 12 isto checava apenas PRESENÇA do cookie next-auth, o que num
  // dispositivo compartilhado (cookie do guardião sempre presente) deixava uma
  // criança entrar no painel via URL direta. Agora exigimos um guardian-session
  // JWT criptograficamente válido, com familyId batendo com o da URL.
  //
  // O guardian-session só é emitido por guardian-pin.ts (verifyGuardianPin /
  // setGuardianPin) APÓS confirmar membership ativo de guardião via
  // resolveGuardianMembership(). next-auth continua sendo a authn base; este
  // cookie é a authz step-up "você provou ser guardião desta família agora".
  if (pathname.startsWith('/family/') || pathname.startsWith('/guardian/')) {
    // T-PR6-01/02: child-session guard roda ANTES do check do guardian-session.
    // Um child-session verificado (role=child) tem precedência — impede
    // escalonamento de privilégio e manda de volta ao seletor de perfis.
    // Tokens não verificáveis (expirados/malformados) NUNCA são confiados.
    const childSessionValue = req.cookies.get(CHILD_SESSION_COOKIE)?.value

    if (childSessionValue) {
      try {
        const childSecret = new TextEncoder().encode(process.env.CHILD_SESSION_SECRET!)
        const { payload } = await jwtVerify(childSessionValue, childSecret)

        if (payload.role === 'child') {
          const familyId = (payload as Record<string, unknown>).familyId as string
          return NextResponse.redirect(new URL(`/family/access/${familyId}`, req.url))
        }
      } catch {
        // Não confiar em nenhum campo de um token expirado ou inválido — prossegue
      }
    }

    // Extrai o familyId da URL (/family/{familyId}/...) para comparar com o token.
    // Se a rota não casar com /family/{id}/..., não há como validar escopo — nega.
    const pathMatch = pathname.match(/^\/family\/([^/]+)(?:\/|$)/)
    const urlFamilyId = pathMatch?.[1]

    const guardianSessionValue = req.cookies.get(GUARDIAN_SESSION_COOKIE)?.value

    if (!guardianSessionValue || !urlFamilyId) {
      // Sem step-up: manda ao seletor de perfis, de onde o guardião entra via PIN.
      // (next-auth pode estar presente — não é mais suficiente por si só.)
      return NextResponse.redirect(new URL(`/family/access/${urlFamilyId ?? ''}`, req.url))
    }

    try {
      const guardianSecret = new TextEncoder().encode(
        process.env.GUARDIAN_SESSION_SECRET ?? process.env.CHILD_SESSION_SECRET!,
      )
      const { payload } = await jwtVerify(guardianSessionValue, guardianSecret)

      const tokenFamilyId = (payload as Record<string, unknown>).familyId as string
      const tokenRole = payload.role

      // Escopo obrigatório: role guardião E familyId do token == familyId da URL.
      // Impede que um step-up emitido para a família A desbloqueie a família B.
      if (tokenRole !== 'guardian' || tokenFamilyId !== urlFamilyId) {
        return NextResponse.redirect(new URL(`/family/access/${urlFamilyId}`, req.url))
      }

      return NextResponse.next()
    } catch {
      // Token expirado, malformado ou assinatura inválida — exige PIN de novo.
      return NextResponse.redirect(new URL(`/family/access/${urlFamilyId}`, req.url))
    }
  }

  // Fallback — rotas não mapeadas passam livremente
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg|sw\\.js).*)'],
}
