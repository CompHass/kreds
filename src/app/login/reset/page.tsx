import type { Metadata } from 'next'
import { PasswordResetForm } from '@/components/auth/password-reset-form'

export const metadata: Metadata = {
  title: 'Redefinir senha | kreds',
}

/**
 * Tela de redefinição de senha do responsável.
 * Server Component shell — PasswordResetForm é 'use client' (2 estados).
 * GAUTH-05: form → confirmação com e-mail mascarado.
 */
export default function ResetPage() {
  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--color-kreds-bg)', padding: '0 24px' }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '392px',
          margin: '0 auto',
          paddingTop: '48px',
        }}
      >
        <PasswordResetForm />
      </div>
    </main>
  )
}
