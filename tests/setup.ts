import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Mock global de IntersectionObserver para jsdom (Pitfall 2 do RESEARCH.md)
globalThis.IntersectionObserver = class IntersectionObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  constructor(public callback: IntersectionObserverCallback) {}
} as unknown as typeof IntersectionObserver
