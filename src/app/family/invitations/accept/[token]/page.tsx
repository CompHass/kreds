import { redirect } from 'next/navigation'
import { auth } from '../../../../../../auth'
import { requireAuthenticatedIdentity } from '@/lib/auth/authorization'
import { acceptInvitation } from '@/lib/families/invitations'

export const dynamic = 'force-dynamic'

interface AcceptPageProps {
  params: Promise<{ token: string }>
}

export default async function AcceptInvitationPage({ params }: AcceptPageProps) {
  const { token } = await params
  const session = await auth()

  let identity
  try {
    identity = requireAuthenticatedIdentity(session)
  } catch {
    const callbackUrl = `/family/invitations/accept/${encodeURIComponent(token)}`
    redirect(`/api/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`)
  }

  // Auto-accept: user is authenticated — complete acceptance and redirect to dashboard
  try {
    await acceptInvitation({
      token,
      identityId: identity!.zitadelSub,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao aceitar convite.'

    return (
      <main
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: 'var(--color-background, #f5f3ee)',
        }}
      >
        <div
          style={{
            background: '#fff',
            borderRadius: '20px',
            padding: '32px 24px',
            maxWidth: '380px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          }}
        >
          <p style={{ fontSize: '2rem', margin: '0 0 16px' }}>⚠️</p>
          <h1
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#1a1a1a',
              margin: '0 0 12px',
            }}
          >
            Convite inválido
          </h1>
          <p
            style={{
              fontSize: '0.9375rem',
              color: '#72796e',
              margin: '0 0 24px',
              lineHeight: 1.5,
            }}
          >
            {message}
          </p>
          <a
            href="/"
            style={{
              display: 'block',
              padding: '12px',
              borderRadius: '99px',
              background: 'linear-gradient(135deg, #3b6934, #154212)',
              color: '#fff',
              fontWeight: 700,
              textDecoration: 'none',
              fontSize: '0.9375rem',
            }}
          >
            Ir para o início
          </a>
        </div>
      </main>
    )
  }

  redirect('/')
}
