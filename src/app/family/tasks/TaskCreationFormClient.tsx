'use client'

import { useState } from 'react'

const TREE_TYPES = [
  { value: 'macieira', label: 'Macieira', icon: '🍎', desc: 'Crescimento Doce' },
  { value: 'carvalho', label: 'Carvalho', icon: '🌳', desc: 'Força Antiga' },
  { value: 'cedro', label: 'Cedro', icon: '🌲', desc: 'Altitude Majestosa' },
]

type Child = { id: string; displayName: string; avatarPreset: string }

export function TaskCreationFormClient({ children }: { children: Child[] }) {
  const [selectedChildren, setSelectedChildren] = useState<string[]>([])
  const [selectedTree, setSelectedTree] = useState<string>('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [kredsValue, setKredsValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleChild(id: string) {
    setSelectedChildren((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!title.trim()) return setError('Título obrigatório.')
    if (selectedChildren.length === 0) return setError('Selecione ao menos um filho.')
    if (!kredsValue || Number(kredsValue) < 1) return setError('Valor em Kreds deve ser positivo.')

    const treeLabel = TREE_TYPES.find((t) => t.value === selectedTree)?.label
    const descWithTree = [
      treeLabel ? `[Árvore: ${treeLabel}]` : '',
      description.trim(),
    ]
      .filter(Boolean)
      .join(' ')

    setLoading(true)
    try {
      const results = await Promise.all(
        selectedChildren.map((childId) =>
          fetch('/api/families/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: title.trim(),
              description: descWithTree || undefined,
              assignedChildId: childId,
              kredsValue: Number(kredsValue),
            }),
          }).then((res) => {
            if (!res.ok) return res.json().then((e) => Promise.reject(e))
            return res.json()
          }),
        ),
      )
      if (results.length > 0) {
        window.location.reload()
      }
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'error' in err
        ? String((err as { error: unknown }).error)
        : 'Erro ao salvar. Tente novamente.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '14px',
    border: '1px solid rgba(45,90,39,0.15)',
    fontSize: '15px',
    boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.8)',
    outline: 'none',
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {error && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '12px',
          background: 'rgba(186,26,26,0.08)',
          border: '1px solid rgba(186,26,26,0.2)',
          color: '#ba1a1a',
          fontSize: '14px',
          fontWeight: 600,
        }}>
          {error}
        </div>
      )}

      {/* Title */}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={100}
        placeholder="Título da missão *"
        style={inputStyle}
      />

      {/* Tree type */}
      <div>
        <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 600, color: '#154212' }}>
          Tipo de árvore
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          {TREE_TYPES.map((tree) => (
            <button
              key={tree.value}
              type="button"
              onClick={() => setSelectedTree(tree.value === selectedTree ? '' : tree.value)}
              style={{
                flex: 1,
                padding: '10px 8px',
                borderRadius: '14px',
                border: selectedTree === tree.value
                  ? '2px solid #154212'
                  : '1px solid rgba(45,90,39,0.15)',
                background: selectedTree === tree.value
                  ? 'rgba(188,240,174,0.3)'
                  : 'rgba(255,255,255,0.8)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span style={{ fontSize: '24px' }}>{tree.icon}</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#154212' }}>{tree.label}</span>
              <span style={{ fontSize: '10px', color: '#42493e' }}>{tree.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={500}
        rows={2}
        placeholder="Descrição (opcional)"
        style={{ ...inputStyle, resize: 'vertical' }}
      />

      {/* Children multi-select */}
      <div>
        <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 600, color: '#154212' }}>
          Filhos responsáveis *
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {children.map((child) => {
            const isSelected = selectedChildren.includes(child.id)
            return (
              <button
                key={child.id}
                type="button"
                onClick={() => toggleChild(child.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '14px',
                  border: isSelected
                    ? '2px solid #154212'
                    : '1px solid rgba(45,90,39,0.15)',
                  background: isSelected
                    ? 'rgba(188,240,174,0.3)'
                    : 'rgba(255,255,255,0.8)',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  border: isSelected ? '2px solid #154212' : '2px solid rgba(45,90,39,0.3)',
                  background: isSelected ? '#154212' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: '#fff',
                  fontSize: '14px',
                }}>
                  {isSelected && '✓'}
                </div>
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#154212' }}>
                  {child.displayName}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Kreds value */}
      <input
        type="number"
        value={kredsValue}
        onChange={(e) => setKredsValue(e.target.value)}
        min="1"
        step="1"
        placeholder="Valor em Kreds *"
        style={inputStyle}
      />

      <button
        type="submit"
        disabled={loading}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          minHeight: '52px',
          borderRadius: '14px',
          background: loading ? 'rgba(45,90,39,0.4)' : 'linear-gradient(to right, #2d5a27, #3b6934)',
          color: '#fff',
          border: 'none',
          fontWeight: 700,
          fontSize: '16px',
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: loading ? 'none' : '0 8px 24px rgba(45,90,39,0.2)',
        }}
      >
        {loading ? '⏳ Plantando...' : '🌱 Plantar Missão'}
      </button>
    </form>
  )
}
