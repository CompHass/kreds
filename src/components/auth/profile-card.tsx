'use client'
import Link from 'next/link'
import { ChildAvatar } from '@/components/avatar/child-avatar'

interface ProfileCardProps {
  childId: string
  displayName: string
  accentColor: string
  avatarPreset?: string
}

export function ProfileCard({
  childId,
  displayName,
  accentColor,
  avatarPreset = 'initial',
}: ProfileCardProps) {
  return (
    <Link
      href={`/child/${childId}/login`}
      aria-label={`Entrar como ${displayName}`}
      className="flex flex-col items-center gap-2 group"
      style={
        {
          '--accent': accentColor,
        } as React.CSSProperties
      }
    >
      {/* Avatar circle — preset ilustrado (Phase 14) ou inicial+gradiente */}
      <div
        className="flex items-center justify-center rounded-full select-none transition-transform duration-150 ease-in-out group-hover:scale-[0.96] group-active:scale-[0.96]"
        style={{
          borderRadius: '50%',
          boxShadow: 'var(--tw-ring-shadow, 0 0 0 0 transparent)',
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLDivElement).style.boxShadow =
            '0 0 0 3px rgba(62,107,79,.3)'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
        }}
      >
        <ChildAvatar
          displayName={displayName}
          accentColor={accentColor}
          avatarPreset={avatarPreset}
          size={72}
          background="linear-gradient(135deg, #5A8A66 0%, #3E6B4F 100%)"
        />
      </div>

      {/* Name label */}
      <span
        className="text-[12px] font-medium leading-[1.4]"
        style={{ color: 'var(--color-kreds-text)' }}
      >
        {displayName}
      </span>
    </Link>
  )
}
