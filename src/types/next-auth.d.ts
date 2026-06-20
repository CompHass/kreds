import type { DefaultSession, DefaultJWT } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      systemRoles: string[]
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    systemRoles?: string[]
  }
}
