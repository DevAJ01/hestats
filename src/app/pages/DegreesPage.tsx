import { Link } from 'react-router'
import { ArrowUpRight, BookOpen } from 'lucide-react'
import { Panel } from '../components/layout/Panel'
import { IntelligenceCardList } from '../components/intelligence/IntelligenceCardList'
import { INTELLIGENCE_RECORDS } from '../data/intelligence'
import { providerSourceCoverage } from '../data/providerSourceCoverage'

export function DegreesPage() {
  const records = INTELLIGENCE_RECORDS
    .filter((row) => ['graduate-outcomes', 'ai-exposure'].includes(row.category))
    .sort((a, b) => b.published_date.localeCompare(a.published_date))
  const metrics = records.flatMap((record) => record.metrics.map((metric) => ({ ...metric, record })))
  const outcomeCoverage = providerSourceCoverage.filter((row) => row.domain === 'outcomes')

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-3 space-y-3">
      <div
        className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-1.5 border"
        style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3, fontSize: 11 }}
      >
        <BookOpen className="w-3 h-3" style={{ color: 'var(--accent)' }} />
        <span style={{ color: 'var(--muted)', letterSpacing: '0.06em' }}>DEGREE INTELLIGENCE</span>
        <span style={{ color: 'var(--border-strong)' }}>|</span>
        <span style={{ color: 'var(--text-2)' }}>{records.length} source-backed records</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        {[
          { label: 'Outcome source rows', value: `${outcomeCoverage.filter((row) => row.source_status === 'verified').length}/${outcomeCoverage.length}`, sub: 'provider coverage' },
          ...metrics.slice(0, 3).map((metric) => ({
            label: metric.label,
            value: metric.value === null ? 'Pending' : metric.unit === 'GBP annualised earnings' || metric.unit === 'GBP' ? `£${metric.value.toLocaleString()}` : `${metric.value.toLocaleString()} ${metric.unit}`,
            sub: metric.period,
          })),
        ].map((item) => (
          <div key={item.label} className="p-3 border" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}>
            <p className="font-num" style={{ color: item.value === 'Pending' ? 'var(--warning)' : 'var(--text)', fontSize: 18, fontWeight: 700 }}>{item.value}</p>
            <p style={{ color: 'var(--text)', fontSize: 11.5, fontWeight: 600, lineHeight: 1.3 }}>{item.label}</p>
            <p style={{ color: 'var(--muted)', fontSize: 10, marginTop: 4 }}>{item.sub}</p>
          </div>
        ))}
      </div>

      <Panel title="Degree intelligence" subtitle="Subject tables remain hidden until row-level official source data is attached">
        <IntelligenceCardList records={records} />
        <div className="flex flex-wrap gap-2 pt-3 mt-3" style={{ borderTop: '1px solid var(--border)' }}>
          <Link to="/graduate-outcomes" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border hover:underline" style={{ color: 'var(--link)', borderColor: 'var(--border)', borderRadius: 3, fontSize: 12 }}>
            Graduate outcomes <ArrowUpRight className="w-3 h-3" />
          </Link>
          <Link to="/about" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border hover:underline" style={{ color: 'var(--link)', borderColor: 'var(--border)', borderRadius: 3, fontSize: 12 }}>
            Methodology <ArrowUpRight className="w-3 h-3" />
          </Link>
          <Link to="/intelligence" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border hover:underline" style={{ color: 'var(--link)', borderColor: 'var(--border)', borderRadius: 3, fontSize: 12 }}>
            Intelligence centre <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </Panel>
    </div>
  )
}
