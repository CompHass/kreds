import { test, expect } from '@playwright/test'

// Updated for Phase 02: routes restructured from /api/families/[id]/... to flat route handlers.
// Real routes implemented: /api/families (GET/POST), /api/families/children (POST),
// /api/families/children/deactivate (POST), /api/families/invitations (POST with action param).

test.describe('Family access — unauthenticated denial (FAM-01, FAM-05)', () => {
  test('GET /api/families should return 401 when unauthenticated', async ({ request }) => {
    const response = await request.get('/api/families')
    // FAM-01: unauthenticated access must not enumerate or expose family data
    expect(response.status()).toBe(401)
  })

  test('POST /api/families should return 401 when unauthenticated', async ({ request }) => {
    const response = await request.post('/api/families', {
      data: { name: 'Test Family', timezone: 'UTC' },
    })
    // FAM-01: unauthenticated callers must not create families
    expect(response.status()).toBe(401)
  })

  test('GET /api/families should not return 200 with family list (tenant enumeration prevention)', async ({
    request,
  }) => {
    const response = await request.get('/api/families')
    // FAM-05: unauthenticated users must not enumerate families
    // The unscoped Phase 1 proof-of-concept behavior must be replaced
    expect(response.status()).not.toBe(200)
  })
})

test.describe('Family access — child profile routes (FAM-03)', () => {
  test('POST /api/families/children should return 401 when unauthenticated', async ({ request }) => {
    const response = await request.post('/api/families/children', {
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
})

test.describe('Family access — invitation routes (FAM-02)', () => {
  test('POST /api/families/invitations with action=create returns 401 when unauthenticated', async ({
    request,
  }) => {
    const response = await request.post('/api/families/invitations', {
      data: { action: 'create', email: 'guardian@example.com' },
    })
    // FAM-02: only active guardians can invite
    expect(response.status()).toBe(401)
  })

  test('POST /api/families/invitations with action=decline returns 401 when unauthenticated', async ({
    request,
  }) => {
    const response = await request.post('/api/families/invitations', {
      data: { action: 'decline', token: 'fake-token-for-auth-test' },
    })
    // Gap closure: CR-03 fix — decline must require authentication to prevent anonymous token-guessing attacks
    // VERIFICATION.md item 3: unauthenticated decline must return 401
    expect(response.status()).toBe(401)
  })
})

test.describe('Family access — audit routes (FAM-07)', () => {
  test('unauthenticated visit to /family/audit should not display audit data', async ({ page }) => {
    await page.goto('/family/audit')
    // FAM-07: only authenticated family members can view audit timeline
    // The page is server-rendered and must redirect or show nothing sensitive
    const finalUrl = page.url()
    const isRedirected = !finalUrl.includes('/family/audit')

    if (!isRedirected) {
      const bodyText = await page.textContent('body')
      // If not redirected, the page must not contain sensitive audit data
      expect(bodyText).not.toMatch(/audit.*event|guardianInvitation|memberJoined/i)
    } else {
      // Redirect to login or home is the expected safe behavior
      expect(finalUrl).toMatch(/\/(api\/auth\/signin|$)/)
    }
  })
})

test.describe('Family access — homepage smoke (FAM-01)', () => {
  test('homepage should not enumerate family count when unauthenticated', async ({ page }) => {
    await page.goto('/')
    // Phase 1 proof-of-concept showed family count; Phase 02 must remove that
    const bodyText = await page.textContent('body')
    // Should not show "X families" to unauthenticated visitors
    expect(bodyText).not.toMatch(/\d+ families/)
  })
})
