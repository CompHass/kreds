// ChildrenPanelView integration-style component test — Phase 8, Plan 05
// Covers: list render, NULL-safe reveal gating (Pitfall 6), reveal flow,
// and dialog-gated deactivation (D-14 invariant).
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ChildrenPanelView } from '../../src/components/parent/children-panel-view'
import type { ChildProfileView } from '../../src/types/child'

// Mock next/navigation — ParentSidebar usa useRouter (08-02) que não está disponível em jsdom.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

// Mock next-auth/react — GuardianProfileDrawer chama signOut (07-02)
vi.mock('next-auth/react', () => ({ signOut: vi.fn() }))

// Mock next-auth (sem /react) — NextAuth importa next/server, indisponível em jsdom.
vi.mock('next-auth', () => ({
  default: vi.fn(() => ({
    handlers: {},
    auth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  })),
}))

// Mock Server Actions — createChild retorna row com UUID real-like; revealChildPin
// retorna '4321'; resetChildPin/toggleChildActive resolvem void.
const createChildMock = vi.fn().mockResolvedValue({
  id: 'c3-real-uuid',
  displayName: 'Nova Criança',
  ageYears: 7,
  accentColor: '#3E6B4F',
  active: true,
  pinEncrypted: null,
})
const revealChildPinMock = vi.fn().mockResolvedValue('4321')
const resetChildPinMock = vi.fn().mockResolvedValue(undefined)
const toggleChildActiveMock = vi.fn().mockResolvedValue(undefined)

vi.mock('@/app/actions/children', () => ({
  createChild: (...args: unknown[]) => createChildMock(...args),
  resetChildPin: (...args: unknown[]) => resetChildPinMock(...args),
  revealChildPin: (...args: unknown[]) => revealChildPinMock(...args),
  toggleChildActive: (...args: unknown[]) => toggleChildActiveMock(...args),
}))

const INITIAL_CHILDREN: ChildProfileView[] = [
  { id: 'c1', displayName: 'Ana', ageYears: 8, accentColor: '#3E6B4F', active: true, hasEncryptedPin: true },
  { id: 'c2', displayName: 'Bia', ageYears: 6, accentColor: '#B14A2E', active: true, hasEncryptedPin: false },
]

function renderPanel() {
  return render(
    <ChildrenPanelView
      familyId="fam-1"
      familyName="Família Teste"
      currentUserName="João"
      guardianEmail="j@x.com"
      initialChildren={INITIAL_CHILDREN}
    />,
  )
}

describe('ChildrenPanelView — integration', () => {
  it('renders both Ana and Bia cards', () => {
    renderPanel()
    expect(screen.getByText('Ana')).toBeInTheDocument()
    expect(screen.getByText('Bia')).toBeInTheDocument()
  })

  it('disables Mostrar for Bia (hasEncryptedPin=false) and shows the PIN-not-set copy', () => {
    renderPanel()
    const biaCard = screen.getByText('Bia').closest('[data-testid="child-card"]')
    expect(biaCard).not.toBeNull()
    const mostrarBtn = Array.from(biaCard!.querySelectorAll('button')).find(
      (btn) => btn.textContent === 'Mostrar',
    )
    expect(mostrarBtn).toBeDefined()
    expect(mostrarBtn).toBeDisabled()
    expect(biaCard!.textContent).toContain('PIN ainda não definido')
  })

  it('clicking Ana\'s Mostrar calls revealChildPin and shows 4321', async () => {
    renderPanel()
    const anaCard = screen.getByText('Ana').closest('[data-testid="child-card"]')
    expect(anaCard).not.toBeNull()
    const mostrarBtn = Array.from(anaCard!.querySelectorAll('button')).find(
      (btn) => btn.textContent === 'Mostrar',
    )
    expect(mostrarBtn).toBeDefined()
    fireEvent.click(mostrarBtn!)

    expect(revealChildPinMock).toHaveBeenCalledWith('c1', 'fam-1')

    await waitFor(() => {
      expect(anaCard!.textContent).toContain('4321')
    })
  })

  it('clicking Ana\'s Desativar opens ConfirmDeactivateDialog and does not call toggleChildActive until confirm', () => {
    renderPanel()
    const anaCard = screen.getByText('Ana').closest('[data-testid="child-card"]')
    expect(anaCard).not.toBeNull()
    const desativarBtn = Array.from(anaCard!.querySelectorAll('button')).find(
      (btn) => btn.textContent === 'Desativar',
    )
    expect(desativarBtn).toBeDefined()
    fireEvent.click(desativarBtn!)

    // Dialog title should appear
    expect(screen.getByText('Desativar Ana?')).toBeInTheDocument()
    // toggleChildActive must NOT have been called yet (D-14 invariant)
    expect(toggleChildActiveMock).not.toHaveBeenCalled()
  })

  it('confirming the dialog calls toggleChildActive(c1, fam-1, false)', async () => {
    renderPanel()
    const anaCard = screen.getByText('Ana').closest('[data-testid="child-card"]')
    const desativarBtn = Array.from(anaCard!.querySelectorAll('button')).find(
      (btn) => btn.textContent === 'Desativar',
    )
    fireEvent.click(desativarBtn!)

    expect(screen.getByText('Desativar Ana?')).toBeInTheDocument()

    // Confirm button inside the dialog also reads "Desativar" — scope to the dialog.
    const dialog = screen.getByText('Desativar Ana?').closest('[role="alertdialog"]')
    expect(dialog).not.toBeNull()
    const confirmBtn = Array.from(dialog!.querySelectorAll('button')).find(
      (btn) => btn.textContent === 'Desativar',
    )
    expect(confirmBtn).toBeDefined()
    fireEvent.click(confirmBtn!)

    await waitFor(() => {
      expect(toggleChildActiveMock).toHaveBeenCalledWith('c1', 'fam-1', false)
    })
  })
})
