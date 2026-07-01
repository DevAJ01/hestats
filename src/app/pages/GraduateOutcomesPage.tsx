import { Link } from 'react-router'
import { ArrowUpRight, GraduationCap } from 'lucide-react'
import { Panel } from '../components/layout/Panel'
import { IntelligenceCardList } from '../components/intelligence/IntelligenceCardList'
import { INTELLIGENCE_RECORDS } from '../data/intelligence'

export function GraduateOutcomesPage() {
  const records = INTELLIGENCE_RECORDS
    .filter((row) => row.category === 'graduate-outcomes')
    .sort((a, b) => b.published_date.localeCompare(a.published_date))
  const metrics = records.flatMap((record) => record.metrics.map((metric) => ({ ...metric, record })))

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-3 space-y-3">
      <div
        className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-1.5 border"
        style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3, fontSize: 11 }}
      >
        <GraduationCap className="w-3 h-3" style={{ color: 'var(--accent)' }} />
        <span style={{ color: 'var(--muted)', letterSpacing: '0.06em' }}>GRADUATE OUTCOMES</span>
        <span style={{ color: 'var(--border-strong)' }}>|</span>
        <span style={{ color: 'var(--text-2)' }}>{records.length} DfE LEO record attached</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {metrics.slice(0, 6).map(({ record, ...metric }) => (
          <div key={`${record.id}:${metric.key}`} className="p-3 border" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}>
            <p style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>{record.publisher}</p>
            <p className="font-num" style={{ color: 'var(--text)', fontSize: 20, fontWeight: 700 }}>
              {metric.value === null ? 'Pending' : metric.unit === 'GBP annualised earnings' || metric.unit === 'GBP' ? `£${metric.value.toLocaleString()}` : `${metric.value.toLocaleString()} ${metric.unit}`}
            </p>
            <p style={{ color: 'var(--text-2)', fontSize: 11.5, lineHeight: 1.45 }}>{metric.label}</p>
            <p style={{ color: 'var(--muted)', fontSize: 10, marginTop: 6 }}>{metric.period}</p>
          </div>
        ))}
      </div>

      <Panel title="Graduate outcomes intelligence" subtitle="Provider-level outcome tables remain hidden until official source rows are ingested">
        <IntelligenceCardList records={records} />
        <div className="flex flex-wrap gap-2 pt-3 mt-3" style={{ borderTop: '1px solid var(--border)' }}>
          <Link to="/universities" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border hover:underline" style={{ color: 'var(--link)', borderColor: 'var(--border)', borderRadius: 3, fontSize: 12 }}>
            Browse verified finance <ArrowUpRight className="w-3 h-3" />
          </Link>
          <Link to="/open-data" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border hover:underline" style={{ color: 'var(--link)', borderColor: 'var(--border)', borderRadius: 3, fontSize: 12 }}>
            Download open data <ArrowUpRight className="w-3 h-3" />
          </Link>
          <Link to="/intelligence" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border hover:underline" style={{ color: 'var(--link)', borderColor: 'var(--border)', borderRadius: 3, fontSize: 12 }}>
            Intelligence centre <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </Panel>
    </div>
  )
}
