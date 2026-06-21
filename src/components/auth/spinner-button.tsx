'use client'
import { type ButtonHTMLAttributes, type ReactNode } from 'react'

interface SpinnerButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading: boolean
  children: ReactNode
}

/**
 * Botão com estado de loading — exibe spinner CSS (kredsSpin) branco.
 * GAUTH-04: spinner 20×20px, borda branca, animação kredsSpin 0.7s linear.
 * Disabled visual: bg #C2C9BC quando disabled (campos vazios).
 */
export function SpinnerButton({ loading, children, disabled, style, ...rest }: SpinnerButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      type="submit"
      aria-busy={loading ? 'true' : undefined}
      disabled={isDisabled}
      style={{
        height: '52px',
        borderRadius: '13px',
        backgroundColor: isDisabled && !loading ? '#C2C9BC' : '#3E6B4F',
        color: '#fff',
        fontSize: '15px',
        fontWeight: 700,
        border: 'none',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        boxShadow: isDisabled ? 'none' : '0 12px 24px -12px rgba(62,107,79,.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        width: '100%',
        transition: 'background-color 0.15s ease, box-shadow 0.15s ease',
        ...style,
      }}
      {...rest}
    >
      {loading ? (
        <div
          aria-hidden="true"
          style={{
            width: '20px',
            height: '20px',
            border: '2.5px solid rgba(255,255,255,.3)',
            borderTopColor: '#fff',
            borderRadius: '50%',
            animation: 'var(--animate-kreds-spin)',
            flexShrink: 0,
          }}
        />
      ) : (
        children
      )}
    </button>
  )
}
