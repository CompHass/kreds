// @vitest-environment node
import { describe, it, expect } from 'vitest'

describe('check matcher string', () => {
  it('test sw\\.js in string vs regex', () => {
    const r = /sw\\?\.js/i
    // Test what string content matches
    const s1 = 'sw.js'   // no backslash
    const s2 = 'sw\\.js' // one backslash in TS source = sw\.js at runtime
    const s3 = 'sw?.js'  // literal question mark
    console.log('s1 (sw.js):', r.test(s1))
    console.log('s2 (sw\\.js as TS):', JSON.stringify(s2), r.test(s2))
    console.log('s3 (sw?.js):', r.test(s3))
    expect(true).toBe(true)
  })
})
