import { requireChildSession } from '@/lib/auth/child-guard'
import { getBalance, getChildLedgerHistory } from '@/modules/ledger/queries'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChildBottomNav } from '@/components/ChildBottomNav'

type ChildBalancePageProps = {
  params: Promise<{ childId: string }>
}

export const dynamic = 'force-dynamic'

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

  if (row.transactionType === 'task_earning' && row.accountType === 'available') {
    return `Você ganhou ${row.amount} Kreds`
  }

  if (row.transactionType === 'task_earning' && row.accountType === 'firstfruits') {
    return `${row.amount} Kreds foram reservados para suas Primícias`
  }

  if (row.transactionType === 'negative_adjustment') {
    return `Ajuste de ${formatKreds(Math.abs(row.amount) * -1)} registrado`
  }

  return `${row.amount >= 0 ? '+' : ''}${formatKreds(row.amount)}`
}

export default async function ChildBalancePage({ params }: ChildBalancePageProps) {
  const { childId } = await params
  const session = await requireChildSession()

  if (session.childProfileId !== childId) {
    redirect(`/child/${session.childProfileId}/balance`)
  }

  const [available, firstfruits, rows] = await Promise.all([
    getBalance(session.childProfileId, 'available'),
    getBalance(session.childProfileId, 'firstfruits'),
    getChildLedgerHistory(session.childProfileId, session.familyId),
  ])

  const totalSaved = available + firstfruits

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
            Meu Saldo
          </h2>
          <p style={{
            margin: 0,
            fontSize: '16px',
            color: '#42493e',
            lineHeight: 1.5,
          }}>
            Veja seu saldo e histórico
          </p>
        </div>

        {/* Hero Glass Card: Available Balance */}
        <div style={{
          background: 'rgba(255,255,255,0.4)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '0.5px solid rgba(45,90,39,0.1)',
          boxShadow: '0 8px 32px rgba(45,90,39,0.05)',
          borderRadius: '28px',
          padding: '32px 24px',
          marginBottom: '24px',
          textAlign: 'center',
        }}>
          <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#72796e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Saldo Disponível
          </p>
          <p style={{ margin: '0 0 16px', fontSize: '48px', fontWeight: 800, color: '#2d5a27' }}>
            {available}
          </p>

          {firstfruits > 0 && (
            <div style={{
              display: 'inline-block',
              padding: '6px 16px',
              background: 'rgba(59,105,52,0.12)',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#3b6934',
              marginBottom: '12px',
            }}>
              🏦 Primícias: {firstfruits} Kreds
            </div>
          )}

          {totalSaved > 0 && (
            <p style={{ margin: '0', fontSize: '13px', color: '#72796e' }}>
              Total: {totalSaved} Kreds
            </p>
          )}
        </div>

        {/* Ledger History */}
        <div>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: '#2d5a27' }}>
            Histórico de Transações
          </h3>

          {rows.length === 0 ? (
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
                Seu histórico aparecerá aqui.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {rows.map((row, idx) => (
                <div
                  key={idx}
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
                      {getChildLabel(row)}
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#72796e' }}>
                      {formatTimestamp(row.createdAt)}
                    </p>
                  </div>
                  <p style={{
                    margin: 0,
                    fontSize: '14px',
                    fontWeight: 700,
                    color: row.amount >= 0 ? '#3b6934' : '#b91c1c',
                  }}>
                    {row.amount >= 0 ? '+' : ''}{row.amount}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      <ChildBottomNav active="saldo" childId={childId} />
    </>
  )
}
