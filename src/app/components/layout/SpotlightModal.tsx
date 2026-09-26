import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import {
  Search, X, Building2, BarChart2, GitCompare,
  Compass, Newspaper, Database, Terminal, Heart, Hash, ChevronDown,
  TrendingUp, FileText, GraduationCap, BookOpen, Briefcase, Route,
  Megaphone,
  Activity,
} from 'lucide-react'
import { institutions } from '../../data/institutions'

interface Command {
  icon: React.ReactNode
  label: string
  hint: string
  type: string
  href: string
  keywords?: string
}

const COMMANDS: Command[] = [
  { icon: <FileText className="w-3.5 h-3.5" />, label: 'OfS annual report 2025–26', hint: 'Financial resilience, student experience and funding', type: 'Source', href: '/reports#ofs-annual-report', keywords: 'ofs 2026 annual report accounts source evidence' },
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

export function SpotlightModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    inputRef.current?.focus()
    function trap(event: KeyboardEvent) {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return }
      if (event.key !== 'Tab') return
      const dialog = inputRef.current?.closest('[role="dialog"]')
      const nodes = Array.from(dialog?.querySelectorAll<HTMLElement>('button, input') ?? [])
      const first = nodes[0], last = nodes[nodes.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', trap)
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', trap); previous?.focus() }
  }, [])

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
      className="spotlight-overlay fixed inset-0 z-[200] flex items-start justify-center pt-16 sm:pt-24 px-3"
      style={{ backgroundColor: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        role="dialog" aria-modal="true" aria-label="Search HEStats" className="spotlight-dialog w-full max-w-[620px] overflow-hidden"
        style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--border-strong)', borderRadius: 8 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--muted)' }} />
          <input
            ref={inputRef}
            type="text"
            aria-label="Search universities and actions"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search universities or actions…"
            className="flex-1 bg-transparent outline-none"
            style={{ color: 'var(--text)', fontSize: 14 }}
          />
          {query && (
            <button aria-label="Clear search" onClick={() => setQuery('')} style={{ color: 'var(--muted)' }}>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button className="icon-button" aria-label="Close search" onClick={onClose}><X size={18} /></button>
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
