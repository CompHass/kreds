import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '../../../../auth'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { requireAuthenticatedIdentity, resolveKredsIdentityId } from '@/lib/auth/authorization'
import {
  INVITATION_STATUS,
} from '@/lib/families/invitations'
import InviteFormClient from './InviteFormClient'
import { BottomNav } from '@/components/BottomNav'

export const dynamic = 'force-dynamic'

/**
 * Guardian invitation management page (D-05, D-06).
 *
 * - Only active guardians can access this page
 * - Shows invitation creation form with email input
 * - Lists all invitations for the current family with status
 * - Provides revoke button for pending invitations
 * - Shows copyable invitation link on creation
 */
export default async function InvitationsPage() {
  const session = await auth()

  // Guard: must be authenticated
  let identity
  try {
    identity = requireAuthenticatedIdentity(session)
  } catch {
    redirect('/api/auth/signin')
  }

  // Resolve Kreds UUID from ZITADEL sub — membership columns use the DB UUID, not the sub string
  let kredsIdentityId: string
  try {
    kredsIdentityId = await resolveKredsIdentityId(identity.zitadelSub)
  } catch {
    redirect('/family/onboarding')
  }

  // Find the user's active guardian membership
  const memberships = await db
    .select({
      familyId: schema.familyMemberships.familyId,
      role: schema.familyMemberships.role,
      status: schema.familyMemberships.status,
    })
    .from(schema.familyMemberships)
    .where(
      and(
        eq(schema.familyMemberships.identityId, kredsIdentityId),
        eq(schema.familyMemberships.role, 'guardian'),
        eq(schema.familyMemberships.status, 'active'),
      ),
    )
    .limit(1)

  if (memberships.length === 0) {
    return (
      <main>
        <h1>Invitations</h1>
        <p>Only active guardians can manage invitations.</p>
        <a href="/">Return home</a>
      </main>
    )
  }

  const membership = memberships[0]
  const familyId = membership.familyId

  // Fetch existing invitations for this family — explicit column selection excludes token_hash (WR-05)
  const invitations = await db
    .select({
      id: schema.guardianInvitations.id,
      email: schema.guardianInvitations.email,
      status: schema.guardianInvitations.status,
      invitedByIdentityId: schema.guardianInvitations.invitedByIdentityId,
      acceptedByIdentityId: schema.guardianInvitations.acceptedByIdentityId,
      expiresAt: schema.guardianInvitations.expiresAt,
      createdAt: schema.guardianInvitations.createdAt,
    })
    .from(schema.guardianInvitations)
    .where(eq(schema.guardianInvitations.familyId, familyId))
    .orderBy(desc(schema.guardianInvitations.createdAt))

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
              Guardiões
            </h1>
            <p style={{
              fontSize: '0.8125rem',
              color: 'var(--color-text-soft, #72796e)',
              margin: 0,
            }}>
              Gestão de convites
            </p>
          </div>
        </div>

        <Link
          href="/family/children"
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

      {/* Invitation creation form */}
      <section style={{
        background: 'var(--color-card, rgba(255,255,255,0.64))',
        border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
        borderRadius: '28px',
        boxShadow: 'var(--shadow-soft, 0 18px 55px rgba(45,90,39,0.1))',
        backdropFilter: 'blur(22px)',
        padding: '24px',
        marginBottom: '32px',
      }}>
        <h2 style={{
          fontSize: '1rem',
          fontWeight: 800,
          color: 'var(--color-primary, #154212)',
          margin: '0 0 8px',
        }}>
          Convidar Guardião
        </h2>
        <p style={{
          fontSize: '0.875rem',
          color: 'var(--color-text-soft, #72796e)',
          margin: '0 0 20px',
          lineHeight: 1.5,
        }}>
          Convide outro adulto (ex: cônjuge) para ajudar na gestão da mordomia da família.
        </p>

        <InviteFormClient />
      </section>

      {/* Existing invitations list */}
      <section>
        <p style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--color-text-muted, #42493e)',
          margin: '0 0 12px',
        }}>
          Convites Enviados ({invitations.length})
        </p>
        
        {invitations.length === 0 ? (
          <div style={{
            padding: '24px',
            textAlign: 'center',
            background: 'rgba(255,255,255,0.4)',
            borderRadius: '20px',
            border: '1px dashed var(--color-border, rgba(45,90,39,0.16))',
          }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-soft, #72796e)', margin: 0 }}>
              Nenhum convite enviado ainda.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {invitations.map((inv) => (
              <div key={inv.id} style={{
                padding: '16px 20px',
                background: 'var(--color-card, rgba(255,255,255,0.64))',
                border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backdropFilter: 'blur(12px)',
              }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-primary, #154212)', margin: 0 }}>
                    {inv.email}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-soft, #72796e)', margin: 0 }}>
                    Status: <span style={{ 
                      fontWeight: 600, 
                      color: inv.status === INVITATION_STATUS.PENDING ? '#d2a501' : 
                             inv.status === INVITATION_STATUS.ACCEPTED ? '#3b6934' : '#72796e'
                    }}>
                      {inv.status === INVITATION_STATUS.PENDING ? 'Pendente' : 
                       inv.status === INVITATION_STATUS.ACCEPTED ? 'Aceito' : 
                       inv.status === INVITATION_STATUS.EXPIRED ? 'Expirado' : inv.status}
                    </span>
                  </p>
                </div>

                {inv.status === INVITATION_STATUS.PENDING && (
                  <form action="/api/families/invitations" method="POST">
                    <input type="hidden" name="action" value="revoke" />
                    <input type="hidden" name="invitationId" value={inv.id} />
                    <button type="submit" style={{
                      fontSize: '0.75rem',
                      color: '#b91c1c',
                      background: 'rgba(220,38,38,0.08)',
                      border: '1px solid rgba(220,38,38,0.2)',
                      borderRadius: '99px',
                      padding: '6px 12px',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}>
                      Revogar
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <BottomNav active="perfil" />
    </main>
  )
}
