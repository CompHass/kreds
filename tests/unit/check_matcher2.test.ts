// @vitest-environment node
import { describe, it, expect } from 'vitest'

describe('check regex', () => {
  it('shows regex source and tests', () => {
    const r = /sw\\?\.js/i
    const bytes = [...r.source].map(c => c.charCodeAt(0).toString(16))
    console.log('regex source:', r.source)
    console.log('regex source bytes:', bytes.join(' '))
    console.log('matches sw.js:', r.test('sw.js'))
    console.log('matches sw?.js:', r.test('sw?.js'))
    console.log('matches sw\\.js:', r.test('sw\\.js'))
    expect(true).toBe(true)
  })
})
