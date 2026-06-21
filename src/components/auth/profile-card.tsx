'use client'
import Link from 'next/link'

interface ProfileCardProps {
  childId: string
  displayName: string
  accentColor: string
}

export function ProfileCard({ childId, displayName, accentColor }: ProfileCardProps) {
  const initial = displayName.charAt(0).toUpperCase()

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
      {/* Avatar circle */}
      <div
        className="flex items-center justify-center rounded-full select-none transition-transform duration-150 ease-in-out group-hover:scale-[0.96] group-active:scale-[0.96]"
        style={{
          width: 72,
          height: 72,
          background: `linear-gradient(135deg, #5A8A66 0%, #3E6B4F 100%)`,
          boxShadow: 'var(--tw-ring-shadow, 0 0 0 0 transparent)',
          fontSize: 28,
          fontWeight: 700,
          color: '#ffffff',
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLDivElement).style.boxShadow =
            '0 0 0 3px rgba(62,107,79,.3)'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
        }}
      >
        {initial}
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
