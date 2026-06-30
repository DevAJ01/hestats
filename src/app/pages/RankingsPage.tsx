import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { TrendingUp, TrendingDown, Download, ArrowUpDown } from 'lucide-react'
import { institutions } from '../data/institutions'
import { getFinancialsByInstitution, getAllLatestFinancials, financials, AVAILABLE_YEARS } from '../data/financials'
import { computeHealthScore } from '../data/health'
import { getOutcomesByInstitution } from '../data/outcomes'
import { NationBadge } from '../components/institutions/NationBadge'
import { RiskBadge } from '../components/institutions/RiskBadge'
import { HealthBadge } from '../components/institutions/HealthBadge'
import { Sparkline } from '../components/charts/Sparkline'
import { useYear } from '../context/YearContext'

type SortKey =
  | 'revenue' | 'surplus' | 'surplus_margin' | 'research' | 'tuition'
  | 'staff_cost_ratio' | 'cash' | 'borrowing' | 'borrowing_ratio'
  | 'liquidity' | 'international' | 'students' | 'capex'
  | 'net_assets' | 'income_per_student' | 'health'
  // Employment
  | 'employment_rate' | 'avg_salary' | 'graduate_role_pct' | 'placement_pct' | 'months_to_job'
  // Education
  | 'nss_score' | 'further_study' | 'tef_rating'
  // AI
  | 'ai_resilience'

interface TabDef {
  id: string
  label: string
  metrics: { key: SortKey; label: string }[]
  defaultSort: SortKey
}

const TABS: TabDef[] = [
  {
    id: 'income',
    label: 'Income',
    defaultSort: 'revenue',
    metrics: [
      { key: 'revenue', label: 'Total Income' },
      { key: 'tuition', label: 'Tuition Fees' },
      { key: 'research', label: 'Research Income' },
      { key: 'income_per_student', label: 'Income / Student' },
    ],
  },
  {
    id: 'surplus',
    label: 'Surplus',
    defaultSort: 'surplus_margin',
    metrics: [
      { key: 'surplus', label: 'Operating Surplus' },
      { key: 'surplus_margin', label: 'Surplus Margin' },
      { key: 'staff_cost_ratio', label: 'Staff Cost %' },
      { key: 'net_assets', label: 'Net Assets' },
    ],
  },
  {
    id: 'research',
    label: 'Research',
    defaultSort: 'research',
    metrics: [
      { key: 'research', label: 'Research Income' },
      { key: 'international', label: 'International %' },
      { key: 'students', label: 'Student FTE' },
    ],
  },
  {
    id: 'liquidity',
    label: 'Liquidity',
    defaultSort: 'liquidity',
    metrics: [
      { key: 'liquidity', label: 'Liquidity Days' },
      { key: 'cash', label: 'Cash & Equivalents' },
      { key: 'capex', label: 'Capital Expenditure' },
    ],
  },
  {
    id: 'health',
    label: 'Financial Health',
    defaultSort: 'health',
    metrics: [
      { key: 'health', label: 'Health Score' },
      { key: 'borrowing', label: 'Borrowing' },
      { key: 'borrowing_ratio', label: 'Borrow / Revenue' },
    ],
  },
  {
    id: 'employment',
    label: 'Employment',
    defaultSort: 'employment_rate',
    metrics: [
      { key: 'employment_rate', label: 'Graduate Employment' },
      { key: 'avg_salary', label: 'Avg Graduate Salary' },
      { key: 'graduate_role_pct', label: 'Graduate-Level Roles' },
      { key: 'placement_pct', label: 'Placement Rate' },
      { key: 'months_to_job', label: 'Months to Job' },
    ],
  },
  {
    id: 'education',
    label: 'Education Quality',
    defaultSort: 'nss_score',
    metrics: [
      { key: 'nss_score', label: 'NSS Satisfaction' },
      { key: 'further_study', label: 'Further Study %' },
    ],
  },
  {
    id: 'ai-resilience',
    label: 'AI Resilience',
    defaultSort: 'ai_resilience',
    metrics: [
      { key: 'ai_resilience', label: 'AI Resilience Score' },
      { key: 'employment_rate', label: 'Graduate Employment' },
      { key: 'avg_salary', label: 'Avg Graduate Salary' },
    ],
  },
  {
    id: 'borrowing',
    label: 'Borrowing',
    defaultSort: 'borrowing',
    metrics: [
      { key: 'borrowing', label: 'External Borrowing' },
      { key: 'borrowing_ratio', label: 'Borrowing / Revenue' },
      { key: 'net_assets', label: 'Net Assets' },
    ],
  },
]

const SORT_KEYS = new Set<SortKey>(TABS.flatMap((tab) => tab.metrics.map((metric) => metric.key)).concat('health'))

function resolveRankingParams(params: URLSearchParams): { tab: TabDef; sortKey: SortKey } {
  const category = params.get('category')
  const sort = params.get('sort') as SortKey | null
  const categoryTab = category === 'outcomes'
    ? TABS.find((tab) => tab.id === 'employment')
    : TABS.find((tab) => tab.id === category)
  const sortTab = sort && SORT_KEYS.has(sort)
    ? TABS.find((tab) => tab.metrics.some((metric) => metric.key === sort) || (sort === 'health' && tab.id === 'health'))
    : undefined
  const tab = categoryTab ?? sortTab ?? TABS[0]
  const sortKey = sort && SORT_KEYS.has(sort) ? sort : tab.defaultSort
  return { tab, sortKey }
}

function fmt(key: SortKey, val: number): string {
  switch (key) {
    case 'surplus_margin':
    case 'international':
    case 'staff_cost_ratio':
    case 'borrowing_ratio':
    case 'employment_rate':
    case 'graduate_role_pct':
    case 'placement_pct':
    case 'nss_score':
    case 'further_study':
      return `${val.toFixed(1)}%`
    case 'liquidity':
      return `${Math.round(val)}d`
    case 'students':
      return val >= 1000 ? `${(val / 1000).toFixed(1)}k` : String(Math.round(val))
    case 'health':
    case 'ai_resilience':
      return `${Math.round(val)}/100`
    case 'income_per_student':
      return `£${val.toFixed(0)}k`
    case 'avg_salary':
      return `£${val.toFixed(0)}k`
    case 'months_to_job':
      return `${val.toFixed(1)} mo`
    default:
      return val >= 1000 ? `£${(val / 1000).toFixed(2)}bn` : `£${val.toLocaleString()}m`
  }
}

type FinRow = ReturnType<typeof getAllLatestFinancials>[0]
type HealthRow = ReturnType<typeof computeHealthScore>

function getValue(key: SortKey, fin: FinRow, health: HealthRow): number {
  // Outcome-based metrics: look up from outcomes data
  if (['employment_rate', 'avg_salary', 'graduate_role_pct', 'placement_pct', 'months_to_job', 'nss_score', 'further_study', 'ai_resilience'].includes(key)) {
    const outcome = getOutcomesByInstitution(fin.institution_id)
    if (!outcome) return 0
    switch (key) {
      case 'employment_rate': return outcome.employment_rate_15mo
      case 'avg_salary': return outcome.avg_salary_k
      case 'graduate_role_pct': return outcome.graduate_role_pct
      case 'placement_pct': return outcome.placement_participation_pct
      case 'months_to_job': return outcome.avg_months_to_job
      case 'nss_score': return outcome.nss_overall_pct
      case 'further_study': return outcome.further_study_pct
      case 'ai_resilience': {
        // Simple heuristic: institutions with higher research intensity = higher AI resilience
        const researchPct = fin.revenue_gbp_m > 0 ? (fin.research_income_gbp_m / fin.revenue_gbp_m) * 100 : 0
        return Math.min(95, 50 + researchPct * 2 + health.score * 0.2)
      }
      default: return 0
    }
  }
  switch (key) {
    case 'revenue': return fin.revenue_gbp_m
    case 'surplus': return fin.surplus_gbp_m
    case 'surplus_margin': return fin.surplus_margin_pct
    case 'research': return fin.research_income_gbp_m
    case 'tuition': return fin.tuition_fee_income_gbp_m
    case 'staff_cost_ratio': return fin.revenue_gbp_m > 0 ? (fin.staff_costs_gbp_m / fin.revenue_gbp_m) * 100 : 0
    case 'cash': return fin.cash_gbp_m
    case 'borrowing': return fin.borrowing_gbp_m
    case 'borrowing_ratio': return fin.revenue_gbp_m > 0 ? (fin.borrowing_gbp_m / fin.revenue_gbp_m) * 100 : 0
    case 'liquidity': return fin.liquidity_days
    case 'international': return fin.international_fte_pct
    case 'students': return fin.student_fte_total
    case 'capex': return fin.capital_expenditure_gbp_m
    case 'net_assets': return fin.net_assets_gbp_m
    case 'income_per_student': return fin.student_fte_total > 0 ? (fin.revenue_gbp_m * 1000) / fin.student_fte_total : 0
    case 'health': return health.score
    default: return 0
  }
}

function isLowerBetter(key: SortKey): boolean {
  return key === 'borrowing' || key === 'borrowing_ratio' || key === 'staff_cost_ratio' || key === 'months_to_job'
}

export function RankingsPage() {
  const [params] = useSearchParams()
  const requested = useMemo(() => resolveRankingParams(params), [params])
  const [activeTab, setActiveTab] = useState<TabDef>(requested.tab)
  const [sortKey, setSortKey] = useState<SortKey>(requested.sortKey)
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')
  const [search, setSearch] = useState('')
  const { selectedYear, setSelectedYear } = useYear()

  useEffect(() => {
    setActiveTab(requested.tab)
    setSortKey(requested.sortKey)
    setSortDir(isLowerBetter(requested.sortKey) ? 'asc' : 'desc')
  }, [requested.tab, requested.sortKey])

  // Build financials for the selected year
  const yearFins = useMemo(() => {
    const map = new Map<string, FinRow>()
    for (const f of financials) {
      if (f.fiscal_year === selectedYear) map.set(f.institution_id, f as FinRow)
    }
    return map
  }, [selectedYear])

  const latestYear = selectedYear
  const prevYearIdx = AVAILABLE_YEARS.indexOf(selectedYear) + 1
  const prevYear = prevYearIdx < AVAILABLE_YEARS.length ? AVAILABLE_YEARS[prevYearIdx] : undefined

  const rows = useMemo(() => {
    return institutions
      .map((inst) => {
        const fin = yearFins.get(inst.id)
        if (!fin) return null
        const health = computeHealthScore(fin)
        const prevFin = prevYear ? getFinancialsByInstitution(inst.id).find((f) => f.fiscal_year === prevYear) : undefined
        const history = getFinancialsByInstitution(inst.id)
          .sort((a, b) => a.fiscal_year.localeCompare(b.fiscal_year))
          .map((f) => f.revenue_gbp_m)
        return { inst, fin, health, prevFin, history }
      })
      .filter(Boolean)
      .filter((r) =>
        !search ||
        r!.inst.canonical_name.toLowerCase().includes(search.toLowerCase()) ||
        r!.inst.short_name.toLowerCase().includes(search.toLowerCase()),
      )
      .sort((a, b) => {
        const aVal = getValue(sortKey, a!.fin, a!.health)
        const bVal = getValue(sortKey, b!.fin, b!.health)
        return sortDir === 'desc' ? bVal - aVal : aVal - bVal
      }) as { inst: typeof institutions[0]; fin: FinRow; health: HealthRow; prevFin: FinRow | undefined; history: number[] }[]
  }, [yearFins, sortKey, sortDir, search, prevYear])

  const maxVals = useMemo(() => {
    const m: Partial<Record<SortKey, number>> = {}
    activeTab.metrics.forEach(({ key }) => {
      m[key] = Math.max(1, ...rows.map((r) => Math.abs(getValue(key, r.fin, r.health))))
    })
    return m
  }, [rows, activeTab])

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    else { setSortKey(key); setSortDir(isLowerBetter(key) ? 'asc' : 'desc') }
  }

  function handleTabChange(tab: TabDef) {
    setActiveTab(tab)
    setSortKey(tab.defaultSort)
    setSortDir(isLowerBetter(tab.defaultSort) ? 'asc' : 'desc')
  }

  function downloadCsv() {
    const header = ['Rank', 'Institution', 'Nation', ...activeTab.metrics.map((m) => m.label), 'Health Score', 'Grade', 'Risk'].join(',')
    const lines = rows.map((r, i) =>
      [
        i + 1,
        `"${r.inst.canonical_name}"`,
        r.inst.nation,
        ...activeTab.metrics.map(({ key }) => getValue(key, r.fin, r.health).toFixed(2)),
        r.health.score,
        r.health.grade,
        r.fin.risk_flag,
      ].join(','),
    )
    const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hestats-rankings-${activeTab.id}-${latestYear}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-[1600px] mx-auto px-3 sm:px-4 py-2.5 space-y-2.5">
      {/* Status bar */}
      <div
        className="flex flex-wrap items-center gap-x-2 gap-y-1.5 px-3 py-2 border"
        style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3, fontSize: 11 }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <ArrowUpDown className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--accent)' }} />
          <span style={{ color: 'var(--muted)', letterSpacing: '0.06em' }}>RANKINGS</span>
          <div className="flex items-center gap-1.5">
            <span style={{ color: 'var(--text-2)' }}>FY</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent outline-none font-num"
              style={{ color: 'var(--text)', fontSize: 11, border: '1px solid var(--border)', borderRadius: 2, padding: '1px 4px', cursor: 'pointer' }}
            >
              {AVAILABLE_YEARS.map((y) => (
                <option key={y} value={y} style={{ backgroundColor: 'var(--bg-2)', color: 'var(--text)' }}>{y}</option>
              ))}
            </select>
          </div>
          <span className="hidden sm:inline" style={{ color: 'var(--text-2)' }}>
            <span className="font-num" style={{ color: 'var(--text)' }}>{rows.length}</span> institutions
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter…"
            className="px-2 py-1 bg-transparent outline-none"
            style={{ border: '1px solid var(--border)', borderRadius: 2, color: 'var(--text)', fontSize: 11, width: 100, minWidth: 0 }}
          />
          <button
            onClick={downloadCsv}
            className="flex items-center gap-1.5 px-2 py-1 transition-colors whitespace-nowrap"
            style={{ border: '1px solid var(--border)', borderRadius: 2, color: 'var(--text-2)', fontSize: 10.5 }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <Download className="w-3 h-3" /> CSV
          </button>
        </div>
      </div>

      {/* Tabs — scrollable on mobile */}
      <div className="overflow-x-auto -mx-3 sm:mx-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex px-3 sm:px-0" style={{ minWidth: 'max-content' }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab)}
              className="px-3 sm:px-4 py-2.5 transition-colors whitespace-nowrap"
              style={{
                color: activeTab.id === tab.id ? 'var(--text)' : 'var(--text-2)',
                borderBottom: activeTab.id === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                fontSize: 12,
                fontWeight: activeTab.id === tab.id ? 500 : 400,
                marginBottom: -1,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div
        className="border overflow-hidden"
        style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}
      >
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: 480 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-2)' }}>
                <th className="px-2 sm:px-3 py-2 text-left" style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500, width: 28 }}>#</th>
                <th className="px-2 sm:px-3 py-2 text-left" style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500, minWidth: 140 }}>Institution</th>
                {activeTab.metrics.map(({ key, label }) => (
                  <th
                    key={key}
                    className="px-3 py-2 text-right cursor-pointer select-none"
                    onClick={() => handleSort(key)}
                    style={{
                      color: sortKey === key ? 'var(--accent)' : 'var(--muted)',
                      fontSize: 9,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {label} {sortKey === key ? (sortDir === 'desc' ? '▼' : '▲') : ''}
                  </th>
                ))}
                <th className="px-2 sm:px-3 py-2 text-right cursor-pointer select-none" onClick={() => handleSort('health')}
                  style={{ color: sortKey === 'health' ? 'var(--accent)' : 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500, whiteSpace: 'nowrap' }}>
                  Health {sortKey === 'health' ? (sortDir === 'desc' ? '▼' : '▲') : ''}
                </th>
                <th className="hidden sm:table-cell px-3 py-2 text-right" style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}>Risk</th>
                <th className="hidden md:table-cell px-3 py-2 text-right" style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}>Trend</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => {
                const prevVal = r.prevFin ? getValue(sortKey, r.prevFin, computeHealthScore(r.prevFin)) : null
                const curVal = getValue(sortKey, r.fin, r.health)
                const yoy = prevVal != null && prevVal !== 0 ? ((curVal - prevVal) / Math.abs(prevVal)) * 100 : null
                const positive = isLowerBetter(sortKey) ? (yoy ?? 0) < 0 : (yoy ?? 0) > 0
                return (
                  <tr
                    key={r.inst.id}
                    className="transition-colors group"
                    style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--panel-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td className="px-2 sm:px-3 py-2 font-num tabular-nums" style={{ color: 'var(--muted)', fontSize: 11 }}>
                      {(idx + 1).toString().padStart(2, '0')}
                    </td>
                    <td className="px-2 sm:px-3 py-2">
                      <Link to={`/universities/${r.inst.id}`} className="flex items-center gap-1.5 min-w-0">
                        <NationBadge nation={r.inst.nation} size="sm" />
                        <span className="truncate group-hover:underline" style={{ color: 'var(--text)', fontSize: 11.5, fontWeight: 500 }}>
                          {r.inst.canonical_name}
                        </span>
                      </Link>
                    </td>
                    {activeTab.metrics.map(({ key }) => {
                      const val = getValue(key, r.fin, r.health)
                      const maxV = maxVals[key] ?? 1
                      const barPct = maxV > 0 ? Math.min((Math.abs(val) / maxV) * 100, 100) : 0
                      const isActive = key === sortKey
                      return (
                        <td key={key} className="px-2 sm:px-3 py-2 text-right" style={{ minWidth: 80 }}>
                          <div className="flex items-center justify-end gap-1.5">
                            <div className="hidden sm:block" style={{ width: 36, height: 3, backgroundColor: 'var(--border)', borderRadius: 1, flexShrink: 0 }}>
                              <div
                                style={{
                                  height: '100%',
                                  width: `${barPct}%`,
                                  backgroundColor: isActive ? 'var(--accent)' : 'var(--border-strong)',
                                  borderRadius: 1,
                                  opacity: isActive ? 0.9 : 0.6,
                                }}
                              />
                            </div>
                            <span className="font-num tabular-nums" style={{ color: isActive ? 'var(--text)' : 'var(--text-2)', fontSize: 11.5, fontWeight: isActive ? 600 : 400 }}>
                              {fmt(key, val)}
                            </span>
                          </div>
                        </td>
                      )
                    })}
                    <td className="px-2 sm:px-3 py-2 text-right">
                      <HealthBadge score={r.health.score} grade={r.health.grade} size="sm" showScore />
                    </td>
                    <td className="hidden sm:table-cell px-3 py-2 text-right">
                      <RiskBadge risk={r.fin.risk_flag} size="sm" />
                    </td>
                    <td className="hidden md:table-cell px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Sparkline values={r.history} width={36} height={11} color="var(--link)" />
                        {yoy !== null && (
                          <span className="font-num tabular-nums flex items-center" style={{ color: positive ? 'var(--positive)' : 'var(--negative)', fontSize: 10 }}>
                            {positive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                            {Math.abs(yoy).toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ color: 'var(--muted)', fontSize: 11 }}>
        {rows.length} institutions · FY{latestYear} · Click column headers to sort ·{' '}
        <Link to="/about" className="hover:underline" style={{ color: 'var(--link)' }}>Methodology</Link>
      </div>
    </div>
  )
}
