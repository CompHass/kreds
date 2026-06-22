// Glow radial amarelo ao redor da planta quando canHarvest=true

interface HarvestGlowProps {
  visible: boolean
}

export function HarvestGlow({ visible }: HarvestGlowProps) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 220,
        height: 220,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(227,197,124,.4) 0%, transparent 70%)',
        pointerEvents: 'none',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease',
      }}
    />
  )
}
