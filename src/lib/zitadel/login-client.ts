import 'server-only'

import { createPrivateKey, createSign } from 'node:crypto'
import { env } from '@/lib/env'

const issuer = env.AUTH_ZITADEL_ISSUER.replace(/\/$/, '')
const tokenEndpoint = `${issuer}/oauth/v2/token`

export class ZitadelApiError extends Error {
  readonly status: number
  constructor(status: number) {
    super('Zitadel request failed')
    this.name = 'ZitadelApiError'
    this.status = status
  }
}

export interface GuardianProfile {
  id: string
  email: string
  emailVerified: boolean
  name: string | null
}

function encode(value: string): string {
  return Buffer.from(value).toString('base64url')
}

function createAssertion(now = Math.floor(Date.now() / 1000)): string {
  const key = env.IAM_LOGIN_CLIENT
  const header = encode(JSON.stringify({ alg: 'RS256', kid: key.keyId, typ: 'JWT' }))
  const payload = encode(JSON.stringify({ iss: key.userId, sub: key.userId, aud: issuer, iat: now, exp: now + 300 }))
  const unsigned = `${header}.${payload}`
  const signer = createSign('RSA-SHA256')
  signer.update(unsigned)
  signer.end()
  const signature = signer.sign(createPrivateKey({ key: key.key, format: 'pem' }), 'base64url')
  return `${unsigned}.${signature}`
}

async function getAccessToken(): Promise<string> {
  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      scope: 'openid urn:zitadel:iam:org:project:id:zitadel:aud',
      assertion: createAssertion(),
    }),
  })
  if (!response.ok) throw new ZitadelApiError(response.status)
  const body = (await response.json()) as { access_token?: string }
  if (!body.access_token) throw new ZitadelApiError(502)
  return body.access_token
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken()
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${token}`)
  headers.set('Content-Type', 'application/json')
  if (env.IAM_LOGIN_CLIENT.orgId) headers.set('x-zitadel-orgid', env.IAM_LOGIN_CLIENT.orgId)
  const response = await fetch(`${issuer}${path}`, { ...init, headers })
  if (!response.ok) throw new ZitadelApiError(response.status)
  return (await response.json()) as T
}

export async function createGuardianSession(email: string, password: string): Promise<{ userId: string; sessionToken: string }> {
  const body = await request<{ sessionId?: string; sessionToken?: string }>('/v2/sessions', {
    method: 'POST',
    body: JSON.stringify({ checks: { user: { loginName: email }, password: { password } } }),
  })
  if (!body.sessionId || !body.sessionToken) throw new ZitadelApiError(502)

  const session = await request<{ session?: { factors?: { user?: { id?: string } } } }>(`/v2/sessions/${encodeURIComponent(body.sessionId)}`)
  const userId = session.session?.factors?.user?.id
  if (!userId) throw new ZitadelApiError(502)
  return { userId, sessionToken: body.sessionToken }
}

export async function findGuardianUserId(loginName: string): Promise<string> {
  const payload = await request<{ result?: Array<{ id?: string; userId?: string }> }>('/management/v1/users/_search', {
    method: 'POST',
    body: JSON.stringify({ queries: [{ loginNameQuery: { loginName } }] }),
  })
  const userId = payload.result?.[0]?.id ?? payload.result?.[0]?.userId
  if (!userId) throw new ZitadelApiError(502)
  return userId
}

export async function getGuardianUser(userId: string): Promise<GuardianProfile> {
  const payload = await request<Record<string, any>>(`/v2/users/${encodeURIComponent(userId)}`)
  const user = payload.user ?? payload
  const human = user.human ?? {}
  const email = human.email?.email
  const id = user.userId ?? user.id
  if (typeof id !== 'string' || typeof email !== 'string') throw new ZitadelApiError(502)
  return {
    id,
    email,
    emailVerified: human.email?.isVerified === true,
    name: typeof human.profile?.displayName === 'string' ? human.profile.displayName : null,
  }
}

export async function getGuardianGrants(userId: string): Promise<unknown[]> {
  const payload = await request<{ result?: unknown[] }>('/management/v1/users/grants/_search', {
    method: 'POST',
    body: JSON.stringify({ queries: [{ userIdQuery: { userId } }] }),
  })
  return Array.isArray(payload.result) ? payload.result : []
}

export function extractSystemRoles(grants: unknown[]): string[] {
  return grants.flatMap((grant) => {
    if (!grant || typeof grant !== 'object') return []
    const roleKeys = (grant as { roleKeys?: unknown }).roleKeys
    return Array.isArray(roleKeys) ? roleKeys.filter((role): role is string => typeof role === 'string') : []
  })
}
