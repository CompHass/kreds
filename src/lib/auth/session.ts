import { auth } from '../../../auth'

/**
 * Get the authenticated ZITADEL session.
 * Wraps Auth.js auth() for server-only use.
 */
export async function getSession() {
  return auth()
}

/**
 * Extract the ZITADEL subject (sub) from an Auth.js session.
 * Returns the stable ZITADEL identity key — never uses mutable email as primary key.
 */
export function getZitadelSub(session: any): string | null {
  return session?.user?.id ?? null
}
