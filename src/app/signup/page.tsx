import type { Metadata } from 'next'
import { GuardianSignupForm } from '@/components/auth/guardian-signup-form'

export const metadata: Metadata = { title: 'Criar conta | kreds' }

export default function SignupPage() {
  return <main className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-kreds-bg)', padding: '48px 24px' }}><div style={{ width: '100%', maxWidth: '392px', margin: '0 auto' }}><GuardianSignupForm /></div></main>
}
