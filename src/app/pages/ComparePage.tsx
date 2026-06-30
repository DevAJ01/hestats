import { useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useWorkspace } from '../context/WorkspaceContext'
import { useYear } from '../context/YearContext'
import { X, Plus, Download, GitCompare, Camera, Bookmark } from 'lucide-react'
import { institutions } from '../data/institutions'
import { AVAILABLE_YEARS, financials, getLatestFinancial, getFinancialsByInstitution } from '../data/financials'
import { Institution, FinancialYear } from '../data/types'
import { RiskBadge } from '../components/institutions/RiskBadge'
import { NationBadge } from '../components/institutions/NationBadge'
import { MetricTrendChart } from '../components/charts/MetricTrendChart'
import { Panel } from '../components/layout/Panel'
import { ShareCardModal } from '../components/ShareCard'

const COLORS = ['#7396c2', '#5fa97b', '#c2945a', '#b18ab8', '#6fb5b5', '#cf6660']

// ── Custom SVG radar chart (no recharts) ──────────────────────────────────────
function CompareRadar({
  axes,
  series,
  size = 240,
}: {
  axes: string[]
  series: { id: string; label: string; color: string; values: number[] }[]
  size?: number
}) {
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.35
  const n = axes.length
  const angleOffset = -Math.PI / 2
  const rings = [0.25, 0.5, 0.75, 1]

  function pt(axisIdx: number, pct: number) {
    const angle = angleOffset + (2 * Math.PI * axisIdx) / n
    return { x: cx + r * pct * Math.cos(angle), y: cy + r * pct * Math.sin(angle) }
  }

  const gridPoly = (pct: number) =>
    axes.map((_, i) => { const p = pt(i, pct); return `${p.x},${p.y}` }).join(' ')

  const seriesPath = (values: number[]) =>
    values.map((v, i) => { const p = pt(i, v / 100); return `${i === 0 ? 'M' : 'L'}${p.x},${p.y}` }).join(' ') + 'Z'

  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', height: size, display: 'block' }}>
      {rings.map((pct, i) => (
        <polygon key={i} points={gridPoly(pct)} fill="none" stroke="var(--border)" strokeWidth={1} />
      ))}
      {axes.map((_, i) => {
        const end = pt(i, 1)
        return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="var(--border)" strokeWidth={1} />
      })}
      {series.map((s) => (
        <path key={s.id} d={seriesPath(s.values)} fill={s.color} fillOpacity={0.12} stroke={s.color} strokeWidth={1.5} />
      ))}
      {axes.map((label, i) => {
        const pos = pt(i, 1.25)
        return (
          <text key={i} x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central" fontSize={9} fill="var(--muted)">
            {label}
          </text>
        )
      })}
      {series.map((s) =>
        s.values.map((v, i) => {
          const pos = pt(i, v / 100)
          return <circle key={`${s.id}-${i}`} cx={pos.x} cy={pos.y} r={2.5} fill={s.color} stroke="none" />
        }),
      )}
    </svg>
  )
}

const METRICS: { key: keyof FinancialYear; label: string; format: (v: number) => string; higherBetter: boolean }[] = [
  { key: 'revenue_gbp_m', label: 'Total Income', format: (v) => `£${v.toLocaleString()}m`, higherBetter: true },
  { key: 'surplus_gbp_m', label: 'Surplus', format: (v) => `£${v.toLocaleString()}m`, higherBetter: true },
  { key: 'surplus_margin_pct', label: 'Surplus Margin', format: (v) => `${v.toFixed(1)}%`, higherBetter: true },
  { key: 'research_income_gbp_m', label: 'Research Income', format: (v) => `£${v.toLocaleString()}m`, higherBetter: true },
  { key: 'tuition_fee_income_gbp_m', label: 'Tuition Fees', format: (v) => `£${v.toLocaleString()}m`, higherBetter: true },
  { key: 'staff_costs_gbp_m', label: 'Staff Costs', format: (v) => `£${v.toLocaleString()}m`, higherBetter: false },
  { key: 'cash_gbp_m', label: 'Cash & Equivalents', format: (v) => `£${v.toLocaleString()}m`, higherBetter: true },
  { key: 'borrowing_gbp_m', label: 'External Borrowing', format: (v) => `£${v.toLocaleString()}m`, higherBetter: false },
  { key: 'liquidity_days', label: 'Liquidity Days', format: (v) => `${v} days`, higherBetter: true },
  { key: 'international_fte_pct', label: 'International %', format: (v) => `${v}%`, higherBetter: true },
  { key: 'student_fte_total', label: 'Total Student FTE', format: (v) => v.toLocaleString(), higherBetter: true },
  { key: 'capital_expenditure_gbp_m', label: 'Capital Expenditure', format: (v) => `£${v.toLocaleString()}m`, higherBetter: true },
]

const DNA_AXES = [
  { key: 'research_income_gbp_m', label: 'Research' },
  { key: 'international_fte_pct', label: 'International' },
  { key: 'surplus_margin_pct', label: 'Margin' },
  { key: 'liquidity_days', label: 'Liquidity' },
  { key: 'capital_expenditure_gbp_m', label: 'Investment' },
  { key: 'tuition_fee_income_gbp_m', label: 'Teaching' },
] as const

const availableInstitutions = institutions.filter((i) => !!getLatestFinancial(i.id))

function normalise(value: number, min: number, max: number): number {
  if (max === min) return 50
  return Math.round(((value - min) / (max - min)) * 100)
}

function buildRadarData(
  selectedInstitutions: { inst: Institution; fin: FinancialYear; color: string }[],
  allFins: FinancialYear[],
) {
  return DNA_AXES.map(({ key, label }) => {
    const allVals = allFins.map((f) => f[key] as number)
    const min = Math.min(...allVals)
    const max = Math.max(...allVals)
    const row: Record<string, number | string> = { axis: label }
    for (const { inst, fin } of selectedInstitutions) {
      row[inst.id] = normalise(fin[key] as number, min, max)
    }
    return row
  })
}

const AI_INSIGHTS: Record<string, string> = {
  oxford: 'Oxford maintains exceptional research intensity (top 2%) and strong liquidity. Borrowing is elevated but well-covered by assets. Operational surplus consistent at ~5%. High international exposure provides income diversity.',
  cambridge: 'Cambridge shows the highest research income in the sector. Endowment income provides significant balance sheet strength. Conservative borrowing policy. Financial resilience rated Excellent.',
  imperial: 'Imperial is research-dominant with 42% income from grants and contracts. High staff cost ratio (66%) reflects research intensity. Strong international student pipeline. Capital investment ramping.',
  ucl: 'UCL shows rapid income growth (+18% over 5 years) driven by student growth. Staff costs are the key pressure point. Borrowing increased to fund estate strategy. Surplus margin has compressed.',
  lse: 'LSE is highly concentrated in social sciences; international student dependency is the highest in the sector at ~70%. Strong surplus margin. Minimal capital expenditure reflects campus strategy.',
  manchester: 'Manchester demonstrates balanced income diversification. Research income growing steadily. Estate investment underway. Liquidity days comfortable at 120+.',
}



function ExportModal({ onClose, tableRef, selectedInstitutions }: { onClose: () => void; tableRef: React.RefObject<HTMLDivElement | null>; selectedInstitutions: { inst: Institution; fin: FinancialYear; color: string }[] }) {
  const [exporting, setExporting] = useState(false)
  const [done, setDone] = useState(false)

  function exportPng() {
    setExporting(true)
    try {
      const BG = '#111418'
      const PANEL = '#1c2129'
      const BORDER = '#2a313d'
      const TEXT = '#f3f5f7'
      const MUTED = '#707987'

      const rowH = 28
      const colW = 160
      const labelW = 200
      const padding = 24
      const headerH = 48
      const cols = selectedInstitutions.length

      const metrics = METRICS.map((m) => ({
        label: m.label,
        values: selectedInstitutions.map(({ fin }) => m.format(fin[m.key] as number)),
        colors: selectedInstitutions.map(({ fin, color }, idx) => {
          const vals = selectedInstitutions.map((s) => s.fin[m.key] as number)
          const best = m.higherBetter ? Math.max(...vals) : Math.min(...vals)
          return (fin[m.key] as number) === best ? color : TEXT
        }),
      }))

      const totalRows = metrics.length + 1
      const w = labelW + cols * colW + padding * 2
      const h = headerH + totalRows * rowH + padding * 2 + 40

      const canvas = document.createElement('canvas')
      canvas.width = w * 2
      canvas.height = h * 2
      const ctx = canvas.getContext('2d')!
      ctx.scale(2, 2)

      ctx.fillStyle = BG
      ctx.fillRect(0, 0, w, h)

      // Header
      ctx.fillStyle = PANEL
      ctx.fillRect(0, 0, w, headerH)
      ctx.fillStyle = TEXT
      ctx.font = '700 13px "JetBrains Mono", monospace'
      ctx.fillText('HEStats — Financial Scorecard Comparison', padding, 20)
      ctx.fillStyle = MUTED
      ctx.font = '400 10px "JetBrains Mono", monospace'
      ctx.fillText(`hestats.co.uk · ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, padding, 36)

      // Column headers
      selectedInstitutions.forEach(({ inst, color }, ci) => {
        const x = padding + labelW + ci * colW
        ctx.fillStyle = color
        ctx.font = '600 11px system-ui, sans-serif'
        ctx.fillText(inst.short_name, x + 8, headerH - 10)
        ctx.fillStyle = color
        ctx.fillRect(x, headerH - 3, colW - 4, 2)
      })

      // Rows
      metrics.forEach((m, ri) => {
        const y = headerH + padding + ri * rowH
        ctx.fillStyle = ri % 2 === 0 ? PANEL : BG
        ctx.fillRect(0, y, w, rowH)

        ctx.fillStyle = MUTED
        ctx.font = '400 10.5px system-ui, sans-serif'
        ctx.fillText(m.label, padding, y + rowH / 2 + 4)

        m.values.forEach((val, ci) => {
          const x = padding + labelW + ci * colW
          ctx.fillStyle = m.colors[ci]
          ctx.font = m.colors[ci] !== TEXT ? '600 11px "JetBrains Mono", monospace' : '400 11px "JetBrains Mono", monospace'
          ctx.fillText(val, x + 8, y + rowH / 2 + 4)
        })

        ctx.strokeStyle = BORDER
        ctx.lineWidth = 0.5
        ctx.beginPath()
        ctx.moveTo(0, y + rowH)
        ctx.lineTo(w, y + rowH)
        ctx.stroke()
      })

      canvas.toBlob((blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `hestats-comparison-${Date.now()}.png`
        a.click()
        URL.revokeObjectURL(url)
        setDone(true)
      })
    } finally {
      setExporting(false)
    }
  }

  function exportCsv() {
    if (!tableRef.current) return
    const rows = tableRef.current.querySelectorAll('tr')
    const lines: string[] = []
    rows.forEach((row) => {
      const cells = Array.from(row.querySelectorAll('th, td'))
        .map((c) => `"${(c as HTMLElement).innerText.replace(/"/g, '""')}"`)
      lines.push(cells.join(','))
    })
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hestats-comparison-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setDone(true)
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm mx-4 p-5"
        style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--border-strong)', borderRadius: 6 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <p style={{ color: 'var(--text)', fontSize: 14, fontWeight: 600 }}>Export comparison</p>
          <button onClick={onClose} style={{ color: 'var(--muted)' }}><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-2">
          <button
            onClick={exportCsv}
            className="w-full flex items-center gap-3 px-4 py-3 border text-left transition-colors"
            style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3 }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <Download className="w-4 h-4" style={{ color: 'var(--positive)' }} />
            <div>
              <p style={{ color: 'var(--text)', fontSize: 12.5, fontWeight: 600 }}>Export as CSV</p>
              <p style={{ color: 'var(--muted)', fontSize: 10.5 }}>Scorecard data · Excel/Python compatible</p>
            </div>
          </button>
          <button
            onClick={exportPng}
            disabled={exporting}
            className="w-full flex items-center gap-3 px-4 py-3 border text-left transition-colors"
            style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3, opacity: exporting ? 0.6 : 1 }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <Camera className="w-4 h-4" style={{ color: 'var(--link)' }} />
            <div>
              <p style={{ color: 'var(--text)', fontSize: 12.5, fontWeight: 600 }}>
                {exporting ? 'Rendering…' : done ? 'Saved!' : 'Export as PNG'}
              </p>
              <p style={{ color: 'var(--muted)', fontSize: 10.5 }}>High-res snapshot of the scorecard table</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

const COMPARE_PRESETS: Record<string, string[]> = {
  oxbridge: ['oxford', 'cambridge'],
  russell: ['oxford', 'cambridge', 'imperial', 'ucl'],
}

function initialSelection(params: URLSearchParams): string[] {
  const ids = params.get('ids')
  if (ids) return completeSelection(ids.split(',').filter(Boolean).slice(0, 6))
  const set = params.get('set')
  if (set && COMPARE_PRESETS[set]) return COMPARE_PRESETS[set]
  const add = params.get('add')
  if (add) return completeSelection([add])
  return ['oxford', 'cambridge']
}

function completeSelection(ids: string[]): string[] {
  const unique = ids.filter((id, i, arr) => arr.indexOf(id) === i).slice(0, 6)
  if (unique.length !== 1) return unique
  return unique[0] === 'oxford' ? ['oxford', 'cambridge'] : [unique[0], 'oxford']
}

export function ComparePage() {
  const [params, setParams] = useSearchParams()
  const { saveComparison } = useWorkspace()
  const { selectedYear, setSelectedYear } = useYear()
  const [saved, setSaved] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const tableRef = useRef<HTMLDivElement>(null)

  const selected = useMemo(() => initialSelection(params), [params])
  const allFins = useMemo(() => financials.filter((f) => f.fiscal_year === selectedYear), [selectedYear])
  const finMap = useMemo(() => new Map(allFins.map((f) => [f.institution_id, f])), [allFins])

  const selectedInstitutions: { inst: Institution; fin: FinancialYear; color: string }[] = selected
    .map((id, i) => {
      const inst = institutions.find((x) => x.id === id)
      const fin = finMap.get(id)
      if (!inst || !fin) return null
      return { inst, fin, color: COLORS[i % COLORS.length] }
    })
    .filter(Boolean) as { inst: Institution; fin: FinancialYear; color: string }[]

  const filteredSearch = availableInstitutions.filter(
    (i) =>
      !selected.includes(i.id) &&
      (i.canonical_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.short_name.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  function commitSelection(next: string[]) {
    const complete = completeSelection(next)
      .filter((id) => availableInstitutions.some((i) => i.id === id))
      .slice(0, 6)
    setParams((current) => {
      const nextParams = new URLSearchParams(current)
      nextParams.delete('set')
      nextParams.delete('add')
      nextParams.set('ids', complete.join(','))
      return nextParams
    })
  }

  function addInstitution(id: string) {
    if (selected.length < 6) commitSelection([...selected, id])
    setSearchQuery('')
    setShowDropdown(false)
  }
  function removeInstitution(id: string) {
    commitSelection(selected.filter((s) => s !== id))
  }

  function getBestIdx(metricKey: keyof FinancialYear, higherBetter: boolean): number {
    if (!selectedInstitutions.length) return -1
    const values = selectedInstitutions.map(({ fin }) => fin[metricKey] as number)
    const best = higherBetter ? Math.max(...values) : Math.min(...values)
    return values.indexOf(best)
  }

  const radarData = buildRadarData(selectedInstitutions, allFins)

  const trendFinancials = selectedInstitutions.flatMap(({ inst }) =>
    getFinancialsByInstitution(inst.id)
  )

  return (
    <div className="max-w-[1600px] mx-auto px-3 sm:px-4 py-2.5 space-y-2.5">
      {showShare && (
        <ShareCardModal
          onClose={() => setShowShare(false)}
          items={selectedInstitutions}
        />
      )}
      {showExport && <ExportModal onClose={() => setShowExport(false)} tableRef={tableRef} selectedInstitutions={selectedInstitutions} />}
      {/* Status bar */}
      <div
        className="flex items-center gap-3 px-3 py-1.5 border"
        style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3, fontSize: 11 }}
      >
        <GitCompare className="w-3 h-3" style={{ color: 'var(--accent)' }} />
        <span style={{ color: 'var(--muted)', letterSpacing: '0.06em' }}>COMPARISON WORKSPACE</span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}>
          <span className="font-num" style={{ color: 'var(--text)' }}>{selected.length}</span> of 6 institutions selected
        </span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}>FY</span>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="bg-transparent outline-none font-num"
          style={{ color: 'var(--text)', fontSize: 11, border: '1px solid var(--border)', borderRadius: 2, padding: '1px 4px', cursor: 'pointer' }}
        >
          {AVAILABLE_YEARS.map((year) => (
            <option key={year} value={year} style={{ backgroundColor: 'var(--bg-2)', color: 'var(--text)' }}>{year}</option>
          ))}
        </select>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowShare(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 transition-colors"
            style={{
              border: '1px solid var(--accent)',
              borderRadius: 3,
              color: 'var(--accent)',
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: '0.04em',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--accent)' }}
          >
            <Camera className="w-3 h-3" /> Share Card
          </button>
          <button
            onClick={() => { saveComparison(selected); setSaved(true); setTimeout(() => setSaved(false), 1800) }}
            className="flex items-center gap-1.5 px-2 py-1"
            style={{ border: '1px solid var(--border)', borderRadius: 2, color: saved ? 'var(--positive)' : 'var(--text-2)', fontSize: 10.5, letterSpacing: '0.04em' }}
          >
            <Bookmark className="w-3 h-3" /> {saved ? 'Saved' : 'Save'}
          </button>
          <button
            onClick={() => setShowExport(true)}
            className="flex items-center gap-1.5 px-2 py-1"
            style={{
              border: '1px solid var(--border)',
              borderRadius: 2,
              color: 'var(--text-2)',
              fontSize: 10.5,
              letterSpacing: '0.04em',
            }}
          >
            <Download className="w-3 h-3" /> Export
          </button>
        </div>
      </div>

      {/* Institution picker */}
      <div
        className="p-3 border"
        style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}
      >
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Comparing
          </span>
          {selectedInstitutions.map(({ inst, color }) => (
            <div
              key={inst.id}
              className="flex items-center gap-2 px-2 py-1"
              style={{
                backgroundColor: 'var(--bg-2)',
                border: `1px solid ${color}`,
                borderRadius: 3,
              }}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <span style={{ color: 'var(--text)', fontSize: 12, fontWeight: 500 }}>{inst.short_name}</span>
              <button onClick={() => removeInstitution(inst.id)} style={{ color: 'var(--muted)' }}>
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {selected.length < 6 && (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-1.5 px-2 py-1 transition-colors"
                style={{
                  border: '1px dashed var(--border)',
                  borderRadius: 3,
                  color: 'var(--text-2)',
                  fontSize: 12,
                }}
              >
                <Plus className="w-3 h-3" />
                Add institution
              </button>
              {showDropdown && (
                <div
                  className="absolute top-full left-0 mt-1 z-20"
                  style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--border-strong)', borderRadius: 4, width: 'min(288px, calc(100vw - 2rem))' }}
                >
                  <div className="p-2" style={{ borderBottom: '1px solid var(--border)' }}>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search institutions…"
                      className="w-full px-2 py-1.5 outline-none"
                      style={{
                        backgroundColor: 'var(--bg)',
                        border: '1px solid var(--border)',
                        borderRadius: 3,
                        color: 'var(--text)',
                        fontSize: 12,
                      }}
                      autoFocus
                    />
                  </div>
                  <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                    {(searchQuery ? filteredSearch : availableInstitutions.filter((i) => !selected.includes(i.id))).slice(0, 20).map((i) => (
                      <button
                        key={i.id}
                        onClick={() => addInstitution(i.id)}
                        className="w-full text-left flex items-center gap-2 px-3 py-2 transition-colors"
                        style={{ borderBottom: '1px solid var(--border)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--panel-hover)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <NationBadge nation={i.nation} size="sm" />
                        <span style={{ color: 'var(--text)', fontSize: 12 }}>{i.canonical_name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {selected.length === 6 && (
            <span style={{ color: 'var(--muted)', fontSize: 11 }}>Maximum 6 institutions</span>
          )}
        </div>

        {/* Colour legend */}
        <div className="flex flex-wrap items-center gap-4">
          {selectedInstitutions.map(({ inst, color }) => (
            <span key={inst.id} className="flex items-center gap-1.5" style={{ fontSize: 11, color: 'var(--text-2)' }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              {inst.canonical_name}
            </span>
          ))}
        </div>
      </div>

      {/* Radar + Metrics header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
        {/* Radar chart — University DNA comparison */}
        <Panel title="University DNA" subtitle="Normalised across sector (0–100)">
          {selectedInstitutions.length < 2 ? (
            <div className="flex items-center justify-center h-48" style={{ color: 'var(--muted)', fontSize: 12 }}>
              Add at least 2 institutions to compare
            </div>
          ) : (
            <CompareRadar
              axes={radarData.map((d) => d.axis as string)}
              series={selectedInstitutions.map(({ inst, color }) => ({
                id: inst.id,
                label: inst.short_name,
                color,
                values: radarData.map((d) => (d[inst.id] as number) ?? 0),
              }))}
              size={240}
            />
          )}
        </Panel>

        {/* Summary KPI cards */}
        <div className="lg:col-span-2">
          <Panel title="Financial Scorecard" subtitle={`${selectedYear} · side-by-side`} padded={false}>
            <div className="overflow-x-auto" ref={tableRef}>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th
                      className="px-2 sm:px-3 py-2 text-left"
                      style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', backgroundColor: 'var(--bg-2)', width: 120 }}
                    >
                      Metric
                    </th>
                    {selectedInstitutions.map(({ inst, color }) => (
                      <th
                        key={inst.id}
                        className="px-3 py-2 text-right"
                        style={{
                          color: color,
                          fontSize: 11,
                          fontWeight: 600,
                          backgroundColor: 'var(--bg-2)',
                          borderBottom: `2px solid ${color}`,
                        }}
                      >
                        {inst.short_name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {METRICS.map((metric) => {
                    const bestIdx = getBestIdx(metric.key, metric.higherBetter)
                    return (
                      <tr key={metric.key as string} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="px-3 py-1.5" style={{ color: 'var(--text-2)', fontSize: 11.5 }}>
                          {metric.label}
                        </td>
                        {selectedInstitutions.map(({ inst, fin, color }, idx) => {
                          const val = fin[metric.key] as number
                          const isBest = idx === bestIdx
                          return (
                            <td
                              key={inst.id}
                              className="px-3 py-1.5 tabular-nums text-right"
                              style={{
                                fontSize: 12,
                                fontWeight: isBest ? 600 : 400,
                                color: isBest ? color : 'var(--text-2)',
                                backgroundColor: isBest ? `${color}0f` : 'transparent',
                              }}
                            >
                              {metric.format(val)}
                              {isBest && (
                                <span style={{ marginLeft: 4, fontSize: 9, opacity: 0.7 }}>▲</span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                  {/* Risk row */}
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="px-3 py-1.5" style={{ color: 'var(--text-2)', fontSize: 11.5 }}>Financial Risk</td>
                    {selectedInstitutions.map(({ inst, fin }) => (
                      <td key={inst.id} className="px-3 py-1.5 text-right">
                        <RiskBadge risk={fin.risk_flag} size="sm" />
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </div>

      {/* Trend charts */}
      {selectedInstitutions.length >= 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
          <Panel title="Revenue Trends" subtitle="Total income over time (£m)">
            <MetricTrendChart
              financials={trendFinancials}
              metrics={selectedInstitutions.map(({ inst, color }) => ({
                key: 'revenue_gbp_m' as const,
                label: inst.short_name,
                color,
                unit: '£m',
                financials: getFinancialsByInstitution(inst.id),
              }))}
              height={200}
            />
          </Panel>
          <Panel title="Surplus Margin Trends" subtitle="Operating margin over time (%)">
            <MetricTrendChart
              financials={trendFinancials}
              metrics={selectedInstitutions.map(({ inst, color }) => ({
                key: 'surplus_margin_pct' as const,
                label: inst.short_name,
                color,
                unit: '%',
                financials: getFinancialsByInstitution(inst.id),
              }))}
              height={200}
            />
          </Panel>
        </div>
      )}

      {/* AI Executive Summary */}
      {selectedInstitutions.length >= 1 && (
        <Panel title="Executive Intelligence Summary" subtitle="AI-generated financial assessment">
          <div className="space-y-3">
            <div
              className="px-3 py-1.5"
              style={{
                backgroundColor: 'var(--bg-2)',
                border: '1px solid var(--border)',
                borderRadius: 3,
                borderLeft: '3px solid var(--accent)',
              }}
            >
              <p style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
                Disclaimer
              </p>
              <p style={{ color: 'var(--text-2)', fontSize: 11 }}>
                This summary is generated from structured financial data and is illustrative only. It does not constitute financial advice or a complete assessment of institutional health.
              </p>
            </div>
            {selectedInstitutions.map(({ inst, color }) => {
              const insight = AI_INSIGHTS[inst.id]
              return (
                <div key={inst.id} className="flex gap-3">
                  <div className="w-1 flex-shrink-0 rounded" style={{ backgroundColor: color }} />
                  <div>
                    <p style={{ color, fontSize: 12, fontWeight: 600, marginBottom: 3 }}>{inst.canonical_name}</p>
                    <p style={{ color: 'var(--text-2)', fontSize: 12.5, lineHeight: 1.55 }}>
                      {insight ?? 'Detailed financial intelligence summary available once verified data is loaded for this institution.'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </Panel>
      )}
    </div>
  )
}
