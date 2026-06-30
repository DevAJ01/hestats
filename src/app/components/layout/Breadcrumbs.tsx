import { Link, useLocation, useParams } from 'react-router'
import { ChevronRight, Home } from 'lucide-react'
import { institutions } from '../../data/institutions'

const LABELS: Record<string, string> = {
  universities: 'Universities',
  institutions: 'Universities',
  compare: 'Compare',
  rankings: 'Rankings',
  explorer: 'Explorer',
  intelligence: 'Intelligence',
  sector: 'Sector Overview',
  reports: 'Annual Reports',
  'graduate-outcomes': 'Graduate Outcomes',
  employers: 'Employer Intelligence',
  degrees: 'Degree Intelligence',
  'career-explorer': 'Career Explorer',
  'student-journey': 'Student Journey',
  'open-data': 'Open Data',
  api: 'API',
  about: 'Methodology',
  support: 'Support',
  map: 'Explorer',
}

// Pages nested under the Intelligence centre — show Intelligence as a parent crumb.
const UNDER_INTELLIGENCE = new Set([
  'sector', 'reports', 'graduate-outcomes', 'employers', 'degrees', 'career-explorer', 'student-journey',
])

interface Crumb { label: string; href?: string }

export function Breadcrumbs() {
  const location = useLocation()
  const params = useParams()
  const segments = location.pathname.split('/').filter(Boolean)

  if (segments.length === 0) return null // No crumbs on the Overview homepage

  const crumbs: Crumb[] = [{ label: 'Overview', href: '/' }]
  const first = segments[0]

  if (UNDER_INTELLIGENCE.has(first)) {
    crumbs.push({ label: 'Intelligence', href: '/intelligence' })
  }

  if ((first === 'universities' || first === 'institutions') && params.id) {
    crumbs.push({ label: 'Universities', href: '/universities' })
    const inst = institutions.find((i) => i.id === params.id)
    crumbs.push({ label: inst?.canonical_name ?? params.id })
  } else {
    crumbs.push({ label: LABELS[first] ?? first })
  }

  return (
    <div className="border-b" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}>
      <nav className="max-w-[1600px] mx-auto px-3 sm:px-4 py-1.5 flex items-center gap-1.5 overflow-x-auto" aria-label="Breadcrumb">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1
          return (
            <span key={`${c.label}-${i}`} className="flex items-center gap-1.5 flex-shrink-0">
              {i === 0 && <Home className="w-3 h-3" style={{ color: 'var(--muted)' }} />}
              {c.href && !last ? (
                <Link to={c.href} className="transition-colors hover:underline whitespace-nowrap" style={{ color: 'var(--text-2)', fontSize: 11 }}>{c.label}</Link>
              ) : (
                <span className="whitespace-nowrap" style={{ color: last ? 'var(--text)' : 'var(--text-2)', fontSize: 11, fontWeight: last ? 600 : 400 }}>{c.label}</span>
              )}
              {!last && <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--muted)' }} />}
            </span>
          )
        })}
      </nav>
    </div>
  )
}
