import type { Metadata } from 'next'
import { SerwistProvider } from '@serwist/next/react'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kreds',
  description: 'Christian stewardship and allowance management for families',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <SerwistProvider swUrl="/sw.js">{children}</SerwistProvider>
      </body>
    </html>
  )
}
