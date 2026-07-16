'use client'

// Phase 14: shared child avatar — renders the selected preset image, falling
// back to the legacy initial-over-color circle when preset is 'initial',
// unknown, or the asset fails to load (missing file → onError → fallback).
// Used by ProfileCard, GardenHeader, ChildCard, FilterChips, AssigneeSelector
// and ParentTaskCard so every surface stays consistent.

import { useEffect, useRef, useState } from 'react'
import { avatarSrc, avatarEmoji } from '@/lib/avatars/presets'

interface ChildAvatarProps {
  displayName: string
  accentColor: string
  avatarPreset: string
  size: number
  // '50%' circle by default; GardenHeader uses a 15px squircle.
  borderRadius?: number | string
  // Fallback background; ProfileCard/GardenHeader keep their brand gradient.
  background?: string
}

export function ChildAvatar({
  displayName,
  accentColor,
  avatarPreset,
  size,
  borderRadius = '50%',
  background,
}: ChildAvatarProps) {
  const [imgFailed, setImgFailed] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  const src = avatarSrc(avatarPreset)

  // SSR'd <img> can error BEFORE hydration attaches onError (the event is
  // lost) — re-check the loaded state after mount and whenever src changes.
  useEffect(() => {
    setImgFailed(false)
    const img = imgRef.current
    if (img && img.complete && img.naturalWidth === 0) setImgFailed(true)
  }, [src])
  const emoji = avatarEmoji(avatarPreset)
  const fallbackBg =
    background ?? `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}CC 100%)`

  const boxStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  }

  if (src && !imgFailed) {
    return (
      <span
        aria-hidden="true"
        style={{ ...boxStyle, background: 'var(--color-kreds-card)' }}
      >
        <img
          ref={imgRef}
          src={src}
          alt=""
          width={size}
          height={size}
          onError={() => setImgFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </span>
    )
  }

  // Asset missing but a themed preset was chosen: emoji stand-in keeps the
  // choice visible instead of silently reverting to the initial.
  if (emoji && imgFailed) {
    return (
      <span aria-hidden="true" style={{ ...boxStyle, background: fallbackBg, fontSize: size * 0.5 }}>
        {emoji}
      </span>
    )
  }

  return (
    <span
      aria-hidden="true"
      style={{
        ...boxStyle,
        background: fallbackBg,
        fontSize: Math.round(size * 0.42),
        fontWeight: 700,
        color: '#ffffff',
      }}
    >
      {displayName.charAt(0).toUpperCase()}
    </span>
  )
}
