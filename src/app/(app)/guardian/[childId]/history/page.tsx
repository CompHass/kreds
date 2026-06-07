import { requireChildInFamily, requireCurrentFamilyContext } from '@/lib/auth/family-context'
import { getGuardianLedgerHistory } from '@/modules/ledger/queries'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ReversalButton from './ReversalButton'

type GuardianHistoryPageProps = {
  params: Promise<{ childId: string }>
}

function formatKreds(amount: number) {
  return `${amount} Kreds`
}

function formatTimestamp(value: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value)
}

function formatNote(row: { transactionType: string; note: string | null }) {
  if (!row.note) return '—'

  if (row.transactionType !== 'negative_adjustment') {
    return row.note
  }

  try {
    const parsed = JSON.parse(row.note) as {
      reason?: string
      restorationNote?: string | null
    }

    const parts = [
      parsed.reason ? `Motivo: ${parsed.reason}` : null,
      parsed.restorationNote ? `Restauração: ${parsed.restorationNote}` : null,
    ].filter(Boolean)

    return parts.join(' • ') || row.note
  } catch {
    return row.note
  }
}

function translateTransactionType(type: string): string {
  const types: Record<string, string> = {
    earning: 'Ganho',
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

export default async function GuardianHistoryPage({ params }: GuardianHistoryPageProps) {
  const { childId } = await params

  let familyId: string
  try {
    const context = await requireCurrentFamilyContext()
    if (context.role !== 'guardian') {
      redirect('/')
    }
    familyId = context.familyId
    await requireChildInFamily(childId, familyId)
  } catch {
    redirect('/api/auth/signin')
  }

  const rows = await getGuardianLedgerHistory(childId, familyId)

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
              Histórico Detalhado
            </h1>
            <p style={{
              fontSize: '0.8125rem',
              color: 'var(--color-text-soft, #72796e)',
              margin: 0,
            }}>
              Trilha de auditoria financeira
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {rows.map((row) => (
            <article key={row.lineId} style={{
              padding: '20px',
              background: 'var(--color-card, rgba(255,255,255,0.64))',
              border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
              borderRadius: '24px',
              boxShadow: '0 4px 16px rgba(45,90,39,0.06)',
              backdropFilter: 'blur(12px)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: row.amount > 0 ? 'var(--color-success, #3b6934)' : 'var(--color-danger, #ba1a1a)',
                  background: row.amount > 0 ? 'rgba(59,105,52,0.08)' : 'rgba(186,26,26,0.08)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                }}>
                  {translateTransactionType(row.transactionType)}
                </span>
                <span style={{ fontWeight: 800, color: 'var(--color-primary, #154212)', fontSize: '1.125rem' }}>
                  {row.amount > 0 ? '+' : ''}{formatKreds(row.amount)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                <ReversalButton 
                  childId={childId} 
                  transactionId={row.transactionId} 
                  transactionType={row.transactionType} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <dt style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--color-text-soft, #72796e)', textTransform: 'uppercase' }}>Conta</dt>
                  <dd style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-muted, #42493e)', margin: 0 }}>{translateAccountType(row.accountType)}</dd>
                </div>
                <div>
                  <dt style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--color-text-soft, #72796e)', textTransform: 'uppercase' }}>Data</dt>
                  <dd style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-muted, #42493e)', margin: 0 }}>{formatTimestamp(row.createdAt)}</dd>
                </div>
              </div>

              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.4)', borderRadius: '12px', border: '1px solid rgba(45,90,39,0.08)' }}>
                <dt style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--color-text-soft, #72796e)', textTransform: 'uppercase', marginBottom: '4px' }}>Nota / Detalhes</dt>
                <dd style={{ fontSize: '0.8125rem', color: 'var(--color-text, #28180b)', margin: 0, lineHeight: 1.4 }}>{formatNote(row)}</dd>
              </div>

              <div style={{ marginTop: '12px', display: 'flex', gap: '8px', opacity: 0.6 }}>
                <div style={{ fontSize: '0.625rem' }}>
                  <span style={{ fontWeight: 700 }}>ID:</span> {row.transactionId.slice(0, 8)}
                </div>
                {row.correctsTransactionId && (
                  <div style={{ fontSize: '0.625rem', color: 'var(--color-danger, #ba1a1a)' }}>
                    <span style={{ fontWeight: 700 }}>Corrige:</span> {row.correctsTransactionId.slice(0, 8)}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  )
}
