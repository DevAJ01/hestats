import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import * as Dialog from '@radix-ui/react-dialog'
import { Search, Sun, Moon, X, Building2, BarChart2, GitCompare, Compass, Newspaper, Database, Heart, TrendingUp, FileText, GraduationCap, BookOpen, Activity, Menu, ArrowRight, Trophy } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useYear } from '../../context/YearContext'
import { AVAILABLE_YEARS } from '../../data/financials'
import { BrandLogo } from '../brand/BrandLogo'
import { SpotlightModal } from './SpotlightModal'

const NAV_GROUPS = [
  { label: 'Explore', items: [
    { href: '/', label: 'Overview', icon: BarChart2 },
    { href: '/explorer', label: 'Explorer', icon: Compass },
    { href: '/universities', label: 'Universities', icon: Building2 },
    { href: '/compare', label: 'Compare', icon: GitCompare },
    { href: '/rankings', label: 'Rankings', icon: Trophy },
  ] },
  { label: 'Intelligence', items: [
    { href: '/system-watch', label: 'System watch', icon: Activity },
    { href: '/sector', label: 'Sector finances', icon: TrendingUp },
    { href: '/student-journey', label: 'Students & careers', icon: GraduationCap },
    { href: '/intelligence', label: 'Intelligence centre', icon: Newspaper },
  ] },
  { label: 'Sources', items: [
    { href: '/open-data', label: 'Open data', icon: Database },
    { href: '/reports', label: 'Publications', icon: FileText },
    { href: '/about', label: 'Methodology', icon: BookOpen },
  ] },
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
