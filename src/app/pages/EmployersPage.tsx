import { useState } from 'react'
import { Link } from 'react-router'
import { Building2, Search, ArrowUpRight, TrendingUp, Users, Briefcase, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { EMPLOYERS, EMPLOYER_SECTORS, getEmployersBySector, type Employer } from '../data/employers'
import { Panel } from '../components/layout/Panel'

const SECTOR_COLORS: Record<string, string> = {
  'Technology': 'var(--link)',
  'Finance': 'var(--positive)',
  'Consulting & Professional Services': 'var(--warning)',
  'Healthcare': '#e879a0',
  'Manufacturing & Aerospace': '#b18ab8',
  'Defence & Aerospace': '#6fb5b5',
  'Life Sciences': '#5fa97b',
  'Manufacturing & Engineering': '#9b8ea8',
  'Creative Industries & Media': '#f4a460',
  'Government': 'var(--muted)',
  'Manufacturing & Automotive': '#7aab8a',
}

function AIBadge({ pct }: { pct: number }) {
  const color = pct >= 70 ? 'var(--negative)' : pct >= 50 ? 'var(--warning)' : 'var(--positive)'
  const label = pct >= 70 ? 'High AI' : pct >= 50 ? 'Med AI' : 'Low AI'
  return (
    <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 2, backgroundColor: `${color}22`, color, fontWeight: 700, letterSpacing: '0.04em' }}>
      {label} {pct}%
    </span>
  )
}

function isKnown(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function fmtPct(value: number | null | undefined) {
  return isKnown(value) ? `${value}%` : 'Pending'
}

function fmtK(value: number | null | undefined) {
  return isKnown(value) ? `£${value}k` : 'Pending'
}

function avg(values: (number | null)[]) {
  const known = values.filter(isKnown)
  if (!known.length) return null
  return +(known.reduce((sum, value) => sum + value, 0) / known.length).toFixed(1)
}

function EmployerCard({ emp, expanded, onToggle }: { emp: Employer; expanded: boolean; onToggle: () => void }) {
  const sectorColor = SECTOR_COLORS[emp.sector] ?? 'var(--accent)'

  return (
    <div className="border overflow-hidden transition-colors" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 4, borderLeft: `3px solid ${sectorColor}` }}>
      {/* Header row */}
      <button className="w-full flex items-start gap-3 px-3 py-3 text-left" onClick={onToggle}>
        {/* Employer initial badge */}
        <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-sm" style={{ backgroundColor: `${sectorColor}22`, border: `1px solid ${sectorColor}44` }}>
          <span style={{ color: sectorColor, fontSize: 12, fontWeight: 800 }}>{emp.name[0]}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600 }}>{emp.name}</p>
            <span style={{ fontSize: 9.5, padding: '1px 5px', borderRadius: 2, backgroundColor: 'var(--bg-2)', color: 'var(--muted)', fontWeight: 500 }}>{emp.sector}</span>
            <AIBadge pct={emp.ai_exposure_pct} />
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 10.5 }}>{emp.hq_city}</p>
        </div>
        <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
          <div className="text-right">
            <p style={{ color: 'var(--muted)', fontSize: 8.5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>LEO count</p>
            <p className="font-num" style={{ color: 'var(--text)', fontSize: 14, fontWeight: 700 }}>{emp.annual_graduate_intake.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p style={{ color: 'var(--muted)', fontSize: 8.5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Median earnings</p>
            <p className="font-num" style={{ color: 'var(--positive)', fontSize: 14, fontWeight: 700 }}>{fmtK(emp.avg_starting_salary_k)}</p>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4" style={{ color: 'var(--muted)' }} /> : <ChevronDown className="w-4 h-4" style={{ color: 'var(--muted)' }} />}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-3 pb-4" style={{ borderTop: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-2)', fontSize: 12, lineHeight: 1.6, marginTop: 10, marginBottom: 12 }}>{emp.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* University supply table */}
            <div className="md:col-span-2">
              <p style={{ color: 'var(--muted)', fontSize: 9.5, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Provider/company supply</p>
              {emp.top_universities.length > 0 ? (
                <div className="space-y-2">
                  {emp.top_universities.map(({ id, name, annual_hires }, i) => {
                    const maxH = emp.top_universities[0].annual_hires
                    return (
                      <div key={id} className="flex items-center gap-2">
                        <span className="font-num" style={{ color: 'var(--muted)', fontSize: 10, width: 14, flexShrink: 0 }}>{i + 1}</span>
                        <Link to={`/universities/${id}`} className="hover:underline flex-shrink-0" style={{ color: 'var(--text)', fontSize: 11.5, width: 120 }}>{name}</Link>
                        <div className="flex-1 h-2" style={{ backgroundColor: 'var(--bg-2)', borderRadius: 1 }}>
                          <div style={{ height: '100%', width: `${(annual_hires / maxH) * 100}%`, backgroundColor: sectorColor, borderRadius: 1, opacity: 0.75 }} />
                        </div>
                        <span className="font-num" style={{ color: 'var(--text-2)', fontSize: 11, width: 60, textAlign: 'right', flexShrink: 0 }}>{annual_hires} hires/yr</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p style={{ color: 'var(--text-2)', fontSize: 11.5, lineHeight: 1.6 }}>DfE LEO publishes industry-section destinations, not company hiring pipelines. Company-level supplier figures remain withheld unless a verified source is attached.</p>
              )}

              <div className="mt-3">
                <p style={{ color: 'var(--muted)', fontSize: 9.5, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Top subjects hired</p>
                <div className="flex flex-wrap gap-1.5">
                  {emp.top_subjects.map((s) => (
                    <span key={s} style={{ fontSize: 11, padding: '2px 8px', border: '1px solid var(--border)', borderRadius: 2, color: 'var(--text-2)', backgroundColor: 'var(--bg-2)' }}>{s}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-2">
              <p style={{ color: 'var(--muted)', fontSize: 9.5, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Key metrics</p>
              {[
                { label: 'LEO graduates in section', value: emp.annual_graduate_intake.toLocaleString() },
                { label: 'Median earnings', value: fmtK(emp.avg_starting_salary_k) },
                { label: 'Same-section flow', value: fmtPct(emp.retention_rate) },
                { label: 'AI role exposure', value: `${emp.ai_exposure_pct}%` },
                { label: 'Internship conversion', value: emp.internship_pipeline_pct === null ? 'Pending source' : `${emp.internship_pipeline_pct}%` },
                { label: 'Placement partners', value: emp.placement_partnerships.length > 0 ? `${emp.placement_partnerships.length} unis` : 'Pending source' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-2)', fontSize: 11 }}>{label}</span>
                  <span className="font-num" style={{ color: 'var(--text)', fontSize: 12, fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Retention bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span style={{ color: 'var(--muted)', fontSize: 10.5 }}>Same industry section from YAG1 to YAG3</span>
              <span className="font-num" style={{ color: (emp.retention_rate ?? 0) >= 75 ? 'var(--positive)' : (emp.retention_rate ?? 0) >= 60 ? 'var(--warning)' : 'var(--negative)', fontSize: 11, fontWeight: 700 }}>{fmtPct(emp.retention_rate)}</span>
            </div>
            <div className="h-1.5" style={{ backgroundColor: 'var(--bg-2)', borderRadius: 1 }}>
              <div style={{ height: '100%', width: `${emp.retention_rate ?? 0}%`, backgroundColor: (emp.retention_rate ?? 0) >= 75 ? 'var(--positive)' : 'var(--warning)', borderRadius: 1 }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function EmployersPage() {
  const [search, setSearch] = useState('')
  const [sectorFilter, setSectorFilter] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'intake' | 'salary' | 'retention' | 'ai'>('intake')

  const bySector = getEmployersBySector()
  const totalIntake = EMPLOYERS.reduce((s, e) => s + e.annual_graduate_intake, 0)
  const avgSalary = avg(EMPLOYERS.map((e) => e.avg_starting_salary_k))
  const avgAI = +(EMPLOYERS.reduce((s, e) => s + e.ai_exposure_pct, 0) / EMPLOYERS.length).toFixed(0)

  const filtered = EMPLOYERS
    .filter((e) => !sectorFilter || e.sector === sectorFilter)
    .filter((e) => !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.sector.toLowerCase().includes(search.toLowerCase()) || e.hq_city.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'intake') return b.annual_graduate_intake - a.annual_graduate_intake
      if (sortBy === 'salary') return (b.avg_starting_salary_k ?? -Infinity) - (a.avg_starting_salary_k ?? -Infinity)
      if (sortBy === 'retention') return (b.retention_rate ?? -Infinity) - (a.retention_rate ?? -Infinity)
      return b.ai_exposure_pct - a.ai_exposure_pct
    })

  return (
    <div className="max-w-[1600px] mx-auto px-3 sm:px-4 py-2.5 space-y-2.5">
      {/* Status bar */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-1.5 border" style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3, fontSize: 11 }}>
        <Building2 className="w-3 h-3" style={{ color: 'var(--accent)' }} />
        <span style={{ color: 'var(--muted)', letterSpacing: '0.06em' }}>EMPLOYER INTELLIGENCE</span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}><span className="font-num" style={{ color: 'var(--text)' }}>{EMPLOYERS.length}</span> employer markets</span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}>Observed LEO graduates <span className="font-num" style={{ color: 'var(--text)' }}>{totalIntake.toLocaleString()}</span></span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}>Median earnings avg <span className="font-num" style={{ color: 'var(--positive)' }}>{fmtK(avgSalary)}</span></span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}>Avg AI exposure <span className="font-num" style={{ color: 'var(--warning)' }}>{avgAI}%</span></span>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search markets…"
            className="pl-7 pr-3 py-1.5 bg-transparent outline-none"
            style={{ border: '1px solid var(--border)', borderRadius: 3, color: 'var(--text)', fontSize: 11, width: 180 }} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setSectorFilter(null)}
            className="px-2.5 py-1 transition-colors"
            style={{ border: `1px solid ${!sectorFilter ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 3, color: !sectorFilter ? 'var(--accent)' : 'var(--text-2)', fontSize: 10.5 }}>
            All sectors
          </button>
          {EMPLOYER_SECTORS.map((s) => (
            <button key={s} onClick={() => setSectorFilter(sectorFilter === s ? null : s)}
              className="px-2.5 py-1 transition-colors"
              style={{ border: `1px solid ${sectorFilter === s ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 3, color: sectorFilter === s ? 'var(--accent)' : 'var(--text-2)', fontSize: 10 }}>
              {s}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-1.5">
          {([['intake', 'Intake'], ['salary', 'Salary'], ['retention', 'Retention'], ['ai', 'AI Risk']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setSortBy(key)}
              className="px-2 py-1"
              style={{ border: `1px solid ${sortBy === key ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 3, color: sortBy === key ? 'var(--accent)' : 'var(--muted)', fontSize: 10, fontWeight: sortBy === key ? 600 : 400 }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Employer list */}
      <div className="space-y-2">
        {filtered.map((emp) => (
          <EmployerCard key={emp.id} emp={emp} expanded={expanded === emp.id} onToggle={() => setExpanded(expanded === emp.id ? null : emp.id)} />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12" style={{ color: 'var(--muted)', fontSize: 13 }}>No employers match your filters.</div>
        )}
      </div>

      <div className="px-3 py-2 border flex flex-wrap items-center gap-x-4 gap-y-1" style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3 }}>
        <span style={{ color: 'var(--muted)', fontSize: 10 }}>External-analysis guidance · University supply figures stay outside official aggregates unless source coverage is attached</span>
        <Link to="/graduate-outcomes" className="ml-auto flex items-center gap-1 hover:underline" style={{ color: 'var(--link)', fontSize: 11 }}>
          Graduate Outcomes <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  )
}
