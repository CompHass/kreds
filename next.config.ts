import withSerwist from '@serwist/next'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
}

export default withSerwist({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
})(nextConfig)
