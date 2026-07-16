// GARD-09: Flores decorativas de dízimo — dois arranjos flanqueando o vaso,
// no mesmo estilo vetorial da planta (margaridas rosa com centro dourado).

interface DecorativeFlowersProps {
  visible: boolean
}

function FlowerCluster({ mirrored = false }: { mirrored?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width="56"
      height="64"
      viewBox="0 0 56 64"
      style={{ transform: mirrored ? 'scaleX(-1)' : undefined }}
    >
      {/* Caules */}
      <path
        d="M16 26 C 16 38 16 48 16 58"
        stroke="#5A8A66"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M38 34 C 38 42 38 50 38 58"
        stroke="#5A8A66"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      {/* Folhas */}
      <g transform="rotate(-40 9 44)">
        <ellipse cx="9" cy="44" rx="7" ry="3.5" fill="#6FA07A" />
      </g>
      <g transform="rotate(40 45 48)">
        <ellipse cx="45" cy="48" rx="6" ry="3" fill="#6FA07A" />
      </g>
      {/* Flor maior */}
      <g>
        <circle cx="16" cy="14" r="5" fill="var(--color-kreds-rose)" />
        <circle cx="10" cy="20" r="5" fill="var(--color-kreds-rose)" />
        <circle cx="22" cy="20" r="5" fill="var(--color-kreds-rose)" />
        <circle cx="12" cy="26" r="5" fill="var(--color-kreds-rose)" />
        <circle cx="20" cy="26" r="5" fill="var(--color-kreds-rose)" />
        <circle cx="16" cy="21" r="4" fill="#E3C57C" />
      </g>
      {/* Flor menor */}
      <g>
        <circle cx="38" cy="26" r="4" fill="var(--color-kreds-rose)" opacity="0.9" />
        <circle cx="33" cy="31" r="4" fill="var(--color-kreds-rose)" opacity="0.9" />
        <circle cx="43" cy="31" r="4" fill="var(--color-kreds-rose)" opacity="0.9" />
        <circle cx="35" cy="36" r="4" fill="var(--color-kreds-rose)" opacity="0.9" />
        <circle cx="41" cy="36" r="4" fill="var(--color-kreds-rose)" opacity="0.9" />
        <circle cx="38" cy="31" r="3.2" fill="#E3C57C" />
      </g>
    </svg>
  )
}

export function DecorativeFlowers({ visible }: DecorativeFlowersProps) {
  if (!visible) return null

  return (
    <div
      data-testid="decorative-flowers"
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      <div
        style={{
          position: 'absolute',
          left: '9%',
          bottom: 36,
          animation: 'var(--animate-kreds-sprout)',
          transformOrigin: 'bottom center',
        }}
      >
        <FlowerCluster />
      </div>
      <div
        style={{
          position: 'absolute',
          right: '9%',
          bottom: 36,
          animation: 'var(--animate-kreds-sprout)',
          transformOrigin: 'bottom center',
        }}
      >
        <FlowerCluster mirrored />
      </div>
    </div>
  )
}
