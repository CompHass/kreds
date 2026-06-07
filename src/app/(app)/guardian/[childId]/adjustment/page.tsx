import { requireChildInFamily, requireCurrentFamilyContext } from '@/lib/auth/family-context'
import { getBalance } from '@/modules/ledger/queries'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import AdjustmentFormClient from './AdjustmentFormClient'

type GuardianAdjustmentPageProps = {
  params: Promise<{ childId: string }>
}

function formatKreds(amount: number): string {
  return `${amount} Kreds`
}

export default async function GuardianAdjustmentPage({ params }: GuardianAdjustmentPageProps) {
  const { childId } = await params

  try {
    const { familyId, role } = await requireCurrentFamilyContext()
    if (role !== 'guardian') {
      redirect('/')
    }
    await requireChildInFamily(childId, familyId)
  } catch {
    redirect('/api/auth/signin')
  }

  const availableBalance = await getBalance(childId, 'available')

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
              Ajuste Negativo
            </h1>
            <p style={{
              fontSize: '0.8125rem',
              color: 'var(--color-text-soft, #72796e)',
              margin: 0,
            }}>
              Correção de saldo
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

      <section style={{
        background: 'var(--color-card, rgba(255,255,255,0.64))',
        border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
        borderRadius: '28px',
        boxShadow: 'var(--shadow-soft, 0 18px 55px rgba(45,90,39,0.1))',
        backdropFilter: 'blur(22px)',
        padding: '28px 24px',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          padding: '16px',
          background: 'rgba(255,255,255,0.4)',
          borderRadius: '20px',
          border: '1px solid rgba(45,90,39,0.08)',
        }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-muted, #42493e)' }}>Saldo Atual:</span>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary, #154212)' }}>{formatKreds(availableBalance)}</span>
        </div>

        <AdjustmentFormClient childId={childId} />
      </section>

      <p style={{
        marginTop: '24px',
        fontSize: '0.8125rem',
        color: 'var(--color-text-soft, #72796e)',
        textAlign: 'center',
        lineHeight: 1.5,
      }}>
        Ajustes negativos são usados para deduzir Kreds em casos de quebra de regras ou correções manuais.
      </p>
    </main>
  )
}
