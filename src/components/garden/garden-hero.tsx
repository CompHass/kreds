// GARD-02: Container hero do jardim 316px com céu, sol, nuvens, morros, chão e composição dos filhos

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
        background: 'linear-gradient(180deg, #CFE0D8 0%, #DCE6CC 50%, #CCD8AF 100%)',
      }}
    >
      {/* Sol — kredsSun infinite */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 16,
          right: 24,
          width: 58,
          height: 58,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #F5D878 0%, #E8C43E 100%)',
          animation: 'var(--animate-kreds-sun)',
          boxShadow: '0 0 20px rgba(232,196,62,.5)',
        }}
      />

      {/* Nuvem 1 — kredsDrift1 */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 28,
          left: 20,
          width: 64,
          height: 22,
          borderRadius: 999,
          background: 'rgba(255,255,255,0.85)',
          animation: 'var(--animate-kreds-drift1)',
        }}
      />

      {/* Nuvem 2 — kredsDrift2 */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 50,
          left: 60,
          width: 44,
          height: 16,
          borderRadius: 999,
          background: 'rgba(255,255,255,0.7)',
          animation: 'var(--animate-kreds-drift2)',
        }}
      />

      {/* Morro esquerdo */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: 30,
          left: -80,
          width: 260,
          height: 260,
          borderRadius: '50%',
          background: '#BBCB9E',
        }}
      />

      {/* Morro direito */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: 30,
          right: -80,
          width: 260,
          height: 260,
          borderRadius: '50%',
          background: '#A9BA8B',
        }}
      />

      {/* Chão */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 52,
          background: 'linear-gradient(180deg, #AFC289 0%, #96AB71 100%)',
          borderRadius: '999px 999px 0 0',
        }}
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

      {/* Glow de colheita ao redor da planta */}
      <HarvestGlow visible={canHarvest} />

      {/* Planta no estágio atual */}
      <PlantStage stage={stage} droop={droop} pop={pop} />

      {/* Flores decorativas de dízimo */}
      <DecorativeFlowers visible={titheDone} />

      {/* Speech bubble contextual */}
      <SpeechBubble text={bubbleText} visible={showBubble} />

      {/* Slot para overlays do GardenView (WaterDrops, HarvestButton) */}
      {children}
    </div>
  )
}
