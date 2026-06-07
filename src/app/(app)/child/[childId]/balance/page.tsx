import { requireChildInFamily, requireCurrentFamilyContext } from '@/lib/auth/family-context'
import { getBalance } from '@/modules/ledger/queries'
import { redirect } from 'next/navigation'

type ChildBalancePageProps = {
  params: Promise<{ childId: string }>
}

function formatKreds(amount: number): string {
  return `${amount} Kreds`
}

export default async function ChildBalancePage({ params }: ChildBalancePageProps) {
  const { childId } = await params

  try {
    const { familyId } = await requireCurrentFamilyContext()
    await requireChildInFamily(childId, familyId)
  } catch {
    redirect('/api/auth/signin')
  }

  const [available, firstfruits] = await Promise.all([
    getBalance(childId, 'available'),
    getBalance(childId, 'firstfruits'),
  ])

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
              Meu Saldo
            </h1>
            <p style={{
              fontSize: '0.8125rem',
              color: 'var(--color-text-soft, #72796e)',
              margin: 0,
            }}>
              Mordomia e fidelidade
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

      <div style={{
        background: 'var(--color-card, rgba(255,255,255,0.72))',
        border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
        borderRadius: '36px',
        boxShadow: 'var(--shadow-soft, 0 18px 55px rgba(45,90,39,0.1))',
        backdropFilter: 'blur(22px)',
        padding: '32px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary, #154212)', margin: '0 0 8px' }}>
            Sua mordomia está crescendo!
          </h2>
          <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-soft, #72796e)', margin: 0, lineHeight: 1.5 }}>
            Continue realizando suas tarefas com amor e dedicação para ver seus frutos aumentarem.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <article style={{
            padding: '24px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, #3b6934, #154212)',
            color: '#fff',
            boxShadow: '0 12px 24px rgba(45,90,39,0.15)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.8, margin: '0 0 4px' }}>
              Seus Kreds Disponíveis
            </p>
            <p style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0 }}>
              {formatKreds(available)}
            </p>
            <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', fontSize: '64px', opacity: 0.1 }}>💰</div>
          </article>

          <article style={{
            padding: '24px',
            borderRadius: '24px',
            background: 'var(--color-gold-soft, rgba(255, 223, 144, 0.48))',
            border: '1px solid rgba(210,165,1,0.2)',
            color: 'var(--color-primary, #154212)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-gold, #8b6a08)', margin: '0 0 4px' }}>
              Suas Primícias (Tesouro)
            </p>
            <p style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0 }}>
              {formatKreds(firstfruits)}
            </p>
            <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', fontSize: '64px', opacity: 0.1 }}>✨</div>
          </article>
        </div>
      </div>

      <div style={{ marginTop: '32px', textAlign: 'center' }}>
        <Link href={`/child/${childId}/history`} style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '44px',
          padding: '0 24px',
          borderRadius: '99px',
          background: 'rgba(255,255,255,0.82)',
          color: 'var(--color-primary, #154212)',
          textDecoration: 'none',
          fontWeight: 700,
          border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
        }}>
          Ver meu histórico
        </Link>
      </div>
    </main>
  )
}
