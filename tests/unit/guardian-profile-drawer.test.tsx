// Guardian Profile Drawer tests — Phase 7 (RED suite)
// Casos cobertos: conteúdo (D-04/D-05), logout (D-06/D-07), backdrop close, estado open/close (D-01/D-02)
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
// GuardianProfileDrawer ainda não existe — import falhará até a Task 2 implementar o componente (RED)
import { GuardianProfileDrawer } from '../../src/components/parent/guardian-profile-drawer'

// Mock next-auth/react — vi.hoisted evita problema de hoisting do vi.mock
const { mockSignOut } = vi.hoisted(() => ({ mockSignOut: vi.fn() }))
vi.mock('next-auth/react', () => ({
  signOut: mockSignOut,
}))

const DEFAULT_PROPS = {
  open: true,
  guardianName: 'João Silva',
  guardianEmail: 'joao@exemplo.com',
  onClose: vi.fn(),
}

function renderDrawer(overrides: Partial<typeof DEFAULT_PROPS> = {}) {
  const props = { ...DEFAULT_PROPS, onClose: vi.fn(), ...overrides }
  return { ...render(<GuardianProfileDrawer {...props} />), props }
}

describe('GuardianProfileDrawer', () => {
  beforeEach(() => {
    mockSignOut.mockClear()
  })

  it('D-04/D-05: com open=true, exibe guardianName e guardianEmail no documento', () => {
    renderDrawer({ open: true })
    expect(screen.getByText('João Silva')).toBeInTheDocument()
    expect(screen.getByText('joao@exemplo.com')).toBeInTheDocument()
  })

  it('D-06/D-07: botão "Sair" chama signOut com { redirectTo: "/login" }', () => {
    renderDrawer({ open: true })
    const sairBtn = screen.getByRole('button', { name: /sair/i })
    fireEvent.click(sairBtn)
    expect(mockSignOut).toHaveBeenCalledWith({ redirectTo: '/login' })
  })

  it('backdrop click (aria-hidden) chama onClose', () => {
    const { props } = renderDrawer({ open: true })
    const backdrop = document.querySelector('[aria-hidden="true"]')
    expect(backdrop).not.toBeNull()
    fireEvent.click(backdrop!)
    expect(props.onClose).toHaveBeenCalled()
  })

  it('D-01/D-02: open=false → painel translateX(100%); open=true → translateX(0)', () => {
    // Estado fechado
    const { unmount } = renderDrawer({ open: false })
    const closedPanel = screen.getByRole('dialog')
    expect(closedPanel.getAttribute('style')).toContain('translateX(100%)')
    unmount()

    // Estado aberto
    renderDrawer({ open: true })
    const openPanel = screen.getByRole('dialog')
    expect(openPanel.getAttribute('style')).toContain('translateX(0)')
  })
})
