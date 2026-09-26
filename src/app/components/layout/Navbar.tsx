import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import {
  Search, Sun, Moon, Bell, X, Building2, BarChart2, GitCompare,
  Compass, Newspaper, Database, Terminal, Heart, Hash, ChevronDown,
  TrendingUp, FileText, GraduationCap, BookOpen, Briefcase, Route,
  Megaphone,
  Activity,
} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useYear } from '../../context/YearContext'
import { AVAILABLE_YEARS } from '../../data/financials'
import { BrandLogo } from '../brand/BrandLogo'
import { SpotlightModal } from './SpotlightModal'

// ── Reduced, workflow-oriented primary navigation ───────────────────────────
const PRIMARY_NAV = [
  { href: '/', label: 'Overview' },
  { href: '/universities', label: 'Universities' },
  { href: '/compare', label: 'Compare' },
  { href: '/rankings', label: 'Rankings' },
  { href: '/explorer', label: 'Explorer' },
  { href: '/system-watch', label: 'System Watch' },
  { href: '/student-journey', label: 'Students' },
  { href: '/intelligence', label: 'Intelligence', dropdown: true },
  { href: '/open-data', label: 'Open Data' },
]

// Intelligence groups the deeper analytical workspaces contextually, instead of
// scattering them across the top-level nav.
const INTELLIGENCE_MENU: { title: string; items: { href: string; label: string; desc: string; icon: typeof TrendingUp }[] }[] = [
  {
    title: 'Sector & Market',
    items: [
      { href: '/intelligence', label: 'Intelligence Centre', desc: 'News, policy & alerts feed', icon: Newspaper },
      { href: '/social-studio', label: 'Social Studio', desc: 'Metric-led post drafts', icon: Megaphone },
      { href: '/sector', label: 'Sector Overview', desc: 'Sector-wide financial trends', icon: TrendingUp },
      { href: '/system-watch', label: 'System Watch', desc: 'Finance & employment risk', icon: Activity },
      { href: '/reports', label: 'Annual Reports', desc: 'Full report library', icon: FileText },
      { href: '/employers', label: 'Employer Intelligence', desc: 'Top graduate employers', icon: Briefcase },
      { href: '/degrees', label: 'Degree Intelligence', desc: 'Subject-level analytics', icon: BookOpen },
    ],
  },
  {
    title: 'Students & Careers',
    items: [
      { href: '/graduate-outcomes', label: 'Graduate Outcomes', desc: 'Salaries & employment', icon: GraduationCap },
      { href: '/career-explorer', label: 'Career Explorer', desc: 'Pathways by discipline', icon: Compass },
      { href: '/student-journey', label: 'Student Journey', desc: 'Application to graduation', icon: Route },
    ],
  },
]

function IntelligenceDropdown({ active }: { active: boolean }) {
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function enter() { if (closeTimer.current) clearTimeout(closeTimer.current); setOpen(true) }
  function leave() { closeTimer.current = setTimeout(() => setOpen(false), 120) }

  return (
    <div className="relative h-full" onMouseEnter={enter} onMouseLeave={leave}>
      <Link
        to="/intelligence"
        className="px-3 h-full flex items-center gap-1 transition-colors border-b-2 whitespace-nowrap"
        style={{ color: active ? 'var(--text)' : 'var(--text-2)', borderColor: active ? 'var(--accent)' : 'transparent', fontSize: 12.5, fontWeight: active ? 600 : 400 }}
      >
        Intelligence
        <ChevronDown className="w-3 h-3 transition-transform" style={{ transform: open ? 'rotate(180deg)' : 'none' }} />
      </Link>
      {open && (
        <div
          className="absolute left-0 top-full grid grid-cols-2 gap-x-2 gap-y-0.5 p-2"
          style={{ width: 520, backgroundColor: 'var(--panel)', border: '1px solid var(--border-strong)', borderRadius: 6, boxShadow: '0 12px 32px rgba(0,0,0,0.4)' }}
        >
          {INTELLIGENCE_MENU.map((group) => (
            <div key={group.title}>
              <p className="px-2 pt-2 pb-1" style={{ color: 'var(--muted)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{group.title}</p>
              {group.items.map((item) => {
                const Icon = item.icon
                return (
                  <Link key={item.href} to={item.href} className="flex items-start gap-2.5 px-2 py-1.5 rounded-sm transition-colors hover:bg-[var(--panel-hover)]">
                    <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                    <span className="min-w-0">
                      <span className="block" style={{ color: 'var(--text)', fontSize: 12.5 }}>{item.label}</span>
                      <span className="block truncate" style={{ color: 'var(--muted)', fontSize: 10.5 }}>{item.desc}</span>
                    </span>
                  </Link>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Command palette: actions framed as questions, not datasets ───────────────
interface Command {
  icon: React.ReactNode
  label: string
  hint: string
  type: string
  href: string
  keywords?: string
}

const COMMANDS: Command[] = [
  { icon: <Activity className="w-3.5 h-3.5" />, label: 'Open UK HE System Watch', hint: 'Finance, employment & labour risk', type: 'Risk Monitor', href: '/system-watch', keywords: 'atomic clock risk sector employment' },
  { icon: <GitCompare className="w-3.5 h-3.5" />, label: 'Compare universities', hint: 'Up to six side by side', type: 'Workflow', href: '/compare', keywords: 'versus benchmark' },
  { icon: <GitCompare className="w-3.5 h-3.5" />, label: 'Compare Oxford and Cambridge', hint: 'Quick comparison', type: 'Compare', href: '/compare?set=oxbridge' },
  { icon: <BarChart2 className="w-3.5 h-3.5" />, label: 'Show highest revenue universities', hint: 'Financial league table', type: 'Rankings', href: '/rankings?sort=revenue' },
  { icon: <BarChart2 className="w-3.5 h-3.5" />, label: 'Universities with highest graduate salaries', hint: 'Outcomes ranking', type: 'Rankings', href: '/rankings?category=outcomes' },
  { icon: <Compass className="w-3.5 h-3.5" />, label: 'Explore the sector visually', hint: 'Map · graph · timeline · table', type: 'Explorer', href: '/explorer', keywords: 'map visualisation chart' },
  { icon: <Newspaper className="w-3.5 h-3.5" />, label: 'Latest sector intelligence', hint: 'News, policy & reports', type: 'Intelligence', href: '/intelligence', keywords: 'government ofs hesa ucas' },
  { icon: <Newspaper className="w-3.5 h-3.5" />, label: 'Government funding updates', hint: 'Policy feed', type: 'Intelligence', href: '/intelligence?filter=policy' },
  { icon: <Megaphone className="w-3.5 h-3.5" />, label: 'Create social post from metrics', hint: 'Verified data drafts', type: 'Social Studio', href: '/social-studio', keywords: 'social content share post metrics' },
  { icon: <Database className="w-3.5 h-3.5" />, label: 'Download open data', hint: 'CSV · JSON · API', type: 'Open Data', href: '/open-data' },
  { icon: <Terminal className="w-3.5 h-3.5" />, label: 'API reference', hint: 'Endpoints & keys', type: 'API', href: '/api' },
  { icon: <Hash className="w-3.5 h-3.5" />, label: 'Brand system', hint: 'Logos, colours & social kit', type: 'Identity', href: '/brand' },
  { icon: <Heart className="w-3.5 h-3.5" />, label: 'Support HEStats', hint: 'Keep the data open', type: 'Support', href: '/support' },
]

interface ResultItem {
  icon: React.ReactNode
  label: string
  hint?: string
  type: string
  href: string
}

function SpotlightModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => { inputRef.current?.focus() }, [])

  const q = query.trim().toLowerCase()

  // Institutions matching the query
  const instResults: ResultItem[] = q
    ? institutions
        .filter((i) => i.canonical_name.toLowerCase().includes(q) || i.short_name.toLowerCase().includes(q) || i.city.toLowerCase().includes(q))
        .slice(0, 6)
        .map((i) => ({
          icon: <Building2 className="w-3.5 h-3.5" />,
          label: i.canonical_name,
          hint: `${i.city} · ${i.nation}`,
          type: 'University',
          href: `/universities/${i.id}`,
        }))
    : []

  const cmdResults: ResultItem[] = q
    ? COMMANDS.filter((c) =>
        c.label.toLowerCase().includes(q) || c.type.toLowerCase().includes(q) || (c.keywords ?? '').includes(q),
      )
    : COMMANDS

  const groups: { title: string; items: ResultItem[] }[] = q
    ? [
        { title: 'Universities', items: instResults },
        { title: 'Actions', items: cmdResults },
      ].filter((g) => g.items.length > 0)
    : [{ title: 'Suggested', items: cmdResults }]

  const flat = groups.flatMap((g) => g.items)

  useEffect(() => { setActiveIdx(0) }, [query])

  function go(item: ResultItem | undefined) {
    if (item) { navigate(item.href); onClose() }
    else if (q) { navigate(`/universities?q=${encodeURIComponent(query)}`); onClose() }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, flat.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)) }
    if (e.key === 'Enter') { e.preventDefault(); go(flat[activeIdx]) }
    if (e.key === 'Escape') onClose()
  }

  let runningIdx = -1

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-16 sm:pt-24 px-3"
      style={{ backgroundColor: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[620px] overflow-hidden"
        style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--border-strong)', borderRadius: 8 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--muted)' }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask anything — compare Oxford and Nottingham, top research income…"
            className="flex-1 bg-transparent outline-none"
            style={{ color: 'var(--text)', fontSize: 14 }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ color: 'var(--muted)' }}>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd
            className="hidden sm:inline"
            style={{ color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 3, fontSize: 10, padding: '2px 6px', fontFamily: "'JetBrains Mono', monospace" }}
          >
            ESC
          </kbd>
        </div>

        <div style={{ maxHeight: '58vh', overflowY: 'auto' }}>
          {flat.length === 0 && (
            <p className="px-4 py-6 text-center" style={{ color: 'var(--muted)', fontSize: 13 }}>
              No matches for “{query}”. Press <kbd style={{ fontFamily: "'JetBrains Mono', monospace" }}>↵</kbd> to search universities.
            </p>
          )}
          {groups.map((group) => (
            <div key={group.title}>
              <p className="px-4 pt-3 pb-1" style={{ color: 'var(--muted)', fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {group.title}
              </p>
              {group.items.map((item) => {
                runningIdx += 1
                const idx = runningIdx
                return (
                  <button
                    key={`${group.title}-${item.href}-${item.label}`}
                    onClick={() => go(item)}
                    onMouseEnter={() => setActiveIdx(idx)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                    style={{ backgroundColor: idx === activeIdx ? 'var(--panel-hover)' : 'transparent' }}
                  >
                    <span style={{ color: idx === activeIdx ? 'var(--accent)' : 'var(--muted)', flexShrink: 0 }}>{item.icon}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block truncate" style={{ color: 'var(--text)', fontSize: 13 }}>{item.label}</span>
                      {item.hint && <span className="block truncate" style={{ color: 'var(--muted)', fontSize: 11 }}>{item.hint}</span>}
                    </span>
                    <span
                      className="hidden sm:inline px-1.5 py-0.5 flex-shrink-0"
                      style={{ color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 2, fontSize: 9.5, letterSpacing: '0.06em', textTransform: 'uppercase' }}
                    >
                      {item.type}
                    </span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 px-4 py-2" style={{ borderTop: '1px solid var(--border)', backgroundColor: 'var(--bg-2)' }}>
          {[['↑↓', 'Navigate'], ['↵', 'Open'], ['ESC', 'Close']].map(([key, label]) => (
            <span key={label} className="hidden sm:flex items-center gap-1.5" style={{ fontSize: 10, color: 'var(--muted)' }}>
              <kbd style={{ border: '1px solid var(--border)', borderRadius: 2, padding: '1px 4px', fontFamily: "'JetBrains Mono', monospace", fontSize: 9 }}>{key}</kbd>
              {label}
            </span>
          ))}
          <span className="ml-auto flex items-center gap-1.5" style={{ fontSize: 10, color: 'var(--muted)' }}>
            <Hash className="w-3 h-3" /> {institutions.length} universities indexed
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Mobile bottom navigation — a mobile-first intelligence shell ─────────────
function BottomNav({ onSearch }: { onSearch: () => void }) {
  const location = useLocation()
  const isActive = (href: string) => (href === '/' ? location.pathname === '/' : location.pathname.startsWith(href))

  const items = [
    { href: '/', label: 'Overview', icon: BarChart2 },
    { href: '/explorer', label: 'Explorer', icon: Compass },
    { href: '/system-watch', label: 'Watch', icon: Activity },
    { type: 'search' as const, label: 'Search', icon: Search },
    { href: '/compare', label: 'Compare', icon: GitCompare },
    { href: '/student-journey', label: 'Students', icon: GraduationCap },
  ]

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const { theme } = useTheme()
  return <>
    <Link className="observatory-brand" to="/" onClick={onNavigate} aria-label="HEStats overview">
      <BrandLogo variant="mark" tone={theme === 'dark' ? 'onDark' : 'onLight'} size={36} />
      <span><strong>HEStats</strong><small>UK higher education<br />intelligence</small></span>
    </Link>
    <nav aria-label="Main navigation" className="observatory-navigation">
      {NAV_GROUPS.map((group, index) => <div className="nav-group" key={group.label}>
        {index > 0 && <p>{group.label}</p>}
        {group.items.map(({ href, label, icon: Icon }) => <NavLink key={href} to={href} end={href === '/'} onClick={onNavigate} className={({ isActive }) => 'observatory-nav-link' + (isActive ? ' active' : '')}><Icon size={18} /><span>{label}</span></NavLink>)}
      </div>)}
    </nav>
    <div className="sidebar-note"><span>Independent. Open. Accessible.</span><Link to="/support" onClick={onNavigate}><Heart size={14} />Support HEStats</Link></div>
  </>
}

export function Navbar() {
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const { selectedYear, setSelectedYear } = useYear()
  const [spotlightOpen, setSpotlightOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => { setMenuOpen(false) }, [location.pathname])
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      if (e.key === '/' || (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault(); setSpotlightOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  return <>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <aside className="observatory-sidebar"><Navigation /></aside>
    <header className="observatory-topbar">
      <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
        <Dialog.Trigger className="icon-button mobile-menu" aria-label="Open navigation"><Menu size={21} /></Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="navigation-overlay" />
          <Dialog.Content className="navigation-drawer" aria-describedby={undefined}>
            <Dialog.Title className="sr-only">Navigation</Dialog.Title>
            <Dialog.Close className="icon-button drawer-close" aria-label="Close navigation"><X size={20} /></Dialog.Close>
            <Navigation onNavigate={() => setMenuOpen(false)} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <button className="observatory-search" aria-label="Search HEStats" onClick={() => setSpotlightOpen(true)}><Search size={20} /><span>Search for a university, indicator or keyword…</span><kbd>⌘ K</kbd></button>
      {location.pathname === '/' && <label className="observatory-year"><span className="sr-only">Financial year</span><select value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)}>{AVAILABLE_YEARS.map((year) => <option key={year} value={year}>FY {year}</option>)}</select></label>}
      <button onClick={toggleTheme} className="icon-button" aria-label="Toggle theme">{theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}</button>
      <Link to="/explorer" className="observatory-button primary topbar-explore">Explore data <ArrowRight size={17} /></Link>
    </header>
    {spotlightOpen && <SpotlightModal onClose={() => setSpotlightOpen(false)} />}
  </>
}
