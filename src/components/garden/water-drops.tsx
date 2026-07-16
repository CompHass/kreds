// GARD-05: 5 drops animados (kredsDrop) com delays escalonados
// Remontado via key={waterTick} no GardenView para replay da animação

const DROPS = [0, 80, 160, 240, 320] // delays em ms

export function WaterDrops() {
  return (
    <>
      {DROPS.map((delay, i) => (
        <div
          key={i}
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: 150,
            left: `${34 + i * 8}%`,
            width: 10,
            height: 14,
            borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
            background: 'var(--color-kreds-water)',
            animation: 'var(--animate-kreds-drop)',
            animationDelay: `${delay}ms`,
          }}
        />
      ))}
    </>
  )
}
