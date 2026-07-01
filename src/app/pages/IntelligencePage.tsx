import { Link } from 'react-router'
import {
  ArrowUpRight,
  Building2,
  FileText,
  GraduationCap,
  Landmark,
  Megaphone,
  Newspaper,
  TrendingUp,
} from 'lucide-react'
import { Panel } from '../components/layout/Panel'
import { IntelligenceCardList } from '../components/intelligence/IntelligenceCardList'
import { INTELLIGENCE_RECORDS, IntelligenceCategory, getExternalAnalysisIntelligence, getOfficialIntelligence } from '../data/intelligence'
import { useState } from 'react'

const DEEP_DIVES = [
  { label: 'Sector Overview', href: '/sector', icon: TrendingUp, desc: 'HESA finance aggregates and OfS context' },
  { label: 'Social Studio', href: '/social-studio', icon: Megaphone, desc: 'Source-aware posts from verified metrics' },
  { label: 'Annual Reports', href: '/reports', icon: FileText, desc: 'Institution-level report library' },
  { label: 'Graduate Outcomes', href: '/graduate-outcomes', icon: GraduationCap, desc: 'DfE LEO source-backed records' },
  { label: 'Employer Intelligence', href: '/employers', icon: Building2, desc: 'ONS and external AI-risk analysis' },
]

const SOURCE_QUEUES = [
  'Office for Students regulatory publications',
  'Department for Education and Student Loans Company releases',
  'HESA Student, Graduate Outcomes, Staff and Estates open data',
  'UCAS and ONS public datasets',
  'Institution annual reports and audited accounts',
  'External AI-risk analysis labelled separately from official statistics',
]

const FILTERS: { label: string; category: IntelligenceCategory | 'all' }[] = [
  { label: 'All', category: 'all' },
  { label: 'HE Finance', category: 'he-finance' },
  { label: 'Students', category: 'students' },
  { label: 'Graduate Outcomes', category: 'graduate-outcomes' },
  { label: 'Labour Market', category: 'labour-market' },
  { label: 'AI Exposure', category: 'ai-exposure' },
  { label: 'Policy', category: 'policy' },
]

export function IntelligencePage() {
  const [category, setCategory] = useState<IntelligenceCategory | 'all'>('all')
  const records = category === 'all'
    ? [...INTELLIGENCE_RECORDS].sort((a, b) => b.published_date.localeCompare(a.published_date))
    : INTELLIGENCE_RECORDS.filter((row) => row.category === category).sort((a, b) => b.published_date.localeCompare(a.published_date))
  const officialCount = getOfficialIntelligence().length
  const externalCount = getExternalAnalysisIntelligence().length

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-3 space-y-3">
      <div
        className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-1.5 border"
        style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3, fontSize: 11 }}
      >
        <Newspaper className="w-3 h-3" style={{ color: 'var(--accent)' }} />
        <span style={{ color: 'var(--muted)', letterSpacing: '0.06em' }}>INTELLIGENCE CENTRE</span>
        <span style={{ color: 'var(--border-strong)' }}>|</span>
        <span style={{ color: 'var(--text-2)' }}>
          <span className="font-num" style={{ color: 'var(--positive)' }}>{officialCount}</span> official/regulator records
        </span>
        <span style={{ color: 'var(--border-strong)' }}>|</span>
        <span style={{ color: 'var(--text-2)' }}>
          <span className="font-num" style={{ color: 'var(--warning)' }}>{externalCount}</span> external analysis records
        </span>
      </div>

      <Panel title="Verified intelligence feed" subtitle="Every displayed claim is linked to a source document and verification date">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {FILTERS.map((filter) => (
            <button
              key={filter.category}
              onClick={() => setCategory(filter.category)}
              className="px-2 py-1 border"
              style={{
                backgroundColor: category === filter.category ? 'var(--accent)' : 'transparent',
                borderColor: category === filter.category ? 'var(--accent)' : 'var(--border)',
                color: category === filter.category ? '#fff' : 'var(--text-2)',
                borderRadius: 3,
                fontSize: 11,
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <IntelligenceCardList records={records} />
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Panel title="Source queues" subtitle="Accepted source families">
          <div className="space-y-2">
            {SOURCE_QUEUES.map((label) => (
              <div key={label} className="flex items-center gap-2 px-2 py-1.5 border" style={{ borderColor: 'var(--border)', borderRadius: 3 }}>
                <Landmark className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--muted)' }} />
                <span style={{ color: 'var(--text-2)', fontSize: 12 }}>{label}</span>
              </div>
            ))}
          </div>
        </Panel>

        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {DEEP_DIVES.map((d) => {
            const Icon = d.icon
            return (
              <Link key={d.href} to={d.href} className="flex items-center gap-3 px-3 py-3 border transition-colors" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3, textDecoration: 'none' }}>
                <Icon className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                <span className="flex-1 min-w-0">
                  <span className="block" style={{ color: 'var(--text)', fontSize: 12.5, fontWeight: 600 }}>{d.label}</span>
                  <span className="block truncate" style={{ color: 'var(--muted)', fontSize: 10.5 }}>{d.desc}</span>
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--muted)' }} />
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
