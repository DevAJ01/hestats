import { useState, useMemo } from 'react'
import { Link } from 'react-router'
import { Map as MapIcon, TrendingUp } from 'lucide-react'
import { institutions } from '../data/institutions'
import { compareNullableDesc, formatCurrencyM, formatDays, formatPct, getAllLatestFinancials, isKnownNumber } from '../data/financials'
import { computeHealthScore, getGradeColor } from '../data/health'
import { INSTITUTION_COORDS, projectToSvg } from '../data/coordinates'
import { formatStudentCount, getLatestStudentEnrolment } from '../data/students'
import { UK_OUTLINE_PATH, UK_OUTLINE_SOURCE } from '../data/ukOutline'
import { providerUniverse } from '../data/providers'
import { HealthBadge } from '../components/institutions/HealthBadge'
import { NationBadge } from '../components/institutions/NationBadge'
import { RiskBadge } from '../components/institutions/RiskBadge'

type BubbleSize = 'revenue' | 'research' | 'cash' | 'borrowing'
type BubbleColor = 'health' | 'risk' | 'nation' | 'surplus'

const SVG_W = 520
const SVG_H = 720

const NATION_COLORS: Record<string, string> = {
  England: '#7396c2',
  Scotland: '#5fa97b',
  Wales: '#c2945a',
  'Northern Ireland': '#b18ab8',
}

function getBubbleColor(mode: BubbleColor, fin: ReturnType<typeof getAllLatestFinancials>[0], inst: typeof institutions[0]): string {
  if (mode === 'health') {
    const h = computeHealthScore(fin)
    return getGradeColor(h.grade)
  }
  if (mode === 'risk') {
    return fin.risk_flag === 'Low' ? 'var(--positive)' : fin.risk_flag === 'Medium' ? 'var(--warning)' : fin.risk_flag === 'High' ? 'var(--negative)' : 'var(--muted)'
  }
  if (mode === 'nation') return NATION_COLORS[inst.nation] ?? 'var(--muted)'
  if (mode === 'surplus') return isKnownNumber(fin.surplus_margin_pct) ? (fin.surplus_margin_pct >= 3 ? 'var(--positive)' : fin.surplus_margin_pct >= 0 ? 'var(--warning)' : 'var(--negative)') : 'var(--muted)'
  return 'var(--accent)'
}

export function MapPage() {
  const [bubbleSize, setBubbleSize] = useState<BubbleSize>('revenue')
  const [bubbleColor, setBubbleColor] = useState<BubbleColor>('health')
  const [nationFilter, setNationFilter] = useState<string>('All')
  const [hovered, setHovered] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  const latestFins = getAllLatestFinancials()
  // Use a plain object to avoid any Map constructor collision with lucide Map icon
  const finLookup = Object.fromEntries(latestFins.map((f) => [f.institution_id, f]))
  const plotEligibleProviders = institutions.filter((inst) => INSTITUTION_COORDS[inst.id] && finLookup[inst.id]).length

  const bubbles = useMemo(() => {
    return institutions
      .map((inst) => {
        const coords = INSTITUTION_COORDS[inst.id]
        const fin = finLookup[inst.id]
        if (!coords || !fin) return null
        const [x, y] = projectToSvg(coords[0], coords[1], SVG_W, SVG_H)
        const student = getLatestStudentEnrolment(inst.id)
        const rawSize =
          bubbleSize === 'revenue' ? fin.revenue_gbp_m :
          bubbleSize === 'research' ? fin.research_income_gbp_m :
          bubbleSize === 'cash' ? fin.cash_gbp_m :
          fin.borrowing_gbp_m
        return { inst, fin, student, x, y, rawSize, metricKnown: isKnownNumber(rawSize), color: getBubbleColor(bubbleColor, fin, inst) }
      })
      .filter((b): b is NonNullable<typeof b> => b !== null)
      .filter((b) => nationFilter === 'All' || b.inst.nation === nationFilter)
  }, [latestFins, bubbleSize, bubbleColor, nationFilter])

  const maxSize = Math.max(...bubbles.map((b) => b.rawSize).filter(isKnownNumber), 1)

  function getBubbleR(rawSize: number | null): number {
    if (!isKnownNumber(rawSize)) return 4
    return Math.max(3, Math.sqrt(rawSize / maxSize) * 22)
  }

  const hoveredInst = hovered ? bubbles.find((b) => b.inst.id === hovered) : null
  const selectedInst = selected ? bubbles.find((b) => b.inst.id === selected) : null
  const displayInst = hoveredInst ?? selectedInst

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-2.5">
      {/* Status bar */}
      <div
        className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-1.5 mb-2.5 border"
        style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3, fontSize: 11 }}
      >
        <MapIcon className="w-3 h-3" style={{ color: 'var(--accent)' }} />
        <span style={{ color: 'var(--muted)', letterSpacing: '0.06em' }}>INTERACTIVE UK MAP</span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}>
          <span className="font-num" style={{ color: 'var(--text)' }}>{bubbles.length}</span> institutions plotted
        </span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}>
          <span className="font-num" style={{ color: 'var(--text)' }}>{(providerUniverse.length - plotEligibleProviders).toLocaleString()}</span> HESA provider records not geocoded
        </span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}>Bubble size = {bubbleSize} · Colour = {bubbleColor}</span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}>Click any bubble to view institution</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-2.5">
        {/* Controls */}
        <div className="space-y-2.5">
          {/* Bubble size */}
          <div className="p-3 border" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}>
            <p style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              Bubble size
            </p>
            <div className="space-y-1">
              {([['revenue', 'Total Income'], ['research', 'Research Income'], ['cash', 'Cash'], ['borrowing', 'Borrowing']] as [BubbleSize, string][]).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setBubbleSize(val)}
                  className="w-full text-left px-2 py-1.5 transition-colors"
                  style={{
                    backgroundColor: bubbleSize === val ? 'var(--accent)' : 'transparent',
                    color: bubbleSize === val ? '#fff' : 'var(--text-2)',
                    borderRadius: 2,
                    fontSize: 12,
                    border: '1px solid transparent',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Bubble colour */}
          <div className="p-3 border" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}>
            <p style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              Bubble colour
            </p>
            <div className="space-y-1">
              {([['health', 'Financial Health'], ['surplus', 'Surplus Margin'], ['risk', 'Risk Flag'], ['nation', 'Nation']] as [BubbleColor, string][]).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setBubbleColor(val)}
                  className="w-full text-left px-2 py-1.5 transition-colors"
                  style={{
                    backgroundColor: bubbleColor === val ? 'var(--accent)' : 'transparent',
                    color: bubbleColor === val ? '#fff' : 'var(--text-2)',
                    borderRadius: 2,
                    fontSize: 12,
                    border: '1px solid transparent',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Nation filter */}
          <div className="p-3 border" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}>
            <p style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              Filter by nation
            </p>
            <div className="space-y-1">
              {['All', 'England', 'Scotland', 'Wales', 'Northern Ireland'].map((n) => (
                <button
                  key={n}
                  onClick={() => setNationFilter(n)}
                  className="w-full text-left px-2 py-1.5 transition-colors"
                  style={{
                    backgroundColor: nationFilter === n ? 'var(--bg-2)' : 'transparent',
                    color: nationFilter === n ? 'var(--text)' : 'var(--text-2)',
                    borderRadius: 2,
                    fontSize: 12,
                    border: nationFilter === n ? '1px solid var(--border)' : '1px solid transparent',
                    fontWeight: nationFilter === n ? 500 : 400,
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          {bubbleColor === 'health' && (
            <div className="p-3 border" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}>
              <p style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Legend</p>
              {[['AAA/AA', 'var(--positive)'], ['A/BBB', 'var(--warning)'], ['BB–CCC', 'var(--negative)']].map(([label, color]) => (
                <div key={label} className="flex items-center gap-2 mb-1.5">
                  <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: color, display: 'inline-block' }} />
                  <span style={{ color: 'var(--text-2)', fontSize: 11 }}>{label}</span>
                </div>
              ))}
            </div>
          )}
          {bubbleColor === 'nation' && (
            <div className="p-3 border" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}>
              <p style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Legend</p>
              {Object.entries(NATION_COLORS).map(([nation, color]) => (
                <div key={nation} className="flex items-center gap-2 mb-1.5">
                  <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: color, display: 'inline-block' }} />
                  <span style={{ color: 'var(--text-2)', fontSize: 11 }}>{nation}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Map + Detail */}
        <div className="lg:col-span-3 space-y-2.5">
          {/* SVG Map */}
          <div
            className="border overflow-hidden"
            style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}
          >
            <svg
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              preserveAspectRatio="xMidYMid meet"
              style={{ width: '100%', maxHeight: 640, display: 'block' }}
            >
              {/* UK outline */}
              <path
                d={UK_OUTLINE_PATH}
                fill="var(--bg-2)"
                fillRule="evenodd"
                stroke="var(--border)"
                strokeWidth={1.2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Institution bubbles — render in order of size (large underneath) */}
              {[...bubbles].sort((a, b) => compareNullableDesc(a.rawSize, b.rawSize)).map(({ inst, x, y, rawSize, metricKnown, color }) => {
                const r = getBubbleR(rawSize)
                const isHovered = hovered === inst.id
                const isSelected = selected === inst.id
                return (
                  <g key={inst.id}>
                    <circle
                      cx={x}
                      cy={y}
                      r={r}
                      fill={color}
                      fillOpacity={isHovered || isSelected ? 0.85 : metricKnown ? 0.55 : 0.22}
                      stroke={isHovered || isSelected ? color : 'transparent'}
                      strokeWidth={isSelected ? 2 : 1}
                      style={{ cursor: 'pointer', transition: 'r 0.2s, fill-opacity 0.15s' }}
                      onMouseEnter={() => setHovered(inst.id)}
                      onMouseLeave={() => setHovered(null)}
                      onClick={() => setSelected(selected === inst.id ? null : inst.id)}
                    />
                    {/* Label for hovered/selected or large institutions */}
                    {(isHovered || isSelected || r > 14) && (
                      <text
                        x={x}
                        y={y + r + 9}
                        textAnchor="middle"
                        fontSize={8.5}
                        fill="var(--text-2)"
                        style={{ pointerEvents: 'none', userSelect: 'none' }}
                      >
                        {inst.short_name}
                      </text>
                    )}
                  </g>
                )
              })}
            </svg>
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5" style={{ borderTop: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--muted)', fontSize: 10 }}>
                Boundary: {UK_OUTLINE_SOURCE.publisher} · {UK_OUTLINE_SOURCE.source_reference}
              </span>
              <a href={UK_OUTLINE_SOURCE.source_url} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: 'var(--link)', fontSize: 10 }}>
                Source
              </a>
            </div>
          </div>

          {/* Institution detail card */}
          {displayInst ? (
            <div
              className="p-3 border"
              style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <NationBadge nation={displayInst.inst.nation} />
                    {(() => {
                      const h = computeHealthScore(displayInst.fin)
                      return <HealthBadge score={h.score} grade={h.grade} size="sm" showScore />
                    })()}
                    <RiskBadge risk={displayInst.fin.risk_flag} size="sm" />
                  </div>
                  <p style={{ color: 'var(--text)', fontSize: 15, fontWeight: 600 }}>{displayInst.inst.canonical_name}</p>
                  <p style={{ color: 'var(--muted)', fontSize: 11 }}>{displayInst.inst.city} · Est. {displayInst.inst.founded} · UKPRN {displayInst.inst.ukprn ?? 'pending'}</p>
                </div>
                <Link
                  to={`/universities/${displayInst.inst.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 flex-shrink-0"
                  style={{ backgroundColor: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 500, borderRadius: 3 }}
                >
                  <TrendingUp className="w-3.5 h-3.5" /> View profile
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'Total Income', value: formatCurrencyM(displayInst.fin.revenue_gbp_m) },
                  { label: 'Surplus Margin', value: formatPct(displayInst.fin.surplus_margin_pct), color: isKnownNumber(displayInst.fin.surplus_margin_pct) && displayInst.fin.surplus_margin_pct >= 0 ? 'var(--positive)' : isKnownNumber(displayInst.fin.surplus_margin_pct) ? 'var(--negative)' : 'var(--muted)' },
                  { label: 'Research Income', value: formatCurrencyM(displayInst.fin.research_income_gbp_m) },
                  { label: 'HESA Enrolments', value: formatStudentCount(displayInst.student?.total_enrolments) },
                  { label: 'Cash', value: formatCurrencyM(displayInst.fin.cash_gbp_m) },
                  { label: 'Borrowing', value: formatCurrencyM(displayInst.fin.borrowing_gbp_m) },
                  { label: 'Liquidity Days', value: formatDays(displayInst.fin.liquidity_days) },
                  { label: 'International %', value: isKnownNumber(displayInst.fin.international_fte_pct) ? `${displayInst.fin.international_fte_pct.toFixed(1)}%` : 'Pending' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="px-2.5 py-2 border" style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3 }}>
                    <p style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 2 }}>{label}</p>
                    <p className="font-num tabular-nums" style={{ color: color ?? 'var(--text)', fontSize: 14, fontWeight: 600 }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div
              className="flex items-center justify-center px-3 py-6 border"
              style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}
            >
              <p style={{ color: 'var(--muted)', fontSize: 12 }}>Hover or click a bubble to see institution details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
