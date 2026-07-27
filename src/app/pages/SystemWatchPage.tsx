import { Activity, BriefcaseBusiness, Building2, ExternalLink, GraduationCap, Info, ShieldAlert } from 'lucide-react'
import { SYSTEM_RISK_SNAPSHOT, SystemRiskIndicator, SystemRiskLevel } from '../data/systemRisk'

const levelColour: Record<SystemRiskLevel, string> = {
  Stable: 'var(--positive)',
  Guarded: 'var(--warning)',
  Severe: '#d57b55',
  Critical: 'var(--negative)',
}

const iconById = {
  finance: Building2,
  'graduate-employment': GraduationCap,
  'labour-demand': BriefcaseBusiness,
  'recruitment-exposure': ShieldAlert,
} as const

function IndicatorCard({ indicator }: { indicator: SystemRiskIndicator }) {
  const Icon = iconById[indicator.id]
  const colour = levelColour[indicator.level]
  return (
    <article className="border" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 4 }}>
      <div className="flex items-start gap-3 px-4 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="p-2 border" style={{ borderColor: 'var(--border)', color: colour, borderRadius: 3, backgroundColor: 'var(--bg-2)' }}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 style={{ fontSize: 13, fontWeight: 600 }}>{indicator.label}</h2>
              <p className="mt-0.5 font-num" style={{ color: 'var(--muted)', fontSize: 10 }}>{indicator.period}</p>
            </div>
            <div className="text-right">
              <p className="font-num tabular-nums" style={{ color: colour, fontSize: 22, fontWeight: 600, lineHeight: 1 }}>{indicator.score}</p>
              <p className="mt-1" style={{ color: colour, fontSize: 9.5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{indicator.level}</p>
            </div>
          </div>
          <p className="mt-2" style={{ color: 'var(--text-2)', fontSize: 11.5, lineHeight: 1.55 }}>{indicator.summary}</p>
        </div>
      </div>
      <div className="px-4 py-3 space-y-2">
        {indicator.signals.map((signal) => (
          <div key={signal.label} className="flex items-center justify-between gap-3">
            <span style={{ color: 'var(--text-2)', fontSize: 11 }}>{signal.label}</span>
            <span
              className="font-num tabular-nums"
              style={{
                color: signal.direction === 'negative' ? 'var(--negative)' : signal.direction === 'positive' ? 'var(--positive)' : 'var(--text)',
                fontSize: 11,
                fontWeight: 500,
              }}
            >
              {signal.value}
            </span>
          </div>
        ))}
      </div>
      <details className="px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
        <summary className="cursor-pointer" style={{ color: 'var(--link)', fontSize: 10.5 }}>Method and source</summary>
        <p className="mt-2" style={{ color: 'var(--muted)', fontSize: 10.5, lineHeight: 1.55 }}>{indicator.methodology}</p>
        <a className="inline-flex items-center gap-1 mt-2" href={indicator.source_url} target="_blank" rel="noreferrer" style={{ color: 'var(--link)', fontSize: 10.5 }}>
          {indicator.source_name}<ExternalLink className="w-3 h-3" />
        </a>
      </details>
    </article>
  )
}

export function SystemWatchPage() {
  const snapshot = SYSTEM_RISK_SNAPSHOT
  const colour = levelColour[snapshot.level]

  return (
    <div className="max-w-[1440px] mx-auto px-3 sm:px-5 py-4 sm:py-6 space-y-4">
      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="border px-5 py-5 sm:px-6 sm:py-6" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border-strong)', borderRadius: 4 }}>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <span style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' }}>UK Higher Education System Watch</span>
          </div>
          <div className="flex flex-wrap items-end gap-x-5 gap-y-2 mt-5">
            <div className="font-num tabular-nums" style={{ fontSize: 'clamp(52px, 8vw, 84px)', lineHeight: 0.86, color: 'var(--text)', letterSpacing: '-0.06em' }}>
              {snapshot.score}<span style={{ color: 'var(--muted)', fontSize: '0.28em', letterSpacing: 0 }}>/100</span>
            </div>
            <div className="pb-1.5">
              <p style={{ color: colour, fontSize: 20, fontWeight: 600 }}>{snapshot.level}</p>
              <p className="font-num mt-1" style={{ color: 'var(--muted)', fontSize: 10 }}>AS OF {snapshot.as_of}</p>
            </div>
          </div>
          <div className="relative mt-6 h-2 overflow-hidden" style={{ backgroundColor: 'var(--bg-2)', borderRadius: 2 }}>
            <div style={{ width: `${snapshot.score}%`, height: '100%', backgroundColor: colour }} />
            {[30, 55, 75].map((point) => <span key={point} className="absolute top-0 h-full w-px" style={{ left: `${point}%`, backgroundColor: 'var(--border-strong)' }} />)}
          </div>
          <div className="grid grid-cols-4 mt-2 font-num" style={{ color: 'var(--muted)', fontSize: 9 }}>
            <span>STABLE</span><span className="text-center">GUARDED</span><span className="text-center">SEVERE</span><span className="text-right">CRITICAL</span>
          </div>
          <p className="mt-5 max-w-[720px]" style={{ color: 'var(--text-2)', fontSize: 12.5, lineHeight: 1.65 }}>
            A source-backed early-warning view across institutional finances, graduate employment, labour demand and recruitment concentration. Every component is inspectable and API-ready.
          </p>
        </div>

        <aside className="border px-5 py-5" style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 4 }}>
          <p style={{ color: 'var(--text)', fontSize: 12, fontWeight: 600 }}>Coverage & guardrails</p>
          <div className="mt-4 space-y-3">
            {[
              ['Verified finance providers', snapshot.coverage.verified_finance_providers],
              ['Graduate outcomes period', snapshot.coverage.graduate_outcomes_period],
              ['Latest labour signal', snapshot.coverage.external_signal_date],
              ['Composite version', 'v1.0'],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-2)', fontSize: 11 }}>{label}</span>
                <span className="font-num" style={{ color: 'var(--text)', fontSize: 10.5 }}>{value}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: 'var(--warning)' }} />
            <p style={{ color: 'var(--muted)', fontSize: 10.5, lineHeight: 1.55 }}>{snapshot.caveat}</p>
          </div>
        </aside>
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
          <div>
            <h1 style={{ fontSize: 17, fontWeight: 600 }}>Component indicators</h1>
            <p className="mt-1" style={{ color: 'var(--muted)', fontSize: 11.5 }}>Open each method panel to inspect the thresholds and source.</p>
          </div>
          <p className="font-num" style={{ color: 'var(--muted)', fontSize: 10 }}>WEIGHTS · FIN 35 · EMP 25 · LAB 25 · REC 15</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {snapshot.indicators.map((indicator) => <IndicatorCard key={indicator.id} indicator={indicator} />)}
        </div>
      </section>
    </div>
  )
}
