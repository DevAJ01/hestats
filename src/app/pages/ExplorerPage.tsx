import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router'
import {
  Table as TableIcon, LayoutGrid, Map as MapIcon, GitBranch, Activity, Search, Star, Eye,
} from 'lucide-react'
import { useWorkspace } from '../context/WorkspaceContext'
import { useContextPanel } from '../context/ContextPanelContext'
import {
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts'
import { institutions } from '../data/institutions'
import { compareNullableDesc, formatCurrencyM, formatDays, formatPct, getAllLatestFinancials, isKnownNumber } from '../data/financials'
import { computeHealthScore, getGradeColor } from '../data/health'
import { INSTITUTION_COORDS, projectToSvg } from '../data/coordinates'
import { UK_OUTLINE_PATH, UK_OUTLINE_SOURCE } from '../data/ukOutline'
import { providerUniverse } from '../data/providers'
import { Institution } from '../data/types'
import { InstitutionCard } from '../components/institutions/InstitutionCard'
import { InstitutionRow } from '../components/institutions/InstitutionRow'

type ViewMode = 'table' | 'cards' | 'map' | 'graph' | 'timeline'

const VIEWS: { id: ViewMode; label: string; icon: typeof TableIcon }[] = [
  { id: 'table', label: 'Table', icon: TableIcon },
  { id: 'cards', label: 'Cards', icon: LayoutGrid },
  { id: 'map', label: 'Map', icon: MapIcon },
  { id: 'graph', label: 'Graph', icon: GitBranch },
  { id: 'timeline', label: 'Timeline', icon: Activity },
]

const SELECT_STYLE: React.CSSProperties = {
  backgroundColor: 'var(--bg-2)', color: 'var(--text)', border: '1px solid var(--border)',
  borderRadius: 3, fontSize: 11.5, padding: '4px 8px', outline: 'none',
}

const SVG_W = 520
const SVG_H = 720

export function ExplorerPage() {
  const [params, setParams] = useSearchParams()
  const { isWatched, toggleWatch } = useWorkspace()
  const { openPanel } = useContextPanel()

  // Filters initialise from the URL so views and filters are shareable & persistent.
  const initialView = (params.get('view') as ViewMode) || 'table'
  const [view, setView] = useState<ViewMode>(VIEWS.some((v) => v.id === initialView) ? initialView : 'table')
  const [query, setQuery] = useState(params.get('q') ?? '')
  const [nation, setNation] = useState(params.get('nation') ?? 'All')
  const [missionGroup, setMissionGroup] = useState(params.get('group') ?? 'All')
  const [sortBy, setSortBy] = useState<'revenue' | 'surplus' | 'research' | 'liquidity' | 'name'>((params.get('sort') as never) ?? 'revenue')
  const [hovered, setHovered] = useState<string | null>(null)

  const finMap = useMemo(() => Object.fromEntries(getAllLatestFinancials().map((f) => [f.institution_id, f])), [])
  const geocodedProfiledProviders = useMemo(() =>
    institutions.filter((inst) => INSTITUTION_COORDS[inst.id] && finMap[inst.id]).length,
  [finMap])
  const unplottedProviderRows = Math.max(0, providerUniverse.length - geocodedProfiledProviders)

  // Persist all filter state to the URL (replace, so back button isn't polluted).
  useEffect(() => {
    const next = new URLSearchParams()
    next.set('view', view)
    if (query) next.set('q', query)
    if (nation !== 'All') next.set('nation', nation)
    if (missionGroup !== 'All') next.set('group', missionGroup)
    if (sortBy !== 'revenue') next.set('sort', sortBy)
    setParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, query, nation, missionGroup, sortBy])

  function setViewAndUrl(v: ViewMode) { setView(v) }

  const filtered = useMemo(() => {
    let list = institutions.filter((i) => finMap[i.id])
    if (query) {
      const q = query.toLowerCase()
      list = list.filter((i) => i.canonical_name.toLowerCase().includes(q) || i.short_name.toLowerCase().includes(q) || i.city.toLowerCase().includes(q))
    }
    if (nation !== 'All') list = list.filter((i) => i.nation === nation)
    if (missionGroup !== 'All') {
      if (missionGroup === 'None') list = list.filter((i) => !i.mission_group)
      else list = list.filter((i) => i.mission_group === missionGroup)
    }
    list.sort((a, b) => {
      const fa = finMap[a.id], fb = finMap[b.id]
      if (sortBy === 'name') return a.canonical_name.localeCompare(b.canonical_name)
      if (sortBy === 'revenue') return compareNullableDesc(fa.revenue_gbp_m, fb.revenue_gbp_m)
      if (sortBy === 'surplus') return compareNullableDesc(fa.surplus_margin_pct, fb.surplus_margin_pct)
      if (sortBy === 'research') return compareNullableDesc(fa.research_income_gbp_m, fb.research_income_gbp_m)
      if (sortBy === 'liquidity') return compareNullableDesc(fa.liquidity_days, fb.liquidity_days)
      return 0
    })
    return list
  }, [query, nation, missionGroup, sortBy, finMap])

  const nations: Institution['nation'][] = ['England', 'Scotland', 'Wales', 'Northern Ireland']

  // Map bubbles
  const bubbles = useMemo(() => {
    return filtered
      .map((inst) => {
        const coords = INSTITUTION_COORDS[inst.id]
        const fin = finMap[inst.id]
        if (!coords || !fin) return null
        const [x, y] = projectToSvg(coords[0], coords[1], SVG_W, SVG_H)
        return { inst, fin, x, y }
      })
      .filter((b): b is NonNullable<typeof b> => b !== null)
  }, [filtered, finMap])
  const maxRev = Math.max(...bubbles.map((b) => b.fin.revenue_gbp_m).filter(isKnownNumber), 1)

  // Graph data (scatter: research income vs surplus margin, size = revenue)
  const scatterData = useMemo(() => filtered
    .map((inst) => {
      const fin = finMap[inst.id]
      if (!isKnownNumber(fin.research_income_gbp_m) || !isKnownNumber(fin.surplus_margin_pct) || !isKnownNumber(fin.revenue_gbp_m)) return null
      const h = computeHealthScore(fin)
      return {
        id: inst.id, name: inst.short_name,
        x: fin.research_income_gbp_m, y: fin.surplus_margin_pct, z: fin.revenue_gbp_m,
        color: getGradeColor(h.grade),
      }
    })
    .filter((row): row is NonNullable<typeof row> => row !== null), [filtered, finMap])

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-3">
      {/* Status / breadcrumb bar */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-1.5 mb-3 border" style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3, fontSize: 11 }}>
        <span style={{ color: 'var(--muted)', letterSpacing: '0.06em' }}>EXPLORER</span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}>
          <span className="font-num" style={{ color: 'var(--text)' }}>{filtered.length}</span> / {institutions.length} profiled universities
        </span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}>{providerUniverse.length} HESA provider records · {unplottedProviderRows} not geocoded</span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}>One source-backed workspace · {VIEWS.length} synchronised views</span>
      </div>

      {/* Toolbar: views + filters */}
      <div className="flex flex-wrap items-center gap-2 p-2 mb-3 border" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}>
        {/* View switcher */}
        <div className="flex items-center" style={{ border: '1px solid var(--border)', borderRadius: 3, overflow: 'hidden' }}>
          {VIEWS.map((v, idx) => {
            const Icon = v.icon
            const active = view === v.id
            return (
              <button
                key={v.id}
                onClick={() => setViewAndUrl(v.id)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 transition-colors"
                style={{
                  backgroundColor: active ? 'var(--accent)' : 'transparent',
                  color: active ? '#fff' : 'var(--text-2)',
                  borderLeft: idx > 0 ? '1px solid var(--border)' : 'none',
                  fontSize: 11.5, fontWeight: active ? 500 : 400,
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{v.label}</span>
              </button>
            )
          })}
        </div>

        <div className="relative flex-1 min-w-44">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
          <input
            type="text" placeholder="Filter universities…" value={query} onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 outline-none"
            style={{ backgroundColor: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 3, fontSize: 12 }}
          />
        </div>
        <select value={nation} onChange={(e) => setNation(e.target.value)} style={SELECT_STYLE}>
          <option value="All">All Nations</option>
          {nations.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <select value={missionGroup} onChange={(e) => setMissionGroup(e.target.value)} style={SELECT_STYLE}>
          <option value="All">All Groups</option>
          <option value="Russell Group">Russell Group</option>
          <option value="None">Unaffiliated</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} style={SELECT_STYLE}>
          <option value="revenue">Sort: Income ▾</option>
          <option value="surplus">Sort: Margin ▾</option>
          <option value="research">Sort: Research ▾</option>
          <option value="liquidity">Sort: Liquidity ▾</option>
          <option value="name">Sort: Name ▾</option>
        </select>
      </div>

      {/* ── TABLE ── */}
      {view === 'table' && (
        <div className="overflow-hidden border" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="px-3 py-2" style={{ color: 'var(--muted)', fontSize: 9.5, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500, textAlign: 'left' }}>University</th>
                  {['Income', 'Margin', 'Research', 'Liquidity', 'Borrowing', 'Risk', 'Data'].map((h) => (
                    <th key={h} className="px-3 py-2" style={{ color: 'var(--muted)', fontSize: 9.5, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500, textAlign: 'right' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((inst) => <InstitutionRow key={inst.id} institution={inst} financial={finMap[inst.id]} />)}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CARDS ── */}
      {view === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((inst) => (
            <div key={inst.id} className="relative group">
              <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.preventDefault(); toggleWatch(inst.id) }}
                  className="w-7 h-7 flex items-center justify-center"
                  style={{ backgroundColor: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 3, color: isWatched(inst.id) ? 'var(--warning)' : 'var(--text-2)' }}
                  aria-label="Watch"
                >
                  <Star className="w-3.5 h-3.5" fill={isWatched(inst.id) ? 'var(--warning)' : 'none'} />
                </button>
                <button
                  onClick={(e) => { e.preventDefault(); openPanel(inst.id) }}
                  className="w-7 h-7 flex items-center justify-center"
                  style={{ backgroundColor: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 3, color: 'var(--text-2)' }}
                  aria-label="Quick view"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </div>
              <InstitutionCard institution={inst} financial={finMap[inst.id]} />
            </div>
          ))}
        </div>
      )}

      {/* ── MAP ── */}
      {view === 'map' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2 border overflow-hidden" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}>
            <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} preserveAspectRatio="xMidYMid meet" style={{ width: '100%', maxHeight: 640, display: 'block' }}>
              <path
                d={UK_OUTLINE_PATH}
                fill="var(--bg-2)"
                fillRule="evenodd"
                stroke="var(--border)"
                strokeWidth={1.2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {[...bubbles].sort((a, b) => compareNullableDesc(a.fin.revenue_gbp_m, b.fin.revenue_gbp_m)).map(({ inst, fin, x, y }) => {
                const r = isKnownNumber(fin.revenue_gbp_m) ? Math.max(3, Math.sqrt(fin.revenue_gbp_m / maxRev) * 22) : 4
                const h = computeHealthScore(fin)
                const color = getGradeColor(h.grade)
                const active = hovered === inst.id
                return (
                  <g key={inst.id}>
                    <circle cx={x} cy={y} r={r} fill={color} fillOpacity={active ? 0.85 : 0.55} stroke={active ? color : 'transparent'} strokeWidth={1.5}
                      style={{ cursor: 'pointer', transition: 'fill-opacity 0.15s' }}
                      onMouseEnter={() => setHovered(inst.id)} onMouseLeave={() => setHovered(null)} />
                    {(active || r > 14) && <text x={x} y={y + r + 9} textAnchor="middle" fontSize={8.5} fill="var(--text-2)" style={{ pointerEvents: 'none' }}>{inst.short_name}</text>}
                  </g>
                )
              })}
            </svg>
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5" style={{ borderTop: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--muted)', fontSize: 10 }}>
                Boundary: {UK_OUTLINE_SOURCE.publisher} · {UK_OUTLINE_SOURCE.source_reference}
              </span>
              <span style={{ color: 'var(--muted)', fontSize: 10 }}>
                Plotted: {bubbles.length} geocoded profiles · {unplottedProviderRows} HESA provider records not geocoded
              </span>
              <a href={UK_OUTLINE_SOURCE.source_url} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: 'var(--link)', fontSize: 10 }}>
                Source
              </a>
            </div>
          </div>
          <div className="border p-3" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}>
            <p style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
              {hovered ? 'Selected' : 'Hover a bubble'}
            </p>
            {(() => {
              const b = bubbles.find((x) => x.inst.id === hovered)
              if (!b) return <p style={{ color: 'var(--muted)', fontSize: 12 }}>Bubble size = total income · colour = financial health. Provider records without verified coordinates remain in coverage tables and exports, not on the map.</p>
              return (
                <div>
                  <p style={{ color: 'var(--text)', fontSize: 15, fontWeight: 600 }}>{b.inst.canonical_name}</p>
                  <p style={{ color: 'var(--muted)', fontSize: 11, marginBottom: 10 }}>{b.inst.city} · {b.inst.nation}</p>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {[['Income', formatCurrencyM(b.fin.revenue_gbp_m)], ['Margin', formatPct(b.fin.surplus_margin_pct)], ['Research', formatCurrencyM(b.fin.research_income_gbp_m)], ['Liquidity', formatDays(b.fin.liquidity_days)]].map(([l, v]) => (
                      <div key={l} className="px-2 py-1.5 border" style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3 }}>
                        <p style={{ color: 'var(--muted)', fontSize: 9, textTransform: 'uppercase' }}>{l}</p>
                        <p className="font-num" style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600 }}>{v}</p>
                      </div>
                    ))}
                  </div>
                  <Link to={`/universities/${b.inst.id}`} className="block text-center px-3 py-1.5" style={{ backgroundColor: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 500, borderRadius: 3 }}>View profile</Link>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* ── GRAPH (scatter) ── */}
      {view === 'graph' && (
        <div className="border p-4" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}>
          <p style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
            Research income (x) vs surplus margin (y) · bubble size = total income · colour = health
          </p>
          <ResponsiveContainer width="100%" height={520}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="2 2" />
              <XAxis type="number" dataKey="x" name="Research" unit="m" tick={{ fill: 'var(--muted)', fontSize: 10 }} stroke="var(--border)" label={{ value: 'Research income (£m)', position: 'bottom', fill: 'var(--muted)', fontSize: 10 }} />
              <YAxis type="number" dataKey="y" name="Margin" unit="%" tick={{ fill: 'var(--muted)', fontSize: 10 }} stroke="var(--border)" />
              <ZAxis type="number" dataKey="z" range={[30, 600]} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3', stroke: 'var(--border-strong)' }}
                contentStyle={{ backgroundColor: 'var(--panel)', border: '1px solid var(--border-strong)', borderRadius: 4, fontSize: 11 }}
                formatter={(val: number, name: string) => [name === 'Research' ? `£${val}m` : name === 'Margin' ? `${val}%` : `£${val}m`, name]}
                labelFormatter={() => ''}
                content={({ payload }) => {
                  if (!payload || !payload.length) return null
                  const d = payload[0].payload
                  return (
                    <div style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--border-strong)', borderRadius: 4, padding: '6px 10px', fontSize: 11 }}>
                      <p style={{ color: 'var(--text)', fontWeight: 600 }}>{d.name}</p>
                      <p style={{ color: 'var(--muted)' }}>Research £{d.x}m · Margin {d.y}% · Income £{d.z}m</p>
                    </div>
                  )
                }}
              />
              <Scatter data={scatterData} fillOpacity={0.7}>
                {scatterData.map((d) => <Cell key={d.id} fill={d.color} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── TIMELINE ── */}
      {view === 'timeline' && (
        <div className="border" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}>
          <p className="px-4 pt-3 pb-1" style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Universities ranked by latest total income
          </p>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {filtered.map((inst, i) => {
              const fin = finMap[inst.id]
              const pct = isKnownNumber(fin.revenue_gbp_m) ? (fin.revenue_gbp_m / maxRev) * 100 : 0
              return (
                <Link key={inst.id} to={`/universities/${inst.id}`} className="flex items-center gap-3 px-4 py-2 transition-colors" style={{ borderBottom: '1px solid var(--border)' }}>
                  <span className="font-num" style={{ color: 'var(--muted)', fontSize: 11, width: 26 }}>{i + 1}</span>
                  <span className="flex-1 min-w-0 truncate" style={{ color: 'var(--text)', fontSize: 12.5 }}>{inst.canonical_name}</span>
                  <div className="hidden sm:block" style={{ width: '40%', height: 8, backgroundColor: 'var(--bg-2)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', backgroundColor: 'var(--accent)' }} />
                  </div>
                  <span className="font-num" style={{ color: 'var(--text)', fontSize: 12, width: 80, textAlign: 'right' }}>{formatCurrencyM(fin.revenue_gbp_m)}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16" style={{ color: 'var(--muted)' }}>
          <Search className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <p style={{ fontSize: 12 }}>No universities match your filters.</p>
        </div>
      )}
    </div>
  )
}
