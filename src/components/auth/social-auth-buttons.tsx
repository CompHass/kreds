'use client'
import { loginWithPasskey, loginWithProvider } from '@/app/actions/guardian-auth'

/**
 * Botões de autenticação social: Google, Apple e Passkey.
 * D-04/D-05/D-06: todos via Zitadel federation — auth.ts NÃO modificado.
 * Google/Apple: identity_provider hint. Passkey: signIn('zitadel') direto.
 */
export function SocialAuthButtons() {
  return (
    <div className="flex flex-col gap-3">
      {/* Botão Google */}
      <button
        type="button"
        onClick={() => loginWithProvider('google')}
        style={{
          height: '44px',
          borderRadius: '13px',
          border: '1.5px solid #E2DECF',
          backgroundColor: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          cursor: 'pointer',
          width: '100%',
          fontSize: '12px',
          fontWeight: 500,
          color: 'var(--color-kreds-text)',
        }}
      >
        {/* Logo Google SVG */}
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M19.6 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h5.382a4.6 4.6 0 0 1-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35z"
            fill="#4285F4"
          />
          <path
            d="M10 20c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.759-5.596-4.123H1.064v2.59A9.996 9.996 0 0 0 10 20z"
            fill="#34A853"
          />
          <path
            d="M4.404 11.9A6.014 6.014 0 0 1 4.09 10c0-.663.114-1.305.314-1.9V5.51H1.064A9.994 9.994 0 0 0 0 10c0 1.614.386 3.14 1.064 4.49l3.34-2.59z"
            fill="#FBBC05"
          />
          <path
            d="M10 3.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C14.959.99 12.695 0 10 0A9.996 9.996 0 0 0 1.064 5.51l3.34 2.59C5.19 5.735 7.395 3.977 10 3.977z"
            fill="#EA4335"
          />
        </svg>
        Continuar com Google
      </button>

      {/* Botão Apple */}
      <button
        type="button"
        onClick={() => loginWithProvider('apple')}
        style={{
          height: '44px',
          borderRadius: '13px',
          backgroundColor: '#23302A',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          cursor: 'pointer',
          width: '100%',
          fontSize: '12px',
          fontWeight: 500,
          color: '#fff',
        }}
      >
        {/* Logo Apple SVG */}
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M14.5 0c.09 1.28-.37 2.55-1.08 3.47-.72.94-1.86 1.67-3.03 1.58-.12-1.23.45-2.52 1.12-3.33C12.26.8 13.48.1 14.5 0zm3.6 14.88c-.5 1.1-1.04 2.15-1.87 3.07-.64.7-1.31 1.4-2.27 1.41-.93.02-1.23-.55-2.3-.55-1.07 0-1.4.54-2.29.57-.92.04-1.62-.74-2.27-1.44C4.98 16.4 3.9 13.9 3.9 11.5c0-3.3 2.16-5.05 4.28-5.08 1.01-.02 1.97.68 2.59.68.62 0 1.78-.84 3-.72.51.02 1.94.21 2.86 1.58-.07.05-1.71.99-1.69 2.96.02 2.36 2.07 3.14 2.1 3.15-.03.08-.32 1.09-.94 1.81z"
            fill="#fff"
          />
        </svg>
        Continuar com Apple
      </button>

      {/* Botão Passkey */}
      <button
        type="button"
        onClick={() => loginWithPasskey()}
        style={{
          height: '44px',
          borderRadius: '13px',
          border: '1.5px solid #E2DECF',
          backgroundColor: '#FBFAF5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          cursor: 'pointer',
          width: '100%',
          fontSize: '12px',
          fontWeight: 500,
          color: 'var(--color-kreds-text)',
        }}
      >
        {/* Ícone chave SVG */}
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M12.5 2a5.5 5.5 0 0 0-5.33 6.86L2.3 13.7A1 1 0 0 0 2 14.41V17a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-1h1a1 1 0 0 0 1-1v-1h1a1 1 0 0 0 .7-.29l.57-.57A5.5 5.5 0 1 0 12.5 2zm1.5 5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"
            fill="currentColor"
          />
        </svg>
        Entrar com Passkey
      </button>
    </div>
  )
}
