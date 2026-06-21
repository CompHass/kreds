import { db } from '@/lib/db'
import { childProfiles } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { ProfileCard } from '@/components/auth/profile-card'

export default async function SelectProfilePage({
  params,
}: {
  params: Promise<{ familyId: string }>
}) {
  const { familyId } = await params

  const children = await db
    .select({
      id: childProfiles.id,
      displayName: childProfiles.displayName,
      accentColor: childProfiles.accentColor,
    })
    .from(childProfiles)
    .where(and(eq(childProfiles.familyId, familyId), eq(childProfiles.active, true)))

  return (
    <main
      className="min-h-screen flex flex-col items-center bg-kreds-bg"
      style={{ padding: '48px 24px 32px' }}
    >
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <circle cx="14" cy="14" r="14" fill="url(#logo-grad)" />
          <path
            d="M14 7c-1.2 3-4 4.5-4 7.5 0 2.2 1.8 4 4 4s4-1.8 4-4C18 11.5 15.2 10 14 7z"
            fill="#fff"
          />
          <defs>
            <linearGradient id="logo-grad" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#5A8A66" />
              <stop offset="1" stopColor="#3E6B4F" />
            </linearGradient>
          </defs>
        </svg>
        <span
          className="text-[15px] font-medium"
          style={{ color: 'var(--color-kreds-text)' }}
        >
          kreds
        </span>
      </div>

      {/* Title */}
      <h1
        className="text-[24px] font-bold mb-8 tracking-[-0.01em]"
        style={{ color: 'var(--color-kreds-text)' }}
      >
        Quem está aqui?
      </h1>

      {/* Profile grid */}
      {children.length === 0 ? (
        <p
          className="text-[15px] font-medium text-center"
          style={{ color: 'var(--color-kreds-muted)' }}
        >
          Nenhum perfil encontrado para esta família.
        </p>
      ) : (
        <div
          className={`grid gap-4 ${children.length >= 3 ? 'grid-cols-2' : 'grid-cols-1'}`}
          style={{ justifyItems: 'center' }}
        >
          {children.map((child) => (
            <ProfileCard
              key={child.id}
              childId={child.id}
              displayName={child.displayName}
              accentColor={child.accentColor}
            />
          ))}
        </div>
      )}

      {/* Footer spacer */}
      <div className="flex-1" />

      {/* Footer */}
      <p
        className="text-[12px] font-medium text-center mt-8"
        style={{ color: 'var(--color-kreds-hint)' }}
      >
        Kreds — Mordomia para famílias
      </p>
    </main>
  )
}
