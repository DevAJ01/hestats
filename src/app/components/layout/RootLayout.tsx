import { useEffect, useRef } from 'react'
import { Outlet, useLocation, useNavigationType } from 'react-router'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { Breadcrumbs } from './Breadcrumbs'
import { ContextPanel } from './ContextPanel'
import { SeoManager } from '../seo/SeoManager'

export function RootLayout() {
  const { pathname, hash } = useLocation()
  const navigationType = useNavigationType()
  const previousPath = useRef(pathname)
  useEffect(() => {
    if (hash) {
      let target = hash.slice(1)
      try { target = decodeURIComponent(target) } catch { /* Use a literal malformed fragment. */ }
      document.getElementById(target)?.scrollIntoView?.({ block: 'start' })
    } else if (previousPath.current !== pathname && navigationType !== 'POP') {
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
      document.getElementById('main-content')?.focus({ preventScroll: true })
    }
    previousPath.current = pathname
  }, [pathname, hash, navigationType])
  return <div className="observatory-shell">
    <SeoManager />
    <Navbar />
    <div className="observatory-content">
      <Breadcrumbs />
      <main id="main-content" tabIndex={-1}><div className="route-entry" key={pathname}><Outlet /></div></main>
      <Footer />
    </div>
    <ContextPanel />
  </div>
}
