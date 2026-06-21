'use client'

interface PinDotProps {
  filled: boolean
  error: boolean
}

export function PinDot({ filled, error }: PinDotProps) {
  const getBg = () => {
    if (error) return '#D8916B'
    if (filled) return '#3E6B4F'
    return 'transparent'
  }

  const getBorder = () => {
    if (error) return '2px solid #C06B4A'
    if (filled) return '2px solid #3E6B4F'
    return '2px solid #C3C9B7'
  }

  return (
    <div
      style={{
        width: 16,
        height: 16,
        borderRadius: '50%',
        background: getBg(),
        border: getBorder(),
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {filled && !error && (
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ animation: 'var(--animate-kreds-sprout)', position: 'absolute' }}
        >
          {/* Brotinho — caule */}
          <line x1="5" y1="9" x2="5" y2="5" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
          {/* Brotinho — folha esquerda */}
          <path d="M5 6.5 C3.5 5.5 2.5 4 3.5 3 C4.5 2 5 4 5 5.5" fill="#fff" opacity="0.9" />
          {/* Brotinho — folha direita */}
          <path d="M5 6.5 C6.5 5.5 7.5 4 6.5 3 C5.5 2 5 4 5 5.5" fill="#fff" opacity="0.9" />
          {/* Brotinho — ponta */}
          <circle cx="5" cy="3.5" r="1" fill="#fff" />
        </svg>
      )}
    </div>
  )
}
