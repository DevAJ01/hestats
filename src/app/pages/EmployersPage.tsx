import { Link } from 'react-router'
import { ArrowUpRight, Building2 } from 'lucide-react'
import { Panel } from '../components/layout/Panel'
import { IntelligenceCardList } from '../components/intelligence/IntelligenceCardList'
import { INTELLIGENCE_RECORDS } from '../data/intelligence'

export function EmployersPage() {
  const records = INTELLIGENCE_RECORDS
    .filter((row) => ['labour-market', 'ai-exposure', 'policy'].includes(row.category))
    .sort((a, b) => b.published_date.localeCompare(a.published_date))
  const officialRecords = records.filter((row) => row.claim_type !== 'external-analysis')
  const externalRecords = records.filter((row) => row.claim_type === 'external-analysis')
  const metrics = records.flatMap((record) => record.metrics.map((metric) => ({ ...metric, record })))

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-3 space-y-3">
      <div
        className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-1.5 border"
        style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3, fontSize: 11 }}
      >
        <Building2 className="w-3 h-3" style={{ color: 'var(--accent)' }} />
        <span style={{ color: 'var(--muted)', letterSpacing: '0.06em' }}>EMPLOYER INTELLIGENCE</span>
        <span style={{ color: 'var(--border-strong)' }}>|</span>
        <span style={{ color: 'var(--text-2)' }}>{records.length} labour-market and AI records</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="p-3 border" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}>
          <p className="font-num" style={{ color: 'var(--positive)', fontSize: 20, fontWeight: 700 }}>{officialRecords.length}</p>
          <p style={{ color: 'var(--text)', fontSize: 11.5, fontWeight: 600 }}>official or government records</p>
          <p style={{ color: 'var(--muted)', fontSize: 10, marginTop: 4 }}>available for employer context</p>
        </div>
        <div className="p-3 border" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}>
          <p className="font-num" style={{ color: 'var(--warning)', fontSize: 20, fontWeight: 700 }}>{externalRecords.length}</p>
          <p style={{ color: 'var(--text)', fontSize: 11.5, fontWeight: 600 }}>external analysis records</p>
          <p style={{ color: 'var(--muted)', fontSize: 10, marginTop: 4 }}>excluded from official aggregates</p>
        </div>
        {metrics.slice(0, 1).map(({ record, ...metric }) => (
          <div key={`${record.id}:${metric.key}`} className="p-3 border" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}>
            <p className="font-num" style={{ color: 'var(--text)', fontSize: 20, fontWeight: 700 }}>{metric.value === null ? 'Pending' : `${metric.value.toLocaleString()} ${metric.unit}`}</p>
            <p style={{ color: 'var(--text)', fontSize: 11.5, fontWeight: 600 }}>{metric.label}</p>
            <p style={{ color: 'var(--muted)', fontSize: 10, marginTop: 4 }}>{record.publisher}</p>
          </div>
        ))}
      </div>

      <Panel title="Employer intelligence" subtitle="Employer-specific rows remain hidden until source records are attached">
        <IntelligenceCardList records={records} />
        <div className="flex flex-wrap gap-2 pt-3 mt-3" style={{ borderTop: '1px solid var(--border)' }}>
          <Link to="/graduate-outcomes" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border hover:underline" style={{ color: 'var(--link)', borderColor: 'var(--border)', borderRadius: 3, fontSize: 12 }}>
            Graduate outcomes <ArrowUpRight className="w-3 h-3" />
          </Link>
          <Link to="/open-data" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border hover:underline" style={{ color: 'var(--link)', borderColor: 'var(--border)', borderRadius: 3, fontSize: 12 }}>
            Open data <ArrowUpRight className="w-3 h-3" />
          </Link>
          <Link to="/intelligence" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border hover:underline" style={{ color: 'var(--link)', borderColor: 'var(--border)', borderRadius: 3, fontSize: 12 }}>
            Intelligence centre <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </Panel>
    </div>
  )
}
