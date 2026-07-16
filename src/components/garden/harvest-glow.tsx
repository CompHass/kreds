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
        bottom: 26,
        left: 0,
        right: 0,
        margin: '0 auto',
        width: 260,
        height: 260,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(227,197,124,.5) 0%, transparent 65%)',
        pointerEvents: 'none',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease',
      }}
    />
  )
}
