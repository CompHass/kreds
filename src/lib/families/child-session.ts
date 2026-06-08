import 'server-only'

import { jwtVerify, SignJWT, type JWTPayload } from 'jose'
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'
import { env } from '@/lib/env'

const CHILD_SESSION_COOKIE = 'child-session'
const CHILD_SESSION_TTL = '8h'
const BRUTE_FORCE_WINDOW_MS = 15 * 60 * 1000
const BRUTE_FORCE_MAX_ATTEMPTS = 5
const childSessionSecret = new TextEncoder().encode(env.CHILD_SESSION_SECRET)

type AttemptWindow = {
  count: number
  windowStart: number
}

const bruteForceAttempts = new Map<string, AttemptWindow>()

export interface ChildSessionPayload {
  childProfileId: string
  familyId: string
  role: 'child'
}

function getAttemptWindow(childProfileId: string, now: number): AttemptWindow | null {
  const attempt = bruteForceAttempts.get(childProfileId)

  if (!attempt) {
    return null
  }

  if (attempt.windowStart + BRUTE_FORCE_WINDOW_MS <= now) {
    bruteForceAttempts.delete(childProfileId)
    return null
  }

  return attempt
}

export async function signChildSession(payload: ChildSessionPayload): Promise<string> {
  const jwtPayload: JWTPayload = {
    childProfileId: payload.childProfileId,
    familyId: payload.familyId,
    role: payload.role,
  }

  return new SignJWT(jwtPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(CHILD_SESSION_TTL)
    .sign(childSessionSecret)
}

export async function verifyChildSession(token: string): Promise<ChildSessionPayload> {
  try {
    const { payload } = await jwtVerify(token, childSessionSecret)

    if (
      typeof payload.childProfileId !== 'string' ||
      typeof payload.familyId !== 'string' ||
      payload.role !== 'child'
    ) {
      throw new Error('Invalid child session payload')
    }

    return {
      childProfileId: payload.childProfileId,
      familyId: payload.familyId,
      role: 'child',
    }
  } catch {
    throw new Error('Invalid child session token')
  }
}

export async function getChildSession(
  cookies: ReadonlyRequestCookies,
): Promise<ChildSessionPayload | null> {
  const token = cookies.get(CHILD_SESSION_COOKIE)?.value

  if (!token) {
    return null
  }

  try {
    return await verifyChildSession(token)
  } catch {
    return null
  }
}

export function checkBruteForce(childProfileId: string): {
  blocked: boolean
  attemptsLeft: number
} {
  const now = Date.now()
  const attempt = getAttemptWindow(childProfileId, now)
  const count = attempt?.count ?? 0

  return {
    blocked: count >= BRUTE_FORCE_MAX_ATTEMPTS,
    attemptsLeft: Math.max(0, BRUTE_FORCE_MAX_ATTEMPTS - count),
  }
}

export function recordFailedAttempt(childProfileId: string): void {
  const now = Date.now()
  const attempt = getAttemptWindow(childProfileId, now)

  if (!attempt) {
    bruteForceAttempts.set(childProfileId, { count: 1, windowStart: now })
    return
  }

  bruteForceAttempts.set(childProfileId, {
    count: attempt.count + 1,
    windowStart: attempt.windowStart,
  })
}

export function resetAttempts(childProfileId: string): void {
  bruteForceAttempts.delete(childProfileId)
}
