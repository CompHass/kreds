// @vitest-environment node
import { generateKeyPairSync } from 'node:crypto'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
process.env.IAM_LOGIN_CLIENT = JSON.stringify({
  type: 'serviceaccount',
  keyId: 'test-key',
  key: privateKey.export({ type: 'pkcs1', format: 'pem' }).toString(),
  userId: 'test-user',
})

describe('Zitadel login client', () => {
  let client: typeof import('../../src/lib/zitadel/login-client')

  beforeAll(async () => {
    client = await import('../../src/lib/zitadel/login-client')
  })

  beforeEach(() => vi.restoreAllMocks())

  it('maps unknown user and wrong password failures to the same safe error message', async () => {
    const responses = [
      new Response(JSON.stringify({ code: 5 }), { status: 404 }),
      new Response(JSON.stringify({ code: 3 }), { status: 400 }),
    ]
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 'token' }), { status: 200 }))
      .mockResolvedValueOnce(responses[0])
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 'token' }), { status: 200 }))
      .mockResolvedValueOnce(responses[1]))

    const first = client.createGuardianSession('missing@example.com', 'secret').catch((error) => error)
    const second = client.createGuardianSession('known@example.com', 'wrong').catch((error) => error)
    const [firstError, secondError] = await Promise.all([first, second])

    expect(firstError).toBeInstanceOf(client.ZitadelApiError)
    expect(secondError).toBeInstanceOf(client.ZitadelApiError)
    expect(firstError.message).toBe(secondError.message)
    expect(firstError.message).not.toContain('missing@example.com')
    expect(firstError.message).not.toContain('wrong')
  })

  it('reads the verified guardian ID from the session instead of searching the email as a login name', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 'token' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ sessionId: 'session-1', sessionToken: 'session-token' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 'token' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ session: { factors: { user: { id: 'guardian-1' } } } }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(client.createGuardianSession('guardian@example.com', 'secret')).resolves.toEqual({
      userId: 'guardian-1',
      sessionToken: 'session-token',
    })
    expect(fetchMock.mock.calls[3]?.[0]).toBe('https://auth.hasslab.pro/v2/sessions/session-1')
  })

  it('normalizes the v2 user profile and extracts grant role keys', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 'token' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        user: { id: 'user-1', human: { email: { email: 'guardian@example.com' }, profile: { displayName: 'Guardian' } } },
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 'token' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ result: [{ roleKeys: ['system_owner', 'report_reader'] }, { roleKeys: ['system_owner'] }] }), { status: 200 })))

    await expect(client.getGuardianUser('user-1')).resolves.toEqual({
      id: 'user-1',
      email: 'guardian@example.com',
      emailVerified: false,
      name: 'Guardian',
    })
    await expect(client.getGuardianGrants('user-1')).resolves.toHaveLength(2)
    expect(client.extractSystemRoles([{ roleKeys: ['system_owner', 'report_reader'] }, { roleKeys: ['system_owner'] }])).toEqual([
      'system_owner',
      'report_reader',
      'system_owner',
    ])
  })
})
