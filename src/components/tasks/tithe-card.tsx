'use client'

// CTASK-03: TitheCard — card de dízimo com botão "Plantar" / estado "Feito ✓" / desfazer

interface TitheCardProps {
  done: boolean
  onPlant: () => void
  onUnplant?: () => void
}

export function TitheCard({ done, onPlant, onUnplant }: TitheCardProps) {
  function handleClick() {
    if (done) {
      onUnplant?.()
    } else {
      onPlant()
    }
  }

  return (
    <div style={{ padding: '0 16px' }}>
      <div
        style={{
          background: 'var(--color-kreds-card)',
          border: '1px solid var(--color-kreds-border)',
          borderRadius: 'var(--radius-card-md)',
          padding: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Lado esquerdo: ícone + título */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Ícone de flor (4 pétalas: #C98AA0, centro: #E3C57C) */}
          <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            aria-hidden="true"
          >
            {/* Pétalas */}
            <ellipse cx="20" cy="12" rx="5" ry="9" fill="#C98AA0" />
            <ellipse cx="20" cy="28" rx="5" ry="9" fill="#C98AA0" />
            <ellipse cx="12" cy="20" rx="9" ry="5" fill="#C98AA0" />
            <ellipse cx="28" cy="20" rx="9" ry="5" fill="#C98AA0" />
            {/* Centro dourado */}
            <circle cx="20" cy="20" r="7" fill="#E3C57C" />
          </svg>

          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '-0.01em',
              color: '#27372C',
            }}
          >
            Dízimo
          </span>
        </div>

        {/* Botão "Plantar" / "Feito ✓" / "Desfazer" (D-11) */}
        <button
          onClick={handleClick}
          aria-label={done ? 'Desfazer dízimo plantado' : 'Plantar dízimo'}
          style={{
            border: 'none',
            borderRadius: 'var(--radius-card-sm)',
            height: 44,
            padding: '10px 20px',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: 15,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-cta)',
            transition: 'background .3s ease',
            background: done
              ? '#B07E91'
              : 'linear-gradient(135deg, #C98AA0 0%, #A55E76 100%)',
          }}
        >
          {done ? 'Feito ✓' : 'Plantar'}
        </button>
      </div>
    </div>
  )
}
