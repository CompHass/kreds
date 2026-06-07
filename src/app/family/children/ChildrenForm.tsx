'use client'

import { useActionState } from 'react'
import { addChildAction } from './actions'

interface AvatarOption { key: string; label: string }
interface AccentOption { key: string; label: string }

interface ChildrenFormProps {
  avatarOptions: AvatarOption[]
  accentOptions: AccentOption[]
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: '16px',
  border: '1px solid var(--color-border, rgba(45,90,39,0.16))',
  background: 'rgba(255,255,255,0.72)',
  fontSize: '0.9375rem',
  color: 'var(--color-primary, #154212)',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted, #42493e)',
}

export default function ChildrenForm({ avatarOptions, accentOptions }: ChildrenFormProps) {
  const [state, formAction, isPending] = useActionState(addChildAction, null)

  return (
    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

      {/* Display name */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label htmlFor="displayName" style={labelStyle}>Nome</label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          required
          placeholder="ex: Lucas"
          minLength={1}
          disabled={isPending}
          style={{ ...inputStyle, opacity: isPending ? 0.6 : 1 }}
        />
      </div>

      {/* Age */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label htmlFor="ageYears" style={labelStyle}>Idade (anos)</label>
        <input
          id="ageYears"
          name="ageYears"
          type="number"
          required
          min={0}
          max={120}
          placeholder="ex: 8"
          disabled={isPending}
          style={{ ...inputStyle, opacity: isPending ? 0.6 : 1 }}
        />
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-soft, #72796e)' }}>
          Apenas a idade em anos é armazenada — não a data de nascimento.
        </span>
      </div>

      {/* Avatar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label htmlFor="avatarPreset" style={labelStyle}>Avatar</label>
        <select
          id="avatarPreset"
          name="avatarPreset"
          required
          disabled={isPending}
          style={{ ...inputStyle, appearance: 'none', cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.6 : 1 }}
        >
          <option value="">Escolha um avatar</option>
          {avatarOptions.map(({ key, label }) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Accent color */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label htmlFor="accentColor" style={labelStyle}>Cor de destaque</label>
        <select
          id="accentColor"
          name="accentColor"
          required
          disabled={isPending}
          style={{ ...inputStyle, appearance: 'none', cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.6 : 1 }}
        >
          <option value="">Escolha uma cor</option>
          {accentOptions.map(({ key, label }) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Consent */}
      <label style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
        fontSize: '0.875rem',
        color: 'var(--color-text-soft, #72796e)',
        lineHeight: 1.5,
        cursor: 'pointer',
      }}>
        <input
          type="checkbox"
          name="consentGiven"
          value="true"
          required
          disabled={isPending}
          style={{ marginTop: '3px', accentColor: '#154212', flexShrink: 0 }}
        />
        Confirmo que sou pai/mãe ou responsável legal desta criança e consinto na criação deste
        perfil no Kreds. Entendo que o perfil contém apenas nome, idade em anos, avatar e cor.
      </label>

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
        {isPending ? 'Adicionando...' : 'Adicionar filho'}
      </button>
    </form>
  )
}
