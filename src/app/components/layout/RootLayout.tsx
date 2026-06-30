import { Outlet } from 'react-router'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { Breadcrumbs } from './Breadcrumbs'
import { ContextPanel } from './ContextPanel'

export function RootLayout() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
    >
      <Navbar />
      <Breadcrumbs />
      <main className="flex-1 pb-16 lg:pb-0">
        <Outlet />
      </main>
      <Footer />
      <ContextPanel />
    </div>
  )
}
