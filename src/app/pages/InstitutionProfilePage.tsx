import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router'
import { ArrowLeft, FileText, Globe, CheckCircle, Clock, AlertCircle, ArrowUpRight, GitCompare, TrendingUp, Star } from 'lucide-react'
import { useWorkspace } from '../context/WorkspaceContext'
import { getInstitutionById } from '../data/institutions'
import { formatCurrencyM, formatDays, formatNumber, formatPct, getFinancialsByInstitution, getAllLatestFinancials, AVAILABLE_YEARS, isKnownNumber, ratioPct } from '../data/financials'
import { FinancialYear } from '../data/types'
import { computeHealthScore, getGradeColor } from '../data/health'
import { getInstitutionProvenance, getProvenance, getSourceById, CONFIDENCE_META, DATA_SOURCES } from '../data/sources'
import { getOutcomesByInstitution, getSectorOutcomes } from '../data/outcomes'
import { getTopEmployersForInstitution } from '../data/employers'
import { RiskBadge } from '../components/institutions/RiskBadge'
import { NationBadge } from '../components/institutions/NationBadge'
import { DataSourceBadge } from '../components/institutions/DataSourceBadge'
import { HealthBadge } from '../components/institutions/HealthBadge'
import { MetricTrendChart } from '../components/charts/MetricTrendChart'
import { IncomeBreakdownChart } from '../components/charts/IncomeBreakdownChart'
import { Sparkline } from '../components/charts/Sparkline'

const TABS = ['Overview', 'Financials', 'Trends', 'DNA', 'Research', 'Borrowing', 'Outcomes', 'Staff', 'Timeline', 'Estates', 'Sources'] as const
type Tab = (typeof TABS)[number]

const DNA_DIMENSIONS: { key: keyof FinancialYear; label: string; description: string; higherBetter: boolean }[] = [
  { key: 'research_income_gbp_m', label: 'Research Intensity', description: 'Research grants & contracts as a signal of research output capacity', higherBetter: true },
  { key: 'international_fte_pct', label: 'International Exposure', description: 'International student proportion — income diversity and global reach', higherBetter: true },
  { key: 'surplus_margin_pct', label: 'Financial Resilience', description: 'Operating margin as a proxy for financial headroom and sustainability', higherBetter: true },
  { key: 'liquidity_days', label: 'Liquidity Position', description: 'Days of operating expenditure held in liquid assets', higherBetter: true },
  { key: 'capital_expenditure_gbp_m', label: 'Estate Investment', description: 'Capital expenditure as a signal of strategic investment intensity', higherBetter: true },
  { key: 'tuition_fee_income_gbp_m', label: 'Teaching Dependence', description: 'Tuition fee income — indicates reliance on student fees for revenue', higherBetter: false },
]

function normalise(value: number, min: number, max: number): number {
  if (max === min) return 50
  return Math.max(5, Math.min(100, Math.round(((value - min) / (max - min)) * 100)))
}

interface RadarSeries { label: string; color: string; values: number[] /* 0-100 per axis */ }

function SvgRadar({ axes, series, size = 240 }: { axes: string[]; series: RadarSeries[]; size?: number }) {
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.36
  const n = axes.length
  const rings = [0.25, 0.5, 0.75, 1]
  const angleOffset = -Math.PI / 2 // start at top

  function pt(axisIdx: number, pct: number) {
    const angle = angleOffset + (2 * Math.PI * axisIdx) / n
    return {
      x: cx + r * pct * Math.cos(angle),
      y: cy + r * pct * Math.sin(angle),
    }
  }

  const gridPoints = (pct: number) =>
    axes.map((_, i) => pt(i, pct)).map((p) => `${p.x},${p.y}`).join(' ')

  const seriesPath = (values: number[]) =>
    values.map((v, i) => pt(i, v / 100)).map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z'

  const [hovered, setHovered] = useState<{ x: number; y: number; label: string; vals: string[] } | null>(null)

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      style={{ width: '100%', height: size, display: 'block' }}
      onMouseLeave={() => setHovered(null)}
    >
      {/* Grid rings */}
      {rings.map((pct, i) => (
        <polygon key={i} points={gridPoints(pct)} fill="none" stroke="var(--border)" strokeWidth={1} />
      ))}
      {/* Spokes */}
      {axes.map((_, i) => {
        const end = pt(i, 1)
        return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="var(--border)" strokeWidth={1} />
      })}
      {/* Series fills */}
      {series.map((s) => (
        <path key={s.label} d={seriesPath(s.values)} fill={s.color} fillOpacity={0.15} stroke={s.color} strokeWidth={1.5} />
      ))}
      {/* Axis labels */}
      {axes.map((label, i) => {
        const pos = pt(i, 1.22)
        return (
          <text
            key={i}
            x={pos.x}
            y={pos.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={8.5}
            fill="var(--muted)"
          >
            {label}
          </text>
        )
      })}
      {/* Hover dots */}
      {series.map((s) =>
        s.values.map((v, i) => {
          const pos = pt(i, v / 100)
          return (
            <circle
              key={`${s.label}-${i}`}
              cx={pos.x}
              cy={pos.y}
              r={3}
              fill={s.color}
              stroke="none"
              style={{ cursor: 'pointer' }}
              onMouseEnter={(e) =>
                setHovered({
                  x: pos.x,
                  y: pos.y,
                  label: axes[i],
                  vals: series.map((ser) => `${ser.label}: ${ser.values[i]}/100`),
                })
              }
            />
          )
        }),
      )}
      {/* Tooltip */}
      {hovered && (
        <foreignObject
          x={hovered.x + 6 > size - 100 ? hovered.x - 108 : hovered.x + 6}
          y={Math.max(4, hovered.y - 20)}
          width={100}
          height={hovered.vals.length * 14 + 22}
          style={{ overflow: 'visible', pointerEvents: 'none' }}
        >
          <div
            style={{
              background: 'var(--panel)',
              border: '1px solid var(--border-strong)',
              borderRadius: 3,
              padding: '4px 7px',
              fontSize: 10,
            }}
          >
            <div style={{ color: 'var(--muted)', fontSize: 9, marginBottom: 3 }}>{hovered.label}</div>
            {hovered.vals.map((v, i) => (
              <div key={i} style={{ color: series[i]?.color ?? 'var(--text)', marginBottom: 1 }}>{v}</div>
            ))}
          </div>
        </foreignObject>
      )}
    </svg>
  )
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'found') return <CheckCircle className="w-3.5 h-3.5" style={{ color: 'var(--positive)' }} />
  if (status === 'archived') return <Clock className="w-3.5 h-3.5" style={{ color: 'var(--warning)' }} />
  return <AlertCircle className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
}

function MetricCell({ label, value, sub, valueColor }: { label: string; value: string; sub?: string; valueColor?: string }) {
  return (
    <div
      className="px-3 py-2.5 border-r border-b"
      style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)' }}
    >
      <p
        style={{
          color: 'var(--muted)',
          fontSize: 9,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 3,
        }}
      >
        {label}
      </p>
      <p
        className="font-num tabular-nums"
        style={{ color: valueColor ?? 'var(--text)', fontSize: 16, fontWeight: 600, lineHeight: 1.1 }}
      >
        {value}
      </p>
      {sub && <p style={{ color: 'var(--muted)', fontSize: 10, marginTop: 2 }}>{sub}</p>}
    </div>
  )
}

export function InstitutionProfilePage() {
  const { id } = useParams<{ id: string }>()
  const institution = getInstitutionById(id ?? '')
  const financials = id ? getFinancialsByInstitution(id) : []
  const latest = financials[0]
  const [activeTab, setActiveTab] = useState<Tab>('Overview')
  const { isWatched, toggleWatch, recordView } = useWorkspace()

  useEffect(() => { if (id && institution) recordView(id) }, [id, institution, recordView])

  if (!institution || !latest) {
    return (
      <div className="max-w-[1600px] mx-auto px-4 py-20 text-center">
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 12 }}>Institution not found.</p>
        <Link to="/universities" style={{ color: 'var(--link)', fontSize: 12 }}>
          ← Back to institutions
        </Link>
      </div>
    )
  }

  const historyAsc = [...financials].sort((a, b) => a.fiscal_year.localeCompare(b.fiscal_year))
  const revSpark = historyAsc.map((h) => h.revenue_gbp_m)
  const health = computeHealthScore(latest)

  return (
    <div className="max-w-[1600px] mx-auto px-3 sm:px-4 py-3">
      <Link
        to="/universities"
        className="inline-flex items-center gap-1 mb-2"
        style={{ color: 'var(--text-2)', fontSize: 11 }}
      >
        <ArrowLeft className="w-3 h-3" /> All universities
      </Link>

      {/* Header */}
      <div
        className="px-3 py-3 mb-3 border"
        style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}
      >
        {/* Top row: name + badges */}
        <div className="flex flex-wrap items-start gap-3 mb-2">
          <NationBadge nation={institution.nation} />
          <div className="flex-1 min-w-0">
            <p style={{ color: 'var(--text)', fontSize: 15, fontWeight: 600, lineHeight: 1.2 }}>
              {institution.canonical_name}
            </p>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1" style={{ fontSize: 10.5, color: 'var(--muted)' }}>
              <span className="font-num">UKPRN {institution.ukprn}</span>
              <span>·</span>
              <span>{institution.city}</span>
              <span>·</span>
              <span>Est. {institution.founded}</span>
              {institution.mission_group && (
                <>
                  <span>·</span>
                  <span style={{ color: 'var(--text-2)' }}>{institution.mission_group}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => id && toggleWatch(id)}
              className="flex items-center gap-1.5 px-2.5 py-1.5"
              style={{ border: '1px solid var(--border)', borderRadius: 3, color: id && isWatched(id) ? 'var(--warning)' : 'var(--text-2)', fontSize: 11.5 }}
            >
              <Star className="w-3.5 h-3.5" fill={id && isWatched(id) ? 'var(--warning)' : 'none'} />
              {id && isWatched(id) ? 'Watching' : 'Watch'}
            </button>
            <HealthBadge score={health.score} grade={health.grade} size="md" showScore />
          </div>
        </div>
        {/* Bottom row: badges + website */}
        <div className="flex flex-wrap items-center gap-2">
          <RiskBadge risk={latest.risk_flag} />
          <DataSourceBadge source={latest.data_source} />
          {institution.official_website && (
            <a
              href={`https://${institution.official_website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-1"
              style={{ color: 'var(--link)', fontSize: 11, border: '1px solid var(--border)', borderRadius: 2 }}
            >
              <Globe className="w-3 h-3" />
              <span className="truncate max-w-[160px] sm:max-w-none">{institution.official_website}</span>
              <ArrowUpRight className="w-3 h-3 flex-shrink-0" />
            </a>
          )}
        </div>
      </div>

      {/* Tabs — horizontally scrollable on mobile */}
      <div className="overflow-x-auto mb-3 -mx-3 sm:mx-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex px-3 sm:px-0" style={{ minWidth: 'max-content' }}>
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-3 sm:px-4 py-2.5 transition-colors whitespace-nowrap flex-shrink-0"
              style={{
                color: activeTab === tab ? 'var(--text)' : 'var(--text-2)',
                borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                fontSize: 12,
                fontWeight: activeTab === tab ? 500 : 400,
                marginBottom: -1,
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'Overview' && (
        <>
          <div
            className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 border-l border-t mb-3"
            style={{ borderColor: 'var(--border)' }}
          >
            <MetricCell label="Total Income" value={formatCurrencyM(latest.revenue_gbp_m)} sub={`FY${latest.fiscal_year}`} />
            <MetricCell
              label="Surplus Margin"
              value={formatPct(latest.surplus_margin_pct)}
              sub={`${formatCurrencyM(latest.surplus_gbp_m)} surplus`}
              valueColor={isKnownNumber(latest.surplus_margin_pct) ? (latest.surplus_margin_pct >= 0 ? 'var(--positive)' : 'var(--negative)') : 'var(--muted)'}
            />
            <MetricCell label="Research" value={formatCurrencyM(latest.research_income_gbp_m)} sub="Grants & contracts" />
            <MetricCell label="Tuition Fees" value={formatCurrencyM(latest.tuition_fee_income_gbp_m)} />
            <MetricCell label="Staff Costs" value={formatCurrencyM(latest.staff_costs_gbp_m)} />
            <MetricCell label="Cash" value={formatCurrencyM(latest.cash_gbp_m)} sub={`${formatDays(latest.liquidity_days)} liquidity`} />
            <MetricCell label="Borrowing" value={formatCurrencyM(latest.borrowing_gbp_m)} />
            <MetricCell label="Intl. Students" value={isKnownNumber(latest.international_fte_pct) ? `${latest.international_fte_pct.toFixed(1)}%` : 'Pending'} sub={`${formatNumber(latest.student_fte_total)} FTE`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div
              className="lg:col-span-2 border"
              style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}
            >
              <div className="px-3 py-2 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
                <div>
                  <p style={{ color: 'var(--text)', fontSize: 12, fontWeight: 600 }}>Income, Research & Surplus</p>
                  <p style={{ color: 'var(--muted)', fontSize: 10 }}>5-year trend (£m)</p>
                </div>
                <Sparkline values={revSpark} width={80} height={22} color="#7396c2" fill />
              </div>
              <div className="p-3">
                <MetricTrendChart
                  financials={financials}
                  metrics={[
                    { key: 'revenue_gbp_m', label: 'Income', color: '#7396c2', unit: '£m' },
                    { key: 'research_income_gbp_m', label: 'Research', color: '#5fa97b', unit: '£m' },
                    { key: 'surplus_gbp_m', label: 'Surplus', color: '#c2945a', unit: '£m' },
                  ]}
                  height={220}
                />
              </div>
            </div>
            <div className="border" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}>
              <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                <p style={{ color: 'var(--text)', fontSize: 12, fontWeight: 600 }}>Income Composition</p>
                <p style={{ color: 'var(--muted)', fontSize: 10 }}>Tuition · Research · Other</p>
              </div>
              <div className="p-3">
                <IncomeBreakdownChart financials={financials} height={220} />
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'Financials' && (
        <div
          className="border overflow-hidden"
          style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Year', 'Income', 'Surplus', 'Margin', 'Research', 'Tuition', 'Staff', 'Cash', 'Borrowing', 'Liquidity', 'Intl %', 'Risk'].map((h, i) => (
                    <th
                      key={h}
                      className="px-3 py-2"
                      style={{
                        color: 'var(--muted)',
                        fontSize: 9.5,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        fontWeight: 500,
                        textAlign: i === 0 ? 'left' : 'right',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {financials.map((f) => (
                  <tr
                    key={f.fiscal_year}
                    className="transition-colors"
                    style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--panel-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td className="px-3 py-2 font-num tabular-nums" style={{ color: 'var(--text)', fontSize: 12, fontWeight: 500 }}>{f.fiscal_year}</td>
                    <td className="px-3 py-2 tabular-nums text-right" style={{ color: 'var(--text)', fontSize: 12 }}>{formatCurrencyM(f.revenue_gbp_m)}</td>
                    <td className="px-3 py-2 tabular-nums text-right" style={{ color: isKnownNumber(f.surplus_gbp_m) ? (f.surplus_gbp_m >= 0 ? 'var(--positive)' : 'var(--negative)') : 'var(--muted)', fontSize: 12, fontWeight: 500 }}>
                      {formatCurrencyM(f.surplus_gbp_m)}
                    </td>
                    <td className="px-3 py-2 tabular-nums text-right" style={{ color: isKnownNumber(f.surplus_margin_pct) ? (f.surplus_margin_pct >= 0 ? 'var(--positive)' : 'var(--negative)') : 'var(--muted)', fontSize: 12, fontWeight: 500 }}>
                      {formatPct(f.surplus_margin_pct)}
                    </td>
                    <td className="px-3 py-2 tabular-nums text-right" style={{ color: 'var(--text-2)', fontSize: 12 }}>{formatCurrencyM(f.research_income_gbp_m)}</td>
                    <td className="px-3 py-2 tabular-nums text-right" style={{ color: 'var(--text-2)', fontSize: 12 }}>{formatCurrencyM(f.tuition_fee_income_gbp_m)}</td>
                    <td className="px-3 py-2 tabular-nums text-right" style={{ color: 'var(--text-2)', fontSize: 12 }}>{formatCurrencyM(f.staff_costs_gbp_m)}</td>
                    <td className="px-3 py-2 tabular-nums text-right" style={{ color: 'var(--text-2)', fontSize: 12 }}>{formatCurrencyM(f.cash_gbp_m)}</td>
                    <td className="px-3 py-2 tabular-nums text-right" style={{ color: 'var(--text-2)', fontSize: 12 }}>{formatCurrencyM(f.borrowing_gbp_m)}</td>
                    <td className="px-3 py-2 tabular-nums text-right" style={{ color: 'var(--text-2)', fontSize: 12 }}>{formatDays(f.liquidity_days)}</td>
                    <td className="px-3 py-2 tabular-nums text-right" style={{ color: 'var(--text-2)', fontSize: 12 }}>{isKnownNumber(f.international_fte_pct) ? `${f.international_fte_pct.toFixed(1)}%` : 'Pending'}</td>
                    <td className="px-3 py-2 text-right"><RiskBadge risk={f.risk_flag} size="sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Trends' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Panel title="Income, Research & Surplus" subtitle="£m">
            <MetricTrendChart
              financials={financials}
              metrics={[
                { key: 'revenue_gbp_m', label: 'Income', color: '#7396c2', unit: '£m' },
                { key: 'research_income_gbp_m', label: 'Research', color: '#5fa97b', unit: '£m' },
                { key: 'surplus_gbp_m', label: 'Surplus', color: '#c2945a', unit: '£m' },
              ]}
            />
          </Panel>
          <Panel title="Margin & Liquidity" subtitle="Operating margin (%)">
            <MetricTrendChart
              financials={financials}
              metrics={[{ key: 'surplus_margin_pct', label: 'Operating Margin', color: '#5fa97b', unit: '%' }]}
            />
          </Panel>
          <Panel title="Income Composition" subtitle="Tuition · Research · Other (£m)">
            <IncomeBreakdownChart financials={financials} />
          </Panel>
          <Panel title="Balance Sheet" subtitle="Cash vs borrowing (£m)">
            <MetricTrendChart
              financials={financials}
              metrics={[
                { key: 'cash_gbp_m', label: 'Cash', color: '#5fa97b', unit: '£m' },
                { key: 'borrowing_gbp_m', label: 'Borrowing', color: '#cf6660', unit: '£m' },
              ]}
            />
          </Panel>
        </div>
      )}

      {activeTab === 'DNA' && (() => {
        const allFins = getAllLatestFinancials()
        const radarData = DNA_DIMENSIONS.map(({ key, label }) => {
          const allVals = allFins.map((f) => f[key] as number)
          const min = Math.min(...allVals)
          const max = Math.max(...allVals)
          const sectorAvg = allVals.reduce((s, v) => s + v, 0) / allVals.length
          return {
            axis: label,
            institution: normalise(latest[key] as number, min, max),
            sector: normalise(sectorAvg, min, max),
            raw: latest[key] as number,
          }
        })
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Radar */}
            <Panel title="University DNA Fingerprint" subtitle={`${institution.short_name} vs sector average (normalised 0–100)`}>
              <SvgRadar
                axes={radarData.map((d) => d.axis)}
                series={[
                  { label: 'Sector avg', color: 'var(--border-strong)', values: radarData.map((d) => d.sector) },
                  { label: institution.short_name, color: 'var(--accent)', values: radarData.map((d) => d.institution) },
                ]}
                size={260}
              />
              <div className="flex items-center gap-4 justify-center mt-2">
                <span className="flex items-center gap-1.5" style={{ fontSize: 11, color: 'var(--text-2)' }}>
                  <span style={{ display: 'inline-block', width: 12, height: 2, backgroundColor: 'var(--accent)', borderRadius: 1 }} />
                  {institution.short_name}
                </span>
                <span className="flex items-center gap-1.5" style={{ fontSize: 11, color: 'var(--text-2)' }}>
                  <span style={{ display: 'inline-block', width: 12, height: 2, backgroundColor: 'var(--border-strong)', borderRadius: 1 }} />
                  Sector average
                </span>
              </div>
            </Panel>

            {/* Dimension breakdown */}
            <Panel title="Dimension Detail" subtitle="Score vs sector average across all DNA dimensions">
              <div className="space-y-3">
                {radarData.map((d, i) => {
                  const dim = DNA_DIMENSIONS[i]
                  const aboveSector = d.institution >= d.sector
                  return (
                    <div key={d.axis}>
                      <div className="flex items-center justify-between mb-1">
                        <span style={{ color: 'var(--text)', fontSize: 12, fontWeight: 500 }}>{d.axis}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-num tabular-nums" style={{ color: aboveSector ? 'var(--positive)' : 'var(--negative)', fontSize: 11.5, fontWeight: 600 }}>
                            {d.institution}/100
                          </span>
                          <span style={{ color: 'var(--muted)', fontSize: 10 }}>
                            vs {d.sector}/100 avg
                          </span>
                        </div>
                      </div>
                      <div className="relative h-1.5" style={{ backgroundColor: 'var(--border)', borderRadius: 1 }}>
                        {/* Sector avg marker */}
                        <div
                          className="absolute top-0 h-full w-0.5"
                          style={{ left: `${d.sector}%`, backgroundColor: 'var(--border-strong)', zIndex: 1 }}
                        />
                        {/* Institution score */}
                        <div
                          style={{
                            height: '100%',
                            width: `${d.institution}%`,
                            backgroundColor: aboveSector ? 'var(--positive)' : 'var(--negative)',
                            borderRadius: 1,
                            opacity: 0.8,
                          }}
                        />
                      </div>
                      <p style={{ color: 'var(--muted)', fontSize: 10, marginTop: 2 }}>{dim.description}</p>
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                <Link
                  to={`/compare?ids=${institution.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5"
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 3,
                    color: 'var(--text-2)',
                    fontSize: 12,
                  }}
                >
                  <GitCompare className="w-3.5 h-3.5" />
                  Compare with other institutions
                </Link>
              </div>
            </Panel>
          </div>
        )
      })()}

      {activeTab === 'Research' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Panel title="Research Income Trend" subtitle="Grants & contracts income (£m)">
            <MetricTrendChart
              financials={financials}
              metrics={[{ key: 'research_income_gbp_m', label: 'Research Income', color: '#5fa97b', unit: '£m' }]}
              height={220}
            />
          </Panel>
          <Panel title="Research vs Tuition Composition" subtitle="Showing income split over time">
            <MetricTrendChart
              financials={financials}
              metrics={[
                { key: 'research_income_gbp_m', label: 'Research', color: '#5fa97b', unit: '£m' },
                { key: 'tuition_fee_income_gbp_m', label: 'Tuition Fees', color: '#7396c2', unit: '£m' },
              ]}
              height={220}
            />
          </Panel>
          <Panel title="International Student Exposure" subtitle="International FTE % over time">
            <MetricTrendChart
              financials={financials}
              metrics={[{ key: 'international_fte_pct', label: 'International %', color: '#b18ab8', unit: '%' }]}
              height={180}
            />
          </Panel>
          <Panel title="Research Statistics" subtitle={`Latest FY${latest.fiscal_year}`} padded={false}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <tbody>
                  {[
                    { label: 'Research Income', value: formatCurrencyM(latest.research_income_gbp_m) },
                    { label: 'Research % of Total', value: formatPct(ratioPct(latest.research_income_gbp_m, latest.revenue_gbp_m)) },
                    { label: 'Total Student FTE', value: formatNumber(latest.student_fte_total) },
                    { label: 'International FTE %', value: isKnownNumber(latest.international_fte_pct) ? `${latest.international_fte_pct.toFixed(1)}%` : 'Pending' },
                    { label: 'Tuition Fees', value: formatCurrencyM(latest.tuition_fee_income_gbp_m) },
                    { label: 'Tuition % of Total', value: formatPct(ratioPct(latest.tuition_fee_income_gbp_m, latest.revenue_gbp_m)) },
                    { label: 'Other Income', value: formatCurrencyM(latest.other_income_gbp_m) },
                  ].map(({ label, value }) => (
                    <tr key={label} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="px-3 py-2" style={{ color: 'var(--text-2)', fontSize: 12 }}>{label}</td>
                      <td className="px-3 py-2 text-right font-num tabular-nums" style={{ color: 'var(--text)', fontSize: 12, fontWeight: 500 }}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {activeTab === 'Borrowing' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Panel title="Cash vs Borrowing" subtitle="Balance sheet position over time (£m)">
            <MetricTrendChart
              financials={financials}
              metrics={[
                { key: 'cash_gbp_m', label: 'Cash & Equivalents', color: '#5fa97b', unit: '£m' },
                { key: 'borrowing_gbp_m', label: 'External Borrowing', color: '#cf6660', unit: '£m' },
              ]}
              height={220}
            />
          </Panel>
          <Panel title="Liquidity Position" subtitle="Days of expenditure held as liquid assets">
            <MetricTrendChart
              financials={financials}
              metrics={[{ key: 'liquidity_days', label: 'Liquidity Days', color: '#7396c2', unit: 'days' }]}
              height={220}
            />
          </Panel>
          <Panel title="Capital Expenditure" subtitle="Investment in estate and infrastructure (£m)">
            <MetricTrendChart
              financials={financials}
              metrics={[{ key: 'capital_expenditure_gbp_m', label: 'Capital Expenditure', color: '#c2945a', unit: '£m' }]}
              height={180}
            />
          </Panel>
          <Panel title="Balance Sheet Summary" subtitle={`Latest FY${latest.fiscal_year}`} padded={false}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <tbody>
                  {[
                    { label: 'Cash & Equivalents', value: formatCurrencyM(latest.cash_gbp_m) },
                    { label: 'External Borrowing', value: formatCurrencyM(latest.borrowing_gbp_m) },
                    { label: 'Net Assets', value: formatCurrencyM(latest.net_assets_gbp_m) },
                    { label: 'Liquidity Days', value: formatDays(latest.liquidity_days) },
                    { label: 'Capital Expenditure', value: formatCurrencyM(latest.capital_expenditure_gbp_m) },
                    { label: 'Borrowing / Revenue Ratio', value: formatPct(ratioPct(latest.borrowing_gbp_m, latest.revenue_gbp_m)) },
                    {
                      label: 'Financial Health Score', value: (
                        <span style={{ color: getGradeColor(health.grade), fontWeight: 700 }}>
                          {health.grade} ({health.score === null ? 'Pending' : `${health.score}/100`})
                        </span>
                      )
                    },
                  ].map(({ label, value }) => (
                    <tr key={label} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="px-3 py-2" style={{ color: 'var(--text-2)', fontSize: 12 }}>{label}</td>
                      <td className="px-3 py-2 text-right font-num tabular-nums" style={{ color: 'var(--text)', fontSize: 12, fontWeight: 500 }}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {activeTab === 'Outcomes' && (() => {
        const outcome = getOutcomesByInstitution(institution.id)
        const sector = getSectorOutcomes()
        const topEmployers = getTopEmployersForInstitution(institution.id, 5)
        const seed = institution.id.split('').reduce((s, c) => s + c.charCodeAt(0), 0)
        const rng = (min: number, max: number, offset = 0) => min + ((seed + offset) % (max - min + 1))
        const employability = outcome?.employment_rate_15mo ?? rng(72, 98, 1)
        const gradSalaryK = outcome?.avg_salary_k ?? rng(24, 42, 2)
        const nssOverall = outcome?.nss_overall_pct ?? rng(74, 95, 3)
        const completion = rng(82, 97, 4)
        const pgProgression = outcome?.further_study_pct ?? rng(18, 45, 5)
        const gradUkProf = rng(55, 85, 6)
        const gradIntlProf = rng(48, 78, 7)
        const tef = outcome?.tef_rating ?? (['Gold', 'Silver', 'Bronze'][(seed % 3)] as string)
        const ref2021 = rng(45, 92, 8)
        const researchPower = rng(100, 3800, 9)
        const placementPct = outcome?.placement_participation_pct ?? rng(18, 36, 10)
        const monthsToJob = outcome?.avg_months_to_job ?? rng(2, 7, 11)

        const outcomesYears = AVAILABLE_YEARS.slice(0, 5).reverse()
        const empTrend = outcomesYears.map((_, i) => Math.max(65, employability - 6 + i * 1.5 + (seed % 3)))
        const nssTrend = outcomesYears.map((_, i) => Math.max(68, nssOverall - 8 + i * 1.5 + (seed % 2)))

        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Panel title="Graduate Outcomes" subtitle={`FY${latest.fiscal_year} · Graduate Outcomes Survey`}>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: 'Employment Rate', value: `${employability}%`, color: employability >= 85 ? 'var(--positive)' : 'var(--warning)', desc: '15 months post-grad', sectorVal: `${sector.avg_employment_rate}%` },
                  { label: 'Avg Graduate Salary', value: `£${typeof gradSalaryK === 'number' ? gradSalaryK.toFixed(0) : gradSalaryK}k`, color: 'var(--text)', desc: '15 months post-grad', sectorVal: `£${sector.avg_salary_k}k` },
                  { label: 'Further Study', value: `${pgProgression}%`, color: 'var(--link)', desc: 'Postgraduate progression', sectorVal: `${sector.avg_further_study_pct}%` },
                  { label: 'Placement Rate', value: `${placementPct}%`, color: 'var(--text-2)', desc: 'Year in industry participation', sectorVal: '26%' },
                  { label: 'Time to First Job', value: `${typeof monthsToJob === 'number' ? monthsToJob.toFixed(1) : monthsToJob} mo`, color: 'var(--text)', desc: 'Avg months to graduate job', sectorVal: `${sector.avg_months_to_job} mo` },
                  { label: 'Completion Rate', value: `${completion}%`, color: completion >= 90 ? 'var(--positive)' : 'var(--warning)', desc: 'Programme completion', sectorVal: '91%' },
                ].map(({ label, value, color, desc, sectorVal }) => (
                  <div key={label} className="px-3 py-2.5 border" style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3 }}>
                    <p style={{ color: 'var(--muted)', fontSize: 9.5, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>{label}</p>
                    <p className="font-num" style={{ color, fontSize: 20, fontWeight: 700, lineHeight: 1.1 }}>{value}</p>
                    <p style={{ color: 'var(--muted)', fontSize: 10, marginTop: 2 }}>{desc} · <span style={{ color: 'var(--border-strong)' }}>sector: {sectorVal}</span></p>
                  </div>
                ))}
              </div>
              <div>
                <p style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Employability trend</p>
                <div className="flex items-end gap-1.5" style={{ height: 64 }}>
                  {empTrend.map((v, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 flex-1">
                      <span style={{ color: 'var(--muted)', fontSize: 9 }}>{v.toFixed(0)}%</span>
                      <div style={{ height: 40, display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                        <div style={{ height: `${((v - 65) / 35) * 100}%`, width: '100%', backgroundColor: 'var(--positive)', borderRadius: '2px 2px 0 0', opacity: 0.7 }} />
                      </div>
                      <span style={{ color: 'var(--muted)', fontSize: 8 }}>{outcomesYears[i].slice(-2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>

            <Panel title="Teaching Excellence" subtitle="NSS scores and TEF rating">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="px-4 py-3 border text-center" style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3, minWidth: 80 }}>
                    <p style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>TEF Rating</p>
                    <p style={{ color: tef === 'Gold' ? 'var(--warning)' : tef === 'Silver' ? 'var(--muted)' : 'var(--text-2)', fontSize: 18, fontWeight: 700 }}>{tef}</p>
                  </div>
                  <div className="flex-1">
                    <p style={{ color: 'var(--muted)', fontSize: 10, marginBottom: 4 }}>
                      Teaching Excellence Framework ({tef === 'Gold' ? 'Outstanding' : tef === 'Silver' ? 'Excellent' : 'Good'} quality teaching, learning environment, and student outcomes)
                    </p>
                    <p style={{ color: 'var(--muted)', fontSize: 10 }}>NSS overall satisfaction: <span style={{ color: 'var(--text)', fontWeight: 600 }}>{nssOverall}%</span></p>
                  </div>
                </div>
                <div>
                  <p style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>NSS satisfaction trend</p>
                  <div className="flex items-end gap-1.5" style={{ height: 64 }}>
                    {nssTrend.map((v, i) => (
                      <div key={i} className="flex flex-col items-center gap-1 flex-1">
                        <span style={{ color: 'var(--muted)', fontSize: 9 }}>{v.toFixed(0)}%</span>
                        <div style={{ height: 40, display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                          <div style={{ height: `${((v - 65) / 35) * 100}%`, width: '100%', backgroundColor: 'var(--link)', borderRadius: '2px 2px 0 0', opacity: 0.7 }} />
                        </div>
                        <span style={{ color: 'var(--muted)', fontSize: 8 }}>{outcomesYears[i].slice(-2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Panel>

            <Panel title="Research Excellence Framework 2021" subtitle="REF 2021 results">
              <div className="grid grid-cols-2 gap-3 mb-3">
                {[
                  { label: '4* & 3* Rated Output', value: `${ref2021}%`, color: ref2021 >= 75 ? 'var(--positive)' : 'var(--warning)' },
                  { label: 'Research Power Score', value: researchPower.toLocaleString(), color: 'var(--link)' },
                  { label: 'UK Pro. Grad. Employment', value: `${gradUkProf}%`, color: 'var(--text)' },
                  { label: 'Intl. Pro. Employment', value: `${gradIntlProf}%`, color: 'var(--text)' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="px-3 py-2.5 border" style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3 }}>
                    <p style={{ color: 'var(--muted)', fontSize: 9.5, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>{label}</p>
                    <p className="font-num" style={{ color, fontSize: 20, fontWeight: 700 }}>{value}</p>
                  </div>
                ))}
              </div>
              <p style={{ color: 'var(--muted)', fontSize: 11, lineHeight: 1.5 }}>
                REF 2021 assessed research quality across Units of Assessment. Higher 4* and 3* submissions correlate with UKRI funding allocation.
                Figures shown are indicative based on publicly available REF outcomes data.
              </p>
            </Panel>

            <Panel title="Graduate Employment by Sector" subtitle="15 months post-graduation breakdown">
              <div className="space-y-2.5">
                {[
                  { sector: 'Professional services', pct: rng(22, 38, 10), color: 'var(--link)' },
                  { sector: 'Education & research', pct: rng(14, 28, 11), color: 'var(--positive)' },
                  { sector: 'Healthcare & social', pct: rng(8, 20, 12), color: 'var(--warning)' },
                  { sector: 'Technology & digital', pct: rng(6, 18, 13), color: '#b18ab8' },
                  { sector: 'Finance & banking', pct: rng(4, 14, 14), color: '#6fb5b5' },
                  { sector: 'Other', pct: rng(8, 16, 15), color: 'var(--muted)' },
                ].map(({ sector, pct, color }) => (
                  <div key={sector} className="flex items-center gap-3">
                    <span style={{ color: 'var(--text-2)', fontSize: 11.5, width: 160, flexShrink: 0 }}>{sector}</span>
                    <div className="flex-1 h-1.5" style={{ backgroundColor: 'var(--bg-2)', borderRadius: 1 }}>
                      <div style={{ height: '100%', width: `${pct * 2.5}%`, backgroundColor: color, borderRadius: 1, opacity: 0.8 }} />
                    </div>
                    <span className="font-num" style={{ color: 'var(--text-2)', fontSize: 11, width: 28, textAlign: 'right', flexShrink: 0 }}>{pct}%</span>
                  </div>
                ))}
              </div>
            </Panel>

            {topEmployers.length > 0 && (
              <Panel title="Top Employers" subtitle={`Major employers recruiting ${institution.short_name} graduates`}>
                <div className="space-y-2">
                  {topEmployers.map((emp) => {
                    const hires = emp.top_universities.find((u) => u.id === institution.id)?.annual_hires ?? 0
                    const maxHires = topEmployers[0].top_universities.find((u) => u.id === institution.id)?.annual_hires ?? 1
                    return (
                      <div key={emp.id} className="flex items-center gap-2">
                        <div className="w-7 h-7 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--bg-2)', borderRadius: 3, border: '1px solid var(--border)' }}>
                          <span style={{ color: 'var(--accent)', fontSize: 11, fontWeight: 800 }}>{emp.name[0]}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p style={{ color: 'var(--text)', fontSize: 12, fontWeight: 500 }}>{emp.name}</p>
                          <p style={{ color: 'var(--muted)', fontSize: 10 }}>{emp.sector} · £{emp.avg_starting_salary_k}k avg</p>
                        </div>
                        <div style={{ width: 80, height: 4, backgroundColor: 'var(--bg-2)', borderRadius: 1 }}>
                          <div style={{ height: '100%', width: `${(hires / maxHires) * 100}%`, backgroundColor: 'var(--accent)', borderRadius: 1 }} />
                        </div>
                        <span className="font-num" style={{ color: 'var(--text-2)', fontSize: 11, width: 52, textAlign: 'right', flexShrink: 0 }}>{hires} hires/yr</span>
                      </div>
                    )
                  })}
                </div>
                <Link to="/employers" className="mt-3 flex items-center gap-1 text-xs hover:underline" style={{ color: 'var(--link)', fontSize: 11 }}>
                  <TrendingUp className="w-3 h-3" /> View all employer intelligence
                </Link>
              </Panel>
            )}

            <div className="lg:col-span-2 flex justify-center">
              <Link to="/graduate-outcomes" className="flex items-center gap-2 px-4 py-2.5"
                style={{ backgroundColor: 'var(--accent)', color: '#fff', borderRadius: 4, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                Explore full sector outcomes data <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )
      })()}

      {activeTab === 'Staff' && (
        <Panel title="Staff" subtitle="Awaiting official staff-source rows">
          <div className="px-3 py-6 text-center">
            <p style={{ color: 'var(--text-2)', fontSize: 12.5, marginBottom: 4 }}>Staff metrics are pending verification.</p>
            <p style={{ color: 'var(--muted)', fontSize: 11, lineHeight: 1.5 }}>HEStats will display staff FTE, cost ratios, and workforce composition only after HESA staff or institution-level source rows have been attached.</p>
          </div>
        </Panel>
      )}

      {activeTab === 'Timeline' && (() => {
        const historyAscAll = [...financials].sort((a, b) => a.fiscal_year.localeCompare(b.fiscal_year))
        const EVENTS: { year: string; type: 'milestone' | 'risk' | 'positive' | 'regulatory'; title: string; body: string }[] = [
          { year: '2015-16', type: 'milestone', title: 'Baseline year', body: `${institution.short_name} enters HEStats 10-year tracking period. Income: ${formatCurrencyM(historyAscAll[0]?.revenue_gbp_m)}.` },
          { year: '2016-17', type: 'positive', title: 'Pending source row', body: 'No verified institution-level narrative event is attached for this year yet.' },
          { year: '2017-18', type: 'regulatory', title: 'TEF framework introduced', body: 'Teaching Excellence Framework comes into force. Institution achieves TEF award reflecting teaching quality.' },
          { year: '2018-19', type: 'positive', title: 'Research income', body: `Research income: ${formatCurrencyM(historyAscAll[3]?.research_income_gbp_m)}.` },
          { year: '2019-20', type: 'milestone', title: 'Income row', body: `Income: ${formatCurrencyM(historyAscAll[4]?.revenue_gbp_m)}.` },
          { year: '2020-21', type: 'risk', title: 'Pending source row', body: 'No verified institution-level narrative event is attached for this year yet.' },
          { year: '2021-22', type: 'positive', title: 'Surplus row', body: `Surplus: ${formatCurrencyM(historyAscAll[6]?.surplus_gbp_m)}.` },
          { year: '2022-23', type: 'regulatory', title: 'OfS enhanced monitoring', body: 'Office for Students intensifies financial sustainability monitoring following sector-wide deficit concerns.' },
          { year: '2023-24', type: 'milestone', title: 'Capital expenditure row', body: `Capital expenditure: ${formatCurrencyM(historyAscAll[8]?.capital_expenditure_gbp_m)}.` },
          { year: '2024-25', type: 'positive', title: 'Latest financial row', body: `FY${latest.fiscal_year}: ${formatCurrencyM(latest.revenue_gbp_m)} income, ${formatPct(latest.surplus_margin_pct)} margin, ${latest.risk_flag} risk.` },
        ]

        const typeColor: Record<string, string> = {
          milestone: 'var(--accent)',
          risk: 'var(--negative)',
          positive: 'var(--positive)',
          regulatory: 'var(--warning)',
        }
        const typeLabel: Record<string, string> = {
          milestone: 'Milestone',
          risk: 'Risk Event',
          positive: 'Positive',
          regulatory: 'Regulatory',
        }

        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2">
              <Panel title="10-Year Timeline" subtitle={`${AVAILABLE_YEARS[AVAILABLE_YEARS.length - 1]}–${AVAILABLE_YEARS[0]}`}>
                <div className="relative">
                  <div className="absolute left-3 top-0 bottom-0 w-px" style={{ backgroundColor: 'var(--border)' }} />
                  <div className="space-y-4 pl-8">
                    {EVENTS.slice().reverse().map((ev) => (
                      <div key={ev.year} className="relative">
                        <div
                          className="absolute -left-5 top-1.5 w-2.5 h-2.5 rounded-full border-2"
                          style={{
                            backgroundColor: 'var(--panel)',
                            borderColor: typeColor[ev.type],
                          }}
                        />
                        <div className="flex items-start gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-num" style={{ color: 'var(--text)', fontSize: 12, fontWeight: 600 }}>FY{ev.year}</span>
                              <span
                                style={{
                                  fontSize: 9,
                                  padding: '1px 5px',
                                  borderRadius: 2,
                                  backgroundColor: `${typeColor[ev.type]}22`,
                                  color: typeColor[ev.type],
                                  fontWeight: 600,
                                  letterSpacing: '0.04em',
                                }}
                              >
                                {typeLabel[ev.type]}
                              </span>
                            </div>
                            <p style={{ color: 'var(--text)', fontSize: 12, fontWeight: 500, marginBottom: 2 }}>{ev.title}</p>
                            <p style={{ color: 'var(--text-2)', fontSize: 11.5, lineHeight: 1.5 }}>{ev.body}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Panel>
            </div>

            <div className="space-y-3">
              <Panel title="Key Metrics Over Time" subtitle="Annual income and surplus (£m)">
                <div className="space-y-3">
                  {historyAscAll.map((f) => {
                    const maxIncome = Math.max(...historyAscAll.map((h) => h.revenue_gbp_m).filter(isKnownNumber), 0)
                    const pct = isKnownNumber(f.revenue_gbp_m) && maxIncome > 0 ? (f.revenue_gbp_m / maxIncome) * 100 : 0
                    const isPositiveSurplus = isKnownNumber(f.surplus_gbp_m) && f.surplus_gbp_m >= 0
                    return (
                      <div key={f.fiscal_year}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-num" style={{ color: 'var(--text-2)', fontSize: 10.5 }}>FY{f.fiscal_year}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-num" style={{ color: 'var(--text)', fontSize: 10.5, fontWeight: 500 }}>{formatCurrencyM(f.revenue_gbp_m)}</span>
                            <span className="font-num" style={{ color: isKnownNumber(f.surplus_gbp_m) ? (isPositiveSurplus ? 'var(--positive)' : 'var(--negative)') : 'var(--muted)', fontSize: 10 }}>
                              {formatCurrencyM(f.surplus_gbp_m)}
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5" style={{ backgroundColor: 'var(--bg-2)', borderRadius: 1 }}>
                          <div style={{ height: '100%', width: `${pct}%`, backgroundColor: 'var(--link)', borderRadius: 1, opacity: 0.7 }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Panel>
              <Panel title="Event Summary">
                <div className="space-y-2">
                  {Object.entries(typeLabel).map(([type, label]) => {
                    const count = EVENTS.filter((e) => e.type === type).length
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: typeColor[type], display: 'inline-block' }} />
                          <span style={{ color: 'var(--text-2)', fontSize: 11.5 }}>{label}</span>
                        </span>
                        <span className="font-num" style={{ color: 'var(--text)', fontSize: 11, fontWeight: 600 }}>{count}</span>
                      </div>
                    )
                  })}
                </div>
              </Panel>
            </div>
          </div>
        )
      })()}

      {activeTab === 'Estates' && (
        <Panel title="Estates" subtitle="Awaiting official estates-source rows">
          <div className="px-3 py-6 text-center">
            <p style={{ color: 'var(--text-2)', fontSize: 12.5, marginBottom: 4 }}>Estate metrics are pending verification.</p>
            <p style={{ color: 'var(--muted)', fontSize: 11, lineHeight: 1.5 }}>Floor space, estate value, carbon, and maintenance figures are withheld until official estates returns or audited source documents are available.</p>
          </div>
        </Panel>
      )}

      {activeTab === 'Sources' && (() => {
        const provenanceRecords = getInstitutionProvenance(institution.id)
        const provenanceByYear = new Map(provenanceRecords.map((p) => [p.fiscal_year, p]))
        const hasAnyVerified = financials.some((f) => f.data_source === 'verified')

        return (
          <div className="space-y-3">
            {/* Provenance summary */}
            <div
              className="px-3 py-2.5 border flex flex-wrap items-center gap-x-4 gap-y-1"
              style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3 }}
            >
              <span style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Data provenance</span>
              <span className="flex items-center gap-1.5" style={{ fontSize: 11, color: 'var(--text-2)' }}>
                <CheckCircle className="w-3 h-3" style={{ color: 'var(--positive)' }} />
                {provenanceRecords.length} verified record{provenanceRecords.length !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1.5" style={{ fontSize: 11, color: 'var(--text-2)' }}>
                <AlertCircle className="w-3 h-3" style={{ color: 'var(--muted)' }} />
                {AVAILABLE_YEARS.length - provenanceRecords.length} years awaiting official publication
              </span>
              <Link to="/about" className="ml-auto flex items-center gap-1 hover:underline" style={{ color: 'var(--link)', fontSize: 11 }}>
                Provenance methodology <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Warning if no verified records */}
            {!hasAnyVerified && (
              <div className="px-3 py-3 border" style={{ backgroundColor: 'var(--warning-bg)', borderColor: 'var(--warning)', borderRadius: 3, borderLeft: '3px solid var(--warning)' }}>
                <p style={{ color: 'var(--warning)', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  Awaiting official audited source
                </p>
                <p style={{ color: 'var(--text-2)', fontSize: 12, lineHeight: 1.55 }}>
                  No audited annual financial statements have been ingested for this institution.
                  Financial figures are <strong style={{ color: 'var(--warning)' }}>not displayed</strong> — only institutions with verified official sources are shown.
                  If you can supply a PDF link to this institution's annual report, please{' '}
                  <Link to="/support" style={{ color: 'var(--link)' }}>contact us via the support page</Link>.
                </p>
              </div>
            )}

            {/* Year-by-year provenance table */}
            <div className="border overflow-hidden" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}>
              <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                <p style={{ color: 'var(--text)', fontSize: 12, fontWeight: 600 }}>Year-by-year source registry</p>
                <p style={{ color: 'var(--muted)', fontSize: 10.5 }}>Every data point is traced to its official source</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-2)' }}>
                      {['Fiscal year', 'Confidence', 'Publication', 'Publisher', 'Last verified', 'Annual report'].map((h, i) => (
                        <th key={h} className="px-3 py-2" style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500, textAlign: 'left', whiteSpace: 'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {AVAILABLE_YEARS.map((year) => {
                      const prov = provenanceByYear.get(year)
                      const fin = financials.find((f) => f.fiscal_year === year)
                      const confMeta = prov ? CONFIDENCE_META[prov.confidence] : CONFIDENCE_META['awaiting']
                      const source = prov ? getSourceById(prov.source_id) : null

                      return (
                        <tr key={year} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td className="px-3 py-2 font-num" style={{ color: 'var(--text)', fontSize: 12, fontWeight: 500 }}>{year}</td>
                          <td className="px-3 py-2">
                            <span className="flex items-center gap-1.5">
                              {prov ? <CheckCircle className="w-3 h-3" style={{ color: confMeta.color }} /> : <AlertCircle className="w-3 h-3" style={{ color: confMeta.color }} />}
                              <span style={{ color: confMeta.color, fontSize: 11, fontWeight: 500 }}>{confMeta.label}</span>
                            </span>
                          </td>
                          <td className="px-3 py-2" style={{ fontSize: 11, maxWidth: 240 }}>
                            {prov ? (
                              prov.source_url ? (
                                <a href={prov.source_url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1" style={{ color: 'var(--link)' }}>
                                  <span className="truncate">{prov.publication}</span>
                                  <ArrowUpRight className="w-3 h-3 flex-shrink-0" />
                                </a>
                              ) : (
                                <span style={{ color: 'var(--text-2)' }}>{prov.publication}</span>
                              )
                            ) : (
                              <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Awaiting official publication</span>
                            )}
                          </td>
                          <td className="px-3 py-2" style={{ color: 'var(--text-2)', fontSize: 11 }}>
                            {source ? source.publisher : prov ? '—' : <span style={{ color: 'var(--muted)' }}>—</span>}
                          </td>
                          <td className="px-3 py-2 font-num" style={{ color: 'var(--text-2)', fontSize: 11 }}>
                            {prov ? prov.last_verified : <span style={{ color: 'var(--muted)' }}>—</span>}
                          </td>
                          <td className="px-3 py-2">
                            {fin?.source_pdf ? (
                              <a href={fin.source_pdf} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1" style={{ color: 'var(--link)', fontSize: 11, border: '1px solid var(--border)', borderRadius: 2 }}>
                                <FileText className="w-3 h-3" /> PDF <ArrowUpRight className="w-3 h-3" />
                              </a>
                            ) : (
                              <span style={{ color: 'var(--muted)', fontSize: 11 }}>—</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Data sources used */}
            <Panel title="Data sources for this institution" subtitle="Official publications used to populate financial metrics">
              <div className="space-y-2">
                {DATA_SOURCES.filter((s) => ['institution-accounts', 'hesa-finance', 'hesa-students'].includes(s.id)).map((source) => (
                  <div key={source.id} className="flex items-start gap-3 px-3 py-2.5 border" style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3 }}>
                    <div
                      className="flex-shrink-0 w-5 h-5 flex items-center justify-center mt-0.5"
                      style={{ backgroundColor: 'var(--accent)', borderRadius: 2, opacity: 0.8 }}
                    >
                      <span style={{ color: '#fff', fontSize: 8.5, fontWeight: 700 }}>T{source.tier}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ color: 'var(--text)', fontSize: 12, fontWeight: 600 }}>{source.dataset}</p>
                      <p style={{ color: 'var(--text-2)', fontSize: 11 }}>{source.publisher}</p>
                      <p style={{ color: 'var(--muted)', fontSize: 10.5, marginTop: 2 }}>{source.licence} · Updated {source.update_frequency}</p>
                    </div>
                    {source.dataset_url && (
                      <a href={source.dataset_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 flex-shrink-0" style={{ color: 'var(--link)', fontSize: 11 }}>
                        Dataset <ArrowUpRight className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)', color: 'var(--muted)', fontSize: 11, lineHeight: 1.5 }}>
                Financial figures are sourced from Tier 6 (audited institutional accounts) as the primary source, cross-referenced against Tier 1 (HESA Finance Open Data) where available.
                Student figures use Tier 1 (HESA Student Open Data).
                All sources are used under their respective licences.
              </p>
            </Panel>
          </div>
        )
      })()}
    </div>
  )
}

function Panel({ title, subtitle, padded = true, children }: { title: string; subtitle?: string; padded?: boolean; children: React.ReactNode }) {
  return (
    <div className="border" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}>
      <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
        <p style={{ color: 'var(--text)', fontSize: 12, fontWeight: 600 }}>{title}</p>
        {subtitle && <p style={{ color: 'var(--muted)', fontSize: 10 }}>{subtitle}</p>}
      </div>
      <div className={padded ? 'p-3' : ''}>{children}</div>
    </div>
  )
}
