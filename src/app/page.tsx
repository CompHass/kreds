import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '../../auth'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { resolveKredsIdentityId } from '@/lib/auth/authorization'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const session = await auth()

  if (!session?.user?.id) {
    return <LandingScreen />
  }

  let kredsIdentityId: string | null = null
  try {
    kredsIdentityId = await resolveKredsIdentityId(session.user.id)
  } catch {
    return <LandingScreen />
  }

  if (!kredsIdentityId) {
    return <OnboardingScreen />
  }

  const memberships = await db
    .select({ familyId: schema.familyMemberships.familyId })
    .from(schema.familyMemberships)
    .where(eq(schema.familyMemberships.identityId, kredsIdentityId))
    .limit(1)

  if (memberships.length === 0) {
    return <OnboardingScreen />
  }

  redirect('/family/children')
}

function LandingScreen() {
  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '32px',
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '28px',
          display: 'grid',
          placeItems: 'center',
          fontSize: '40px',
          background: 'radial-gradient(circle, #fff3b8, #d2a501 58%, #8b6a08)',
          boxShadow: '0 18px 38px rgba(210,165,1,.24), inset 0 3px 0 rgba(255,255,255,.46)',
        }}>
          🧺
        </div>

        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontFamily: 'var(--font-heading, "Plus Jakarta Sans", system-ui, sans-serif)',
            fontWeight: 800,
            fontSize: '2.7rem',
            letterSpacing: '-0.025em',
            color: 'var(--color-primary, #154212)',
            margin: '0 0 8px',
          }}>
            Kreds
          </h1>
          <p style={{
            fontSize: '1rem',
            color: 'var(--color-text-muted, #42493e)',
            margin: 0,
            lineHeight: 1.5,
          }}>
            Mordomia cristã para famílias
          </p>
        </div>

        <div style={{
          width: '100%',
          background: 'var(--color-card, rgba(255,255,255,0.64))',
          border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
          borderRadius: 'var(--radius-xl, 36px)',
          boxShadow: 'var(--shadow-soft, 0 18px 55px rgba(45,90,39,0.1))',
          backdropFilter: 'blur(22px)',
          padding: '32px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}>
          <div>
            <p style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted, #42493e)',
              margin: '0 0 6px',
            }}>
              Acesso familiar
            </p>
            <p style={{
              fontSize: '0.9375rem',
              color: 'var(--color-text-soft, #72796e)',
              margin: 0,
              lineHeight: 1.5,
            }}>
              Entre com sua conta para gerenciar a mordomia da sua família.
            </p>
          </div>

          <Link
            href="/api/auth/signin"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '52px',
              borderRadius: 'var(--radius-full, 9999px)',
              background: 'linear-gradient(135deg, #3b6934, #154212)',
              boxShadow: 'inset 0 2px 0 rgba(255,223,144,0.38), 0 18px 55px rgba(45,90,39,0.1)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '1rem',
              textDecoration: 'none',
            }}
          >
            Entrar com ZITADEL
          </Link>
        </div>

        <p style={{
          fontSize: '0.8125rem',
          color: 'var(--color-text-soft, #72796e)',
          margin: 0,
          textAlign: 'center',
        }}>
          Acesso exclusivo para famílias cadastradas.
        </p>
      </div>
    </main>
  )
}

function OnboardingScreen() {
  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '32px',
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '28px',
          display: 'grid',
          placeItems: 'center',
          fontSize: '40px',
          background: 'radial-gradient(circle, #fff3b8, #d2a501 58%, #8b6a08)',
          boxShadow: '0 18px 38px rgba(210,165,1,.24), inset 0 3px 0 rgba(255,255,255,.46)',
        }}>
          🧺
        </div>

        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontFamily: 'var(--font-heading, "Plus Jakarta Sans", system-ui, sans-serif)',
            fontWeight: 800,
            fontSize: '2rem',
            letterSpacing: '-0.025em',
            color: 'var(--color-primary, #154212)',
            margin: '0 0 8px',
          }}>
            Bem-vindo ao Kreds
          </h1>
          <p style={{
            fontSize: '1rem',
            color: 'var(--color-text-muted, #42493e)',
            margin: 0,
            lineHeight: 1.5,
          }}>
            Você está conectado. Vamos configurar sua família.
          </p>
        </div>

        <div style={{
          width: '100%',
          background: 'var(--color-card, rgba(255,255,255,0.64))',
          border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
          borderRadius: 'var(--radius-xl, 36px)',
          boxShadow: 'var(--shadow-soft, 0 18px 55px rgba(45,90,39,0.1))',
          backdropFilter: 'blur(22px)',
          padding: '32px 28px',
        }}>
          <Link
            href="/family/onboarding"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '52px',
              borderRadius: 'var(--radius-full, 9999px)',
              background: 'linear-gradient(135deg, #3b6934, #154212)',
              boxShadow: 'inset 0 2px 0 rgba(255,223,144,0.38), 0 18px 55px rgba(45,90,39,0.1)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '1rem',
              textDecoration: 'none',
            }}
          >
            Criar minha família
          </Link>
        </div>
      </div>
    </main>
  )
}
