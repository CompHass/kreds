'use client'

import { useActionState } from 'react'
import { createFamilyAction } from './actions'

interface TimezoneOption {
  iana: string
  locality: string
}

interface OnboardingFormProps {
  timezoneOptions: TimezoneOption[]
}

/**
 * Client component for the family onboarding form.
 *
 * Uses useActionState to wire the createFamilyAction server action,
 * displaying inline errors without a full page reload.
 * On success the server action redirects to /family/children (D-04).
 */
export default function OnboardingForm({ timezoneOptions }: OnboardingFormProps) {
  const [state, formAction, isPending] = useActionState(createFamilyAction, null)

  return (
    <form action={formAction} style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    }}>
      {/* Error message */}
      {state?.error && (
        <div role="alert" style={{
          padding: '12px 16px',
          borderRadius: '12px',
          background: 'rgba(220,38,38,0.08)',
          border: '1px solid rgba(220,38,38,0.24)',
          color: '#b91c1c',
          fontSize: '0.875rem',
        }}>
          {state.error}
        </div>
      )}

      {/* Family name */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label htmlFor="familyName" style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--color-text-muted, #42493e)',
        }}>
          Nome da família
        </label>
        <input
          id="familyName"
          name="familyName"
          type="text"
          required
          placeholder="ex: Família Silva"
          minLength={2}
          disabled={isPending}
          style={{
            width: '100%',
            padding: '14px 16px',
            borderRadius: '16px',
            border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
            background: 'rgba(255,255,255,0.72)',
            fontSize: '0.9375rem',
            color: 'var(--color-primary, #154212)',
            outline: 'none',
            boxSizing: 'border-box',
            opacity: isPending ? 0.6 : 1,
          }}
        />
      </div>

      {/* Timezone */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label htmlFor="timezone" style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--color-text-muted, #42493e)',
        }}>
          Fuso horário
        </label>
        <select
          id="timezone"
          name="timezone"
          required
          disabled={isPending}
          style={{
            width: '100%',
            padding: '14px 16px',
            borderRadius: '16px',
            border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
            background: 'rgba(255,255,255,0.72)',
            fontSize: '0.9375rem',
            color: 'var(--color-primary, #154212)',
            outline: 'none',
            appearance: 'none',
            boxSizing: 'border-box',
            cursor: isPending ? 'not-allowed' : 'pointer',
            opacity: isPending ? 0.6 : 1,
          }}
        >
          <option value="">Selecione seu fuso horário</option>
          {timezoneOptions.map((tz) => (
            <option key={tz.iana} value={tz.iana}>
              {tz.locality}
            </option>
          ))}
        </select>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '52px',
          borderRadius: 'var(--radius-full, 9999px)',
          background: 'linear-gradient(135deg, #3b6934, #154212)',
          boxShadow: 'inset 0 2px 0 rgba(255,223,144,0.38), 0 18px 55px rgba(45,90,39,0.1)',
          color: '#fff',
          fontWeight: 700,
          fontSize: '1rem',
          border: 'none',
          cursor: isPending ? 'not-allowed' : 'pointer',
          marginTop: '4px',
          opacity: isPending ? 0.7 : 1,
        }}
      >
        {isPending ? 'Criando família...' : 'Criar família'}
      </button>
    </form>
  )
}
