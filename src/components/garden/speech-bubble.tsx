// GARD-07: Speech bubble com texto contextual e animação kredsBubble

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
        bottom: 60,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--color-kreds-card)',
        borderRadius: 'var(--radius-card-md)',
        padding: '8px 14px',
        maxWidth: 240,
        textAlign: 'center',
        animation: 'var(--animate-kreds-bubble)',
        boxShadow: 'var(--shadow-card)',
        whiteSpace: 'nowrap',
        zIndex: 10,
      }}
    >
      <span
        style={{
          fontSize: 14,
          fontWeight: 500,
          lineHeight: 1.5,
          color: 'var(--color-kreds-text)',
        }}
      >
        {text}
      </span>
      {/* Triângulo de ponteiro */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: -6,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '6px solid var(--color-kreds-card)',
        }}
      />
    </div>
  )
}
