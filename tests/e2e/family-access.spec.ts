import { test, expect } from '@playwright/test'

// RED phase: Wave 0 scaffold — these tests will fail because the API routes
// and page-level protection do not exist yet. Implementation created in later plans.

test.describe('Family access — unauthenticated denial (FAM-01)', () => {
  test('GET /api/families should return 401 when unauthenticated', async ({ request }) => {
    const response = await request.get('/api/families')
    // FAM-01: unauthenticated access must not enumerate or expose family data
    expect(response.status()).toBe(401)
  })

  test('POST /api/families should return 401 when unauthenticated', async ({ request }) => {
    const response = await request.post('/api/families', {
      data: { name: 'Test Family', timezone: 'UTC' },
    })
    expect(response.status()).toBe(401)
  })

  test('GET /api/families/[id] should return 401 when unauthenticated', async ({ request }) => {
    const response = await request.get('/api/families/any-uuid')
    expect(response.status()).toBe(401)
  })

  test('GET /api/families should not return 200 with family list (tenant enumeration prevention)', async ({ request }) => {
    const response = await request.get('/api/families')
    // The unscoped Phase 1 proof-of-concept behavior must be replaced
    // — unauthenticated users must not enumerate families (FAM-05)
    expect(response.status()).not.toBe(200)
  })
})

test.describe('Family access — child profile routes (FAM-03)', () => {
  test('POST /api/families/[id]/children should return 401 when unauthenticated', async ({ request }) => {
    const response = await request.post('/api/families/any-uuid/children', {
      data: {
        displayName: 'Child Name',
        ageYears: 8,
        avatarPreset: 'oak-sprout',
        accentColor: 'moss',
      },
    })
    // FAM-03: no public child self-registration — unauthenticated blocked
    expect(response.status()).toBe(401)
  })

  test('GET /api/families/[id]/children should return 401 when unauthenticated', async ({ request }) => {
    const response = await request.get('/api/families/any-uuid/children')
    expect(response.status()).toBe(401)
  })
})

test.describe('Family access — invitation routes (FAM-02)', () => {
  test('POST /api/families/[id]/invitations should return 401 when unauthenticated', async ({ request }) => {
    const response = await request.post('/api/families/any-uuid/invitations', {
      data: { email: 'guardian@example.com' },
    })
    // FAM-02: only active guardians can invite
    expect(response.status()).toBe(401)
  })

  test('GET /api/families/invitations/[token] should return 404 for invalid token', async ({ request }) => {
    const response = await request.get('/api/families/invitations/invalid-token-12345')
    // Invalid tokens must not leak family data
    expect(response.status()).toBe(404)
  })
})

test.describe('Family access — audit routes (FAM-07)', () => {
  test('GET /api/families/[id]/audit should return 401 when unauthenticated', async ({ request }) => {
    const response = await request.get('/api/families/any-uuid/audit')
    // FAM-07: only authenticated family members can view audit timeline
    expect(response.status()).toBe(401)
  })
})

test.describe('Family access — onboarding page smoke (FAM-01)', () => {
  test('homepage should not enumerate family count when unauthenticated', async ({ page }) => {
    await page.goto('/')
    // Phase 1 proof-of-concept showed family count; Phase 02 must remove that
    const bodyText = await page.textContent('body')
    // Should not show "X families" to unauthenticated visitors
    expect(bodyText).not.toMatch(/\d+ families/)
  })
})
