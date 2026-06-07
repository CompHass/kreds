import NextAuth from 'next-auth'
import Zitadel from 'next-auth/providers/zitadel'
import { env } from '@/lib/env'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Zitadel({
      issuer: env.AUTH_ZITADEL_ISSUER,
      clientId: env.AUTH_ZITADEL_ID,
      clientSecret: env.AUTH_ZITADEL_SECRET,
      authorization: {
        params: {
          scope: 'openid email profile offline_access',
        },
      },
    }),
  ],
  callbacks: {
    signIn({ profile }) {
      if (profile?.email_verified === false) return false
      return true
    },
    jwt({ token, profile }) {
      if (profile?.sub) {
        token.sub = profile.sub
      }
      return token
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      return session
    },
  },
  session: {
    strategy: 'jwt',
  },
  trustHost: true,
})
