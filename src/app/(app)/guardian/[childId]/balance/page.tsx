import { requireChildInFamily, requireCurrentFamilyContext } from '@/lib/auth/family-context'
import { getBalance, getGuardianLedgerHistory } from '@/modules/ledger/queries'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BottomNav } from '@/components/BottomNav'

type GuardianBalancePageProps = {
  params: Promise<{ childId: string }>
}

function formatKreds(amount: number): string {
  return `${amount} Kreds`
}

function formatTimestamp(value: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value)
}

function translateTransactionType(type: string): string {
  const types: Record<string, string> = {
    task_earning: 'Ganho',
    negative_adjustment: 'Ajuste Negativo',
    reversal: 'Estorno',
    firstfruits_withholding: 'Reserva de Primícias',
  }
  return types[type] ?? type
}

function translateAccountType(type: string): string {
  const types: Record<string, string> = {
    available: 'Disponível',
    firstfruits: 'Primícias',
  }
  return types[type] ?? type
}

export default async function GuardianBalancePage({ params }: GuardianBalancePageProps) {
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

  const [available, firstfruits, rows] = await Promise.all([
    getBalance(childId, 'available'),
    getBalance(childId, 'firstfruits'),
    getGuardianLedgerHistory(childId, childId),
  ])

  const totalSaved = available + firstfruits

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
              Saldo do Filho
            </h1>
            <p style={{
              fontSize: '0.8125rem',
              color: 'var(--color-text-soft, #72796e)',
              margin: 0,
            }}>
              Visão do Guardião
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

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
        <div style={{
          background: 'var(--color-card, rgba(255,255,255,0.64))',
          border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
          borderRadius: '20px',
          padding: '20px',
          boxShadow: '0 4px 16px rgba(45,90,39,0.06)',
        }}>
          <p style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--color-text-soft, #72796e)',
            margin: '0 0 8px',
          }}>
            Disponível
          </p>
          <p style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            color: 'var(--color-success, #3b6934)',
            margin: 0,
          }}>
            {available}
          </p>
        </div>

        <div style={{
          background: 'var(--color-card, rgba(255,255,255,0.64))',
          border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
          borderRadius: '20px',
          padding: '20px',
          boxShadow: '0 4px 16px rgba(45,90,39,0.06)',
        }}>
          <p style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--color-text-soft, #72796e)',
            margin: '0 0 8px',
          }}>
            Primícias
          </p>
          <p style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            color: 'var(--color-gold, #d2a501)',
            margin: 0,
          }}>
            {firstfruits}
          </p>
        </div>
      </div>

      {/* Total */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(59,105,52,0.08), rgba(210,165,1,0.08))',
        border: '1px solid rgba(45,90,39,0.16)',
        borderRadius: '24px',
        padding: '24px',
        marginBottom: '32px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--color-text-muted, #42493e)',
          }}>
            Total Acumulado
          </span>
          <span style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: 'var(--color-primary, #154212)',
          }}>
            {totalSaved}
          </span>
        </div>
      </div>

      {/* Ledger History */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--color-text-muted, #42493e)',
          margin: '0 0 16px',
        }}>
          Histórico de Transações
        </h2>

        {rows.length === 0 ? (
          <div style={{
            padding: '48px 24px',
            textAlign: 'center',
            background: 'var(--color-card, rgba(255,255,255,0.64))',
            borderRadius: '28px',
            border: '1px dashed var(--color-border, rgba(45,90,39,0.16))',
            backdropFilter: 'blur(12px)',
          }}>
            <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-soft, #72796e)', margin: 0 }}>
              Nenhuma transação registrada ainda.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {rows.map((row) => (
              <div key={row.lineId} style={{
                padding: '16px',
                background: 'var(--color-card, rgba(255,255,255,0.64))',
                border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
                borderRadius: '16px',
                boxShadow: '0 2px 8px rgba(45,90,39,0.04)',
                backdropFilter: 'blur(12px)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <span style={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: row.amount > 0 ? 'var(--color-success, #3b6934)' : 'var(--color-danger, #ba1a1a)',
                      background: row.amount > 0 ? 'rgba(59,105,52,0.08)' : 'rgba(186,26,26,0.08)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      display: 'inline-block',
                    }}>
                      {translateTransactionType(row.transactionType)}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: row.amount > 0 ? 'var(--color-success, #3b6934)' : 'var(--color-danger, #ba1a1a)',
                  }}>
                    {row.amount > 0 ? '+' : ''}{formatKreds(row.amount)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-soft, #72796e)' }}>
                  <span>{translateAccountType(row.accountType)}</span>
                  <time>{formatTimestamp(row.createdAt)}</time>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav active="perfil" />
    </main>
  )
}
