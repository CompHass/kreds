// ConfirmDeactivateDialog tests — Phase 8, Plan 04 (D-14, first Radix AlertDialog in project)
// Covers: open/closed rendering, willDeactivate-driven copy, confirm/cancel/ESC behavior.

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ConfirmDeactivateDialog } from '../../src/components/parent/confirm-deactivate-dialog'

describe('ConfirmDeactivateDialog — D-14', () => {
  it('open=false: title is not in the document', () => {
    render(
      <ConfirmDeactivateDialog
        open={false}
        childName="Ana"
        willDeactivate={true}
        onConfirm={vi.fn()}
        onOpenChange={vi.fn()}
      />,
    )

    expect(screen.queryByText('Desativar Ana?')).not.toBeInTheDocument()
  })

  it('open=true, willDeactivate=true, childName="Ana": renders "Desativar Ana?" title', () => {
    render(
      <ConfirmDeactivateDialog
        open={true}
        childName="Ana"
        willDeactivate={true}
        onConfirm={vi.fn()}
        onOpenChange={vi.fn()}
      />,
    )

    expect(screen.getByText('Desativar Ana?')).toBeInTheDocument()
  })

  it('clicking "Desativar" calls onConfirm', () => {
    const onConfirm = vi.fn()
    render(
      <ConfirmDeactivateDialog
        open={true}
        childName="Ana"
        willDeactivate={true}
        onConfirm={onConfirm}
        onOpenChange={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Desativar' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('clicking "Cancelar" does NOT call onConfirm', () => {
    const onConfirm = vi.fn()
    render(
      <ConfirmDeactivateDialog
        open={true}
        childName="Ana"
        willDeactivate={true}
        onConfirm={onConfirm}
        onOpenChange={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('pressing ESC triggers onOpenChange(false)', () => {
    const onOpenChange = vi.fn()
    render(
      <ConfirmDeactivateDialog
        open={true}
        childName="Ana"
        willDeactivate={true}
        onConfirm={vi.fn()}
        onOpenChange={onOpenChange}
      />,
    )

    fireEvent.keyDown(screen.getByText('Desativar Ana?'), { key: 'Escape', code: 'Escape' })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
