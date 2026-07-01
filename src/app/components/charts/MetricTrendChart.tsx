import { useState, useRef, useCallback } from 'react'
import { FinancialYear } from '../../data/types'
import { isKnownNumber } from '../../data/financials'

interface Metric {
  key: keyof FinancialYear
  label: string
  color: string
  unit: string
  /**
   * Optional per-series data. When provided, this series is plotted from its own
   * financials (used to overlay multiple institutions). When omitted, the shared
   * `financials` prop is used (single-institution, multi-metric usage).
   */
  financials?: FinancialYear[]
}

interface MetricTrendChartProps {
  financials: FinancialYear[]
  metrics: Metric[]
  height?: number
}

interface TooltipData {
  x: number
  y: number
  year: string
  values: { label: string; color: string; value: string }[]
}

function fmtVal(value: number, unit: string) {
  if (unit === '%') return `${value.toFixed(1)}%`
  if (unit === 'days') return `${value} days`
  return `£${value.toLocaleString()}m`
}

function dedupeByYear(financials: FinancialYear[]) {
  const seen = new Set<string>()
  return financials.filter((f) => {
    if (!f.fiscal_year || seen.has(f.fiscal_year)) return false
    seen.add(f.fiscal_year)
    return true
  })
}

export function MetricTrendChart({ financials, metrics, height = 240 }: MetricTrendChartProps) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const primaryUnit = metrics[0]?.unit ?? ''
  const PAD = { top: 8, right: 12, bottom: 24, left: 48 }
  const chartW = 600
  const chartH = height - PAD.top - PAD.bottom - 28 // 28 for legend
  const innerW = chartW - PAD.left - PAD.right
  const innerH = chartH

  // Each metric resolves its own data source (shared prop or per-series financials),
  // keyed by fiscal year so series can be aligned on a shared x-axis.
  const sharedSorted = dedupeByYear(financials).sort((a, b) => a.fiscal_year.localeCompare(b.fiscal_year))
  const series = metrics.map((m) => {
    const src = dedupeByYear(m.financials ?? financials)
    const byYear = new Map(
      src
        .map((f) => [f.fiscal_year, f[m.key]] as const)
        .filter((entry): entry is readonly [string, number] => isKnownNumber(entry[1] as number | null)),
    )
    return { metric: m, byYear }
  })

  // Unified, sorted list of all years across every series.
  const yearSet = new Set<string>()
  series.forEach((s) => s.byYear.forEach((_, y) => yearSet.add(y)))
  if (sharedSorted.length === 0 && yearSet.size === 0) return null
  const years = Array.from(yearSet).sort((a, b) => a.localeCompare(b))

  if (!years.length || !metrics.length) return null

  // Value range across all series.
  const allVals = series.flatMap((s) => Array.from(s.byYear.values())).filter(isFinite)
  if (!allVals.length) return null
  const minVal = Math.min(...allVals)
  const maxVal = Math.max(...allVals)
  const pad = (maxVal - minVal) * 0.1 || 1
  const yMin = minVal - pad
  const yMax = maxVal + pad

  function xPos(i: number) {
    return PAD.left + (i / Math.max(years.length - 1, 1)) * innerW
  }
  function yPos(v: number) {
    return PAD.top + innerH - ((v - yMin) / (yMax - yMin)) * innerH
  }

  // Y axis ticks
  const tickCount = 4
  const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => yMin + ((yMax - yMin) * i) / tickCount)

  // Build line paths (only across years where the series has a value).
  const paths = series.map((s) => {
    const pts: string[] = []
    years.forEach((y, i) => {
      const v = s.byYear.get(y)
      if (v !== undefined && isFinite(v)) pts.push(`${xPos(i)},${yPos(v)}`)
    })
    return { metric: s.metric, byYear: s.byYear, d: pts.length ? `M ${pts.join(' L ')}` : '' }
  })

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const rect = svgRef.current?.getBoundingClientRect()
      if (!rect) return
      const svgX = ((e.clientX - rect.left) / rect.width) * chartW
      const relX = svgX - PAD.left
      const idx = Math.round((relX / innerW) * (years.length - 1))
      const clamped = Math.max(0, Math.min(years.length - 1, idx))
      const year = years[clamped]
      if (!year) return
      const values = series
        .map((s) => {
          const v = s.byYear.get(year)
          if (v === undefined) return null
          return { label: s.metric.label, color: s.metric.color, value: fmtVal(v, s.metric.unit), raw: v }
        })
        .filter((v): v is NonNullable<typeof v> => v !== null)
      if (!values.length) return
      setTooltip({
        x: xPos(clamped),
        y: Math.min(...values.map((v) => yPos(v.raw))),
        year,
        values: values.map(({ label, color, value }) => ({ label, color, value })),
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [years.join('|'), metrics, innerW],
  )

  return (
    <div>
      {/* Legend */}
      <div className="flex items-center gap-4 mb-1 flex-wrap" style={{ paddingLeft: PAD.left }}>
        {metrics.map((m, mi) => (
          <span key={`legend-${mi}`} className="flex items-center gap-1.5" style={{ fontSize: 10.5, color: 'var(--text-2)' }}>
            <svg width="16" height="2" style={{ display: 'inline', verticalAlign: 'middle' }}>
              <line x1="0" y1="1" x2="16" y2="1" stroke={m.color} strokeWidth="2" />
            </svg>
            {m.label}
          </span>
        ))}
      </div>

      {/* Chart SVG */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${chartW} ${chartH}`}
        style={{ width: '100%', height: chartH, display: 'block', overflow: 'visible' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Grid lines */}
        {yTicks.map((v, i) => (
          <g key={`grid-${i}`}>
            <line
              x1={PAD.left} y1={yPos(v)} x2={PAD.left + innerW} y2={yPos(v)}
              stroke="var(--border)" strokeWidth={1} strokeDasharray="2 4"
            />
            <text x={PAD.left - 4} y={yPos(v) + 3.5} textAnchor="end" fontSize={9} fill="var(--muted)">
              {primaryUnit === '%' ? `${v.toFixed(0)}%` : primaryUnit === 'days' ? `${v.toFixed(0)}d` : `£${Math.round(v)}m`}
            </text>
          </g>
        ))}

        {/* X axis ticks — thin labels when there are many data points */}
        {years.map((year, i) => {
          const showLabel = years.length <= 6 || i === 0 || i === years.length - 1 || i % 2 === 0
          if (!showLabel) return null
          return (
            <text key={`xtick-${i}`} x={xPos(i)} y={PAD.top + innerH + 14} textAnchor="middle" fontSize={8.5} fill="var(--muted)">
              {year.slice(0, 7)}
            </text>
          )
        })}

        {/* X axis line */}
        <line x1={PAD.left} y1={PAD.top + innerH} x2={PAD.left + innerW} y2={PAD.top + innerH} stroke="var(--border)" strokeWidth={1} />

        {/* Lines */}
        {paths.map(({ metric, d }, mi) =>
          d ? (
            <path key={`line-${mi}`} d={d} stroke={metric.color} strokeWidth={1.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          ) : null,
        )}

        {/* Dots — smaller for dense datasets */}
        {paths.map(({ byYear, metric }, mi) =>
          years.map((year, i) => {
            const v = byYear.get(year)
            if (v === undefined || !isFinite(v)) return null
            return (
              <circle
                key={`dot-${mi}-${i}`}
                cx={xPos(i)}
                cy={yPos(v)}
                r={years.length > 7 ? 1.8 : 2.5}
                fill={metric.color}
                stroke="none"
              />
            )
          }),
        )}

        {/* Tooltip crosshair */}
        {tooltip && (
          <>
            <line x1={tooltip.x} y1={PAD.top} x2={tooltip.x} y2={PAD.top + innerH} stroke="var(--border-strong)" strokeWidth={1} />
            <foreignObject
              x={tooltip.x + 8 > chartW - 120 ? tooltip.x - 120 : tooltip.x + 8}
              y={Math.max(PAD.top, Math.min(PAD.top + innerH - 80, tooltip.y - 30))}
              width={112}
              height={tooltip.values.length * 18 + 28}
              style={{ overflow: 'visible' }}
            >
              <div
                style={{
                  background: 'var(--panel)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 3,
                  padding: '5px 7px',
                  fontSize: 10.5,
                  pointerEvents: 'none',
                }}
              >
                <div style={{ color: 'var(--muted)', fontSize: 9, marginBottom: 4, letterSpacing: '0.04em' }}>
                  FY{tooltip.year}
                </div>
                {tooltip.values.map((v, vi) => (
                  <div key={`tt-${vi}`} style={{ color: v.color, marginBottom: 2 }}>
                    {v.label}: <span style={{ fontWeight: 600 }}>{v.value}</span>
                  </div>
                ))}
              </div>
            </foreignObject>
          </>
        )}
      </svg>
    </div>
  )
}
