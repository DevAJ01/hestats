import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

// Drives the right-hand contextual slide-over. Any component can call
// openPanel(institutionId) to reveal a quick summary without navigating away.

interface ContextPanelValue {
  openId: string | null
  openPanel: (id: string) => void
  closePanel: () => void
}

const Ctx = createContext<ContextPanelValue | null>(null)

export function ContextPanelProvider({ children }: { children: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const openPanel = useCallback((id: string) => setOpenId(id), [])
  const closePanel = useCallback(() => setOpenId(null), [])
  return <Ctx.Provider value={{ openId, openPanel, closePanel }}>{children}</Ctx.Provider>
}

export function useContextPanel() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useContextPanel must be used within ContextPanelProvider')
  return ctx
}
