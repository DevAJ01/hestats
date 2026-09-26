import { Outlet } from 'react-router'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { Breadcrumbs } from './Breadcrumbs'
import { ContextPanel } from './ContextPanel'
import { SeoManager } from '../seo/SeoManager'

export function RootLayout() {
  return <div className="observatory-shell">
    <SeoManager />
    <Navbar />
    <div className="observatory-content">
      <Breadcrumbs />
      <main id="main-content" tabIndex={-1}><Outlet /></main>
      <Footer />
    </div>
    <ContextPanel />
  </div>
}
