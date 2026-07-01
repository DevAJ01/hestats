import { useState, useCallback } from 'react'
import { FinancialYear } from '../../data/types'
import { FinancialValueKey, isKnownNumber } from '../../data/financials'

interface IncomeBreakdownChartProps {
  financials: FinancialYear[]
  height?: number
}

const SERIES: { key: FinancialValueKey; label: string; color: string }[] = [
  { key: 'tuition_fee_income_gbp_m', label: 'Tuition Fees', color: '#7396c2' },
  { key: 'research_income_gbp_m', label: 'Research', color: '#5fa97b' },
  { key: 'other_income_gbp_m', label: 'Other Income', color: '#c2945a' },
]

interface TooltipInfo {
  x: number
  year: string
  values: { label: string; color: string; value: number }[]
}

export function IncomeBreakdownChart({ financials, height = 240 }: IncomeBreakdownChartProps) {
  const seen = new Set<string>()
  const deduped = financials.filter((f) => {
    if (!f.fiscal_year || seen.has(f.fiscal_year)) return false
    seen.add(f.fiscal_year)
    return true
  })
  const sorted = [...deduped].sort((a, b) => a.fiscal_year.localeCompare(b.fiscal_year))

  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null)

  const PAD = { top: 8, right: 12, bottom: 24, left: 52 }
  const chartW = 600
  const legendH = 28
  const chartH = height - legendH
  const innerW = chartW - PAD.left - PAD.right
  const innerH = chartH - PAD.top - PAD.bottom

  if (!sorted.length) return null

  const barData = sorted
    .map((f) => {
      const values = SERIES.map((s) => f[s.key])
      if (!values.every(isKnownNumber)) return null
      return {
        year: f.fiscal_year,
        values,
        total: values.reduce((sum, value) => sum + value, 0),
      }
    })
    .filter((row): row is { year: string; values: number[]; total: number } => row !== null)

  if (!barData.length) return null

  const maxTotal = Math.max(...barData.map((d) => d.total))
  const yMax = maxTotal * 1.1 || 1

  const barGroupW = innerW / barData.length
  const barW = Math.min(barGroupW * 0.65, 48)

  const tickCount = 4
  const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => (yMax * i) / tickCount)

  function xCenter(i: number) {
    return PAD.left + barGroupW * i + barGroupW / 2
  }
  function yPos(v: number) {
    return PAD.top + innerH - (v / yMax) * innerH
  }
  function barH(v: number) {
    return (v / yMax) * innerH
  }

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const svgX = ((e.clientX - rect.left) / rect.width) * chartW
      const idx = Math.floor((svgX - PAD.left) / barGroupW)
      const clamped = Math.max(0, Math.min(barData.length - 1, idx))
      const d = barData[clamped]
      if (!d) return
      setTooltip({
        x: xCenter(clamped),
        year: d.year,
        values: SERIES.map((s, si) => ({ label: s.label, color: s.color, value: d.values[si] })),
      })
    },
    [barData, barGroupW],
  )

  return (
    <div>
      {/* Legend */}
      <div className="flex items-center gap-4 mb-1 flex-wrap" style={{ paddingLeft: PAD.left }}>
        {SERIES.map((s) => (
          <span key={s.key as string} className="flex items-center gap-1.5" style={{ fontSize: 10.5, color: 'var(--text-2)' }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, backgroundColor: s.color, borderRadius: 1 }} />
            {s.label}
          </span>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${chartW} ${chartH}`}
        style={{ width: '100%', height: chartH, display: 'block', overflow: 'visible' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Grid + Y ticks */}
        {yTicks.map((v, i) => (
          <g key={i}>
            <line
              x1={PAD.left} y1={yPos(v)} x2={PAD.left + innerW} y2={yPos(v)}
              stroke="var(--border)" strokeWidth={1} strokeDasharray="2 4"
            />
            <text x={PAD.left - 4} y={yPos(v) + 3.5} textAnchor="end" fontSize={9} fill="var(--muted)">
              £{Math.round(v)}m
            </text>
          </g>
        ))}

        {/* X axis */}
        <line x1={PAD.left} y1={PAD.top + innerH} x2={PAD.left + innerW} y2={PAD.top + innerH} stroke="var(--border)" strokeWidth={1} />

        {/* Bars */}
        {barData.map((d, i) => {
          let cumulative = 0
          return (
            <g key={i}>
              {SERIES.map((s, si) => {
                const val = d.values[si]
                const bh = barH(val)
                const by = yPos(cumulative + val)
                cumulative += val
                return (
                  <rect
                    key={si}
                    x={xCenter(i) - barW / 2}
                    y={by}
                    width={barW}
                    height={bh}
                    fill={s.color}
                    opacity={tooltip?.year === d.year ? 1 : 0.85}
                  />
                )
              })}
              <text x={xCenter(i)} y={PAD.top + innerH + 14} textAnchor="middle" fontSize={9} fill="var(--muted)">
                {d.year}
              </text>
            </g>
          )
        })}

        {/* Tooltip */}
        {tooltip && (
          <>
            <line x1={tooltip.x} y1={PAD.top} x2={tooltip.x} y2={PAD.top + innerH} stroke="var(--border-strong)" strokeWidth={1} strokeDasharray="2 3" />
            <foreignObject
              x={tooltip.x + 8 > chartW - 130 ? tooltip.x - 130 : tooltip.x + 8}
              y={PAD.top}
              width={122}
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
                {tooltip.values.map((v) => (
                  <div key={v.label} style={{ color: v.color, marginBottom: 2 }}>
                    {v.label}: <span style={{ fontWeight: 600 }}>£{v.value.toLocaleString()}m</span>
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
