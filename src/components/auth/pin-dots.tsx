'use client'

import { PinDot } from './pin-dot'

interface PinDotsProps {
  count: number
  error: boolean
}

export function PinDots({ count, error }: PinDotsProps) {
  return (
    <div
      role="status"
      aria-label={`PIN: ${count} de 4 dígitos preenchidos`}
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        animation: error ? 'var(--animate-kreds-shake)' : undefined,
      }}
    >
      {Array.from({ length: 4 }, (_, i) => (
        <PinDot key={i} filled={i < count} error={error} />
      ))}
    </div>
  )
}
