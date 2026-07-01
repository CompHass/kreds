import NextAuth from 'next-auth'
import Zitadel from 'next-auth/providers/zitadel'
import { env } from '@/lib/env'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Zitadel({
      issuer: env.AUTH_ZITADEL_ISSUER,
      clientId: env.AUTH_ZITADEL_ID,
      clientSecret: env.AUTH_ZITADEL_SECRET,
      authorization: {
        params: {
          scope: 'openid email profile offline_access urn:zitadel:iam:org:project:roles',
        },
      },
    }),
  ],
  callbacks: {
    signIn({ profile }) {
      if (profile?.email_verified === false) return false
      return true
    },
    async jwt({ token, profile }) {
      if (profile?.sub) {
        token.sub = profile.sub

        // Persist email from OIDC profile claim (resolves Open Question 2 / Assumption A2).
        // next-auth with strategy:'jwt' may not propagate session.user.email by default
        // because the session callback only receives token fields, not the original profile.
        // Storing it explicitly here makes email stable across token refreshes.
        if (typeof profile.email === 'string') {
          token.email = profile.email
        }

        // Persist system_owner role from Zitadel grant claims.
        // Zitadel returns roles via urn:zitadel:iam:org:project:roles (native scope)
        // OR via custom Action that sets a 'roles' claim directly.
        // Check both formats and normalize to string[].
        const nativeRoles = profile['urn:zitadel:iam:org:project:roles']
        const customRoles = profile['roles']
        if (nativeRoles && typeof nativeRoles === 'object') {
          token.systemRoles = Object.keys(nativeRoles as Record<string, unknown>)
        } else if (Array.isArray(customRoles)) {
          token.systemRoles = customRoles as string[]
        } else {
          token.systemRoles = []
        }

        // Upsert kreds_identities on first login so resolveKredsIdentityId
        // can find a row for this ZITADEL subject on subsequent requests.
        try {
          const existing = await db
            .select({ id: schema.identities.id })
            .from(schema.identities)
            .where(eq(schema.identities.zitadelSubject, profile.sub))
            .limit(1)

          if (existing.length === 0) {
            await db.insert(schema.identities).values({
              zitadelSubject: profile.sub,
              email: typeof profile.email === 'string' ? profile.email : null,
              emailVerified: profile.email_verified === true,
              displayName:
                typeof profile.name === 'string'
                  ? profile.name
                  : typeof profile.preferred_username === 'string'
                    ? profile.preferred_username
                    : null,
            })
          }
        } catch (err) {
          // Log but do not block sign-in — identity row will be created on retry
          console.error('[auth] kreds_identities upsert failed:', err)
        }
      }
      return token
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      if (token.systemRoles) {
        session.user.systemRoles = token.systemRoles as string[]
      }
      // Propagate email explicitly from token (T-07-04 mitigated: passed server-side,
      // not in URL/querystring/localStorage; is the logged-in user's own email only).
      if (token.email && session.user) {
        session.user.email = token.email as string
      }
      return session
    },
  },
  session: {
    strategy: 'jwt',
  },
  trustHost: true,
})
