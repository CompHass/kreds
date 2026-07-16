'use server'
import { signIn } from '../../../auth'

export type GuardianLoginResult =
  | { ok: true }
  | { ok: false; error: 'E-mail ou senha inválidos' }

/**
 * Login nativo do responsável via Zitadel Session API v2 / Credentials provider.
 * GAUTH-01: redireciona para /family após autenticação bem-sucedida.
 */
export async function loginWithCredentials(formData: FormData): Promise<GuardianLoginResult> {
  try {
    await signIn('credentials', {
      email: String(formData.get('email') ?? ''),
      password: String(formData.get('password') ?? ''),
      redirectTo: '/family',
    })
    return { ok: true }
  } catch (error) {
    // Auth.js throws CredentialsSignin for both unknown users and wrong passwords.
    // Convert only that expected authentication failure into a safe UI result;
    // redirect errors and unexpected infrastructure failures must still propagate.
    if (error && typeof error === 'object' && 'type' in error && error.type === 'CredentialsSignin') {
      return { ok: false, error: 'E-mail ou senha inválidos' }
    }
    throw error
  }
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
