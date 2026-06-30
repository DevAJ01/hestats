import { useState } from 'react'
import { Link } from 'react-router'
import { BookOpen, ArrowUpRight, TrendingUp, Zap, ChevronDown, ChevronUp } from 'lucide-react'
import { DEGREES, getSectorDegreeStats, type Degree } from '../data/degrees'
import { EMPLOYERS } from '../data/employers'
import { institutions } from '../data/institutions'
import { Panel } from '../components/layout/Panel'

type SortKey = 'employment_rate_pct' | 'avg_salary_k' | 'ai_automation_risk_pct' | 'ai_resilience_score' | 'further_study_pct' | 'annual_graduations'
type FilterKey = 'all' | 'high-ai-risk' | 'low-ai-risk' | 'high-employment' | 'high-salary'

const OUTLOOK_COLOR: Record<Degree['ai_demand_outlook'], string> = {
  High: 'var(--positive)',
  Growing: 'var(--link)',
  Stable: 'var(--warning)',
  Declining: 'var(--negative)',
}

function AiRiskBar({ risk, augment }: { risk: number; augment: number }) {
  const color = risk >= 50 ? 'var(--negative)' : risk >= 35 ? 'var(--warning)' : 'var(--positive)'
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span style={{ color: 'var(--muted)', fontSize: 9.5 }}>Automation risk</span>
        <span className="font-num" style={{ color, fontSize: 10.5, fontWeight: 700 }}>{risk}%</span>
      </div>
      <div className="h-1.5" style={{ backgroundColor: 'var(--bg-2)', borderRadius: 1 }}>
        <div style={{ height: '100%', width: `${risk}%`, backgroundColor: color, borderRadius: 1 }} />
      </div>
      <div className="flex items-center justify-between">
        <span style={{ color: 'var(--muted)', fontSize: 9.5 }}>AI augmentation</span>
        <span className="font-num" style={{ color: 'var(--positive)', fontSize: 10.5, fontWeight: 700 }}>+{augment}%</span>
      </div>
    </div>
  )
}

function DegreeCard({ degree, expanded, onToggle }: { degree: Degree; expanded: boolean; onToggle: () => void }) {
  const riskColor = degree.ai_automation_risk_pct >= 50 ? 'var(--negative)' : degree.ai_automation_risk_pct >= 35 ? 'var(--warning)' : 'var(--positive)'
  const outlookColor = OUTLOOK_COLOR[degree.ai_demand_outlook]
  const topInsts = degree.top_institutions.slice(0, 4).map((id) => institutions.find((i) => i.id === id)).filter(Boolean)
  const topEmps = degree.top_employers.slice(0, 3).map((id) => EMPLOYERS.find((e) => e.id === id)).filter(Boolean)

  return (
    <div className="border overflow-hidden" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 4 }}>
      {/* Card top accent */}
      <div className="h-0.5" style={{ backgroundColor: riskColor, opacity: 0.6 }} />

      <button className="w-full p-3 text-left" onClick={onToggle}>
        <div className="flex items-start gap-3">
          <span style={{ fontSize: 24, flexShrink: 0 }}>{degree.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p style={{ color: 'var(--text)', fontSize: 13, fontWeight: 700 }}>{degree.name}</p>
              <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 2, backgroundColor: `${outlookColor}22`, color: outlookColor, fontWeight: 700 }}>
                {degree.ai_demand_outlook} Demand
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
              {[
                { l: 'Employment', v: `${degree.employment_rate_pct}%`, c: 'var(--positive)' },
                { l: 'Avg Salary', v: `£${degree.avg_salary_k}k`, c: 'var(--text)' },
                { l: 'Graduates/yr', v: degree.annual_graduations.toLocaleString(), c: 'var(--text-2)' },
                { l: 'AI Risk', v: `${degree.ai_automation_risk_pct}%`, c: riskColor },
              ].map(({ l, v, c }) => (
                <div key={l}>
                  <p style={{ color: 'var(--muted)', fontSize: 8.5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{l}</p>
                  <p className="font-num" style={{ color: c, fontSize: 13, fontWeight: 700 }}>{v}</p>
                </div>
              ))}
            </div>
            <div className="h-1.5 mb-1" style={{ backgroundColor: 'var(--bg-2)', borderRadius: 1 }}>
              <div style={{ height: '100%', width: `${degree.ai_automation_risk_pct}%`, backgroundColor: riskColor, borderRadius: 1, opacity: 0.7 }} />
            </div>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 flex-shrink-0 mt-1" style={{ color: 'var(--muted)' }} /> : <ChevronDown className="w-4 h-4 flex-shrink-0 mt-1" style={{ color: 'var(--muted)' }} />}
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-4" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
            {/* Full metrics */}
            <div>
              <p style={{ color: 'var(--muted)', fontSize: 9.5, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Full metrics</p>
              {[
                { l: 'Employment rate (15mo)', v: `${degree.employment_rate_pct}%` },
                { l: 'Average salary', v: `£${degree.avg_salary_k}k` },
                { l: 'Median salary', v: `£${degree.median_salary_k}k` },
                { l: 'Further study', v: `${degree.further_study_pct}%` },
                { l: 'PhD progression', v: `${degree.phd_progression_pct}%` },
                { l: 'Annual graduations', v: degree.annual_graduations.toLocaleString() },
                { l: 'NSS satisfaction', v: `${degree.satisfaction_score}%` },
                { l: 'Female students', v: `${degree.gender_female_pct}%` },
                { l: 'International students', v: `${degree.international_pct}%` },
                { l: 'Avg months to job', v: `${degree.avg_months_to_job} months` },
              ].map(({ l, v }) => (
                <div key={l} className="flex items-center justify-between py-1" style={{ borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-2)', fontSize: 11 }}>{l}</span>
                  <span className="font-num" style={{ color: 'var(--text)', fontSize: 11.5, fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>

            {/* AI Impact */}
            <div>
              <p style={{ color: 'var(--muted)', fontSize: 9.5, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>AI impact analysis</p>
              <div className="space-y-3 mb-4">
                <AiRiskBar risk={degree.ai_automation_risk_pct} augment={degree.ai_augmentation_pct} />
                <div className="px-3 py-2.5" style={{ backgroundColor: 'var(--bg-2)', borderRadius: 3, borderLeft: `3px solid ${riskColor}` }}>
                  <p style={{ color: riskColor, fontSize: 11, fontWeight: 600, marginBottom: 3 }}>AI Resilience Score</p>
                  <p className="font-num" style={{ color: riskColor, fontSize: 22, fontWeight: 800 }}>{degree.ai_resilience_score}<span style={{ fontSize: 11, opacity: 0.6 }}>/100</span></p>
                </div>
                <div className="h-1.5" style={{ backgroundColor: 'var(--bg-2)', borderRadius: 1 }}>
                  <div style={{ height: '100%', width: `${degree.ai_resilience_score}%`, backgroundColor: riskColor, borderRadius: 1 }} />
                </div>
              </div>

              {/* Typical roles */}
              <p style={{ color: 'var(--muted)', fontSize: 9.5, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Typical graduate roles</p>
              <div className="flex flex-wrap gap-1.5">
                {degree.typical_job_titles.map((t) => (
                  <span key={t} style={{ fontSize: 10.5, padding: '2px 7px', border: '1px solid var(--border)', borderRadius: 2, color: 'var(--text-2)', backgroundColor: 'var(--bg-2)' }}>{t}</span>
                ))}
              </div>

              <p style={{ color: 'var(--muted)', fontSize: 10, marginTop: 8, lineHeight: 1.5 }}>{degree.uk_ranking_note}</p>
            </div>

            {/* Industry destinations + top employers + top unis */}
            <div>
              <p style={{ color: 'var(--muted)', fontSize: 9.5, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Industry destinations</p>
              <div className="space-y-1.5 mb-4">
                {degree.industry_destinations.map(({ sector, pct }) => (
                  <div key={sector} className="flex items-center gap-2">
                    <span style={{ color: 'var(--text-2)', fontSize: 10.5, flex: 1, minWidth: 0 }}>{sector}</span>
                    <div style={{ width: 60, height: 4, backgroundColor: 'var(--bg-2)', borderRadius: 1 }}>
                      <div style={{ height: '100%', width: `${pct * 2}%`, backgroundColor: 'var(--accent)', borderRadius: 1, opacity: 0.75 }} />
                    </div>
                    <span className="font-num" style={{ color: 'var(--text-2)', fontSize: 10.5, width: 28, textAlign: 'right', flexShrink: 0 }}>{pct}%</span>
                  </div>
                ))}
              </div>

              {topEmps.length > 0 && (
                <>
                  <p style={{ color: 'var(--muted)', fontSize: 9.5, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Top employers</p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {topEmps.map((e) => e && (
                      <Link key={e.id} to="/employers" style={{ fontSize: 11, padding: '2px 7px', border: '1px solid var(--border)', borderRadius: 2, color: 'var(--link)', textDecoration: 'none', backgroundColor: 'var(--bg-2)' }}>
                        {e.name}
                      </Link>
                    ))}
                  </div>
                </>
              )}

              {topInsts.length > 0 && (
                <>
                  <p style={{ color: 'var(--muted)', fontSize: 9.5, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Top institutions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {topInsts.map((i) => i && (
                      <Link key={i.id} to={`/institutions/${i.id}`} style={{ fontSize: 11, padding: '2px 7px', border: '1px solid var(--border)', borderRadius: 2, color: 'var(--text-2)', textDecoration: 'none', backgroundColor: 'var(--bg-2)' }}>
                        {i.short_name}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function DegreesPage() {
  const [sort, setSort] = useState<SortKey>('employment_rate_pct')
  const [filter, setFilter] = useState<FilterKey>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const stats = getSectorDegreeStats()

  const sortedDegrees = [...DEGREES]
    .filter((d) => {
      if (filter === 'high-ai-risk') return d.ai_automation_risk_pct >= 40
      if (filter === 'low-ai-risk') return d.ai_automation_risk_pct < 25
      if (filter === 'high-employment') return d.employment_rate_pct >= 90
      if (filter === 'high-salary') return d.avg_salary_k >= 35
      return true
    })
    .sort((a, b) => {
      if (sort === 'ai_automation_risk_pct') return b[sort] - a[sort]
      if (sort === 'ai_resilience_score') return b[sort] - a[sort]
      return (b[sort] as number) - (a[sort] as number)
    })

  return (
    <div className="max-w-[1600px] mx-auto px-3 sm:px-4 py-2.5 space-y-2.5">
      {/* Status bar */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-1.5 border" style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3, fontSize: 11 }}>
        <BookOpen className="w-3 h-3" style={{ color: 'var(--link)' }} />
        <span style={{ color: 'var(--muted)', letterSpacing: '0.06em' }}>DEGREE INTELLIGENCE</span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}><span className="font-num" style={{ color: 'var(--text)' }}>{stats.total_subjects}</span> subjects</span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}>Avg employment <span className="font-num" style={{ color: 'var(--positive)' }}>{stats.avg_employment_rate}%</span></span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}>Avg salary <span className="font-num" style={{ color: 'var(--text)' }}>£{stats.avg_salary_k}k</span></span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}>Avg AI risk <span className="font-num" style={{ color: 'var(--warning)' }}>{stats.avg_ai_risk}%</span></span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}>Most resilient: <span style={{ color: 'var(--positive)' }}>{stats.most_resilient.name}</span></span>
      </div>

      {/* Highlight cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Highest Paid', name: stats.highest_paid.name, val: `£${stats.highest_paid.avg_salary_k}k`, color: 'var(--positive)', emoji: stats.highest_paid.emoji },
          { label: 'Most Employed', name: stats.highest_employed.name, val: `${stats.highest_employed.employment_rate_pct}%`, color: 'var(--link)', emoji: stats.highest_employed.emoji },
          { label: 'Most AI Resilient', name: stats.most_resilient.name, val: `${stats.most_resilient.ai_resilience_score}/100`, color: 'var(--positive)', emoji: stats.most_resilient.emoji },
          { label: 'Highest AI Risk', name: DEGREES.reduce((a, b) => a.ai_automation_risk_pct > b.ai_automation_risk_pct ? a : b).name, val: `${DEGREES.reduce((a, b) => a.ai_automation_risk_pct > b.ai_automation_risk_pct ? a : b).ai_automation_risk_pct}%`, color: 'var(--negative)', emoji: DEGREES.reduce((a, b) => a.ai_automation_risk_pct > b.ai_automation_risk_pct ? a : b).emoji },
        ].map(({ label, name, val, color, emoji }) => (
          <div key={label} className="px-3 py-2.5 border" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}>
            <p style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>{label}</p>
            <p style={{ fontSize: 20, marginBottom: 2 }}>{emoji}</p>
            <p style={{ color: 'var(--text)', fontSize: 11.5, fontWeight: 600, marginBottom: 2 }}>{name}</p>
            <p className="font-num" style={{ color, fontSize: 16, fontWeight: 700 }}>{val}</p>
          </div>
        ))}
      </div>

      {/* Filters and sort */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          {([['all', 'All subjects'], ['high-employment', '90%+ employed'], ['high-salary', '£35k+ salary'], ['low-ai-risk', 'Low AI risk'], ['high-ai-risk', 'High AI risk']] as [FilterKey, string][]).map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)}
              className="px-2.5 py-1 text-xs transition-colors"
              style={{ border: `1px solid ${filter === key ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 3, color: filter === key ? 'var(--accent)' : 'var(--text-2)', fontSize: 10.5 }}>
              {label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-1.5">
          <span style={{ color: 'var(--muted)', fontSize: 10.5, alignSelf: 'center' }}>Sort:</span>
          {([['employment_rate_pct', 'Employment'], ['avg_salary_k', 'Salary'], ['ai_resilience_score', 'AI Resilience'], ['ai_automation_risk_pct', 'AI Risk ↓'], ['annual_graduations', 'Volume']] as [SortKey, string][]).map(([key, label]) => (
            <button key={key} onClick={() => setSort(key)}
              className="px-2 py-1"
              style={{ border: `1px solid ${sort === key ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 3, color: sort === key ? 'var(--accent)' : 'var(--muted)', fontSize: 10, fontWeight: sort === key ? 600 : 400 }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Degree cards */}
      <div className="space-y-2">
        {sortedDegrees.map((d) => (
          <DegreeCard key={d.id} degree={d} expanded={expanded === d.id} onToggle={() => setExpanded(expanded === d.id ? null : d.id)} />
        ))}
      </div>

      <div className="px-3 py-2 border flex flex-wrap items-center gap-x-4 gap-y-1" style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3 }}>
        <span style={{ color: 'var(--muted)', fontSize: 10 }}>Employment, salary, and further study figures from HESA Graduate Outcomes Survey. AI automation risk figures are modelled projections — not official statistics.</span>
        <Link to="/career-explorer" className="ml-auto flex items-center gap-1 hover:underline" style={{ color: 'var(--link)', fontSize: 11 }}>
          Career Explorer <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  )
}
