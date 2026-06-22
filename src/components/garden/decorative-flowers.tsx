// GARD-09: Flores decorativas SVG visíveis quando titheDone=true

interface DecorativeFlowersProps {
  visible: boolean
}

export function DecorativeFlowers({ visible }: DecorativeFlowersProps) {
  if (!visible) return null

  return (
    <svg
      data-testid="decorative-flowers"
      width="120"
      height="80"
      viewBox="0 0 120 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{
        position: 'absolute',
        bottom: 40,
        left: '50%',
        transform: 'translateX(-50%)',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      {/* Flor esquerda */}
      <circle cx="20" cy="40" r="8" fill="var(--color-kreds-rose)" opacity="0.85" />
      <circle cx="12" cy="32" r="5" fill="var(--color-kreds-rose)" opacity="0.7" />
      <circle cx="28" cy="32" r="5" fill="var(--color-kreds-rose)" opacity="0.7" />
      <circle cx="12" cy="48" r="5" fill="var(--color-kreds-rose)" opacity="0.7" />
      <circle cx="28" cy="48" r="5" fill="var(--color-kreds-rose)" opacity="0.7" />
      {/* Centro esquerda */}
      <circle cx="20" cy="40" r="4" fill="#F5D0DE" />

      {/* Flor central */}
      <circle cx="60" cy="35" r="10" fill="var(--color-kreds-rose)" opacity="0.9" />
      <circle cx="50" cy="25" r="6" fill="var(--color-kreds-rose)" opacity="0.75" />
      <circle cx="70" cy="25" r="6" fill="var(--color-kreds-rose)" opacity="0.75" />
      <circle cx="50" cy="45" r="6" fill="var(--color-kreds-rose)" opacity="0.75" />
      <circle cx="70" cy="45" r="6" fill="var(--color-kreds-rose)" opacity="0.75" />
      {/* Centro */}
      <circle cx="60" cy="35" r="5" fill="#F5D0DE" />

      {/* Flor direita */}
      <circle cx="100" cy="40" r="8" fill="var(--color-kreds-rose)" opacity="0.85" />
      <circle cx="92" cy="32" r="5" fill="var(--color-kreds-rose)" opacity="0.7" />
      <circle cx="108" cy="32" r="5" fill="var(--color-kreds-rose)" opacity="0.7" />
      <circle cx="92" cy="48" r="5" fill="var(--color-kreds-rose)" opacity="0.7" />
      <circle cx="108" cy="48" r="5" fill="var(--color-kreds-rose)" opacity="0.7" />
      {/* Centro direita */}
      <circle cx="100" cy="40" r="4" fill="#F5D0DE" />

      {/* Caules */}
      <line x1="20" y1="52" x2="20" y2="72" stroke="#5A8A66" strokeWidth="2" strokeLinecap="round" />
      <line x1="60" y1="48" x2="60" y2="72" stroke="#5A8A66" strokeWidth="2" strokeLinecap="round" />
      <line x1="100" y1="52" x2="100" y2="72" stroke="#5A8A66" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
