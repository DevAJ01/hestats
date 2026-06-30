import { Link } from 'react-router'
import { X, Star, GitCompare, ArrowUpRight, FileText, TrendingUp, TrendingDown } from 'lucide-react'
import { useContextPanel } from '../../context/ContextPanelContext'
import { useWorkspace } from '../../context/WorkspaceContext'
import { institutions } from '../../data/institutions'
import { getLatestFinancial, getFinancialsByInstitution } from '../../data/financials'
import { computeHealthScore } from '../../data/health'
import { HealthBadge } from '../institutions/HealthBadge'
import { NationBadge } from '../institutions/NationBadge'
import { RiskBadge } from '../institutions/RiskBadge'
import { Sparkline } from '../charts/Sparkline'

export function ContextPanel() {
  const { openId, closePanel } = useContextPanel()
  const { isWatched, toggleWatch } = useWorkspace()

  const inst = openId ? institutions.find((i) => i.id === openId) : null
  const fin = openId ? getLatestFinancial(openId) : null
  const open = Boolean(inst && fin)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[170] transition-opacity"
        style={{
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(2px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
        }}
        onClick={closePanel}
      />
      {/* Panel */}
      <aside
        className="fixed top-0 right-0 bottom-0 z-[180] w-full sm:w-[400px] flex flex-col transition-transform"
        style={{
          backgroundColor: 'var(--bg-2)',
          borderLeft: '1px solid var(--border-strong)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {inst && fin && (() => {
          const health = computeHealthScore(fin)
          const history = getFinancialsByInstitution(inst.id).sort((a, b) => a.fiscal_year.localeCompare(b.fiscal_year))
          const revSpark = history.map((h) => h.revenue_gbp_m)
          const prev = history[history.length - 2]
          const revChange = prev ? ((fin.revenue_gbp_m - prev.revenue_gbp_m) / prev.revenue_gbp_m) * 100 : 0
          return (
            <>
              {/* Header */}
              <div className="flex items-start gap-2 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <NationBadge nation={inst.nation} size="sm" />
                    <HealthBadge score={health.score} grade={health.grade} size="sm" showScore />
                    <RiskBadge risk={fin.risk_flag} size="sm" />
                  </div>
                  <p style={{ color: 'var(--text)', fontSize: 15, fontWeight: 600, lineHeight: 1.2 }}>{inst.canonical_name}</p>
                  <p style={{ color: 'var(--muted)', fontSize: 11 }}>{inst.city} · Est. {inst.founded} · UKPRN {inst.ukprn}</p>
                </div>
                <button onClick={closePanel} className="w-8 h-8 flex items-center justify-center flex-shrink-0" style={{ color: 'var(--text-2)' }} aria-label="Close panel">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {/* Quick summary */}
                <div>
                  <p className="mb-2" style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Financial health</p>
                  <div className="flex items-center justify-between px-3 py-2.5 border" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}>
                    <div>
                      <p className="font-num" style={{ color: 'var(--text)', fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{health.score}<span style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 400 }}>/100</span></p>
                      <p style={{ color: 'var(--muted)', fontSize: 10, marginTop: 2 }}>Grade {health.grade}</p>
                    </div>
                    <Sparkline values={revSpark} width={120} height={32} color="#7396c2" />
                  </div>
                </div>

                {/* Pinned metrics */}
                <div>
                  <p className="mb-2" style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Key metrics</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Total income', value: `£${fin.revenue_gbp_m.toLocaleString()}m`, change: revChange },
                      { label: 'Surplus margin', value: `${fin.surplus_margin_pct.toFixed(1)}%`, color: fin.surplus_margin_pct >= 0 ? 'var(--positive)' : 'var(--negative)' },
                      { label: 'Research income', value: `£${fin.research_income_gbp_m}m` },
                      { label: 'Liquidity', value: `${fin.liquidity_days}d` },
                      { label: 'Borrowing', value: `£${fin.borrowing_gbp_m}m` },
                      { label: 'International', value: `${fin.international_fte_pct}%` },
                    ].map((m) => (
                      <div key={m.label} className="px-2.5 py-2 border" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}>
                        <p style={{ color: 'var(--muted)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</p>
                        <p className="font-num flex items-center gap-1" style={{ color: m.color ?? 'var(--text)', fontSize: 14, fontWeight: 600 }}>
                          {m.value}
                          {typeof m.change === 'number' && m.change !== 0 && (
                            <span className="flex items-center" style={{ color: m.change >= 0 ? 'var(--positive)' : 'var(--negative)', fontSize: 10 }}>
                              {m.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {Math.abs(m.change).toFixed(1)}%
                            </span>
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Latest report */}
                <div>
                  <p className="mb-2" style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Latest report</p>
                  <Link to={`/universities/${inst.id}#reports`} onClick={closePanel} className="flex items-center gap-2.5 px-3 py-2 border" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}>
                    <FileText className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                    <span className="flex-1 min-w-0">
                      <span className="block" style={{ color: 'var(--text)', fontSize: 12.5 }}>Annual Report FY{fin.fiscal_year}</span>
                      <span className="block" style={{ color: 'var(--muted)', fontSize: 10.5 }}>Financial statements · {fin.data_source}</span>
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--muted)' }} />
                  </Link>
                </div>
              </div>

              {/* Footer actions */}
              <div className="grid grid-cols-3 gap-2 px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
                <button
                  onClick={() => toggleWatch(inst.id)}
                  className="flex items-center justify-center gap-1.5 py-2"
                  style={{ border: '1px solid var(--border)', borderRadius: 3, color: isWatched(inst.id) ? 'var(--warning)' : 'var(--text-2)', fontSize: 11.5 }}
                >
                  <Star className="w-3.5 h-3.5" fill={isWatched(inst.id) ? 'var(--warning)' : 'none'} />
                  {isWatched(inst.id) ? 'Watching' : 'Watch'}
                </button>
                <Link to={`/compare?add=${inst.id}`} onClick={closePanel} className="flex items-center justify-center gap-1.5 py-2" style={{ border: '1px solid var(--border)', borderRadius: 3, color: 'var(--text-2)', fontSize: 11.5 }}>
                  <GitCompare className="w-3.5 h-3.5" /> Compare
                </Link>
                <Link to={`/universities/${inst.id}`} onClick={closePanel} className="flex items-center justify-center gap-1.5 py-2" style={{ backgroundColor: 'var(--accent)', borderRadius: 3, color: '#fff', fontSize: 11.5, fontWeight: 500 }}>
                  Profile <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </>
          )
        })()}
      </aside>
    </>
  )
}
