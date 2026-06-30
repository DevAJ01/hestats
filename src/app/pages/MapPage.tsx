import { useState, useMemo } from 'react'
import { Link } from 'react-router'
import { Map as MapIcon, TrendingUp } from 'lucide-react'
import { institutions } from '../data/institutions'
import { getAllLatestFinancials } from '../data/financials'
import { computeHealthScore, getGradeColor } from '../data/health'
import { INSTITUTION_COORDS, projectToSvg } from '../data/coordinates'
import { HealthBadge } from '../components/institutions/HealthBadge'
import { NationBadge } from '../components/institutions/NationBadge'
import { RiskBadge } from '../components/institutions/RiskBadge'

type BubbleSize = 'revenue' | 'research' | 'students' | 'borrowing'
type BubbleColor = 'health' | 'risk' | 'nation' | 'surplus'

const SVG_W = 520
const SVG_H = 720

// Simplified UK outline path (approximated for visualization)
const UK_PATH = `
  M 285,10 L 300,18 L 310,30 L 298,40 L 310,55 L 320,65 L 315,80 L 305,90
  L 310,105 L 295,115 L 288,130 L 295,145 L 290,158 L 278,162 L 272,175
  L 268,188 L 275,200 L 270,212 L 260,220 L 265,232 L 258,245 L 252,260
  L 245,272 L 238,285 L 235,300 L 242,312 L 238,325 L 230,335 L 222,348
  L 215,362 L 218,375 L 212,388 L 205,400 L 198,413 L 192,426 L 185,440
  L 178,453 L 175,466 L 182,478 L 178,490 L 170,502 L 165,515 L 168,528
  L 162,540 L 155,552 L 148,564 L 145,576 L 150,585 L 158,592 L 170,598
  L 182,604 L 195,608 L 208,610 L 220,607 L 230,600 L 238,592 L 245,583
  L 252,574 L 255,563 L 260,552 L 266,541 L 272,530 L 275,518 L 280,507
  L 285,496 L 290,485 L 295,474 L 298,462 L 302,450 L 306,438 L 310,426
  L 312,414 L 316,402 L 320,390 L 322,378 L 325,366 L 326,354 L 328,342
  L 330,330 L 328,318 L 326,306 L 325,294 L 326,282 L 328,270 L 325,258
  L 322,246 L 318,234 L 315,222 L 312,210 L 310,198 L 308,186 L 305,174
  L 302,162 L 300,150 L 298,138 L 295,126 L 293,114 L 291,102 L 290,90
  L 291,78 L 294,66 L 293,54 L 289,42 L 285,30 Z
  M 100,400 L 108,390 L 115,380 L 120,370 L 125,360 L 120,350 L 112,360
  L 105,370 L 100,380 L 98,390 Z
  M 80,450 L 88,440 L 95,430 L 98,420 L 92,412 L 84,420 L 78,432 L 74,442 L 78,452 Z
`

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
    return fin.risk_flag === 'Low' ? 'var(--positive)' : fin.risk_flag === 'Medium' ? 'var(--warning)' : 'var(--negative)'
  }
  if (mode === 'nation') return NATION_COLORS[inst.nation] ?? 'var(--muted)'
  if (mode === 'surplus') return fin.surplus_margin_pct >= 3 ? 'var(--positive)' : fin.surplus_margin_pct >= 0 ? 'var(--warning)' : 'var(--negative)'
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

  const bubbles = useMemo(() => {
    return institutions
      .map((inst) => {
        const coords = INSTITUTION_COORDS[inst.id]
        const fin = finLookup[inst.id]
        if (!coords || !fin) return null
        const [x, y] = projectToSvg(coords[0], coords[1], SVG_W, SVG_H)
        const rawSize =
          bubbleSize === 'revenue' ? fin.revenue_gbp_m :
          bubbleSize === 'research' ? fin.research_income_gbp_m :
          bubbleSize === 'students' ? fin.student_fte_total / 1000 :
          fin.borrowing_gbp_m
        return { inst, fin, x, y, rawSize, color: getBubbleColor(bubbleColor, fin, inst) }
      })
      .filter((b): b is NonNullable<typeof b> => b !== null)
      .filter((b) => nationFilter === 'All' || b.inst.nation === nationFilter)
  }, [latestFins, bubbleSize, bubbleColor, nationFilter])

  const maxSize = Math.max(...bubbles.map((b) => b.rawSize), 1)

  function getBubbleR(rawSize: number): number {
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
              {([['revenue', 'Total Income'], ['research', 'Research Income'], ['students', 'Student FTE'], ['borrowing', 'Borrowing']] as [BubbleSize, string][]).map(([val, label]) => (
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
              style={{ width: '100%', maxHeight: 600, display: 'block' }}
            >
              {/* UK outline */}
              <path d={UK_PATH} fill="var(--bg-2)" stroke="var(--border)" strokeWidth={1.5} />

              {/* Institution bubbles — render in order of size (large underneath) */}
              {[...bubbles].sort((a, b) => b.rawSize - a.rawSize).map(({ inst, fin, x, y, rawSize, color }) => {
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
                      fillOpacity={isHovered || isSelected ? 0.85 : 0.55}
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
                  <p style={{ color: 'var(--muted)', fontSize: 11 }}>{displayInst.inst.city} · Est. {displayInst.inst.founded} · UKPRN {displayInst.inst.ukprn}</p>
                </div>
                <Link
                  to={`/institutions/${displayInst.inst.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 flex-shrink-0"
                  style={{ backgroundColor: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 500, borderRadius: 3 }}
                >
                  <TrendingUp className="w-3.5 h-3.5" /> View profile
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'Total Income', value: `£${displayInst.fin.revenue_gbp_m.toLocaleString()}m` },
                  { label: 'Surplus Margin', value: `${displayInst.fin.surplus_margin_pct.toFixed(1)}%`, color: displayInst.fin.surplus_margin_pct >= 0 ? 'var(--positive)' : 'var(--negative)' },
                  { label: 'Research Income', value: `£${displayInst.fin.research_income_gbp_m}m` },
                  { label: 'Student FTE', value: displayInst.fin.student_fte_total.toLocaleString() },
                  { label: 'Cash', value: `£${displayInst.fin.cash_gbp_m}m` },
                  { label: 'Borrowing', value: `£${displayInst.fin.borrowing_gbp_m}m` },
                  { label: 'Liquidity Days', value: `${displayInst.fin.liquidity_days}d` },
                  { label: 'International %', value: `${displayInst.fin.international_fte_pct}%` },
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
