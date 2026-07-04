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
      // Returning `false` here redirects to Auth.js's built-in, unbranded
      // /api/auth/error?error=AccessDenied page (no pages.error configured) --
      // this left users with an unverified Zitadel email silently bounced
      // with zero visible explanation, indistinguishable from a broken login
      // (see .planning/debug/resolved/login-stuck-after-zitadel.md). Redirect
      // to the app's own /login route with an explicit error code instead so
      // the reason is surfaced in the UI.
      if (profile?.email_verified === false) return '/login?error=email-not-verified'
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

        // Persist name from OIDC profile claim, same pattern as email above.
        // Zitadel only includes name/preferred_username in the ID token when the
        // client has "User Info inside ID Token" enabled — see .planning/debug/guardian-drawer-empty.md.
        if (typeof profile.name === 'string') {
          token.name = profile.name
        } else if (typeof profile.preferred_username === 'string') {
          token.name = profile.preferred_username
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

        // Upsert kreds_identities on EVERY login (not just first), so that
        // emailVerified/email/displayName stay in sync with Zitadel's current
        // claims. Previously this only inserted on first login and never
        // updated an existing row -- an account created while email_verified
        // was false stayed permanently false in kreds_identities even after
        // the user verified their email in Zitadel, since the signIn callback
        // above reads the LIVE profile claim (correct) but nothing re-synced
        // the cached DB copy used elsewhere. See
        // .planning/debug/resolved/login-stuck-after-zitadel.md.
        try {
          const displayName =
            typeof profile.name === 'string'
              ? profile.name
              : typeof profile.preferred_username === 'string'
                ? profile.preferred_username
                : null

          await db
            .insert(schema.identities)
            .values({
              zitadelSubject: profile.sub,
              email: typeof profile.email === 'string' ? profile.email : null,
              emailVerified: profile.email_verified === true,
              displayName,
            })
            .onConflictDoUpdate({
              target: schema.identities.zitadelSubject,
              set: {
                email: typeof profile.email === 'string' ? profile.email : null,
                emailVerified: profile.email_verified === true,
                displayName,
                updatedAt: new Date(),
              },
            })
        } catch (err) {
          // Log but do not block sign-in — identity row will be created/synced on retry
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
      if (token.name && session.user) {
        session.user.name = token.name as string
      }
      return session
    },
  },
  session: {
    strategy: 'jwt',
  },
  trustHost: true,
})
