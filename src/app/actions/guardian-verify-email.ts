'use server'

import { signIn } from '../../../auth'
import { resendGuardianEmailCode, verifyGuardianEmail, ZitadelApiError } from '@/lib/zitadel/login-client'
import { clearPendingVerify, getPendingVerify } from '@/lib/auth/pending-verify'

const VERIFY_INVALID = 'Código inválido ou expirado. Verifique e tente novamente.'
const EXPIRED = 'Sua sessão expirou. Cadastre-se novamente.'
const RESEND_FAILED = 'Não foi possível reenviar o código. Tente novamente em instantes.'

export type GuardianVerifyResult = { ok: true } | { ok: false; error: string }
export type GuardianResendResult = { ok: true } | { ok: false; error: string }

// Verifies the email code typed by the user on the /verify screen.
// Flow:
//   1. Read the pending-verify cookie (carries userId/email/password, 5-min TTL).
//   2. Validate the code against ZITADEL. The userId on the cookie is the
//      source of truth — never trust a client-supplied userId for the verify
//      call itself, only the code typed by the user.
//   3. On success, clear the cookie and complete signIn('credentials'); the
//      authorize flow re-reads isVerified (now true) from ZITADEL and lets the
//      user through to /family.
export async function verifyGuardianEmailAction(input: { code: string }): Promise<GuardianVerifyResult> {
  const code = input.code.trim()
  if (!code) return { ok: false, error: VERIFY_INVALID }

  const pending = await getPendingVerify()
  if (!pending) return { ok: false, error: EXPIRED }

  try {
    await verifyGuardianEmail(pending.userId, code)
  } catch (error) {
    if (error instanceof ZitadelApiError && error.status >= 400 && error.status < 500) {
      return { ok: false, error: VERIFY_INVALID }
    }
    return { ok: false, error: VERIFY_INVALID }
  }

  // Code validated — issue a real session. authorize re-reads the (now
  // verified) user from ZITADEL, so the email-not-verified gate passes.
  await clearPendingVerify()
  await signIn('credentials', {
    email: pending.email,
    password: pending.password,
    redirectTo: '/family',
  })
  return { ok: true }
}

// Resends the email verification code. The userId comes from the signed
// pending-verify cookie (not the client), so an anonymous visitor cannot trigger
// emails to arbitrary users via this action.
export async function resendGuardianEmailCodeAction(): Promise<GuardianResendResult> {
  const pending = await getPendingVerify()
  if (!pending) return { ok: false, error: EXPIRED }
  try {
    await resendGuardianEmailCode(pending.userId)
  } catch (error) {
    if (error instanceof ZitadelApiError && error.status < 500) {
      return { ok: false, error: RESEND_FAILED }
    }
    return { ok: false, error: RESEND_FAILED }
  }
  return { ok: true }
}
