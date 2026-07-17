import { GuardianResetConfirmForm } from '@/components/auth/guardian-reset-confirm-form'

export default async function ResetConfirmPage({ searchParams }: { searchParams: Promise<{ userID?: string; code?: string }> }) {
  const params = await searchParams
  return <main className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-kreds-bg)', padding: '48px 24px' }}><div style={{ width: '100%', maxWidth: 392, margin: '0 auto' }}><GuardianResetConfirmForm userId={params.userID ?? ''} code={params.code ?? ''} /></div></main>
}
