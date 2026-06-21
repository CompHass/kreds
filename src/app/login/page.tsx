import type { Metadata } from 'next'
import { GuardianLoginForm } from '@/components/auth/guardian-login-form'

export const metadata: Metadata = {
  title: 'Entrar | kreds',
}

/**
 * Tela de login do responsável.
 * Server Component shell — GuardianLoginForm é 'use client'.
 * Fundo: var(--color-kreds-bg). Padding lateral 24px. Logo no topo (48px).
 */
export default function LoginPage() {
  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--color-kreds-bg)', padding: '0 24px' }}
    >
      {/* Logo */}
      <div style={{ paddingTop: '48px', paddingBottom: '32px' }}>
        <KredsLogo />
      </div>

      {/* Formulário de login */}
      <div style={{ width: '100%', maxWidth: '392px', margin: '0 auto' }}>
        <GuardianLoginForm />
      </div>
    </main>
  )
}

/** Logo kreds: folha SVG bicolor + wordmark */
function KredsLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <path
          d="M14 2C10 2 7 5.5 7 10c0 3 1.5 5.5 4 7v5a3 3 0 0 0 6 0v-5c2.5-1.5 4-4 4-7 0-4.5-3-8-7-8z"
          fill="url(#kredsLogoGrad)"
        />
        <defs>
          <linearGradient id="kredsLogoGrad" x1="7" y1="2" x2="21" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="#5A8A66" />
            <stop offset="1" stopColor="#3E6B4F" />
          </linearGradient>
        </defs>
      </svg>
      <span
        style={{
          fontSize: '15px',
          fontWeight: 500,
          color: 'var(--color-kreds-text)',
        }}
      >
        kreds
      </span>
    </div>
  )
}
