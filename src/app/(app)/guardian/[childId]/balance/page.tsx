import { requireChildInFamily, requireCurrentFamilyContext } from '@/lib/auth/family-context'
import { getBalance, getChildLedgerHistory } from '@/modules/ledger/queries'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
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

function getGuardianLabel(row: Awaited<ReturnType<typeof getChildLedgerHistory>>[number]) {
  if (row.transactionType === 'reversal') {
    return 'Correção aplicada'
  }

  if (row.transactionType === 'task_earning' && row.accountType === 'available') {
    return `Ganho registrado`
  }

  if (row.transactionType === 'task_earning' && row.accountType === 'firstfruits') {
    return `${row.amount} Kreds reservados como Primícias`
  }

  if (row.transactionType === 'negative_adjustment') {
    return `Ajuste de ${formatKreds(Math.abs(row.amount) * -1)} registrado`
  }

  if (row.transactionType === 'donation_match') {
    return `Doação combinada registrada`
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

export const dynamic = 'force-dynamic'

export default async function GuardianBalancePage({ params }: GuardianBalancePageProps) {
  const { childId } = await params

  let familyId: string
  let role: string

  try {
    const context = await requireCurrentFamilyContext()
    familyId = context.familyId
    role = context.role

    if (role !== 'guardian') {
      redirect('/')
    }

    await requireChildInFamily(childId, familyId)
  } catch {
    redirect('/api/auth/signin')
  }

  // Fetch child profile with family verification
  const [childProfile] = await db
    .select({
      id: schema.childProfiles.id,
      displayName: schema.childProfiles.displayName,
      avatarPreset: schema.childProfiles.avatarPreset,
      accentColor: schema.childProfiles.accentColor,
    })
    .from(schema.childProfiles)
    .where(
      and(
        eq(schema.childProfiles.id, childId),
        eq(schema.childProfiles.familyId, familyId),
      ),
    )
    .limit(1)

  if (!childProfile) {
    redirect('/family/children')
  }

  // Fetch balance and ledger history in parallel
  const [available, firstfruits, rows] = await Promise.all([
    getBalance(childId, 'available'),
    getBalance(childId, 'firstfruits'),
    getChildLedgerHistory(childId, familyId),
  ])

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '32px 24px 64px',
        maxWidth: '480px',
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '32px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '16px',
              display: 'grid',
              placeItems: 'center',
              fontSize: '24px',
              background: 'radial-gradient(circle, #fff3b8, #d2a501 58%, #8b6a08)',
              boxShadow: '0 8px 20px rgba(210,165,1,.2)',
              flexShrink: 0,
            }}
          >
            🧺
          </div>
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-heading, "Plus Jakarta Sans", system-ui, sans-serif)',
                fontWeight: 800,
                fontSize: '1.25rem',
                letterSpacing: '-0.02em',
                color: 'var(--color-primary, #154212)',
                margin: 0,
              }}
            >
              Saldo de {childProfile.displayName}
            </h1>
            <p
              style={{
                fontSize: '0.8125rem',
                color: 'var(--color-text-soft, #72796e)',
                margin: 0,
              }}
            >
              Visão do guardião
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
          ← Voltar
        </Link>
      </div>

      {/* Hero glass card with balances */}
      <section
        style={{
          background: 'var(--color-card, rgba(255,255,255,0.64))',
          border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
          borderRadius: '28px',
          boxShadow: 'var(--shadow-soft, 0 18px 55px rgba(45,90,39,0.1))',
          backdropFilter: 'blur(22px)',
          padding: '28px 24px',
          marginBottom: '32px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Available balance */}
          <div
            style={{
              padding: '16px',
              background: 'rgba(255,255,255,0.4)',
              borderRadius: '20px',
              border: '1px solid rgba(45,90,39,0.08)',
            }}
          >
            <span
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--color-text-muted, #42493e)',
              }}
            >
              Saldo Disponível
            </span>
            <p
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: 'var(--color-primary, #154212)',
                margin: '8px 0 0',
              }}
            >
              {formatKreds(available)}
            </p>
          </div>

          {/* Firstfruits badge */}
          <div
            style={{
              padding: '12px 16px',
              background: 'rgba(210,165,1,0.1)',
              borderRadius: '16px',
              border: '1px solid rgba(210,165,1,0.2)',
            }}
          >
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: 'var(--color-text-soft, #72796e)',
              }}
            >
              Primícias Reservadas
            </span>
            <p
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: 'var(--color-primary, #154212)',
                margin: '4px 0 0',
              }}
            >
              {formatKreds(firstfruits)}
            </p>
          </div>
        </div>
      </section>

      {/* Ledger history */}
      <div style={{ marginTop: '32px' }}>
        <h2
          style={{
            fontSize: '0.875rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--color-text-soft, #72796e)',
            margin: '0 0 16px',
          }}
        >
          Histórico de Transações
        </h2>

        {rows.length === 0 ? (
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              background: 'var(--color-card, rgba(255,255,255,0.64))',
              borderRadius: '28px',
              border: '1px dashed var(--color-border, rgba(45,90,39,0.16))',
              backdropFilter: 'blur(12px)',
            }}
          >
            <p
              style={{
                fontSize: '0.9375rem',
                color: 'var(--color-text-soft, #72796e)',
                margin: 0,
              }}
            >
              Nenhum histórico registrado ainda.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {rows.map((row) => (
              <article
                key={row.lineId}
                style={{
                  padding: '20px',
                  background: 'var(--color-card, rgba(255,255,255,0.64))',
                  border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
                  borderRadius: '24px',
                  boxShadow: '0 4px 16px rgba(45,90,39,0.06)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: 'var(--color-text-soft, #72796e)',
                      background: 'rgba(255,255,255,0.5)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    {translateAccountType(row.accountType)}
                  </span>
                  <time
                    dateTime={row.createdAt.toISOString()}
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--color-text-soft, #72796e)',
                    }}
                  >
                    {formatTimestamp(row.createdAt)}
                  </time>
                </div>

                <h3
                  style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: 'var(--color-primary, #154212)',
                    margin: '0 0 4px',
                  }}
                >
                  {getGuardianLabel(row)}
                </h3>

                <p
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color:
                      row.amount >= 0
                        ? 'var(--color-success, #3b6934)'
                        : 'var(--color-danger, #ba1a1a)',
                    margin: 0,
                  }}
                >
                  {row.amount >= 0 ? '+' : ''}
                  {formatKreds(row.amount)}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>

      <BottomNav active="perfil" />
    </main>
  )
}
