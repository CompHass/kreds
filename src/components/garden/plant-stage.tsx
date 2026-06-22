// GARD-03: Imagem da planta por estágio com animações de droop e pop

interface PlantStageProps {
  stage: 'a' | 'b' | 'c' | 'd'
  droop: boolean
  pop: boolean
}

export function PlantStage({ stage, droop, pop }: PlantStageProps) {
  const transform = [
    'translateX(-50%)',
    droop ? 'rotate(-2.5deg)' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <img
      src={`/garden/plant-${stage}.png`}
      alt={`Planta no estágio ${stage}`}
      style={{
        position: 'absolute',
        bottom: 30,
        left: '50%',
        transform,
        transformOrigin: '50% 94%',
        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,.15))',
        maxHeight: 200,
        animation: pop ? 'var(--animate-kreds-pop)' : undefined,
      }}
    />
  )
}
