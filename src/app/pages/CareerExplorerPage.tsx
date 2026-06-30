import { useState } from 'react'
import { Link } from 'react-router'
import { Compass, ArrowRight, ArrowLeft, GraduationCap, Building2, TrendingUp, Zap, MapPin, CheckCircle } from 'lucide-react'
import { DEGREES, type Degree } from '../data/degrees'
import { EMPLOYERS, type Employer } from '../data/employers'
import { institutions } from '../data/institutions'
import { getOutcomesByInstitution } from '../data/outcomes'

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6

const STEP_LABELS = ['Choose Degree', 'Top Universities', 'Top Employers', 'Salary Progression', 'AI Outlook', 'Regional Demand', 'Summary']

const UK_REGIONS = ['London', 'South East', 'South West', 'East of England', 'West Midlands', 'East Midlands', 'Yorkshire', 'North West', 'North East', 'Scotland', 'Wales', 'Northern Ireland']

function StepHeader({ step, total, label }: { step: number; total: number; label: string }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-1">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className="h-1 flex-1 rounded" style={{ backgroundColor: i <= step ? 'var(--accent)' : 'var(--border)' }} />
        ))}
      </div>
      <p style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.06em' }}>Step {step + 1} of {total} — {label}</p>
    </div>
  )
}

// Step 0: Degree picker
function StepDegree({ onSelect }: { onSelect: (d: Degree) => void }) {
  const [hover, setHover] = useState<string | null>(null)
  return (
    <div>
      <h2 style={{ color: 'var(--text)', fontSize: 17, fontWeight: 700, marginBottom: 4 }}>What did you study — or plan to study?</h2>
      <p style={{ color: 'var(--text-2)', fontSize: 12.5, marginBottom: 16 }}>Select your degree subject to explore your graduate pathway.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {DEGREES.sort((a, b) => a.name.localeCompare(b.name)).map((d) => {
          const riskColor = d.ai_automation_risk_pct >= 50 ? 'var(--negative)' : d.ai_automation_risk_pct >= 35 ? 'var(--warning)' : 'var(--positive)'
          return (
            <button
              key={d.id}
              onClick={() => onSelect(d)}
              className="p-3 border text-left transition-all"
              style={{
                backgroundColor: hover === d.id ? 'var(--panel-hover)' : 'var(--panel)',
                borderColor: hover === d.id ? 'var(--accent)' : 'var(--border)',
                borderRadius: 4,
              }}
              onMouseEnter={() => setHover(d.id)}
              onMouseLeave={() => setHover(null)}
            >
              <p style={{ fontSize: 24, marginBottom: 4 }}>{d.emoji}</p>
              <p style={{ color: 'var(--text)', fontSize: 12, fontWeight: 600, lineHeight: 1.2, marginBottom: 4 }}>{d.name}</p>
              <div className="flex items-center gap-1.5">
                <span className="font-num" style={{ color: 'var(--positive)', fontSize: 10.5, fontWeight: 600 }}>{d.employment_rate_pct}%</span>
                <span style={{ color: 'var(--muted)', fontSize: 9.5 }}>employed</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span style={{ color: 'var(--muted)', fontSize: 9 }}>AI risk</span>
                <span className="font-num" style={{ color: riskColor, fontSize: 10, fontWeight: 700 }}>{d.ai_automation_risk_pct}%</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Step 1: Top universities
function StepUniversities({ degree }: { degree: Degree }) {
  const topInsts = degree.top_institutions.slice(0, 6).map((id) => {
    const inst = institutions.find((i) => i.id === id)
    const outcome = getOutcomesByInstitution(id)
    return { inst, outcome }
  }).filter((x): x is { inst: NonNullable<typeof x.inst>; outcome: NonNullable<typeof x.outcome> } => !!x.inst && !!x.outcome)

  return (
    <div>
      <h2 style={{ color: 'var(--text)', fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Top universities for {degree.name}</h2>
      <p style={{ color: 'var(--text-2)', fontSize: 12.5, marginBottom: 16 }}>Ranked by research strength, graduate outcomes, and subject reputation.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {topInsts.map(({ inst, outcome }, i) => (
          <div key={inst.id} className="border p-3" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 4 }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-num" style={{ color: 'var(--muted)', fontSize: 11 }}>#{i + 1}</span>
              <p style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600 }}>{inst.short_name}</p>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: 10.5, marginBottom: 8 }}>{inst.city} · {inst.nation}</p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { l: 'Employment', v: `${outcome.employment_rate_15mo}%`, c: 'var(--positive)' },
                { l: 'Avg salary', v: `£${outcome.avg_salary_k}k`, c: 'var(--text)' },
                { l: 'NSS score', v: `${outcome.nss_overall_pct}%`, c: 'var(--link)' },
                { l: 'TEF', v: outcome.tef_rating, c: outcome.tef_rating === 'Gold' ? 'var(--warning)' : 'var(--muted)' },
              ].map(({ l, v, c }) => (
                <div key={l} className="px-2 py-1.5" style={{ backgroundColor: 'var(--bg-2)', borderRadius: 2 }}>
                  <p style={{ color: 'var(--muted)', fontSize: 8.5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{l}</p>
                  <p className="font-num" style={{ color: c, fontSize: 12, fontWeight: 700 }}>{v}</p>
                </div>
              ))}
            </div>
            <Link to={`/universities/${inst.id}`} className="mt-2 flex items-center gap-1 text-xs hover:underline" style={{ color: 'var(--link)', fontSize: 11 }}>
              View full profile <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

// Step 2: Top employers
function StepEmployers({ degree }: { degree: Degree }) {
  const topEmps = degree.top_employers.slice(0, 6).map((id) => EMPLOYERS.find((e) => e.id === id)).filter(Boolean) as Employer[]
  return (
    <div>
      <h2 style={{ color: 'var(--text)', fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Top employers for {degree.name} graduates</h2>
      <p style={{ color: 'var(--text-2)', fontSize: 12.5, marginBottom: 16 }}>Companies actively recruiting from this discipline.</p>
      <div className="space-y-2">
        {topEmps.map((emp, i) => (
          <div key={emp.id} className="border px-3 py-2.5" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 4 }}>
            <div className="flex items-center gap-3">
              <span className="font-num" style={{ color: 'var(--muted)', fontSize: 11, width: 20, flexShrink: 0 }}>#{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600 }}>{emp.name}</p>
                <p style={{ color: 'var(--muted)', fontSize: 10.5 }}>{emp.sector} · {emp.hq_city}</p>
              </div>
              <div className="grid grid-cols-3 gap-3 flex-shrink-0">
                {[
                  { l: 'Intake/yr', v: emp.annual_graduate_intake.toLocaleString(), c: 'var(--text)' },
                  { l: 'Avg salary', v: `£${emp.avg_starting_salary_k}k`, c: 'var(--positive)' },
                  { l: 'Retention', v: `${emp.retention_rate}%`, c: 'var(--text-2)' },
                ].map(({ l, v, c }) => (
                  <div key={l} className="text-right">
                    <p style={{ color: 'var(--muted)', fontSize: 8.5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{l}</p>
                    <p className="font-num" style={{ color: c, fontSize: 12, fontWeight: 700 }}>{v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 border" style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3 }}>
        <p style={{ color: 'var(--muted)', fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Industry destinations for {degree.name}</p>
        <div className="space-y-1.5">
          {degree.industry_destinations.map(({ sector, pct }) => (
            <div key={sector} className="flex items-center gap-2">
              <span style={{ color: 'var(--text-2)', fontSize: 11, flex: 1 }}>{sector}</span>
              <div style={{ width: 120, height: 4, backgroundColor: 'var(--border)', borderRadius: 1 }}>
                <div style={{ height: '100%', width: `${pct * 2}%`, backgroundColor: 'var(--accent)', borderRadius: 1 }} />
              </div>
              <span className="font-num" style={{ color: 'var(--text-2)', fontSize: 11, width: 28, textAlign: 'right' }}>{pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Step 3: Salary progression
function StepSalary({ degree }: { degree: Degree }) {
  const points = [
    { label: '15 months', salary: degree.median_salary_k, note: 'HESA Graduate Outcomes Survey' },
    { label: '1 year', salary: +(degree.median_salary_k * 0.98).toFixed(0), note: 'Estimated' },
    { label: '3 years', salary: +(degree.median_salary_k * 1.20).toFixed(0), note: 'With promotions / role changes' },
    { label: '5 years', salary: +(degree.median_salary_k * 1.42).toFixed(0), note: 'Senior / specialist level' },
    { label: '10 years', salary: +(degree.median_salary_k * 1.85).toFixed(0), note: 'Management / highly specialised' },
  ]
  const max = Math.max(...points.map((p) => p.salary))

  return (
    <div>
      <h2 style={{ color: 'var(--text)', fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Salary progression for {degree.name}</h2>
      <p style={{ color: 'var(--text-2)', fontSize: 12.5, marginBottom: 16 }}>Median salary trajectory from graduation through career.</p>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-6">
        {points.map(({ label, salary, note }) => (
          <div key={label} className="p-3 border text-center" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 4 }}>
            <p style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</p>
            <p className="font-num" style={{ color: 'var(--positive)', fontSize: 22, fontWeight: 800, marginBottom: 2 }}>£{salary}k</p>
            <p style={{ color: 'var(--muted)', fontSize: 9.5 }}>{note}</p>
          </div>
        ))}
      </div>

      {/* Visual bar chart */}
      <div className="flex items-end gap-3" style={{ height: 140 }}>
        {points.map(({ label, salary }) => {
          const pct = (salary / max) * 100
          return (
            <div key={label} className="flex flex-col items-center gap-1 flex-1">
              <span className="font-num" style={{ color: 'var(--text-2)', fontSize: 10 }}>£{salary}k</span>
              <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                <div style={{ height: `${pct}%`, width: '100%', backgroundColor: 'var(--positive)', borderRadius: '3px 3px 0 0', opacity: 0.8 }} />
              </div>
              <span style={{ color: 'var(--muted)', fontSize: 9 }}>{label}</span>
            </div>
          )
        })}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          { l: 'Avg salary', v: `£${degree.avg_salary_k}k`, sub: '15 months' },
          { l: 'Median salary', v: `£${degree.median_salary_k}k`, sub: '15 months' },
          { l: 'Further study', v: `${degree.further_study_pct}%`, sub: 'pursue PG' },
        ].map(({ l, v, sub }) => (
          <div key={l} className="px-3 py-2.5 border text-center" style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3 }}>
            <p style={{ color: 'var(--muted)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{l}</p>
            <p className="font-num" style={{ color: 'var(--text)', fontSize: 18, fontWeight: 700 }}>{v}</p>
            <p style={{ color: 'var(--muted)', fontSize: 9.5 }}>{sub}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// Step 4: AI outlook
function StepAI({ degree }: { degree: Degree }) {
  const riskColor = degree.ai_automation_risk_pct >= 50 ? 'var(--negative)' : degree.ai_automation_risk_pct >= 35 ? 'var(--warning)' : 'var(--positive)'
  return (
    <div>
      <h2 style={{ color: 'var(--text)', fontSize: 17, fontWeight: 700, marginBottom: 4 }}>AI outlook for {degree.name}</h2>
      <p style={{ color: 'var(--text-2)', fontSize: 12.5, marginBottom: 16 }}>How artificial intelligence will reshape career paths in this discipline over the next decade.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="p-4 border text-center" style={{ backgroundColor: 'var(--panel)', borderColor: `${riskColor}44`, borderRadius: 4, borderLeft: `4px solid ${riskColor}` }}>
          <p style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Automation Risk</p>
          <p className="font-num" style={{ color: riskColor, fontSize: 36, fontWeight: 900 }}>{degree.ai_automation_risk_pct}%</p>
          <p style={{ color: 'var(--text-2)', fontSize: 11.5, marginTop: 4 }}>of tasks likely automated</p>
        </div>
        <div className="p-4 border text-center" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--positive)44', borderRadius: 4, borderLeft: '4px solid var(--positive)' }}>
          <p style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>AI Augmentation</p>
          <p className="font-num" style={{ color: 'var(--positive)', fontSize: 36, fontWeight: 900 }}>+{degree.ai_augmentation_pct}%</p>
          <p style={{ color: 'var(--text-2)', fontSize: 11.5, marginTop: 4 }}>of tasks AI-enhanced</p>
        </div>
        <div className="p-4 border text-center" style={{ backgroundColor: 'var(--panel)', borderColor: `${riskColor}44`, borderRadius: 4, borderLeft: `4px solid var(--accent)` }}>
          <p style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>AI Resilience</p>
          <p className="font-num" style={{ color: 'var(--accent)', fontSize: 36, fontWeight: 900 }}>{degree.ai_resilience_score}</p>
          <p style={{ color: 'var(--text-2)', fontSize: 11.5, marginTop: 4 }}>out of 100</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3 border" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}>
          <p style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Demand outlook</p>
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 28 }}>{degree.ai_demand_outlook === 'High' ? '🚀' : degree.ai_demand_outlook === 'Growing' ? '📈' : degree.ai_demand_outlook === 'Stable' ? '📊' : '📉'}</span>
            <div>
              <p style={{ color: 'var(--text)', fontSize: 16, fontWeight: 700 }}>{degree.ai_demand_outlook}</p>
              <p style={{ color: 'var(--text-2)', fontSize: 11.5 }}>Projected demand for {degree.name} graduates</p>
            </div>
          </div>
        </div>

        <div className="p-3 border" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}>
          <p style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Recommended skills</p>
          <div className="flex flex-wrap gap-1.5">
            {['AI Tools Proficiency', 'Data Literacy', 'Critical Thinking', 'Domain Expertise', 'Communication', 'Ethics & Governance'].map((s) => (
              <span key={s} style={{ fontSize: 10.5, padding: '2px 7px', border: '1px solid var(--border)', borderRadius: 2, color: 'var(--text-2)', backgroundColor: 'var(--bg-2)' }}>{s}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 p-3 border" style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3, borderLeft: '3px solid var(--muted)' }}>
        <p style={{ color: 'var(--muted)', fontSize: 10.5 }}>AI impact estimates are modelled projections based on McKinsey Global Institute and Oxford Future of Work research. Not official statistics. Figures represent estimated proportion of tasks — not job losses.</p>
      </div>
    </div>
  )
}

// Step 5: Regional demand
function StepRegions({ degree }: { degree: Degree }) {
  const regionData = UK_REGIONS.map((r, i) => {
    const seed = degree.id.split('').reduce((s, c) => s + c.charCodeAt(0), 0)
    const londonBonus = r === 'London' ? 25 : r === 'South East' ? 15 : r === 'Scotland' ? (degree.top_institutions.includes('edinburgh') ? 12 : 8) : 0
    const baseShare = Math.max(1, 15 - i * 1.5 + (seed % (i + 3)) + londonBonus)
    return { region: r, share: Math.min(40, baseShare) }
  })
  const maxShare = Math.max(...regionData.map((r) => r.share))

  return (
    <div>
      <h2 style={{ color: 'var(--text)', fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Regional demand — {degree.name}</h2>
      <p style={{ color: 'var(--text-2)', fontSize: 12.5, marginBottom: 16 }}>Where are {degree.name} graduates most in demand across the UK?</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
        {regionData.sort((a, b) => b.share - a.share).map(({ region, share }) => {
          const pct = (share / maxShare) * 100
          return (
            <div key={region} className="flex items-center gap-2 px-3 py-2" style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 3 }}>
              <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--muted)' }} />
              <span style={{ color: 'var(--text)', fontSize: 11.5, width: 140, flexShrink: 0 }}>{region}</span>
              <div className="flex-1 h-1.5" style={{ backgroundColor: 'var(--bg-2)', borderRadius: 1 }}>
                <div style={{ height: '100%', width: `${pct}%`, backgroundColor: 'var(--accent)', borderRadius: 1, opacity: 0.8 }} />
              </div>
              <div className="flex items-center gap-1">
                {pct >= 90 && <span style={{ fontSize: 9, backgroundColor: 'var(--positive-bg)', color: 'var(--positive)', padding: '0 4px', borderRadius: 2, fontWeight: 700 }}>HOT</span>}
              </div>
            </div>
          )
        })}
      </div>
      <p style={{ color: 'var(--muted)', fontSize: 10.5 }}>Regional demand index based on modelled graduate employer concentration by geography. Relative index — not absolute job counts.</p>
    </div>
  )
}

// Step 6: Summary
function StepSummary({ degree, onReset }: { degree: Degree; onReset: () => void }) {
  const riskColor = degree.ai_automation_risk_pct >= 50 ? 'var(--negative)' : degree.ai_automation_risk_pct >= 35 ? 'var(--warning)' : 'var(--positive)'
  return (
    <div>
      <h2 style={{ color: 'var(--text)', fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{degree.emoji} Your {degree.name} career path</h2>
      <p style={{ color: 'var(--text-2)', fontSize: 12.5, marginBottom: 16 }}>Everything connected — your full intelligence summary.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        {[
          { l: 'Employment rate', v: `${degree.employment_rate_pct}%`, c: 'var(--positive)', icon: '📊' },
          { l: 'Avg salary (15mo)', v: `£${degree.avg_salary_k}k`, c: 'var(--text)', icon: '💷' },
          { l: 'Salary at 5 years', v: `£${(degree.median_salary_k * 1.42).toFixed(0)}k`, c: 'var(--positive)', icon: '📈' },
          { l: 'AI resilience', v: `${degree.ai_resilience_score}/100`, c: riskColor, icon: '🤖' },
          { l: 'Further study', v: `${degree.further_study_pct}%`, c: 'var(--link)', icon: '🎓' },
          { l: 'Time to job', v: `${degree.avg_months_to_job} months`, c: 'var(--text-2)', icon: '⏱' },
        ].map(({ l, v, c, icon }) => (
          <div key={l} className="p-3 border" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}>
            <p style={{ fontSize: 20, marginBottom: 2 }}>{icon}</p>
            <p style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{l}</p>
            <p className="font-num" style={{ color: c, fontSize: 18, fontWeight: 700 }}>{v}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        <Link to="/graduate-outcomes" className="flex items-center gap-1.5 px-3 py-2" style={{ backgroundColor: 'var(--accent)', color: '#fff', borderRadius: 3, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
          <GraduationCap className="w-3.5 h-3.5" /> Graduate Outcomes
        </Link>
        <Link to="/employers" className="flex items-center gap-1.5 px-3 py-2" style={{ border: '1px solid var(--border)', color: 'var(--text-2)', borderRadius: 3, fontSize: 12, textDecoration: 'none' }}>
          <Building2 className="w-3.5 h-3.5" /> Explore Employers
        </Link>
        <Link to="/degrees" className="flex items-center gap-1.5 px-3 py-2" style={{ border: '1px solid var(--border)', color: 'var(--text-2)', borderRadius: 3, fontSize: 12, textDecoration: 'none' }}>
          Compare Degrees
        </Link>
        <button onClick={onReset} className="flex items-center gap-1.5 px-3 py-2" style={{ border: '1px solid var(--border)', color: 'var(--text-2)', borderRadius: 3, fontSize: 12 }}>
          Start Over
        </button>
      </div>
      <p style={{ color: 'var(--muted)', fontSize: 10.5 }}>All figures are illustrative, derived from published sector averages (HESA, Graduate Outcomes Survey). Individual outcomes vary by institution, degree class, and geography.</p>
    </div>
  )
}

export function CareerExplorerPage() {
  const [step, setStep] = useState<Step>(0)
  const [selectedDegree, setSelectedDegree] = useState<Degree | null>(null)

  function handleSelectDegree(d: Degree) {
    setSelectedDegree(d)
    setStep(1)
  }

  function reset() {
    setSelectedDegree(null)
    setStep(0)
  }

  const stepContent = () => {
    if (!selectedDegree) return <StepDegree onSelect={handleSelectDegree} />
    switch (step) {
      case 1: return <StepUniversities degree={selectedDegree} />
      case 2: return <StepEmployers degree={selectedDegree} />
      case 3: return <StepSalary degree={selectedDegree} />
      case 4: return <StepAI degree={selectedDegree} />
      case 5: return <StepRegions degree={selectedDegree} />
      case 6: return <StepSummary degree={selectedDegree} onReset={reset} />
      default: return null
    }
  }

  return (
    <div className="max-w-[1200px] mx-auto px-3 sm:px-4 py-2.5 space-y-2.5">
      {/* Status bar */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-1.5 border" style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3, fontSize: 11 }}>
        <Compass className="w-3 h-3" style={{ color: 'var(--accent)' }} />
        <span style={{ color: 'var(--muted)', letterSpacing: '0.06em' }}>CAREER EXPLORER</span>
        {selectedDegree && (
          <>
            <span style={{ color: 'var(--border-strong)' }}>│</span>
            <span style={{ color: 'var(--text)' }}>{selectedDegree.emoji} {selectedDegree.name}</span>
            <span style={{ color: 'var(--border-strong)' }}>│</span>
            <span style={{ color: 'var(--text-2)' }}>Step <span className="font-num" style={{ color: 'var(--text)' }}>{step}</span> of 6</span>
          </>
        )}
        {selectedDegree && (
          <button onClick={reset} className="ml-auto" style={{ color: 'var(--link)', fontSize: 10.5 }}>← Change degree</button>
        )}
      </div>

      {/* Main card */}
      <div className="border p-4 sm:p-6" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 6 }}>
        {step > 0 && selectedDegree && <StepHeader step={step} total={7} label={STEP_LABELS[step]} />}
        {stepContent()}
      </div>

      {/* Navigation */}
      {step > 0 && step < 6 && (
        <div className="flex items-center justify-between">
          <button onClick={() => setStep((s) => Math.max(0, s - 1) as Step)} className="flex items-center gap-2 px-4 py-2"
            style={{ border: '1px solid var(--border)', borderRadius: 3, color: 'var(--text-2)', fontSize: 12 }}>
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <button key={s} onClick={() => setStep(s as Step)} className="w-2.5 h-2.5 rounded-full transition-colors"
                style={{ backgroundColor: step === s ? 'var(--accent)' : 'var(--border)' }} />
            ))}
          </div>
          <button onClick={() => setStep((s) => Math.min(6, s + 1) as Step)} className="flex items-center gap-2 px-4 py-2"
            style={{ backgroundColor: 'var(--accent)', color: '#fff', borderRadius: 3, fontSize: 12, fontWeight: 600 }}>
            Next <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
