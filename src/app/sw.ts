import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { Serwist } from 'serwist'

declare global {
  interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  // Exclude auth routes from SW — OAuth PKCE/state cookies must reach the
  // server unmodified. SW interception of /api/auth/* drops cookies and
  // breaks the code exchange, causing Errors.AuthRequest.NoCode from Zitadel.
  excludeFromInterception: [/\/api\/auth\/.*/],
})

serwist.addEventListeners()
