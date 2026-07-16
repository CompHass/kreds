// GARD-04: Tracker de água com 4 dots

interface WaterTrackerProps {
  filled: number // 0–4
}

export function WaterTracker({ filled }: WaterTrackerProps) {
  return (
    <div
      aria-label={`Tracker de água: ${filled} de 4 tarefas concluídas`}
      style={{
        display: 'flex',
        gap: 6,
        alignItems: 'center',
        background: 'var(--color-kreds-card)',
        border: '1px solid var(--color-kreds-border)',
        borderRadius: 'var(--radius-pill)',
        padding: '7px 10px',
      }}
    >
      {Array.from({ length: 4 }, (_, i) => (
        <div
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: i < filled ? 'var(--color-kreds-water)' : 'rgba(255,255,255,.35)',
          }}
        />
      ))}
    </div>
  )
}
