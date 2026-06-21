'use client'

interface NumericKeypadProps {
  onDigit: (d: string) => void
  onBackspace: () => void
}

const ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', '⌫'],
]

export function NumericKeypad({ onDigit, onBackspace }: NumericKeypadProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 64px)',
        columnGap: 8,
        rowGap: 12,
        justifyContent: 'center',
      }}
    >
      {ROWS.map((row, rowIndex) =>
        row.map((key, colIndex) => {
          const cellKey = `${rowIndex}-${colIndex}`

          // Célula vazia (posição [3][0] — o "*")
          if (key === '') {
            return <div key={cellKey} style={{ width: 64, height: 64 }} />
          }

          // Botão backspace
          if (key === '⌫') {
            return (
              <button
                key={cellKey}
                type="button"
                aria-label="Apagar"
                onClick={onBackspace}
                style={{
                  width: 64,
                  height: 64,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  color: 'var(--color-kreds-text)',
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M7.5 3.5L1.5 10L7.5 16.5H18.5V3.5H7.5Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 7.5L15 10.5M15 7.5L12 10.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )
          }

          // Botões numéricos (0-9)
          return (
            <button
              key={cellKey}
              type="button"
              onClick={() => onDigit(key)}
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: '#FBFAF5',
                boxShadow: '0 3px 0 #E6E1D4',
                border: 'none',
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--color-kreds-text)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'inherit',
              }}
            >
              {key}
            </button>
          )
        }),
      )}
    </div>
  )
}
