import { Link, useNavigate } from 'react-router'
import { Star, Clock, GitCompare, Eye, X, ArrowUpRight, Bookmark } from 'lucide-react'
import { useWorkspace } from '../../context/WorkspaceContext'
import { useContextPanel } from '../../context/ContextPanelContext'
import { institutions } from '../../data/institutions'
import { formatCurrencyM, getLatestFinancial } from '../../data/financials'

function nameFor(id: string) {
  return institutions.find((i) => i.id === id)?.short_name ?? id
}

export function WorkspaceSection() {
  const { watchlist, recentlyViewed, savedComparisons, toggleWatch, removeComparison } = useWorkspace()
  const { openPanel } = useContextPanel()
  const navigate = useNavigate()

  const hasAnything = watchlist.length > 0 || recentlyViewed.length > 0 || savedComparisons.length > 0

  return (
    <div className="mb-2.5 border" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}>
      <div className="flex items-center gap-2 px-3 py-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
        <Bookmark className="w-3 h-3" style={{ color: 'var(--accent)' }} />
        <span style={{ color: 'var(--muted)', fontSize: 9.5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>My Workspace</span>
        <span className="ml-auto" style={{ color: 'var(--muted)', fontSize: 10 }}>Saved on this device</span>
      </div>

      {!hasAnything ? (
        <div className="px-4 py-5 text-center">
          <p style={{ color: 'var(--text-2)', fontSize: 12.5, marginBottom: 4 }}>Your workspace is empty.</p>
          <p style={{ color: 'var(--muted)', fontSize: 11 }}>
            Star universities to build a watchlist, or <Link to="/explorer" className="hover:underline" style={{ color: 'var(--accent)' }}>explore the sector</Link> to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x" style={{ borderColor: 'var(--border)' }}>
          {/* Watchlist */}
          <div className="p-3" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Star className="w-3.5 h-3.5" style={{ color: 'var(--warning)' }} />
              <span style={{ color: 'var(--text)', fontSize: 11.5, fontWeight: 600 }}>Watchlist</span>
              <span className="font-num" style={{ color: 'var(--muted)', fontSize: 10 }}>{watchlist.length}</span>
            </div>
            {watchlist.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: 11 }}>No universities followed yet.</p>
            ) : (
              <div className="space-y-1">
                {watchlist.slice(0, 5).map((id) => {
                  const fin = getLatestFinancial(id)
                  return (
                    <div key={id} className="flex items-center gap-2 group/item">
                      <button onClick={() => openPanel(id)} className="flex-1 min-w-0 flex items-center gap-2 text-left px-1.5 py-1 rounded-sm transition-colors hover:bg-[var(--panel-hover)]">
                        <Eye className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--muted)' }} />
                        <span className="flex-1 min-w-0 truncate" style={{ color: 'var(--text)', fontSize: 12 }}>{nameFor(id)}</span>
                        {fin && <span className="font-num" style={{ color: 'var(--text-2)', fontSize: 11 }}>{formatCurrencyM(fin.revenue_gbp_m)}</span>}
                      </button>
                      <button onClick={() => toggleWatch(id)} className="opacity-0 group-hover/item:opacity-100 transition-opacity" style={{ color: 'var(--muted)' }} aria-label="Unwatch">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )
                })}
                {watchlist.length > 2 && (
                  <button
                    onClick={() => navigate(`/compare?ids=${watchlist.slice(0, 6).join(',')}`)}
                    className="flex items-center gap-1.5 mt-1.5 px-2 py-1 w-full justify-center"
                    style={{ border: '1px solid var(--border)', borderRadius: 3, color: 'var(--text-2)', fontSize: 11 }}
                  >
                    <GitCompare className="w-3 h-3" /> Compare watchlist
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Recently viewed */}
          <div className="p-3" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Clock className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
              <span style={{ color: 'var(--text)', fontSize: 11.5, fontWeight: 600 }}>Recently viewed</span>
            </div>
            {recentlyViewed.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: 11 }}>No recent universities.</p>
            ) : (
              <div className="space-y-0.5">
                {recentlyViewed.slice(0, 6).map((id) => (
                  <Link key={id} to={`/universities/${id}`} className="flex items-center gap-2 px-1.5 py-1 rounded-sm transition-colors hover:bg-[var(--panel-hover)]">
                    <span className="flex-1 min-w-0 truncate" style={{ color: 'var(--text)', fontSize: 12 }}>{nameFor(id)}</span>
                    <ArrowUpRight className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--muted)' }} />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Saved comparisons */}
          <div className="p-3" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-1.5 mb-2">
              <GitCompare className="w-3.5 h-3.5" style={{ color: 'var(--positive)' }} />
              <span style={{ color: 'var(--text)', fontSize: 11.5, fontWeight: 600 }}>Saved comparisons</span>
            </div>
            {savedComparisons.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: 11 }}>No saved comparisons.</p>
            ) : (
              <div className="space-y-1">
                {savedComparisons.slice(0, 5).map((key) => (
                  <div key={key} className="flex items-center gap-2 group/cmp">
                    <Link to={`/compare?ids=${key}`} className="flex-1 min-w-0 truncate px-1.5 py-1 rounded-sm transition-colors hover:bg-[var(--panel-hover)]" style={{ color: 'var(--text)', fontSize: 12 }}>
                      {key.split(',').map(nameFor).join(' vs ')}
                    </Link>
                    <button onClick={() => removeComparison(key)} className="opacity-0 group-hover/cmp:opacity-100 transition-opacity" style={{ color: 'var(--muted)' }} aria-label="Remove">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
