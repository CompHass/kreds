import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

// Short-lived, signed, httpOnly cookie that carries the just-signed-up
// guardian's credentials from the signup action to the /verify action, so the
// verify action can complete `signIn('credentials')` after the email code is
// validated — without the user re-typing the password and without persisting
// it anywhere except this 5-minute cookie (encrypted JWE-like HS256 JWT, not
// readable by client JS).
//
// Security: the password travels only inside an httpOnly + secure + sameSite=lax
// cookie, signed with CHILD_SESSION_SECRET. maxAge 300s. Cleared on successful
// verify, on expiry, and any tampering (signature check throws → treated as no
// pending verify).

const COOKIE_NAME = 'kreds-pending-verify'
const MAX_AGE = 300 // 5 minutes — enough to receive the email + type the code

// Reuse the same secret family as guardian-session.ts; fall back to child secret
// in dev so a local setup without GUARDIAN_SESSION_SECRET still works.
const secret = new TextEncoder().encode(
  process.env.GUARDIAN_SESSION_SECRET ?? process.env.CHILD_SESSION_SECRET!,
)

interface PendingVerifyPayload {
  userId: string
  email: string
  password: string
}

export async function setPendingVerify(payload: PendingVerifyPayload): Promise<void> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret)
  const store = await cookies()
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  })
}

export async function getPendingVerify(): Promise<PendingVerifyPayload | null> {
  const store = await cookies()
  const token = store.get(COOKIE_NAME)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret)
    if (
      typeof payload.userId !== 'string' ||
      typeof payload.email !== 'string' ||
      typeof payload.password !== 'string'
    ) {
      return null
    }
    return { userId: payload.userId, email: payload.email, password: payload.password }
  } catch {
    // Expired or tampered — treat as no pending verify.
    return null
  }
}

export async function clearPendingVerify(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}
