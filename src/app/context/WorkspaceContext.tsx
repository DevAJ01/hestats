import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'

// Local-first personalised workspace. Persists to localStorage so it survives
// reloads on this device. Swap the read/write helpers for Supabase to sync
// across devices (see notes in the redesign plan).

const LS_KEY = 'hestats.workspace.v1'

interface WorkspaceState {
  watchlist: string[]          // institution ids
  recentlyViewed: string[]     // institution ids, most-recent first
  savedComparisons: string[]   // arrays of ids joined by ','
}

const EMPTY: WorkspaceState = { watchlist: [], recentlyViewed: [], savedComparisons: [] }

function load(): WorkspaceState {
  if (typeof window === 'undefined') return EMPTY
  try {
    const raw = window.localStorage.getItem(LS_KEY)
    if (!raw) return EMPTY
    return { ...EMPTY, ...JSON.parse(raw) }
  } catch {
    return EMPTY
  }
}

interface WorkspaceContextValue extends WorkspaceState {
  toggleWatch: (id: string) => void
  isWatched: (id: string) => boolean
  recordView: (id: string) => void
  saveComparison: (ids: string[]) => void
  removeComparison: (key: string) => void
  clearRecent: () => void
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WorkspaceState>(load)

  useEffect(() => {
    try { window.localStorage.setItem(LS_KEY, JSON.stringify(state)) } catch { /* ignore quota */ }
  }, [state])

  const toggleWatch = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      watchlist: s.watchlist.includes(id) ? s.watchlist.filter((x) => x !== id) : [id, ...s.watchlist],
    }))
  }, [])

  const isWatched = useCallback((id: string) => state.watchlist.includes(id), [state.watchlist])

  const recordView = useCallback((id: string) => {
    setState((s) => ({ ...s, recentlyViewed: [id, ...s.recentlyViewed.filter((x) => x !== id)].slice(0, 12) }))
  }, [])

  const saveComparison = useCallback((ids: string[]) => {
    const key = [...ids].sort().join(',')
    if (!key) return
    setState((s) => (s.savedComparisons.includes(key) ? s : { ...s, savedComparisons: [key, ...s.savedComparisons].slice(0, 12) }))
  }, [])

  const removeComparison = useCallback((key: string) => {
    setState((s) => ({ ...s, savedComparisons: s.savedComparisons.filter((x) => x !== key) }))
  }, [])

  const clearRecent = useCallback(() => setState((s) => ({ ...s, recentlyViewed: [] })), [])

  return (
    <WorkspaceContext.Provider value={{ ...state, toggleWatch, isWatched, recordView, saveComparison, removeComparison, clearRecent }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider')
  return ctx
}
