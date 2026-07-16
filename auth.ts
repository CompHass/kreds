import NextAuth from 'next-auth'
import { CredentialsSignin } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Zitadel from 'next-auth/providers/zitadel'
import { env } from '@/lib/env'
import { syncGuardianIdentity } from '@/lib/auth/guardian-sync'
import { createGuardianSession, extractSystemRoles, findGuardianUserId, getGuardianGrants, getGuardianUser, ZitadelApiError } from '@/lib/zitadel/login-client'

class InvalidGuardianCredentialsError extends CredentialsSignin {
  code = 'invalid-credentials'

  constructor() {
    super('E-mail ou senha inválidos')
  }
}

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
    Credentials({
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === 'string' ? credentials.email.trim() : ''
        const password = typeof credentials?.password === 'string' ? credentials.password : ''
        if (!email || !password) throw new InvalidGuardianCredentialsError()
        let session: { userId: string | null }
        try {
          session = await createGuardianSession(email, password)
          const user = await getGuardianUser(session.userId ?? await findGuardianUserId(email))
          return { id: user.id, email: user.email, name: user.name, emailVerified: user.emailVerified }
        } catch (error) {
          if (error instanceof ZitadelApiError) {
            console.error('[auth] native credential verification failed', { status: error.status })
          } else {
            console.error('[auth] native credential verification failed', { name: error instanceof Error ? error.name : 'unknown' })
          }
          throw new InvalidGuardianCredentialsError()
        }
      },
    }),
  ],
  callbacks: {
    signIn({ profile, user }) {
      // Returning `false` here redirects to Auth.js's built-in, unbranded
      // /api/auth/error?error=AccessDenied page (no pages.error configured) --
      // this left users with an unverified Zitadel email silently bounced
      // with zero visible explanation, indistinguishable from a broken login
      // (see .planning/debug/resolved/login-stuck-after-zitadel.md). Redirect
      // to the app's own /login route with an explicit error code instead so
      // the reason is surfaced in the UI.
      if (profile?.email_verified === false) return '/login?error=email-not-verified'
      const credentialsUser = user as unknown as { emailVerified?: boolean } | undefined
      if (profile?.email_verified === undefined && credentialsUser?.emailVerified === false) {
        return '/login?error=email-not-verified'
      }
      return true
    },
    async jwt({ token, profile, user, account }) {
      const credentialsUser = account?.provider === 'credentials'
        ? user as { id?: string; email?: string; name?: string | null; emailVerified?: boolean }
        : undefined
      const subject = account?.provider === 'credentials' ? credentialsUser?.id : profile?.sub
      if (subject) {
        token.sub = subject

        // Persist email from OIDC profile claim (resolves Open Question 2 / Assumption A2).
        // next-auth with strategy:'jwt' may not propagate session.user.email by default
        // because the session callback only receives token fields, not the original profile.
        // Storing it explicitly here makes email stable across token refreshes.
        if (account?.provider === 'credentials' && typeof credentialsUser?.email === 'string') {
          token.email = credentialsUser.email
        } else if (typeof profile?.email === 'string') {
          token.email = profile.email
        }

        // Persist name from OIDC profile claim, same pattern as email above.
        // Zitadel only includes name/preferred_username in the ID token when the
        // client has "User Info inside ID Token" enabled — see .planning/debug/guardian-drawer-empty.md.
        if (account?.provider === 'credentials' && typeof credentialsUser?.name === 'string') {
          token.name = credentialsUser.name
        } else if (typeof profile?.name === 'string') {
          token.name = profile.name
        } else if (typeof profile?.preferred_username === 'string') {
          token.name = profile.preferred_username
        }

        // Persist system_owner role from Zitadel grant claims.
        // Zitadel returns roles via urn:zitadel:iam:org:project:roles (native scope)
        // OR via custom Action that sets a 'roles' claim directly.
        // Check both formats and normalize to string[].
        const nativeRoles = profile?.['urn:zitadel:iam:org:project:roles']
        const customRoles = profile?.['roles']
        if (account?.provider === 'credentials') {
          try {
            token.systemRoles = extractSystemRoles(await getGuardianGrants(subject))
          } catch {
            token.systemRoles = []
          }
        } else if (nativeRoles && typeof nativeRoles === 'object') {
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
          const displayName = account?.provider === 'credentials'
            ? (typeof credentialsUser?.name === 'string' ? credentialsUser.name : null)
            : (typeof profile?.name === 'string' ? profile.name : typeof profile?.preferred_username === 'string' ? profile.preferred_username : null)
          await syncGuardianIdentity({
            subject,
            email: token.email as string,
            emailVerified: account?.provider === 'credentials' ? credentialsUser?.emailVerified === true : profile?.email_verified === true,
            displayName,
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
