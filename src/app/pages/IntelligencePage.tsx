import { useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import {
  Newspaper, Landmark, FileText, TrendingUp, GraduationCap, Building2,
  AlertTriangle, Sparkles, ArrowUpRight, Filter,
} from 'lucide-react'

type Category = 'all' | 'policy' | 'report' | 'funding' | 'alert' | 'outcomes' | 'ai'

interface IntelItem {
  id: string
  date: string
  category: Exclude<Category, 'all'>
  source: string
  title: string
  summary: string
  links: { label: string; href: string }[]
}

const SOURCE_META: Record<Exclude<Category, 'all'>, { label: string; icon: typeof Newspaper; color: string }> = {
  policy: { label: 'Government Policy', icon: Landmark, color: 'var(--accent)' },
  report: { label: 'Annual Report', icon: FileText, color: 'var(--text-2)' },
  funding: { label: 'Research Funding', icon: TrendingUp, color: 'var(--positive)' },
  alert: { label: 'Sector Alert', icon: AlertTriangle, color: 'var(--warning)' },
  outcomes: { label: 'Graduate Outcomes', icon: GraduationCap, color: 'var(--accent)' },
  ai: { label: 'AI Analysis', icon: Sparkles, color: 'var(--positive)' },
}

const FEED: IntelItem[] = [
  { id: '1', date: '2026-06-28', category: 'policy', source: 'Office for Students', title: 'OfS confirms revised financial sustainability monitoring for 2026-27', summary: 'New early-warning thresholds on liquidity days and surplus margins take effect from August. Institutions below 30 liquidity days face enhanced reporting.', links: [{ label: 'Liquidity rankings', href: '/rankings?sort=liquidity' }, { label: 'Methodology', href: '/about#liquidity' }] },
  { id: '2', date: '2026-06-25', category: 'funding', source: 'Research England', title: 'QR funding allocations rise 4.1% for research-intensive institutions', summary: 'Russell Group universities capture the majority of the £2.1bn quality-related research uplift. Quantum and AI clusters see largest gains.', links: [{ label: 'Research rankings', href: '/rankings?sort=research' }, { label: 'Compare Russell Group', href: '/compare?set=russell' }] },
  { id: '3', date: '2026-06-22', category: 'report', source: 'University of Nottingham', title: 'Nottingham publishes 2024-25 financial statements', summary: 'Total income up 6.2% to £812m; surplus margin holds at 3.4%. International fee income now 31% of tuition revenue.', links: [{ label: 'View profile', href: '/universities/nottingham' }, { label: 'All reports', href: '/reports' }] },
  { id: '4', date: '2026-06-20', category: 'alert', source: 'HEStats Intelligence', title: 'Five institutions flagged for declining liquidity', summary: 'Cash days have fallen below the sector median at five providers across three consecutive years, signalling tightening working capital.', links: [{ label: 'Sector overview', href: '/sector' }, { label: 'Explore data', href: '/explorer?view=graph' }] },
  { id: '5', date: '2026-06-18', category: 'outcomes', source: 'HESA / Graduate Outcomes', title: 'Graduate salary premiums widen for STEM disciplines', summary: 'Median 15-month earnings for engineering and computing graduates outpace sector average by £6,400. London providers lead.', links: [{ label: 'Graduate outcomes', href: '/graduate-outcomes' }, { label: 'Degree intelligence', href: '/degrees' }] },
  { id: '6', date: '2026-06-15', category: 'ai', source: 'HEStats AI', title: 'AI readiness signals emerging across the sector', summary: 'Compute investment, data-science hiring and research-grant language indicate accelerating AI adoption among 40+ providers.', links: [{ label: 'Employer intelligence', href: '/employers' }, { label: 'Explore', href: '/explorer' }] },
  { id: '7', date: '2026-06-12', category: 'policy', source: 'Department for Education', title: 'Tuition fee cap review opens consultation', summary: 'Government invites responses on indexing the £9,250 cap to inflation from 2027-28. Sector bodies warn of real-terms erosion.', links: [{ label: 'Sector trends', href: '/sector' }] },
  { id: '8', date: '2026-06-10', category: 'funding', source: 'UKRI', title: 'New £180m doctoral training partnerships announced', summary: 'Funding spread across 24 institutions with a focus on AI, net-zero and life sciences. Application window closes September.', links: [{ label: 'Research rankings', href: '/rankings?sort=research' }] },
  { id: '9', date: '2026-06-06', category: 'report', source: 'Imperial College London', title: 'Imperial reports record research income of £487m', summary: 'Research income grows 8.9% year-on-year; commercial spin-out portfolio valued at over £1.2bn.', links: [{ label: 'View profile', href: '/universities/imperial' }] },
  { id: '10', date: '2026-06-02', category: 'alert', source: 'HEStats Intelligence', title: 'Borrowing levels climb across post-92 sector', summary: 'Aggregate borrowing rises 11% as capital programmes resume. Debt-to-income ratios remain within covenant for most providers.', links: [{ label: 'Explore borrowing', href: '/explorer?view=table' }, { label: 'Sector', href: '/sector' }] },
]

const TABS: { id: Category; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'policy', label: 'Policy' },
  { id: 'funding', label: 'Funding' },
  { id: 'report', label: 'Reports' },
  { id: 'alert', label: 'Alerts' },
  { id: 'outcomes', label: 'Outcomes' },
  { id: 'ai', label: 'AI' },
]

const DEEP_DIVES = [
  { label: 'Sector Overview', href: '/sector', icon: TrendingUp, desc: 'Sector-wide financial trends' },
  { label: 'Annual Reports', href: '/reports', icon: FileText, desc: 'Full report library' },
  { label: 'Graduate Outcomes', href: '/graduate-outcomes', icon: GraduationCap, desc: 'Salaries & employment' },
  { label: 'Employer Intelligence', href: '/employers', icon: Building2, desc: 'Top graduate employers' },
]

export function IntelligencePage() {
  const [params, setParams] = useSearchParams()
  const initial = (params.get('filter') as Category) || 'all'
  const [tab, setTab] = useState<Category>(TABS.some((t) => t.id === initial) ? initial : 'all')

  function selectTab(t: Category) {
    setTab(t)
    const next = new URLSearchParams(params)
    if (t === 'all') next.delete('filter'); else next.set('filter', t)
    setParams(next, { replace: true })
  }

  const items = useMemo(() => (tab === 'all' ? FEED : FEED.filter((i) => i.category === tab)), [tab])

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-3">
      {/* Status bar */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-1.5 mb-3 border" style={{ backgroundColor: 'var(--bg-2)', borderColor: 'var(--border)', borderRadius: 3, fontSize: 11 }}>
        <Newspaper className="w-3 h-3" style={{ color: 'var(--accent)' }} />
        <span style={{ color: 'var(--muted)', letterSpacing: '0.06em' }}>INTELLIGENCE CENTRE</span>
        <span style={{ color: 'var(--border-strong)' }}>│</span>
        <span style={{ color: 'var(--text-2)' }}>News · Government · Research England · OfS · HESA · UCAS — one feed</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {/* Feed */}
        <div className="lg:col-span-3">
          {/* Filter tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-2 mb-3 border" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}>
            <Filter className="w-3.5 h-3.5 ml-1 mr-0.5" style={{ color: 'var(--muted)' }} />
            {TABS.map((t) => {
              const active = tab === t.id
              return (
                <button key={t.id} onClick={() => selectTab(t.id)} className="px-2.5 py-1 transition-colors"
                  style={{ backgroundColor: active ? 'var(--accent)' : 'transparent', color: active ? '#fff' : 'var(--text-2)', borderRadius: 3, fontSize: 11.5, fontWeight: active ? 500 : 400, border: active ? '1px solid var(--accent)' : '1px solid var(--border)' }}>
                  {t.label}
                </button>
              )
            })}
          </div>

          {/* Chronological items */}
          <div className="space-y-2">
            {items.map((item) => {
              const meta = SOURCE_META[item.category]
              const Icon = meta.icon
              return (
                <div key={item.id} className="border p-3 transition-colors" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="flex items-center gap-1.5 px-1.5 py-0.5" style={{ border: `1px solid ${meta.color}`, borderRadius: 2 }}>
                      <Icon className="w-3 h-3" style={{ color: meta.color }} />
                      <span style={{ color: meta.color, fontSize: 9.5, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{meta.label}</span>
                    </span>
                    <span style={{ color: 'var(--muted)', fontSize: 11 }}>{item.source}</span>
                    <span className="ml-auto font-num" style={{ color: 'var(--muted)', fontSize: 10.5 }}>
                      {new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text)', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{item.title}</p>
                  <p style={{ color: 'var(--text-2)', fontSize: 12.5, lineHeight: 1.5, marginBottom: 8 }}>{item.summary}</p>
                  <div className="flex flex-wrap gap-2">
                    {item.links.map((l) => (
                      <Link key={l.href + l.label} to={l.href} className="flex items-center gap-1 px-2 py-1" style={{ border: '1px solid var(--border)', borderRadius: 3, color: 'var(--text-2)', fontSize: 11 }}>
                        {l.label} <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Sidebar deep dives */}
        <div className="space-y-2.5">
          <div className="border p-3" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}>
            <p style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Go deeper</p>
            <div className="space-y-1.5">
              {DEEP_DIVES.map((d) => {
                const Icon = d.icon
                return (
                  <Link key={d.href} to={d.href} className="flex items-center gap-2.5 px-2 py-2 transition-colors" style={{ border: '1px solid var(--border)', borderRadius: 3 }}>
                    <Icon className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                    <span className="flex-1 min-w-0">
                      <span className="block" style={{ color: 'var(--text)', fontSize: 12.5 }}>{d.label}</span>
                      <span className="block truncate" style={{ color: 'var(--muted)', fontSize: 10.5 }}>{d.desc}</span>
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="border p-3" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 3 }}>
            <p style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>This week</p>
            <div className="space-y-2">
              {[['Reports published', String(FEED.filter((f) => f.category === 'report').length)], ['Policy updates', String(FEED.filter((f) => f.category === 'policy').length)], ['Sector alerts', String(FEED.filter((f) => f.category === 'alert').length)]].map(([l, v]) => (
                <div key={l} className="flex items-center justify-between">
                  <span style={{ color: 'var(--text-2)', fontSize: 12 }}>{l}</span>
                  <span className="font-num" style={{ color: 'var(--text)', fontSize: 14, fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
