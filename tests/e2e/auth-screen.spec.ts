// Gap closure: covers VERIFICATION.md human_verification items 1 (partial), 2 (partial), and landing screen UI-01
import { test, expect } from '@playwright/test'

test.describe('Auth screen — Sylvan landing (FAM-01, UI-01)', () => {
  test('landing page renders Sylvan branding when unauthenticated', async ({ page }) => {
    await page.goto('/')

    const bodyText = await page.textContent('body')

    // Sylvan wordmark must be present
    expect(bodyText).toContain('Kreds')

    // Subtitle must be present
    expect(bodyText).toContain('Mordomia cristã para famílias')

    // Sign-in CTA must be present
    expect(bodyText).toContain('Entrar com ZITADEL')

    // Regression: Phase 1 proof-of-concept family count must not appear
    expect(bodyText).not.toMatch(/families registered/)

    // Must not show a numeric family counter (pattern: digit + "famílias")
    // Note: "Acesso exclusivo para famílias cadastradas" is expected and acceptable
    expect(bodyText).not.toMatch(/\d+\s+famílias/)
  })

  test('sign in button links to /api/auth/signin', async ({ page }) => {
    await page.goto('/')

    // Locate the sign-in link by accessible role and visible text
    const signInLink = page.getByRole('link', { name: /Entrar com ZITADEL/i })

    const href = await signInLink.getAttribute('href')

    // Link must point to the NextAuth sign-in endpoint
    expect(href).toContain('/api/auth/signin')
  })

  test('unauthenticated visitor does not see family dashboard content', async ({ page }) => {
    await page.goto('/family/children')

    // Should have been redirected away from /family/children without a session
    const finalUrl = page.url()
    const isRedirected = !finalUrl.includes('/family/children')

    if (!isRedirected) {
      // If not redirected, body must not contain authenticated dashboard content
      const bodyText = await page.textContent('body')
      expect(bodyText).not.toMatch(/children.*dashboard|dashboard.*children/i)
    } else {
      // Redirect happened — verify the destination is safe (login screen or home)
      expect(finalUrl).toMatch(/\/(api\/auth\/signin|$)/)
    }
  })

  test('POST to /api/families returns 401 when unauthenticated', async ({ request }) => {
    // FAM-01: unauthenticated callers must not be able to create families
    const response = await request.post('/api/families', {
      data: { name: 'Test', timezone: 'America/Sao_Paulo' },
    })

    expect(response.status()).toBe(401)
  })

  test('LIVE ZITADEL — session identity verification after login', async ({ page }) => {
    // Requires live ZITADEL credentials — run manually per VERIFICATION.md item 1
    test.skip(true, 'Requires live ZITADEL credentials — run manually per VERIFICATION.md item 1')

    // After successful login, session.user.id must equal the ZITADEL subject (sub) claim.
    // Steps:
    //   1. Navigate to / and click "Entrar com ZITADEL"
    //   2. Complete ZITADEL OAuth login with valid credentials
    //   3. Inspect the session: /api/auth/session should return { user: { id: "<ZITADEL sub>" } }
    //   4. Confirm id matches the subject from the ZITADEL token
    await page.goto('/')
  })

  test('LIVE ZITADEL — post-creation routing loads /family/children', async ({ page }) => {
    // Requires live ZITADEL session and database family — run manually per VERIFICATION.md item 2
    test.skip(
      true,
      'Requires live ZITADEL session and database family — run manually per VERIFICATION.md item 2',
    )

    // After creating a family via /family/onboarding, navigating to / should redirect to
    // /family/children and display child management content without errors.
    // Steps:
    //   1. Login with live ZITADEL credentials
    //   2. Complete family onboarding at /family/onboarding
    //   3. Confirm / redirects to /family/children
    //   4. Confirm /family/children loads without 404 or unhandled error
    await page.goto('/')
  })
})
