import { requireChildInFamily, requireCurrentFamilyContext } from '@/lib/auth/family-context'
import { getChildLedgerHistory } from '@/modules/ledger/queries'
import { redirect } from 'next/navigation'

type ChildHistoryPageProps = {
  params: Promise<{ childId: string }>
}

function formatKreds(amount: number) {
  return `${amount} Kreds`
}

import Link from 'next/link'

type ChildHistoryPageProps = {
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

function getChildLabel(row: Awaited<ReturnType<typeof getChildLedgerHistory>>[number]) {
  if (row.transactionType === 'reversal') {
    return 'Correção aplicada'
  }

  if (row.transactionType === 'earning' && row.accountType === 'available') {
    return `Você ganhou ${row.amount} Kreds`
  }

  if (row.transactionType === 'earning' && row.accountType === 'firstfruits') {
    return `${row.amount} Kreds foram reservados para suas Primícias`
  }

  if (row.transactionType === 'negative_adjustment') {
    return `Ajuste de ${formatKreds(Math.abs(row.amount) * -1)} registrado`
  }

  return `${row.amount >= 0 ? '+' : ''}${formatKreds(row.amount)}`
}

function translateAccountType(type: string): string {
  const types: Record<string, string> = {
    available: 'Disponível',
    firstfruits: 'Primícias',
  }
  return types[type] ?? type
}

export default async function ChildHistoryPage({ params }: ChildHistoryPageProps) {
  const { childId } = await params

  let familyId: string
  try {
    const context = await requireCurrentFamilyContext()
    familyId = context.familyId
    await requireChildInFamily(childId, familyId)
  } catch {
    redirect('/api/auth/signin')
  }

  const rows = await getChildLedgerHistory(childId, familyId)

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
              Meu Histórico
            </h1>
            <p style={{
              fontSize: '0.8125rem',
              color: 'var(--color-text-soft, #72796e)',
              margin: 0,
            }}>
              Veja como seus Kreds cresceram
            </p>
          </div>
        </div>

        <Link
          href={`/child/${childId}/balance`}
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
            Seu histórico de Kreds aparecerá aqui.
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'var(--color-text-soft, #72796e)',
                  background: 'rgba(255,255,255,0.5)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                }}>
                  {translateAccountType(row.accountType)}
                </span>
                <time dateTime={row.createdAt.toISOString()} style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-text-soft, #72796e)',
                }}>
                  {formatTimestamp(row.createdAt)}
                </time>
              </div>
              
              <h3 style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--color-primary, #154212)',
                margin: '0 0 4px',
              }}>
                {getChildLabel(row)}
              </h3>
              
              <p style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: row.amount >= 0 ? 'var(--color-success, #3b6934)' : 'var(--color-danger, #ba1a1a)',
                margin: 0,
              }}>
                {row.amount >= 0 ? '+' : ''}{formatKreds(row.amount)}
              </p>
            </article>
          ))}
        </div>
      )}
    </main>
  )
}
