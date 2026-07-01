import { Link } from 'react-router'
import { ArrowUpRight, Compass } from 'lucide-react'
import { Panel } from '../components/layout/Panel'
import { IntelligenceCardList } from '../components/intelligence/IntelligenceCardList'
import { INTELLIGENCE_RECORDS } from '../data/intelligence'
import { nationalStudentFinanceRecords } from '../data/nationalStudentFinance'

export function CareerExplorerPage() {
  const records = INTELLIGENCE_RECORDS
    .filter((row) => ['graduate-outcomes', 'labour-market', 'ai-exposure', 'policy'].includes(row.category))
    .sort((a, b) => b.published_date.localeCompare(a.published_date))
  const finance = nationalStudentFinanceRecords.find((row) => row.id === 'england-full-time-ug-average-borrowing-forecast-2024-25')
  const pathways = [
    { title: 'Graduate labour-market evidence', count: records.filter((row) => row.category === 'graduate-outcomes').length, href: '/graduate-outcomes' },
    { title: 'Employer and AI context', count: records.filter((row) => ['labour-market', 'ai-exposure'].includes(row.category)).length, href: '/employers' },
    { title: 'Student finance context', count: nationalStudentFinanceRecords.length, href: '/open-data' },
  ]

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-3 space-y-3">
      <div
        className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-1.5 border"
        style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3, fontSize: 11 }}
      >
        <Compass className="w-3 h-3" style={{ color: 'var(--accent)' }} />
        <span style={{ color: 'var(--muted)', letterSpacing: '0.06em' }}>CAREER EXPLORER</span>
        <span style={{ color: 'var(--border-strong)' }}>|</span>
        <span style={{ color: 'var(--text-2)' }}>{records.length} source-backed intelligence records</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {pathways.map((pathway) => (
          <Link key={pathway.title} to={pathway.href} className="p-3 border" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3, textDecoration: 'none' }}>
            <p className="font-num" style={{ color: 'var(--accent)', fontSize: 20, fontWeight: 700 }}>{pathway.count}</p>
            <p style={{ color: 'var(--text)', fontSize: 12, fontWeight: 600 }}>{pathway.title}</p>
            <p style={{ color: 'var(--muted)', fontSize: 10, marginTop: 4 }}>source-backed records</p>
          </Link>
        ))}
      </div>

      {finance && (
        <Panel title="Borrowing context" subtitle="DfE forecast, excluded from official observed aggregates">
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-num" style={{ color: 'var(--warning)', fontSize: 24, fontWeight: 700 }}>£{finance.value?.toLocaleString()}</p>
            <p style={{ color: 'var(--text-2)', fontSize: 12, lineHeight: 1.5 }}>{finance.metric}</p>
            <Link to="/open-data" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border hover:underline ml-auto" style={{ color: 'var(--link)', borderColor: 'var(--border)', borderRadius: 3, fontSize: 12 }}>
              Source dataset <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </Panel>
      )}

      <Panel title="Career intelligence" subtitle="Official statistics first; external AI-risk analysis labelled separately">
        <IntelligenceCardList records={records} />
        <div className="flex flex-wrap gap-2 pt-3 mt-3" style={{ borderTop: '1px solid var(--border)' }}>
          <Link to="/universities" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border hover:underline" style={{ color: 'var(--link)', borderColor: 'var(--border)', borderRadius: 3, fontSize: 12 }}>
            Browse verified institutions <ArrowUpRight className="w-3 h-3" />
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
