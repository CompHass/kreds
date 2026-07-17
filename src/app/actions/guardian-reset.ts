'use server'

import { env } from '@/lib/env'
import { findGuardianUserId, requestGuardianPasswordReset, setGuardianPassword, ZitadelApiError } from '@/lib/zitadel/login-client'

const GENERIC = 'Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.'

export async function requestGuardianPasswordResetAction(email: string): Promise<{ ok: true; message: string }> {
  const normalized = email.trim().toLowerCase()
  if (!normalized) return { ok: true, message: GENERIC }
  try {
    const userId = await findGuardianUserId(normalized)
    const url = `${env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')}/login/reset/confirm?userID={{.UserID}}&code={{.Code}}&orgID={{.OrgID}}`
    await requestGuardianPasswordReset(userId, url)
  } catch (error) {
    // The response is intentionally identical for unknown users and provider failures.
    if (!(error instanceof ZitadelApiError)) return { ok: true, message: GENERIC }
  }
  return { ok: true, message: GENERIC }
}

export async function confirmGuardianPasswordResetAction(input: { userId: string; code: string; password: string }): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!input.userId || !input.code || !input.password) return { ok: false, error: 'Link de redefinição inválido ou expirado.' }
  try {
    await setGuardianPassword(input.userId, input.code, input.password)
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof ZitadelApiError && error.status < 500 ? 'A nova senha não atende à política do provedor.' : 'Não foi possível redefinir a senha.' }
  }
}
