import { redirect } from 'next/navigation'
import { auth } from '../../../../auth'
import { listFamilyAuditTimeline } from '@/lib/families/audit'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { and, eq, asc } from 'drizzle-orm'
import Link from 'next/link'
import { resolveKredsIdentityId } from '@/lib/auth/authorization'
import { BottomNav } from '@/components/BottomNav'

export const dynamic = 'force-dynamic'

/**
 * Human-readable labels for audit event types (D-18).
 */
function eventLabel(eventType: string): string {
  const labels: Record<string, string> = {
    'family.created': 'Família Criada',
    'membership.created': 'Membro Adicionado',
    'invitation.created': 'Convite Enviado',
    'invitation.accepted': 'Convite Aceito',
    'invitation.declined': 'Convite Recusado',
    'invitation.revoked': 'Convite Revogado',
    'role.changed': 'Papel Alterado',
    'consent.granted': 'Consentimento Concedido',
    'child_profile.created': 'Perfil de Filho Criado',
    'child_profile.updated': 'Perfil de Filho Atualizado',
    'child_profile.deactivated': 'Perfil de Filho Desativado',
    child_login_success: 'Login bem-sucedido',
    child_login_failed: 'Tentativa de login falhou',
  }
  return labels[eventType] ?? eventType
}

function eventAccent(eventType: string): { color: string; background: string } {
  if (eventType === 'child_login_success') {
    return { color: '#166534', background: 'rgba(187, 247, 208, 0.7)' }
  }

  if (eventType === 'child_login_failed') {
    return { color: '#a16207', background: 'rgba(254, 240, 138, 0.7)' }
  }

  return {
    color: 'var(--color-gold, #d2a501)',
    background: 'var(--color-gold-soft, rgba(255, 223, 144, 0.48))',
  }
}

/**
 * Formats a Date to a readable timestamp string.
 */
function formatTimestamp(date: Date): string {
  return date.toLocaleString('pt-BR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatLastAccess(date: Date | null): string {
  if (!date) {
    return 'Nunca acessou'
  }

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function AuditPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/api/auth/signin')
  }

  const zitadelSub = session.user.id as string

  // Resolve the Kreds UUID — membership columns use the DB UUID, not the ZITADEL sub string
  let kredsIdentityId: string
  try {
    kredsIdentityId = await resolveKredsIdentityId(zitadelSub)
  } catch {
    redirect('/family/onboarding')
  }

  // Find the guardian's active family membership
  const [membership] = await db
    .select({
      familyId: schema.familyMemberships.familyId,
    })
    .from(schema.familyMemberships)
    .where(eq(schema.familyMemberships.identityId, kredsIdentityId))
    .limit(1)

  if (!membership) {
    redirect('/family/onboarding')
  }

  let timeline: Awaited<ReturnType<typeof listFamilyAuditTimeline>>
  try {
    timeline = await listFamilyAuditTimeline(kredsIdentityId, membership.familyId)
  } catch {
    return (
      <main style={{ minHeight: '100vh', padding: '32px 24px', textAlign: 'center' }}>
        <h1 style={{ color: 'var(--color-primary, #154212)' }}>Trilha de Auditoria</h1>
        <p>Ocorreu um erro ao carregar o histórico. Tente novamente mais tarde.</p>
        <Link href="/">Voltar ao início</Link>
      </main>
      )
  }

  const childAccessRows = await db
    .select({
      id: schema.childProfiles.id,
      displayName: schema.childProfiles.displayName,
      lastAccessedAt: schema.childProfiles.lastAccessedAt,
    })
    .from(schema.childProfiles)
    .where(
      and(
        eq(schema.childProfiles.familyId, membership.familyId),
        eq(schema.childProfiles.active, true),
      ),
    )
    .orderBy(asc(schema.childProfiles.displayName))

  return (
    <main style={{
      minHeight: '100vh',
      padding: '32px 24px 100px',
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
              Auditoria
            </h1>
            <p style={{
              fontSize: '0.8125rem',
              color: 'var(--color-text-soft, #72796e)',
              margin: 0,
            }}>
              Histórico de alterações
            </p>
          </div>
        </div>

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
          Voltar
        </Link>
      </div>

      <p style={{
        fontSize: '0.875rem',
        color: 'var(--color-text-soft, #72796e)',
        margin: '0 0 24px',
        lineHeight: 1.5,
      }}>
        Registro completo de mudanças na identidade, membros, convites e perfis da sua família.
      </p>

      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        <h2 style={{ fontSize: '1rem', color: 'var(--color-primary, #154212)', margin: 0 }}>
          Último acesso dos filhos
        </h2>
        {childAccessRows.map((child) => (
          <article
            key={child.id}
            style={{
              padding: '16px 18px',
              background: 'var(--color-card, rgba(255,255,255,0.64))',
              border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
              borderRadius: '20px',
              boxShadow: '0 4px 16px rgba(45,90,39,0.06)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-primary, #154212)', margin: '0 0 4px' }}>
              {child.displayName}
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-soft, #72796e)', margin: 0 }}>
              {formatLastAccess(child.lastAccessedAt)}
            </p>
          </article>
        ))}
      </section>

      {timeline.length === 0 ? (
        <div style={{
          padding: '48px 24px',
          textAlign: 'center',
          background: 'var(--color-card, rgba(255,255,255,0.64))',
          borderRadius: '28px',
          border: '1px dashed var(--color-border, rgba(45,90,39,0.16))',
          backdropFilter: 'blur(12px)',
        }}>
          <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-soft, #72796e)', margin: 0 }}>
            Nenhum evento registrado ainda.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {timeline.map((event) => (
            <article key={event.id} style={{
              padding: '20px',
              background: 'var(--color-card, rgba(255,255,255,0.64))',
              border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
              borderRadius: '24px',
              boxShadow: '0 4px 16px rgba(45,90,39,0.06)',
              backdropFilter: 'blur(12px)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: eventAccent(event.eventType).color,
                  background: eventAccent(event.eventType).background,
                  padding: '2px 8px',
                  borderRadius: '6px',
                }}>
                  {event.subjectType}
                </span>
                <time dateTime={event.createdAt.toISOString()} style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-text-soft, #72796e)',
                }}>
                  {formatTimestamp(event.createdAt)}
                </time>
              </div>
              
              <h3 style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--color-primary, #154212)',
                margin: '0 0 6px',
              }}>
                {eventLabel(event.eventType)}
              </h3>
              
              <p style={{
                fontSize: '0.875rem',
                color: 'var(--color-text-muted, #42493e)',
                margin: 0,
                lineHeight: 1.4,
              }}>
                {event.summary}
              </p>
            </article>
          ))}
        </div>
      )}

      <BottomNav active="perfil" />
    </main>
  )
}
