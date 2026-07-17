import 'server-only'

import { createHash, randomBytes } from 'node:crypto'
import { and, eq, gt, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { guardianSignupTokens, identities } from '@/lib/db/schema'

const TOKEN_TTL_MS = 5 * 60 * 1000

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function issueProvisionalSignupToken(identityId: string): Promise<string> {
  const token = randomBytes(32).toString('base64url')
  await db.insert(guardianSignupTokens).values({
    identityId,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
  })
  return token
}

export async function consumeProvisionalSignupToken(input: {
  zitadelSubject: string
  email: string
  token: string
}): Promise<boolean> {
  if (!input.token) return false
  return db.transaction(async (tx) => {
    const [identity] = await tx.select({ id: identities.id }).from(identities).where(and(
      eq(identities.zitadelSubject, input.zitadelSubject),
      eq(identities.email, input.email.toLowerCase()),
    )).limit(1)
    if (!identity) return false

    const [consumed] = await tx.update(guardianSignupTokens).set({ consumedAt: new Date() }).where(and(
      eq(guardianSignupTokens.identityId, identity.id),
      eq(guardianSignupTokens.tokenHash, hashToken(input.token)),
      isNull(guardianSignupTokens.consumedAt),
      gt(guardianSignupTokens.expiresAt, new Date()),
    )).returning({ id: guardianSignupTokens.id })
    return Boolean(consumed)
  })
}
