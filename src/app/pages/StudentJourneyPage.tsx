import { Link } from 'react-router'
import { ArrowRight, Map } from 'lucide-react'
import { IntelligenceCardList } from '../components/intelligence/IntelligenceCardList'
import { INTELLIGENCE_RECORDS } from '../data/intelligence'
import { Panel } from '../components/layout/Panel'

export function StudentJourneyPage() {
  const records = INTELLIGENCE_RECORDS
    .filter((row) => ['students', 'graduate-outcomes', 'policy'].includes(row.category))
    .sort((a, b) => b.published_date.localeCompare(a.published_date))

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-3 space-y-3">
      <div
        className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-1.5 border"
        style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3, fontSize: 11 }}
      >
        <Map className="w-3 h-3" style={{ color: 'var(--accent)' }} />
        <span style={{ color: 'var(--muted)', letterSpacing: '0.06em' }}>STUDENT JOURNEY</span>
        <span style={{ color: 'var(--border-strong)' }}>|</span>
        <span style={{ color: 'var(--text-2)' }}>{records.length} source-backed records</span>
      </div>

      <Panel title="Student journey intelligence" subtitle="Journey claims render only when source provenance is attached">
        <IntelligenceCardList records={records} />
        <div className="flex flex-wrap gap-2 pt-3 mt-3" style={{ borderTop: '1px solid var(--border)' }}>
          <Link to="/about" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border hover:underline" style={{ color: 'var(--link)', borderColor: 'var(--border)', borderRadius: 3, fontSize: 12 }}>
            Methodology <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link to="/universities" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border hover:underline" style={{ color: 'var(--link)', borderColor: 'var(--border)', borderRadius: 3, fontSize: 12 }}>
            Verified finance <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </Panel>
    </div>
  )
}
