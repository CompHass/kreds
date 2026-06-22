// GARD-01: Header da criança com avatar, nome e badge de moedas

interface GardenHeaderProps {
  name: string
  initial: string
  coins: number
}

export function GardenHeader({ name, initial, coins }: GardenHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 16px',
      }}
    >
      {/* Avatar com inicial */}
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 15,
          background: 'linear-gradient(135deg, #5A8A66 0%, #3E6B4F 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          fontWeight: 700,
          color: '#ffffff',
          flexShrink: 0,
        }}
      >
        {initial}
      </div>

      {/* Nome da criança */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 24,
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
            color: 'var(--color-kreds-text)',
          }}
        >
          {name}
        </div>
      </div>

      {/* Badge de moedas */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'var(--color-kreds-card)',
          border: '1px solid var(--color-kreds-border)',
          borderRadius: 'var(--radius-pill)',
          padding: '6px 12px',
        }}
      >
        {/* SVG coin */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <circle cx="8" cy="8" r="7" fill="var(--color-kreds-coin)" />
          <text
            x="8"
            y="11.5"
            textAnchor="middle"
            fontSize="8"
            fontWeight="700"
            fill="#9A7320"
            fontFamily="sans-serif"
          >
            K
          </text>
        </svg>
        {/* Valor de coins */}
        <span
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--color-kreds-gold)',
          }}
        >
          {coins}
        </span>
      </div>
    </div>
  )
}
