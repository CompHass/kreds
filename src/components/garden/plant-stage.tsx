// GARD-03: Planta vetorial por estágio — mesmo vaso em todos os estágios,
// crescimento contínuo (broto → muda → arbusto florido → árvore com frutos dourados).
// O sprout anima a troca de estágio a partir do solo; o pop é aplicado no <svg>
// (sem transform posicional no elemento animado — evita o "pulo" lateral do kredsPop).

interface PlantStageProps {
  stage: 'a' | 'b' | 'c' | 'd'
  droop: boolean
  pop: boolean
}

const SHADOW = 'drop-shadow(0 6px 10px rgba(39,55,44,.18))'

function Leaf({
  x,
  y,
  rx,
  ry,
  angle,
  fill,
}: {
  x: number
  y: number
  rx: number
  ry: number
  angle: number
  fill: string
}) {
  return (
    <g transform={`rotate(${angle} ${x} ${y})`}>
      <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={fill} />
      <line
        x1={x - rx * 0.65}
        y1={y}
        x2={x + rx * 0.65}
        y2={y}
        stroke="#3E6B4F"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.3"
      />
    </g>
  )
}

function Daisy({ x, y, r = 3.2 }: { x: number; y: number; r?: number }) {
  // 5 pétalas distribuídas a cada 72° a partir do topo
  const petals = Array.from({ length: 5 }, (_, i) => {
    const a = (-90 + i * 72) * (Math.PI / 180)
    return [Math.cos(a) * r * 1.4, Math.sin(a) * r * 1.4]
  })
  return (
    <g>
      {petals.map(([dx, dy], i) => (
        <circle key={i} cx={x + dx} cy={y + dy} r={r} fill="#FBFAF5" />
      ))}
      <circle cx={x} cy={y} r={r * 0.72} fill="#E3C57C" />
    </g>
  )
}

function GoldenFruit({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <line
        x1={x}
        y1={y - 5}
        x2={x + 1.5}
        y2={y - 10}
        stroke="#9A7320"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx={x} cy={y} r={6.5} fill="#E3C57C" stroke="#C9A455" strokeWidth="1" />
      <circle cx={x - 2} cy={y - 2} r={1.9} fill="#F6E3AE" />
    </g>
  )
}

// Vaso de terracota constante entre estágios — a continuidade do vaso é o que
// faz a troca de estágio ler como crescimento, não como troca de planta.
function Pot() {
  return (
    <g>
      {/* Sombra no chão */}
      <ellipse cx="110" cy="234" rx="48" ry="6" fill="#7D9460" opacity="0.35" />
      {/* Corpo */}
      <path
        d="M80 184 L140 184 L133.5 226 Q132.5 232 126 232 L94 232 Q87.5 232 86.5 226 Z"
        fill="#B5623F"
      />
      {/* Luz lateral do corpo */}
      <path d="M84 184 L96 184 L92.5 231 L91.5 231 Q88.5 230 87.6 226 Z" fill="#C97B57" opacity="0.6" />
      {/* Coração em relevo */}
      <path
        d="M110 203 c-2.6 -3 -7 -2.2 -7 1.4 c0 2.8 4 5.6 7 7.6 c3 -2 7 -4.8 7 -7.6 c0 -3.6 -4.4 -4.4 -7 -1.4 Z"
        fill="#96482A"
        opacity="0.85"
      />
      {/* Borda superior */}
      <rect x="72" y="170" width="76" height="15" rx="7" fill="#C97B57" />
      <rect x="76" y="182" width="68" height="3" rx="1.5" fill="#96482A" opacity="0.4" />
      {/* Terra */}
      <ellipse cx="110" cy="177" rx="31" ry="5.5" fill="#5C3D2C" />
      <ellipse cx="110" cy="176" rx="31" ry="5" fill="#6E4936" />
      <circle cx="98" cy="176" r="1.8" fill="#8A6A52" />
      <circle cx="121" cy="177" r="1.4" fill="#8A6A52" />
    </g>
  )
}

// a — broto com caule em espiral
function StageA() {
  return (
    <g style={{ animation: 'var(--animate-kreds-sway)', transformOrigin: '110px 174px' }}>
      <path
        d="M110 176 C 110 166 108.5 158 110 148"
        stroke="#5A8A66"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M110 148 C 110 140 119 136 122.5 141 C 125 145 121 149 117.5 147.5"
        stroke="#5A8A66"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />
      <Leaf x={95} y={160} rx={11} ry={5.5} angle={-28} fill="#6FA07A" />
      <Leaf x={125} y={164} rx={11} ry={5.5} angle={26} fill="#5A8A66" />
    </g>
  )
}

// b — muda com folhas alternadas e broto no topo
function StageB() {
  return (
    <g style={{ animation: 'var(--animate-kreds-sway)', transformOrigin: '110px 174px' }}>
      <path
        d="M110 176 C 110 154 112 140 110 118"
        stroke="#5A8A66"
        strokeWidth="5.5"
        fill="none"
        strokeLinecap="round"
      />
      <Leaf x={93} y={152} rx={13} ry={6.5} angle={-28} fill="#6FA07A" />
      <Leaf x={128} y={142} rx={13} ry={6.5} angle={26} fill="#5A8A66" />
      <Leaf x={92} y={130} rx={12} ry={6} angle={-32} fill="#5A8A66" />
      <Leaf x={127} y={122} rx={12} ry={6} angle={30} fill="#6FA07A" />
      <circle cx="110" cy="114" r="4.5" fill="#6FA07A" />
      <Leaf x={102} y={110} rx={8} ry={4} angle={-30} fill="#7FAE8B" />
      <Leaf x={118} y={110} rx={8} ry={4} angle={30} fill="#7FAE8B" />
    </g>
  )
}

// c — arbusto com flores brancas
function StageC() {
  return (
    <g style={{ animation: 'var(--animate-kreds-sway)', transformOrigin: '110px 144px' }}>
      <path
        d="M110 176 C 110 162 108 154 110 144"
        stroke="#5A8A66"
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="110" cy="120" r="40" fill="#4E7A5C" />
      <circle cx="82" cy="118" r="25" fill="#5A8A66" />
      <circle cx="138" cy="118" r="25" fill="#5A8A66" />
      <circle cx="93" cy="95" r="24" fill="#6FA07A" />
      <circle cx="127" cy="95" r="24" fill="#6FA07A" />
      <circle cx="110" cy="88" r="23" fill="#7FAE8B" />
      <circle cx="110" cy="112" r="30" fill="#6FA07A" />
      <Daisy x={110} y={86} />
      <Daisy x={84} y={106} />
      <Daisy x={136} y={104} />
      <Daisy x={97} y={126} r={2.8} />
      <Daisy x={124} y={124} r={2.8} />
    </g>
  )
}

// d — árvore com frutos dourados (fruto = recompensa da colheita)
function StageD() {
  return (
    <g style={{ animation: 'var(--animate-kreds-sway)', transformOrigin: '110px 140px' }}>
      <path
        d="M110 176 C 110 160 106 150 109 136"
        stroke="#8A5A3B"
        strokeWidth="9"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M109.5 150 C 100 144 94 140 88 136"
        stroke="#8A5A3B"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M109.5 148 C 120 142 126 138 132 134"
        stroke="#8A5A3B"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="110" cy="104" r="46" fill="#4E7A5C" />
      <circle cx="72" cy="110" r="27" fill="#5A8A66" />
      <circle cx="148" cy="110" r="27" fill="#5A8A66" />
      <circle cx="85" cy="76" r="26" fill="#6FA07A" />
      <circle cx="135" cy="76" r="26" fill="#6FA07A" />
      <circle cx="110" cy="62" r="24" fill="#7FAE8B" />
      <circle cx="110" cy="96" r="34" fill="#6FA07A" />
      <Daisy x={78} y={86} r={2.8} />
      <Daisy x={142} y={88} r={2.8} />
      <Daisy x={110} y={46} r={2.8} />
      <GoldenFruit x={88} y={94} />
      <GoldenFruit x={133} y={90} />
      <GoldenFruit x={110} y={116} />
      <GoldenFruit x={70} y={112} />
      <GoldenFruit x={150} y={106} />
      <GoldenFruit x={97} y={66} />
      <GoldenFruit x={126} y={68} />
    </g>
  )
}

const STAGES = { a: StageA, b: StageB, c: StageC, d: StageD }

export function PlantStage({ stage, droop, pop }: PlantStageProps) {
  const Stage = STAGES[stage]
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 34,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <svg
        width="200"
        viewBox="0 0 220 240"
        role="img"
        aria-label={`Planta no estágio ${stage}`}
        style={{
          overflow: 'visible',
          filter: droop ? `saturate(.88) ${SHADOW}` : SHADOW,
          animation: pop ? 'var(--animate-kreds-pop)' : undefined,
        }}
      >
        <Pot />
        {/* key={stage} remonta o grupo e replay do sprout a partir do solo */}
        <g
          key={stage}
          style={{
            animation: 'var(--animate-kreds-sprout)',
            transformOrigin: '110px 176px',
          }}
        >
          <Stage />
        </g>
      </svg>
    </div>
  )
}
