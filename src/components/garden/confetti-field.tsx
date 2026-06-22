// GARD-10: 20 confetes estáticos — array fora do componente (sem Math.random no render)
// Pattern 4 do RESEARCH.md — evita hidratação SSR/CSR mismatch

const CONFETTI_COLORS = ['#3E6B4F', '#E3C57C', '#C98AA0', '#6E9BA0', '#B5623F']

const CONFETTI_ITEMS = Array.from({ length: 20 }, (_, i) => ({
  left: `${5 + (i * 4.75) % 90}%`,
  delay: `${i * 100}ms`,
  color: CONFETTI_COLORS[i % 5],
  size: 8 + (i % 4) * 3,
}))

export function ConfettiField() {
  return (
    <>
      {CONFETTI_ITEMS.map((c, i) => (
        <div
          key={i}
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: c.left,
            top: '-30px',
            width: c.size,
            height: c.size,
            borderRadius: 2,
            background: c.color,
            animation: 'var(--animate-kreds-confetti)',
            animationDelay: c.delay,
          }}
        />
      ))}
    </>
  )
}
