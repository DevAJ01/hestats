import { useState, useMemo } from 'react'
import { Link } from 'react-router'
import { TrendingUp, TrendingDown, Users, Briefcase, GraduationCap, Globe, ArrowUpRight, Search } from 'lucide-react'
import { getAllOutcomes, getSectorOutcomes, getOutcomesByInstitution, type GraduateOutcome } from '../data/outcomes'
import { institutions } from '../data/institutions'
import { DEGREES, getSectorDegreeStats } from '../data/degrees'
import { EMPLOYERS, getTopEmployersForInstitution } from '../data/employers'
import { formatNumber, isKnownNumber } from '../data/financials'
import { NationBadge } from '../components/institutions/NationBadge'
import { Panel } from '../components/layout/Panel'
import { Sparkline } from '../components/charts/Sparkline'

type Tab = 'overview' | 'institutions' | 'subjects' | 'employers'
type SortKey = keyof Pick<GraduateOutcome, 'employment_rate_15mo' | 'avg_salary_k' | 'graduate_role_pct' | 'further_study_pct' | 'avg_months_to_job' | 'nss_overall_pct' | 'placement_participation_pct'>

const SORT_OPTIONS: { key: SortKey; label: string; unit: string; higherBetter: boolean }[] = [
  { key: 'employment_rate_15mo', label: 'Employment Rate', unit: '%', higherBetter: true },
  { key: 'avg_salary_k', label: 'Avg Salary', unit: '£k', higherBetter: true },
  { key: 'graduate_role_pct', label: 'Graduate-Level Roles', unit: '%', higherBetter: true },
  { key: 'further_study_pct', label: 'Further Study', unit: '%', higherBetter: true },
  { key: 'placement_participation_pct', label: 'Placement Rate', unit: '%', higherBetter: true },
  { key: 'nss_overall_pct', label: 'NSS Score', unit: '%', higherBetter: true },
  { key: 'avg_months_to_job', label: 'Months to Job', unit: 'mo', higherBetter: false },
]

function fmtPct(n: number | null | undefined) { return isKnownNumber(n) ? `${n.toFixed(1)}%` : 'Pending' }
function fmtK(n: number | null | undefined) { return isKnownNumber(n) ? `£${n.toFixed(0)}k` : 'Pending' }
function fmtMo(n: number | null | undefined) { return isKnownNumber(n) ? `${n.toFixed(1)} mo` : 'Pending' }

export function GraduateOutcomesPage() {
  return (
    <div className="max-w-[1600px] mx-auto px-3 sm:px-4 py-8">
      <Panel title="Graduate Outcomes" subtitle="Awaiting official outcome-source rows">
        <div className="px-3 py-8 text-center">
          <GraduationCap className="w-6 h-6 mx-auto mb-3" style={{ color: 'var(--muted)' }} />
          <p style={{ color: 'var(--text-2)', fontSize: 13, marginBottom: 4 }}>Graduate outcome statistics are pending verification.</p>
          <p style={{ color: 'var(--muted)', fontSize: 11.5, lineHeight: 1.6 }}>
            Employment, salary, NSS, TEF, placement, subject, and employer metrics are withheld until HESA Graduate Outcomes, LEO, OfS, or other official source rows are attached.
          </p>
        </div>
      </Panel>
    </div>
  )

  const [tab, setTab] = useState<Tab>('overview')
  const [sortKey, setSortKey] = useState<SortKey>('employment_rate_15mo')
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')
  const [search, setSearch] = useState('')
  const [expandedEmp, setExpandedEmp] = useState<string | null>(null)

  const sector = getSectorOutcomes()
  const degreeStats = getSectorDegreeStats()
  const allOutcomes = getAllOutcomes()

  const tableRows = useMemo(() => {
    return institutions
      .map((inst) => ({ inst, outcome: getOutcomesByInstitution(inst.id) }))
      .filter((r): r is { inst: typeof r.inst; outcome: GraduateOutcome } => !!r.outcome)
      .filter((r) => !search || r.inst.canonical_name.toLowerCase().includes(search.toLowerCase()) || r.inst.short_name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        const av = a.outcome[sortKey]
        const bv = b.outcome[sortKey]
        if (!isKnownNumber(av) || !isKnownNumber(bv)) return isKnownNumber(av) ? -1 : isKnownNumber(bv) ? 1 : 0
        return sortDir === 'desc' ? bv - av : av - bv
      })
  }, [sortKey, sortDir, search])

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => d === 'desc' ? 'asc' : 'desc')
    else { setSortKey(key); setSortDir(SORT_OPTIONS.find((s) => s.key === key)?.higherBetter ? 'desc' : 'asc') }
  }

  const topEmp = [...allOutcomes].filter((o) => isKnownNumber(o.employment_rate_15mo)).sort((a, b) => (b.employment_rate_15mo ?? 0) - (a.employment_rate_15mo ?? 0)).slice(0, 5)
  const topSalary = [...allOutcomes].filter((o) => isKnownNumber(o.avg_salary_k)).sort((a, b) => (b.avg_salary_k ?? 0) - (a.avg_salary_k ?? 0)).slice(0, 5)
  const tef_gold = institutions.filter((i) => getOutcomesByInstitution(i.id)?.tef_rating === 'Gold').length
  const tef_silver = institutions.filter((i) => getOutcomesByInstitution(i.id)?.tef_rating === 'Silver').length

  return (
    <div className="max-w-[1600px] mx-auto px-3 sm:px-4 py-2.5 space-y-2.5">
      {/* Status bar */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-1.5 border" style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3, fontSize: 11 }}>
        <GraduationCap className="w-3 h-3" style={{ color: 'var(--positive)' }} />
        <span style={{ color: 'var(--muted)', letterSpacing: '0.06em' }}>GRADUATE OUTCOMES</span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}>Sector avg employment <span className="font-num" style={{ color: 'var(--positive)' }}>{fmtPct(sector.avg_employment_rate)}</span></span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}>Avg salary <span className="font-num" style={{ color: 'var(--text)' }}>{fmtK(sector.avg_salary_k)}</span></span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}><span className="font-num" style={{ color: 'var(--text)' }}>{formatNumber(sector.total_graduates_annually)}</span> graduates/year</span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}><span className="font-num" style={{ color: 'var(--warning)' }}>TEF Gold: {tef_gold}</span> · Silver: {tef_silver}</span>
        <div className="ml-auto flex items-center gap-2">
          <span style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.04em' }}>Source: Graduate Outcomes Survey · HESA</span>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 border-l border-t" style={{ borderColor: 'var(--border)' }}>
        {[
          { label: 'Avg Employment', value: fmtPct(sector.avg_employment_rate), color: 'var(--positive)', sub: '15 months post-grad' },
          { label: 'Graduate Roles', value: fmtPct(sector.avg_graduate_role_pct), color: 'var(--positive)', sub: 'in professional roles' },
          { label: 'Avg Salary', value: fmtK(sector.avg_salary_k), color: 'var(--text)', sub: '15 months post-grad' },
          { label: 'Median Salary', value: fmtK(sector.avg_median_salary_k), color: 'var(--text)', sub: 'across all subjects' },
          { label: 'Further Study', value: fmtPct(sector.avg_further_study_pct), color: 'var(--link)', sub: 'postgraduate study' },
          { label: 'Avg Unemployed', value: fmtPct(sector.avg_unemployed_pct), color: 'var(--warning)', sub: '15 months post-grad' },
          { label: 'Time to Job', value: fmtMo(sector.avg_months_to_job), color: 'var(--text)', sub: 'average months' },
          { label: 'NSS Satisfaction', value: fmtPct(sector.avg_nss), color: 'var(--positive)', sub: 'sector average' },
        ].map(({ label, value, color, sub }) => (
          <div key={label} className="px-3 py-2.5 border-r border-b" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)' }}>
            <p style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>{label}</p>
            <p className="font-num" style={{ color, fontSize: 17, fontWeight: 700, lineHeight: 1.1 }}>{value}</p>
            <p style={{ color: 'var(--muted)', fontSize: 9.5, marginTop: 2 }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto -mx-3 sm:mx-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex px-3 sm:px-0" style={{ minWidth: 'max-content' }}>
          {([['overview', 'Overview'], ['institutions', 'By Institution'], ['subjects', 'By Subject'], ['employers', 'Top Employers']] as [Tab, string][]).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className="px-4 py-2.5 whitespace-nowrap transition-colors"
              style={{ color: tab === id ? 'var(--text)' : 'var(--text-2)', borderBottom: tab === id ? '2px solid var(--accent)' : '2px solid transparent', fontSize: 12.5, fontWeight: tab === id ? 500 : 400, marginBottom: -1 }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
          <Panel title="Top Employment Rate" subtitle="Institutions with highest 15-month employment">
            <div className="space-y-2.5">
              {topEmp.map((o, i) => {
                const inst = institutions.find((x) => x.id === o.institution_id)
                if (!inst) return null
                return (
                  <div key={o.institution_id} className="flex items-center gap-2">
                    <span className="font-num" style={{ color: 'var(--muted)', fontSize: 10, width: 16, flexShrink: 0 }}>{i + 1}</span>
                    <Link to={`/universities/${inst.id}`} className="flex-1 min-w-0 hover:underline truncate" style={{ color: 'var(--text)', fontSize: 12 }}>{inst.short_name}</Link>
                    <div className="flex-1 h-1.5" style={{ backgroundColor: 'var(--bg-2)', borderRadius: 1 }}>
                      <div style={{ height: '100%', width: `${o.employment_rate_15mo}%`, backgroundColor: 'var(--positive)', borderRadius: 1 }} />
                    </div>
                    <span className="font-num" style={{ color: 'var(--positive)', fontSize: 12, fontWeight: 600, width: 36, textAlign: 'right', flexShrink: 0 }}>{o.employment_rate_15mo}%</span>
                  </div>
                )
              })}
            </div>
          </Panel>

          <Panel title="Top Graduate Salaries" subtitle="Avg starting salary 15 months post-graduation">
            <div className="space-y-2.5">
              {topSalary.map((o, i) => {
                const inst = institutions.find((x) => x.id === o.institution_id)
                if (!inst) return null
                const maxSal = topSalary[0]?.avg_salary_k
                return (
                  <div key={o.institution_id} className="flex items-center gap-2">
                    <span className="font-num" style={{ color: 'var(--muted)', fontSize: 10, width: 16, flexShrink: 0 }}>{i + 1}</span>
                    <Link to={`/universities/${inst.id}`} className="flex-1 min-w-0 hover:underline truncate" style={{ color: 'var(--text)', fontSize: 12 }}>{inst.short_name}</Link>
                    <div className="flex-1 h-1.5" style={{ backgroundColor: 'var(--bg-2)', borderRadius: 1 }}>
                      <div style={{ height: '100%', width: `${isKnownNumber(o.avg_salary_k) && isKnownNumber(maxSal) && maxSal > 0 ? (o.avg_salary_k / maxSal) * 100 : 0}%`, backgroundColor: 'var(--link)', borderRadius: 1 }} />
                    </div>
                    <span className="font-num" style={{ color: 'var(--link)', fontSize: 12, fontWeight: 600, width: 36, textAlign: 'right', flexShrink: 0 }}>£{o.avg_salary_k}k</span>
                  </div>
                )
              })}
            </div>
          </Panel>

          <Panel title="Outcome Composition" subtitle="Sector-wide graduate destinations">
            <div className="space-y-3">
              {[
                { label: 'Employed (any)', pct: sector.avg_employment_rate, color: 'var(--positive)' },
                { label: 'Graduate-level role', pct: sector.avg_graduate_role_pct, color: '#5fa97b' },
                { label: 'Further study', pct: sector.avg_further_study_pct, color: 'var(--link)' },
                { label: 'Unemployed', pct: sector.avg_unemployed_pct, color: 'var(--negative)' },
              ].map(({ label, pct, color }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span style={{ color: 'var(--text-2)', fontSize: 11.5 }}>{label}</span>
                    <span className="font-num" style={{ color, fontSize: 12, fontWeight: 600 }}>{pct}%</span>
                  </div>
                  <div className="h-1.5" style={{ backgroundColor: 'var(--bg-2)', borderRadius: 1 }}>
                    <div style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: 1, opacity: 0.8 }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <p style={{ color: 'var(--muted)', fontSize: 10.5, lineHeight: 1.5 }}>
                Based on HESA Graduate Outcomes Survey (15 months post-graduation). Illustrative figures derived from published sector averages.
              </p>
            </div>
          </Panel>

          {/* AI Impact headline */}
          <div className="lg:col-span-3">
            <Panel title="AI Impact on Graduate Employment — Degree Risk Heatmap" subtitle="Estimated automation risk vs augmentation potential by subject area (modelled — see methodology)">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {DEGREES.sort((a, b) => b.ai_automation_risk_pct - a.ai_automation_risk_pct).map((d) => {
                  const riskColor = d.ai_automation_risk_pct >= 50 ? 'var(--negative)' : d.ai_automation_risk_pct >= 35 ? 'var(--warning)' : 'var(--positive)'
                  return (
                    <div key={d.id} className="p-2.5 border" style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3 }}>
                      <p style={{ fontSize: 18, marginBottom: 2 }}>{d.emoji}</p>
                      <p style={{ color: 'var(--text)', fontSize: 11, fontWeight: 600, lineHeight: 1.2, marginBottom: 4 }}>{d.name}</p>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span style={{ color: 'var(--muted)', fontSize: 9 }}>AI Risk</span>
                        <span className="font-num" style={{ color: riskColor, fontSize: 11, fontWeight: 700 }}>{d.ai_automation_risk_pct}%</span>
                      </div>
                      <div className="h-1" style={{ backgroundColor: 'var(--border)', borderRadius: 1 }}>
                        <div style={{ height: '100%', width: `${d.ai_automation_risk_pct}%`, backgroundColor: riskColor, borderRadius: 1 }} />
                      </div>
                      <p style={{ color: 'var(--muted)', fontSize: 9, marginTop: 3 }}>
                        <span style={{ color: 'var(--positive)' }}>+{d.ai_augmentation_pct}%</span> augmented
                      </p>
                    </div>
                  )
                })}
              </div>
              <p style={{ color: 'var(--muted)', fontSize: 10, marginTop: 10, lineHeight: 1.5 }}>
                AI automation risk estimates are modelled projections based on McKinsey Global Institute, Oxford Future of Work Research, and ONS labour market analysis. Not official statistics.
              </p>
            </Panel>
          </div>
        </div>
      )}

      {/* ── BY INSTITUTION ── */}
      {tab === 'institutions' && (
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter institutions…"
                className="pl-7 pr-3 py-1.5 bg-transparent outline-none"
                style={{ border: '1px solid var(--border)', borderRadius: 3, color: 'var(--text)', fontSize: 11, width: 200 }} />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SORT_OPTIONS.map((s) => (
                <button key={s.key} onClick={() => handleSort(s.key)}
                  className="px-2 py-1 transition-colors text-xs"
                  style={{
                    border: `1px solid ${sortKey === s.key ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 3,
                    color: sortKey === s.key ? 'var(--accent)' : 'var(--text-2)',
                    fontSize: 10.5,
                    fontWeight: sortKey === s.key ? 600 : 400,
                  }}>
                  {s.label} {sortKey === s.key ? (sortDir === 'desc' ? '▼' : '▲') : ''}
                </button>
              ))}
            </div>
          </div>
          <div className="border overflow-hidden" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}>
            <div className="overflow-x-auto">
              <table className="w-full" style={{ minWidth: 700 }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-2)', borderBottom: '1px solid var(--border)' }}>
                    <th className="px-2 py-2 text-left" style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', width: 28 }}>#</th>
                    <th className="px-3 py-2 text-left" style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', minWidth: 160 }}>Institution</th>
                    {SORT_OPTIONS.map((s) => (
                      <th key={s.key} onClick={() => handleSort(s.key)} className="px-2 py-2 text-right cursor-pointer"
                        style={{ color: sortKey === s.key ? 'var(--accent)' : 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        {s.label} {sortKey === s.key ? (sortDir === 'desc' ? '▼' : '▲') : ''}
                      </th>
                    ))}
                    <th className="hidden md:table-cell px-2 py-2 text-right" style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase' }}>TEF</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map(({ inst, outcome }, idx) => {
                    const sort = SORT_OPTIONS.find((s) => s.key === sortKey)!
                    return (
                      <tr key={inst.id} className="transition-colors group" style={{ borderBottom: '1px solid var(--border)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--panel-hover)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                        <td className="px-2 py-2 font-num" style={{ color: 'var(--muted)', fontSize: 10 }}>{(idx + 1).toString().padStart(2, '0')}</td>
                        <td className="px-3 py-2">
                          <Link to={`/universities/${inst.id}`} className="flex items-center gap-1.5 min-w-0">
                            <NationBadge nation={inst.nation} size="sm" />
                            <span className="truncate group-hover:underline" style={{ color: 'var(--text)', fontSize: 11.5, fontWeight: 500 }}>{inst.canonical_name}</span>
                          </Link>
                        </td>
                        {SORT_OPTIONS.map((s) => {
                          const val = outcome[s.key] as number
                          const isActive = s.key === sortKey
                          const fmt = s.unit === '%' ? fmtPct(val) : s.unit === '£k' ? fmtK(val) : fmtMo(val)
                          const color = isActive ? (s.higherBetter ? 'var(--positive)' : 'var(--negative)') : 'var(--text-2)'
                          return (
                            <td key={s.key} className="px-2 py-2 text-right font-num tabular-nums" style={{ color, fontSize: 11.5, fontWeight: isActive ? 600 : 400 }}>
                              {fmt}
                            </td>
                          )
                        })}
                        <td className="hidden md:table-cell px-2 py-2 text-right">
                          <span style={{ fontSize: 9.5, padding: '1px 5px', borderRadius: 2,
                            backgroundColor: outcome.tef_rating === 'Gold' ? '#c2945a22' : outcome.tef_rating === 'Silver' ? 'var(--border)' : 'var(--bg-2)',
                            color: outcome.tef_rating === 'Gold' ? 'var(--warning)' : 'var(--muted)', fontWeight: 600 }}>
                            {outcome.tef_rating}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 11, marginTop: 8 }}>{tableRows.length} institutions · Graduate Outcomes Survey · Illustrative model data</p>
        </div>
      )}

      {/* ── BY SUBJECT ── */}
      {tab === 'subjects' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          {DEGREES.sort((a, b) => b.employment_rate_pct - a.employment_rate_pct).map((d) => {
            const riskColor = d.ai_automation_risk_pct >= 50 ? 'var(--negative)' : d.ai_automation_risk_pct >= 35 ? 'var(--warning)' : 'var(--positive)'
            return (
              <div key={d.id} className="border p-3" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}>
                <div className="flex items-start gap-2 mb-2">
                  <span style={{ fontSize: 22 }}>{d.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p style={{ color: 'var(--text)', fontSize: 12.5, fontWeight: 600, lineHeight: 1.2 }}>{d.name}</p>
                    <p style={{ color: 'var(--muted)', fontSize: 10 }}>{d.annual_graduations.toLocaleString()} graduates/year</p>
                  </div>
                  <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 2,
                    backgroundColor: d.ai_demand_outlook === 'High' ? 'var(--positive-bg)' : 'var(--bg-2)',
                    color: d.ai_demand_outlook === 'High' ? 'var(--positive)' : 'var(--muted)', fontWeight: 600 }}>
                    {d.ai_demand_outlook}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                  {[
                    { l: 'Employment', v: `${d.employment_rate_pct}%`, c: 'var(--positive)' },
                    { l: 'Avg Salary', v: `£${d.avg_salary_k}k`, c: 'var(--text)' },
                    { l: 'Further Study', v: `${d.further_study_pct}%`, c: 'var(--link)' },
                    { l: 'NSS', v: `${d.satisfaction_score}%`, c: 'var(--text-2)' },
                  ].map(({ l, v, c }) => (
                    <div key={l} className="px-2 py-1.5" style={{ backgroundColor: 'var(--bg-2)', borderRadius: 2 }}>
                      <p style={{ color: 'var(--muted)', fontSize: 8.5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{l}</p>
                      <p className="font-num" style={{ color: c, fontSize: 13, fontWeight: 700 }}>{v}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span style={{ color: 'var(--muted)', fontSize: 9.5 }}>AI automation risk</span>
                    <span className="font-num" style={{ color: riskColor, fontSize: 10, fontWeight: 700 }}>{d.ai_automation_risk_pct}%</span>
                  </div>
                  <div className="h-1.5" style={{ backgroundColor: 'var(--bg-2)', borderRadius: 1 }}>
                    <div style={{ height: '100%', width: `${d.ai_automation_risk_pct}%`, backgroundColor: riskColor, borderRadius: 1, opacity: 0.8 }} />
                  </div>
                </div>
                <p style={{ color: 'var(--muted)', fontSize: 9.5, marginTop: 6 }}>
                  Top: {d.top_institutions.slice(0, 3).join(', ')}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* ── TOP EMPLOYERS ── */}
      {tab === 'employers' && (
        <div className="space-y-2">
          {EMPLOYERS.slice(0, 12).map((emp) => (
            <div key={emp.id} className="border overflow-hidden" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
                onClick={() => setExpandedEmp(expandedEmp === emp.id ? null : emp.id)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600 }}>{emp.name}</p>
                    <span style={{ fontSize: 9.5, padding: '1px 5px', borderRadius: 2, backgroundColor: 'var(--bg-2)', color: 'var(--muted)' }}>{emp.sector}</span>
                  </div>
                  <p style={{ color: 'var(--muted)', fontSize: 10.5 }}>{emp.hq_city} · {emp.annual_graduate_intake.toLocaleString()} graduates/yr · Avg £{emp.avg_starting_salary_k}k</p>
                </div>
                <div className="hidden sm:flex items-center gap-4">
                  <div className="text-right">
                    <p style={{ color: 'var(--muted)', fontSize: 9 }}>AI Exposure</p>
                    <p className="font-num" style={{ color: emp.ai_exposure_pct >= 70 ? 'var(--negative)' : emp.ai_exposure_pct >= 50 ? 'var(--warning)' : 'var(--positive)', fontSize: 12, fontWeight: 600 }}>{emp.ai_exposure_pct}%</p>
                  </div>
                  <div className="text-right">
                    <p style={{ color: 'var(--muted)', fontSize: 9 }}>Retention</p>
                    <p className="font-num" style={{ color: 'var(--text)', fontSize: 12, fontWeight: 600 }}>{emp.retention_rate}%</p>
                  </div>
                </div>
                <span style={{ color: 'var(--muted)', fontSize: 10 }}>{expandedEmp === emp.id ? '▲' : '▼'}</span>
              </button>
              {expandedEmp === emp.id && (
                <div className="px-3 pb-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <p style={{ color: 'var(--text-2)', fontSize: 12, lineHeight: 1.6, marginTop: 10, marginBottom: 10 }}>{emp.description}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p style={{ color: 'var(--muted)', fontSize: 9.5, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Top university suppliers</p>
                      <div className="space-y-1.5">
                        {emp.top_universities.map(({ id, name, annual_hires }) => (
                          <div key={id} className="flex items-center gap-2">
                            <Link to={`/universities/${id}`} className="hover:underline" style={{ color: 'var(--text)', fontSize: 11.5, width: 100, flexShrink: 0 }}>{name}</Link>
                            <div className="flex-1 h-1.5" style={{ backgroundColor: 'var(--bg-2)', borderRadius: 1 }}>
                              <div style={{ height: '100%', width: `${(annual_hires / emp.top_universities[0].annual_hires) * 100}%`, backgroundColor: 'var(--accent)', borderRadius: 1 }} />
                            </div>
                            <span className="font-num" style={{ color: 'var(--text-2)', fontSize: 11, width: 36, textAlign: 'right', flexShrink: 0 }}>{annual_hires} hires</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p style={{ color: 'var(--muted)', fontSize: 9.5, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Top degree subjects</p>
                      <div className="flex flex-wrap gap-1.5">
                        {emp.top_subjects.map((s) => (
                          <span key={s} style={{ fontSize: 11, padding: '2px 7px', border: '1px solid var(--border)', borderRadius: 2, color: 'var(--text-2)', backgroundColor: 'var(--bg-2)' }}>{s}</span>
                        ))}
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {[
                          { l: 'Annual intake', v: emp.annual_graduate_intake.toLocaleString() },
                          { l: 'Internship %', v: `${emp.internship_pipeline_pct}%` },
                          { l: '3-yr retention', v: `${emp.retention_rate}%` },
                        ].map(({ l, v }) => (
                          <div key={l} className="p-2" style={{ backgroundColor: 'var(--bg-2)', borderRadius: 3 }}>
                            <p style={{ color: 'var(--muted)', fontSize: 9 }}>{l}</p>
                            <p className="font-num" style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600 }}>{v}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="px-3 py-2 border flex flex-wrap items-center gap-x-4 gap-y-1" style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3 }}>
        <span style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.06em' }}>DATA SOURCES</span>
        <span style={{ color: 'var(--text-2)', fontSize: 11 }}>HESA Graduate Outcomes Survey · NSS · TEF 2023 · OfS · Illustrative model data seeded from institutional tier and financial health</span>
        <Link to="/about" className="ml-auto flex items-center gap-1 hover:underline" style={{ color: 'var(--link)', fontSize: 11 }}>
          Methodology <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  )
}
