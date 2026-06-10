'use client'

import { useState } from 'react'

interface ShareLinkButtonProps {
  familyId: string
  appUrl: string
}

export function ShareLinkButton({ familyId, appUrl }: ShareLinkButtonProps) {
  const [copied, setCopied] = useState(false)

  const accessUrl = `${appUrl}/family/access/${familyId}`

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(accessUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: selecionar texto do URL display
      const textArea = document.createElement('textarea')
      textArea.value = accessUrl
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch {
        // silently fail
      }
      document.body.removeChild(textArea)
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      alignItems: 'flex-start',
    }}>
      <button
        onClick={handleCopy}
        style={{
          border: copied ? '1px solid rgba(59,105,52,0.2)' : '1px solid rgba(45,90,39,0.16)',
          background: copied ? 'rgba(59,105,52,0.12)' : 'rgba(255,255,255,0.82)',
          color: copied ? '#3b6934' : '#154212',
          borderRadius: '99px',
          padding: '4px 12px',
          fontSize: '0.75rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
        }}
      >
        🔗 {copied ? 'Copiado!' : 'Compartilhar acesso'}
      </button>
      <p
        style={{
          maxWidth: '180px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontSize: '0.7rem',
          color: '#72796e',
          margin: 0,
        }}
      >
        {accessUrl}
      </p>
    </div>
  )
}
