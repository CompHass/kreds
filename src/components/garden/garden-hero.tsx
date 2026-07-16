// GARD-02: Container hero do jardim 316px — céu em gradiente, sol, nuvens fofas,
// morros em curvas SVG e composição dos filhos (planta, bubble, flores, glow).

import type { ReactNode } from 'react'
import { PlantStage } from './plant-stage'
import { WaterTracker } from './water-tracker'
import { SeasonBadge } from './season-badge'
import { SpeechBubble } from './speech-bubble'
import { DecorativeFlowers } from './decorative-flowers'
import { HarvestGlow } from './harvest-glow'

interface GardenHeroProps {
  stage: 'a' | 'b' | 'c' | 'd'
  season: 'primavera' | 'verao' | 'outono' | 'inverno'
  waterCount: number // 0–4
  titheDone: boolean
  canHarvest: boolean
  droop?: boolean
  pop?: boolean
  showBubble: boolean
  bubbleText: string
  children?: ReactNode
}

// Nuvem fofa (três círculos sobre base arredondada)
function Cloud({
  width,
  style,
  opacity = 0.9,
}: {
  width: number
  style: React.CSSProperties
  opacity?: number
}) {
  return (
    <svg
      aria-hidden="true"
      width={width}
      viewBox="0 0 74 30"
      style={{ position: 'absolute', ...style }}
    >
      <g fill={`rgba(255,255,255,${opacity})`}>
        <circle cx="18" cy="19" r="9" />
        <circle cx="36" cy="13" r="12" />
        <circle cx="54" cy="19" r="9" />
        <rect x="12" y="17" width="50" height="11" rx="5.5" />
      </g>
    </svg>
  )
}

export function GardenHero({
  stage,
  season,
  waterCount,
  titheDone,
  canHarvest,
  droop = false,
  pop = false,
  showBubble,
  bubbleText,
  children,
}: GardenHeroProps) {
  return (
    <div
      style={{
        position: 'relative',
        height: 316,
        borderRadius: 28,
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #CBE0D9 0%, #DDE8CE 55%, #C6D6AA 100%)',
      }}
    >
      {/* Cena de fundo: morros em curvas + chão + grama + florzinhas */}
      <svg
        aria-hidden="true"
        width="100%"
        height="150"
        viewBox="0 0 360 150"
        preserveAspectRatio="none"
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'block' }}
      >
        <defs>
          <linearGradient id="kreds-ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#AFC289" />
            <stop offset="100%" stopColor="#96AB71" />
          </linearGradient>
        </defs>
        {/* Morro esquerdo */}
        <path d="M0 78 C 55 28 125 40 195 82 L195 150 L0 150 Z" fill="#BCCC9F" />
        {/* Morro direito */}
        <path d="M360 82 C 305 32 235 46 165 84 L165 150 L360 150 Z" fill="#ACBD8E" />
        {/* Chão */}
        <path d="M0 104 C 90 86 270 86 360 104 L360 150 L0 150 Z" fill="url(#kreds-ground)" />
        {/* Tufos de grama */}
        <g stroke="#7E9A5C" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7">
          <path d="M38 128 C 37 122 36 119 34 116" />
          <path d="M42 128 C 42 121 42 118 42 115" />
          <path d="M46 128 C 47 122 48 119 50 117" />
          <path d="M312 132 C 311 126 310 123 308 120" />
          <path d="M316 132 C 316 125 316 122 316 119" />
          <path d="M320 132 C 321 126 322 123 324 121" />
        </g>
        {/* Florzinhas nos morros */}
        <circle cx="60" cy="70" r="2.2" fill="#FBFAF5" opacity="0.8" />
        <circle cx="84" cy="82" r="1.8" fill="#FBFAF5" opacity="0.7" />
        <circle cx="286" cy="76" r="2.2" fill="#FBFAF5" opacity="0.8" />
        <circle cx="308" cy="88" r="1.8" fill="#FBFAF5" opacity="0.7" />
      </svg>

      {/* Sol — kredsSun infinite */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 46,
          right: 16,
          width: 46,
          height: 46,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #F5D878 0%, #E8C43E 100%)',
          animation: 'var(--animate-kreds-sun)',
          boxShadow: '0 0 24px rgba(232,196,62,.45)',
        }}
      />

      {/* Nuvens — kredsDrift1/kredsDrift2 */}
      <Cloud width={74} style={{ top: 26, left: 18, animation: 'var(--animate-kreds-drift1)' }} />
      <Cloud
        width={54}
        opacity={0.7}
        style={{ top: 58, left: 66, animation: 'var(--animate-kreds-drift2)' }}
      />

      {/* Badge de estação */}
      <div style={{ position: 'absolute', top: 12, left: 12 }}>
        <SeasonBadge season={season} />
      </div>

      {/* Tracker de água (visível quando não pode colher) */}
      {!canHarvest && (
        <div style={{ position: 'absolute', top: 12, right: 12 }}>
          <WaterTracker filled={waterCount} />
        </div>
      )}

      {/* Glow de colheita ao redor da copa */}
      <HarvestGlow visible={canHarvest} />

      {/* Planta no estágio atual */}
      <PlantStage stage={stage} droop={droop} pop={pop} />

      {/* Flores decorativas de dízimo — flanqueiam o vaso */}
      <DecorativeFlowers visible={titheDone} />

      {/* Speech bubble contextual no topo do céu */}
      <SpeechBubble text={bubbleText} visible={showBubble} />

      {/* Slot para overlays do GardenView (WaterDrops, HarvestButton) */}
      {children}
    </div>
  )
}
