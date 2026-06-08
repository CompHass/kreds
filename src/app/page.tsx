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
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(3deg); }
          50% { transform: translateY(-12px) rotate(3deg); }
        }
        .kreds-float { animation: float 6s ease-in-out infinite; }
      `}</style>

      {/* Atmospheric blobs */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: 'linear-gradient(135deg, rgba(239,246,239,0.8) 0%, rgba(255,248,245,0.9) 100%)',
      }} />
      <div style={{
        position: 'fixed', zIndex: 0, opacity: 0.6, filter: 'blur(80px) brightness(1.1)',
        width: '384px', height: '384px', borderRadius: '9999px',
        background: '#a1d494', top: '-10%', left: '-10%',
        mixBlendMode: 'multiply',
      }} />
      <div style={{
        position: 'fixed', zIndex: 0, opacity: 0.6, filter: 'blur(80px)',
        width: '320px', height: '320px', borderRadius: '9999px',
        background: '#ffdf90', bottom: '-10%', right: '-10%',
        mixBlendMode: 'multiply',
      }} />
      <div style={{
        position: 'fixed', zIndex: 0, opacity: 0.5, filter: 'blur(80px)',
        width: '256px', height: '256px', borderRadius: '9999px',
        background: '#fbddc7', top: '40%', left: '60%',
        mixBlendMode: 'multiply',
      }} />

      <main style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        zIndex: 10,
      }}>
        <div style={{
          width: '100%',
          maxWidth: '400px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          {/* Floating icon */}
          <div className="kreds-float" style={{ marginBottom: '32px', position: 'relative' }}>
            <div style={{
              width: '128px',
              height: '128px',
              borderRadius: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '60px',
              background: '#d2a501',
              boxShadow: '0 20px 40px rgba(210,165,1,.3)',
              transform: 'rotate(3deg)',
            }}>
              🧺
            </div>
            {/* Sparkles */}
            <div style={{
              position: 'absolute', top: '-6px', right: '-6px',
              width: '16px', height: '16px', borderRadius: '9999px',
              background: '#ffdf90',
              boxShadow: '0 0 15px rgba(240,193,44,0.8)',
            }} />
            <div style={{
              position: 'absolute', bottom: '12px', left: '-14px',
              width: '22px', height: '22px', borderRadius: '9999px',
              background: '#a1d494',
              boxShadow: '0 0 15px rgba(161,212,148,0.7)',
            }} />
          </div>

          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h1 style={{
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontWeight: 700,
              fontSize: '40px',
              letterSpacing: '-0.02em',
              lineHeight: '48px',
              color: '#154212',
              margin: '0 0 8px',
            }}>
              Kreds
            </h1>
            <p style={{
              fontSize: '16px',
              color: '#42493e',
              margin: 0,
              lineHeight: 1.5,
            }}>
              Mordomia cristã para famílias
            </p>
          </div>

          {/* Glass card */}
          <div style={{
            width: '100%',
            background: 'rgba(255,248,245,0.6)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(114,121,110,0.1)',
            boxShadow: '0 8px 32px rgba(45,90,39,0.05)',
            borderRadius: '32px',
            padding: '32px',
            marginBottom: '32px',
          }}>
            <p style={{
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#28180b',
              margin: '0 0 8px',
            }}>
              ACESSO FAMILIAR
            </p>
            <p style={{
              fontSize: '16px',
              color: '#42493e',
              margin: '0 0 24px',
              lineHeight: 1.5,
            }}>
              Entre com sua conta para gerenciar a mordomia da sua família.
            </p>
            <Link
              href="/api/auth/signin"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '52px',
                borderRadius: '9999px',
                background: '#154212',
                color: '#fff',
                fontWeight: 700,
                fontSize: '12px',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                transition: 'transform 0.2s',
              }}
            >
              ENTRAR COM ZITADEL
            </Link>
          </div>

          <p style={{
            fontSize: '12px',
            color: '#42493e',
            margin: 0,
            textAlign: 'center',
            opacity: 0.7,
            letterSpacing: '0.04em',
          }}>
            Acesso exclusivo para famílias cadastradas.
          </p>
        </div>
      </main>
    </>
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
