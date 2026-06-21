'use client'
import { type InputHTMLAttributes, type ReactNode, useState } from 'react'

interface AuthInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  id: string
  label: string
  icon: ReactNode
  type?: string
  placeholder?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  rightSlot?: ReactNode
}

/**
 * Input estilizado para as telas de autenticação do responsável.
 * 52px de altura, border-radius 13px, focus ring verde, ícone à esquerda.
 * Acessibilidade: label associada via htmlFor.
 */
export function AuthInput({
  id,
  label,
  icon,
  type = 'text',
  placeholder,
  value,
  onChange,
  rightSlot,
  ...rest
}: AuthInputProps) {
  const [focused, setFocused] = useState(false)

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-[12px] font-[500] leading-[1.4] text-[var(--color-kreds-text)]"
      >
        {label}
      </label>
      <div
        className="relative flex items-center"
        style={{
          height: '52px',
          borderRadius: '13px',
          border: focused ? '1.5px solid #3E6B4F' : '1.5px solid #E2DECF',
          backgroundColor: '#fff',
          boxShadow: focused ? '0 0 0 3px rgba(62,107,79,.13)' : 'none',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        }}
      >
        {/* Ícone à esquerda */}
        <span
          className="pointer-events-none absolute left-4 flex items-center"
          style={{ color: 'var(--color-kreds-muted)', width: '16px', height: '16px' }}
          aria-hidden="true"
        >
          {icon}
        </span>

        {/* Input */}
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="h-full w-full bg-transparent outline-none"
          style={{
            paddingLeft: '44px',
            paddingRight: rightSlot ? '44px' : '16px',
            fontSize: '15px',
            fontWeight: 500,
            color: 'var(--color-kreds-text)',
          }}
          {...rest}
        />

        {/* Slot direito (ex: botão de toggle de olho) */}
        {rightSlot && (
          <span className="absolute right-4 flex items-center">{rightSlot}</span>
        )}
      </div>
    </div>
  )
}
