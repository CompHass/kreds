import type { Metadata } from 'next'
import { GuardianVerifyForm } from '@/components/auth/guardian-verify-form'

export const metadata: Metadata = { title: 'Verificar e-mail | kreds' }

export default async function VerifyPage({ searchParams }: {
  searchParams: Promise<{ userID?: string }>
}) {
  const params = await searchParams
  const userId = typeof params.userID === 'string' ? params.userID : ''
  return (
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-kreds-bg)', padding: '48px 24px' }}>
      <div style={{ width: '100%', maxWidth: 392, margin: '0 auto' }}>
        <GuardianVerifyForm userId={userId} />
      </div>
    </main>
  )
}
