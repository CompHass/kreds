'use server'
import { signIn } from '../../../auth'

/**
 * Login do responsável via Zitadel OIDC (e-mail/senha).
 * GAUTH-01: redireciona para /family após autenticação bem-sucedida.
 * D-04: provider único Zitadel — auth.ts não modificado.
 */
export async function loginWithCredentials(_formData: FormData): Promise<void> {
  await signIn('zitadel', { redirectTo: '/family' })
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
