// ChildFormPanel tests — Phase 8, Plan 04 (D-06, D-07, D-09)
// Covers: RHF+Zod validation (empty displayName, valid submit, ageYears bounds),
// idle-mode placeholder rendering without form inputs.

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ChildFormPanel, EMPTY_CHILD_FORM } from '../../src/components/parent/child-form-panel'

describe('ChildFormPanel — D-06, D-07, D-09', () => {
  it('submitting with empty displayName shows "Nome obrigatório" error and does NOT call onSave', async () => {
    const onSave = vi.fn()
    render(<ChildFormPanel mode="create" onSave={onSave} onCancel={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /adicionar criança/i }))

    await waitFor(() => {
      expect(screen.getByText('Nome obrigatório')).toBeInTheDocument()
    })
    expect(onSave).not.toHaveBeenCalled()
  })

  it('submitting with valid displayName/ageYears/accentColor calls onSave with those values', async () => {
    const onSave = vi.fn()
    render(<ChildFormPanel mode="create" onSave={onSave} onCancel={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Beto' } })
    fireEvent.change(screen.getByLabelText('Idade'), { target: { value: '8' } })
    fireEvent.change(screen.getByLabelText('Cor'), { target: { value: '#b14a2e' } })
    fireEvent.click(screen.getByRole('button', { name: /adicionar criança/i }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled()
    })
    // RHF's handleSubmit(onSave) invokes onSave(data, event) — assert only the
    // first (data) argument rather than toHaveBeenCalledWith, which compares
    // the full args array and would fail on the second (SyntheticEvent) arg.
    expect(onSave.mock.calls[0][0]).toEqual({
      displayName: 'Beto',
      ageYears: 8,
      accentColor: '#b14a2e',
    })
  })

  it('ageYears above 18 shows a validation error', async () => {
    const onSave = vi.fn()
    render(<ChildFormPanel mode="create" onSave={onSave} onCancel={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Beto' } })
    fireEvent.change(screen.getByLabelText('Idade'), { target: { value: '25' } })
    fireEvent.click(screen.getByRole('button', { name: /adicionar criança/i }))

    await waitFor(() => {
      expect(onSave).not.toHaveBeenCalled()
    })
    expect(EMPTY_CHILD_FORM.ageYears).toBe(6)
  })

  it('idle mode renders "Adicionar criança" placeholder header without form inputs', () => {
    render(<ChildFormPanel mode="idle" onSave={vi.fn()} onCancel={vi.fn()} />)

    expect(screen.getByText('Adicionar criança')).toBeInTheDocument()
    expect(screen.queryByLabelText('Nome')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Idade')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Cor')).not.toBeInTheDocument()
  })

  it('edit mode populates initialData and changes header/CTA', () => {
    const initial = { displayName: 'Luna', ageYears: 10, accentColor: '#123456' }
    render(<ChildFormPanel mode="edit" initialData={initial} onSave={vi.fn()} onCancel={vi.fn()} />)

    expect(screen.getByText('Editar criança')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /salvar alterações/i })).toBeInTheDocument()
    expect(screen.getByLabelText('Nome')).toHaveValue('Luna')
    expect(screen.getByLabelText('Idade')).toHaveValue(10)
    expect(screen.getByLabelText('Cor')).toHaveValue('#123456')
  })
})
