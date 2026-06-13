'use client'

import { useMemo, useState, useEffect } from 'react'

type ChildProfileCard = {
  id: string
  displayName: string
  avatarPreset: string
  accentColor: string
}

const ACCENT_CSS: Record<string, string> = {
  moss: '#3b6934',
  gold: '#d2a501',
  sky: '#0369a1',
  berry: '#9333ea',
  clay: '#c2410c',
  sage: '#65a30d',
}

export default function ChildAccessForm({
  familyId,
  profiles,
}: {
  familyId: string
  profiles: ChildProfileCard[]
}) {
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [nextUrl, setNextUrl] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const next = params.get('next')
    if (next) setNextUrl(next)
  }, [])

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === selectedProfileId) ?? null,
    [profiles, selectedProfileId],
  )

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedProfileId) {
      setError('Choose a profile first.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/families/${familyId}/child-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childProfileId: selectedProfileId, pin }),
      })

      if (response.ok) {
        window.location.href = nextUrl ?? '/child/home'
        return
      }

      if (response.status === 401) {
        setError('PIN incorrect. Try again.')
      } else if (response.status === 429) {
        setError('Too many attempts. Wait 15 minutes.')
      } else if (response.status === 404) {
        setError('Profile not found.')
      } else {
        setError('Unable to sign in right now.')
      }
    } catch {
      setError('Unable to sign in right now.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '12px',
        }}
      >
        {profiles.map((profile) => {
          const selected = profile.id === selectedProfileId

          return (
            <button
              key={profile.id}
              type="button"
              onClick={() => setSelectedProfileId(profile.id)}
              style={{
                display: 'grid',
                gap: '10px',
                justifyItems: 'center',
                padding: '18px 12px',
                background: selected
                  ? 'rgba(21,66,18,0.12)'
                  : 'var(--color-card, rgba(255,255,255,0.64))',
                border: selected
                  ? '2px solid var(--color-primary, #154212)'
                  : '1px solid var(--color-border, rgba(45,90,39,0.16))',
                borderRadius: '20px',
                boxShadow: '0 4px 16px rgba(45,90,39,0.06)',
                backdropFilter: 'blur(12px)',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '18px',
                  display: 'grid',
                  placeItems: 'center',
                  background: ACCENT_CSS[profile.accentColor] ?? '#154212',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                }}
              >
                {profile.displayName.charAt(0).toUpperCase()}
              </div>
              <span
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: 'var(--color-primary, #154212)',
                }}
              >
                {profile.displayName}
              </span>
            </button>
          )
        })}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '12px' }}>
        <input type="hidden" name="childProfileId" value={selectedProfileId ?? ''} />
        <label
          style={{
            display: 'grid',
            gap: '8px',
            color: 'var(--color-primary, #154212)',
            fontWeight: 600,
          }}
        >
          <span>{selectedProfile ? `PIN for ${selectedProfile.displayName}` : 'Select a profile first'}</span>
          <input
            type="password"
            name="pin"
            inputMode="numeric"
            maxLength={6}
            minLength={4}
            placeholder="Enter your PIN"
            required
            disabled={!selectedProfileId || isSubmitting}
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            style={{
              padding: '14px 16px',
              borderRadius: '16px',
              border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
              background: 'rgba(255,255,255,0.82)',
              fontSize: '1rem',
            }}
          />
        </label>

        {error ? (
          <p style={{ margin: 0, color: '#b91c1c', fontSize: '0.875rem', fontWeight: 600 }}>{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={!selectedProfileId || isSubmitting}
          style={{
            padding: '14px 18px',
            borderRadius: '999px',
            border: 'none',
            background: 'var(--color-primary, #154212)',
            color: '#fff',
            fontWeight: 700,
            cursor: selectedProfileId && !isSubmitting ? 'pointer' : 'not-allowed',
            opacity: selectedProfileId && !isSubmitting ? 1 : 0.6,
          }}
        >
          {isSubmitting ? 'Signing in...' : 'Enter'}
        </button>
      </form>
    </div>
  )
}
