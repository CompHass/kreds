import { requireChildSession } from '@/lib/auth/child-guard'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { redirect } from 'next/navigation'
import { eq, desc } from 'drizzle-orm'
import Link from 'next/link'
import { ChildBottomNav } from '@/components/ChildBottomNav'
import { DonationFormClient } from './DonationFormClient'

type ChildDonationsPageProps = {
  params: Promise<{ childId: string }>
}

export const dynamic = 'force-dynamic'

function getStatusBadge(status: string) {
  switch (status) {
    case 'pending':
      return { icon: '⏳', label: 'Pendente', color: '#ca8a04' }
    case 'approved':
      return { icon: '✓', label: 'Aprovada', color: '#15803d' }
    case 'rejected':
      return { icon: '✕', label: 'Recusada', color: '#b91c1c' }
    default:
      return { icon: '•', label: status, color: '#72796e' }
  }
}

function formatTimestamp(value: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value)
}

export default async function ChildDonationsPage({ params }: ChildDonationsPageProps) {
  const { childId } = await params
  const session = await requireChildSession()

  if (session.childProfileId !== childId) {
    redirect(`/child/${session.childProfileId}/donations`)
  }

  const donations = await db
    .select()
    .from(schema.donations)
    .where(eq(schema.donations.childProfileId, session.childProfileId))
    .orderBy(desc(schema.donations.requestedAt))

  return (
    <>
      {/* Fixed TopAppBar */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: 'rgba(255,248,245,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(194,201,187,0.2)',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '9999px',
          overflow: 'hidden',
          background: 'rgba(255,241,233,0.9)',
          border: '2px solid rgba(188,240,174,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
        }}>
          🌿
        </div>
        <h1 style={{
          margin: 0,
          fontSize: '20px',
          fontWeight: 700,
          color: '#154212',
        }}>
          Kreds
        </h1>
        <Link
          href={`/child/${childId}/dashboard`}
          style={{
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '9999px',
            color: '#154212',
            textDecoration: 'none',
            fontSize: '18px',
          }}
        >
          🏠
        </Link>
      </header>

      {/* Atmospheric background */}
      <div style={{
        position: 'fixed',
        zIndex: -1,
        width: '300px',
        height: '300px',
        borderRadius: '9999px',
        background: 'rgba(161,212,148,0.4)',
        filter: 'blur(40px)',
        top: '-100px',
        left: '-100px',
        opacity: 0.4,
      }} />
      <div style={{
        position: 'fixed',
        zIndex: -1,
        width: '250px',
        height: '250px',
        borderRadius: '9999px',
        background: 'rgba(255,223,144,0.4)',
        filter: 'blur(40px)',
        bottom: '100px',
        right: '-50px',
        opacity: 0.4,
      }} />

      <main style={{
        padding: '96px 24px 100px',
        maxWidth: '480px',
        margin: '0 auto',
      }}>

        {/* Page Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{
            margin: '0 0 8px',
            fontSize: '40px',
            fontWeight: 700,
            color: '#2d5a27',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}>
            Kreds do Bem
          </h2>
          <p style={{
            margin: 0,
            fontSize: '16px',
            color: '#42493e',
            lineHeight: 1.5,
          }}>
            Suas doações
          </p>
        </div>

        {/* Donation Form */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: '#2d5a27' }}>
            Doe Kreds
          </h3>
          <DonationFormClient childId={childId} />
        </div>

        {/* Donations List */}
        <div>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: '#2d5a27' }}>
            Suas Doações
          </h3>

          {donations.length === 0 ? (
            <div style={{
              background: 'rgba(255,255,255,0.4)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '0.5px solid rgba(45,90,39,0.1)',
              boxShadow: '0 8px 32px rgba(45,90,39,0.05)',
              borderRadius: '28px',
              padding: '40px 24px',
              textAlign: 'center',
            }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#72796e' }}>
                Nenhuma doação registrada ainda.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {donations.map((donation) => {
                const badge = getStatusBadge(donation.status)
                return (
                  <div
                    key={donation.id}
                    style={{
                      background: 'rgba(255,255,255,0.4)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: '0.5px solid rgba(45,90,39,0.1)',
                      boxShadow: '0 8px 32px rgba(45,90,39,0.05)',
                      borderRadius: '16px',
                      padding: '16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, color: '#2d5a27' }}>
                        {donation.targetLabel}
                      </p>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '12px',
                        color: '#72796e',
                      }}>
                        <span>🪙 {donation.amountKreds} Kreds</span>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          background: `rgba(${badge.color === '#15803d' ? '21,128,61' : badge.color === '#b91c1c' ? '185,28,28' : '202,138,4'}, 0.12)`,
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: badge.color,
                        }}>
                          {badge.icon} {badge.label}
                        </span>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#a0a8a3' }}>
                        {formatTimestamp(donation.requestedAt)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </main>

      <ChildBottomNav active="saldo" childId={childId} />
    </>
  )
}
