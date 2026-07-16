'use server'
import { signIn } from '../../../auth'

/**
 * Login nativo do responsável via Zitadel Session API v2 / Credentials provider.
 * GAUTH-01: redireciona para /family após autenticação bem-sucedida.
 */
export async function loginWithCredentials(formData: FormData): Promise<void> {
  await signIn('credentials', {
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
    redirectTo: '/family',
  })
}

/**
 * Login social via identity_provider hint (Google ou Apple).
 * D-05: Google/Apple operam via Zitadel federation — não são providers separados.
 * O nome do IdP ('google' | 'apple') deve bater com o configurado no Zitadel Console.
 */
export async function loginWithProvider(idp: 'google' | 'apple'): Promise<void> {
  await signIn('zitadel', {}, { identity_provider: idp })
}

/**
 * Login com Passkey via Zitadel.
 * D-06: Passkey como opção interna do Zitadel — sem integração WebAuthn direta no Next.js.
 */
export async function loginWithPasskey(): Promise<void> {
  await signIn('zitadel')
}
