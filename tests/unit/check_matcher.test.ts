// @vitest-environment node
import { describe, it, expect } from 'vitest'

process.env.CHILD_SESSION_SECRET ??= '0123456789abcdef0123456789abcdef0123456789abcdef'

describe('check matcher', () => {
  it('logs the matcher value', async () => {
    const { config } = await import('/Users/hass/repos/github/comphass/kreds/src/middleware')
    const matcherStr = config.matcher[0]
    console.log('matcherStr JSON:', JSON.stringify(matcherStr))
    console.log('matcherStr raw:', matcherStr)
    const r = /sw\\?\.js/i
    console.log('regex source:', r.source)
    console.log('test result:', r.test(matcherStr))
    expect(true).toBe(true)
  })
})
