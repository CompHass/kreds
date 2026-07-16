// GARD-07: Speech bubble contextual — ancorado no topo do céu, rabinho apontando
// para a planta. Centralizado via flex no wrapper (sem translateX no elemento
// animado, para o kredsBubble não sobrescrever o posicionamento).

interface SpeechBubbleProps {
  text: string
  visible: boolean
}

export function SpeechBubble({ text, visible }: SpeechBubbleProps) {
  if (!visible) return null

  return (
    <div
      style={{
        position: 'absolute',
        top: 46,
        left: 16,
        right: 16,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      <div
        style={{
          position: 'relative',
          background: 'var(--color-kreds-card)',
          border: '1px solid var(--color-kreds-border)',
          borderRadius: 16,
          padding: '9px 14px',
          maxWidth: 250,
          textAlign: 'center',
          boxShadow: 'var(--shadow-card)',
          animation: 'var(--animate-kreds-bubble)',
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            lineHeight: 1.45,
            color: 'var(--color-kreds-text)',
          }}
        >
          {text}
        </span>
        {/* Rabinho apontando para a planta */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: -5.5,
            left: '50%',
            marginLeft: -5,
            width: 10,
            height: 10,
            background: 'var(--color-kreds-card)',
            borderRight: '1px solid var(--color-kreds-border)',
            borderBottom: '1px solid var(--color-kreds-border)',
            transform: 'rotate(45deg)',
          }}
        />
      </div>
    </div>
  )
}
