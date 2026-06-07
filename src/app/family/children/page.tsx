import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '../../../../auth'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireAuthenticatedIdentity, resolveKredsIdentityId } from '@/lib/auth/authorization'
import { listActiveChildProfiles } from '@/lib/families/child-profiles'
import { AVATAR_PRESETS, ACCENT_COLORS, type AvatarPreset, type AccentColor } from '@/lib/families/avatar-presets'
import ChildrenForm from './ChildrenForm'
import { deactivateChildAction } from './actions'

export const dynamic = 'force-dynamic'

// Sylvan accent color → CSS map
const ACCENT_CSS: Record<string, string> = {
  moss: '#3b6934',
  gold: '#d2a501',
  sky: '#0369a1',
  berry: '#9333ea',
  clay: '#c2410c',
  sage: '#65a30d',
}

export default async function FamilyChildrenPage({
  searchParams,
}: {
  searchParams?: Promise<{ success?: string }>
}) {
  const session = await auth()

  let identity
  try {
    identity = requireAuthenticatedIdentity(session)
  } catch {
    redirect('/api/auth/signin')
  }

  let kredsIdentityId: string
  try {
    kredsIdentityId = await resolveKredsIdentityId(identity.zitadelSub)
  } catch {
    redirect('/family/onboarding')
  }

  const [membership] = await db
    .select({ familyId: schema.familyMemberships.familyId })
    .from(schema.familyMemberships)
    .where(eq(schema.familyMemberships.identityId, kredsIdentityId))
    .limit(1)

  if (!membership) redirect('/family/onboarding')

  const familyId = membership.familyId
  const children = await listActiveChildProfiles(familyId)
  const params = searchParams ? await searchParams : undefined
  const showAdditionDecision = params?.success === '1' && children.length > 0

  const [family] = await db
    .select({ name: schema.families.name })
    .from(schema.families)
    .where(eq(schema.families.id, familyId))
    .limit(1)

  const avatarOptions = (Object.entries(AVATAR_PRESETS) as [AvatarPreset, string][]).map(
    ([key, label]) => ({ key, label }),
  )
  const accentOptions = (Object.entries(ACCENT_COLORS) as [AccentColor, string][]).map(
    ([key, label]) => ({ key, label }),
  )

  return (
    <main style={{
      minHeight: '100vh',
      padding: '32px 24px 64px',
      maxWidth: '480px',
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '32px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '16px',
            display: 'grid',
            placeItems: 'center',
            fontSize: '24px',
            background: 'radial-gradient(circle, #fff3b8, #d2a501 58%, #8b6a08)',
            boxShadow: '0 8px 20px rgba(210,165,1,.2)',
            flexShrink: 0,
          }}>
            🧺
          </div>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-heading, "Plus Jakarta Sans", system-ui, sans-serif)',
              fontWeight: 800,
              fontSize: '1.25rem',
              letterSpacing: '-0.02em',
              color: 'var(--color-primary, #154212)',
              margin: 0,
            }}>
              {family?.name ?? 'Minha Família'}
            </h1>
            <p style={{
              fontSize: '0.8125rem',
              color: 'var(--color-text-soft, #72796e)',
              margin: 0,
            }}>
              Perfis de filhos
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Link
            href="/family/invitations"
            style={{
              fontSize: '0.8125rem',
              color: 'var(--color-primary, #154212)',
              textDecoration: 'none',
              padding: '8px 14px',
              borderRadius: '99px',
              background: 'rgba(255,255,255,0.82)',
              border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
              fontWeight: 600,
            }}
          >
            Guardiões
          </Link>
          {children.length > 0 && (
            <Link
              href="/family/dashboard"
              style={{
                fontSize: '0.8125rem',
                color: 'var(--color-primary, #154212)',
                textDecoration: 'none',
                padding: '8px 14px',
                borderRadius: '99px',
                background: 'rgba(255,255,255,0.82)',
                border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
                fontWeight: 600,
              }}
            >
              Dashboard
            </Link>
          )}
          <Link
            href="/api/auth/signout"
            style={{
              fontSize: '0.8125rem',
              color: 'var(--color-text-soft, #72796e)',
              textDecoration: 'none',
              padding: '8px 14px',
              borderRadius: '99px',
              border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
            }}
          >
            Sair
          </Link>
        </div>
      </div>

      {/* Active children list */}
      {children.length > 0 && (
        <div style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted, #42493e)',
            margin: '0 0 4px',
          }}>
            Filhos ativos ({children.length})
          </p>
          {children.map((child) => (
            <div key={child.id} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              background: 'var(--color-card, rgba(255,255,255,0.64))',
              border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
              borderRadius: '20px',
              boxShadow: '0 4px 16px rgba(45,90,39,0.06)',
              backdropFilter: 'blur(12px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '14px',
                  background: ACCENT_CSS[child.accentColor] ?? '#154212',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '20px',
                  color: '#fff',
                  fontWeight: 700,
                  flexShrink: 0,
                }}>
                  {child.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{
                    fontWeight: 700,
                    fontSize: '0.9375rem',
                    color: 'var(--color-primary, #154212)',
                    margin: 0,
                  }}>
                    {child.displayName}
                  </p>
                  <p style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-text-soft, #72796e)',
                    margin: 0,
                  }}>
                    {child.ageYears} anos · {AVATAR_PRESETS[child.avatarPreset as AvatarPreset] ?? child.avatarPreset}
                  </p>
                </div>
              </div>

              <form action={deactivateChildAction}>
                <input type="hidden" name="childProfileId" value={child.id} />
                <button
                  type="submit"
                  style={{
                    fontSize: '0.75rem',
                    color: '#b91c1c',
                    background: 'rgba(220,38,38,0.08)',
                    border: '1px solid rgba(220,38,38,0.2)',
                    borderRadius: '99px',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Desativar
                </button>
              </form>
            </div>
          ))}
        </div>
      )}

      {showAdditionDecision ? (
        <div style={{
          background: 'var(--color-card, rgba(255,255,255,0.72))',
          border: '1px solid rgba(45,90,39,0.16)',
          borderRadius: 'var(--radius-xl, 36px)',
          boxShadow: 'var(--shadow-soft, 0 18px 55px rgba(45,90,39,0.1))',
          backdropFilter: 'blur(22px)',
          padding: '28px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}>
          <div>
            <p style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted, #42493e)',
              margin: '0 0 4px',
            }}>
              Filho cadastrado
            </p>
            <h2 style={{
              margin: '0 0 8px',
              fontSize: '1.5rem',
              fontWeight: 800,
              color: 'var(--color-primary, #154212)',
            }}>
              Deseja cadastrar outra criança?
            </h2>
            <p style={{
              fontSize: '0.95rem',
              color: 'var(--color-text-soft, #72796e)',
              margin: 0,
              lineHeight: 1.5,
            }}>
              O perfil foi criado com sucesso. Agora você pode adicionar mais uma criança ou seguir para o dashboard.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link
              href="/family/children"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '52px',
                borderRadius: '9999px',
                background: 'linear-gradient(135deg, #3b6934, #154212)',
                color: '#fff',
                textDecoration: 'none',
                fontWeight: 700,
                boxShadow: 'inset 0 2px 0 rgba(255,223,144,0.38), 0 18px 55px rgba(45,90,39,0.1)',
              }}
            >
              Cadastrar outra criança
            </Link>

            <Link
              href="/family/dashboard"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '52px',
                borderRadius: '9999px',
                background: 'rgba(255,255,255,0.82)',
                color: 'var(--color-primary, #154212)',
                textDecoration: 'none',
                fontWeight: 700,
                border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
              }}
            >
              Ir para o dashboard
            </Link>
          </div>
        </div>
      ) : (
        <div style={{
          background: 'var(--color-card, rgba(255,255,255,0.64))',
          border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
          borderRadius: 'var(--radius-xl, 36px)',
          boxShadow: 'var(--shadow-soft, 0 18px 55px rgba(45,90,39,0.1))',
          backdropFilter: 'blur(22px)',
          padding: '28px 24px',
        }}>
          <p style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted, #42493e)',
            margin: '0 0 4px',
          }}>
            Adicionar filho
          </p>
          <p style={{
            fontSize: '0.9rem',
            color: 'var(--color-text-soft, #72796e)',
            margin: '0 0 20px',
            lineHeight: 1.5,
          }}>
            Crie um perfil para cada filho. Todas as informações ficam dentro da sua conta familiar.
          </p>
          <ChildrenForm avatarOptions={avatarOptions} accentOptions={accentOptions} />
        </div>
      )}

      {children.length === 0 && (
        <p style={{
          fontSize: '0.8125rem',
          color: 'var(--color-text-soft, #72796e)',
          textAlign: 'center',
          marginTop: '24px',
        }}>
          Nenhum filho adicionado ainda.
        </p>
      )}
    </main>
  )
}
