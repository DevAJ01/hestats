import { createBrowserRouter, Link, Navigate, useRouteError, type RouteObject } from 'react-router'
import { RootLayout } from './components/layout/RootLayout'
import { HomePage } from './pages/HomePage'
import { InstitutionsPage } from './pages/InstitutionsPage'
import { InstitutionProfilePage } from './pages/InstitutionProfilePage'
import { ComparePage } from './pages/ComparePage'
import { RankingsPage } from './pages/RankingsPage'
import { AboutPage } from './pages/AboutPage'
import { SupportPage } from './pages/SupportPage'
import { SectorPage } from './pages/SectorPage'
import { ReportsPage } from './pages/ReportsPage'
import { MapPage } from './pages/MapPage'
import { ApiPage } from './pages/ApiPage'
import { OpenDataPage } from './pages/OpenDataPage'
import { GraduateOutcomesPage } from './pages/GraduateOutcomesPage'
import { EmployersPage } from './pages/EmployersPage'
import { DegreesPage } from './pages/DegreesPage'
import { CareerExplorerPage } from './pages/CareerExplorerPage'
import { StudentJourneyPage } from './pages/StudentJourneyPage'
import { ExplorerPage } from './pages/ExplorerPage'
import { IntelligencePage } from './pages/IntelligencePage'
import { BrandPage } from './pages/BrandPage'

function NotFoundPage() {
  const error = useRouteError()
  const status = error instanceof Response ? error.status : 404

  return (
    <div className="max-w-[900px] mx-auto px-4 py-10">
      <div className="border p-5" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', borderRadius: 4 }}>
        <p className="font-num" style={{ color: 'var(--negative)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {status} · Route unavailable
        </p>
        <h1 style={{ color: 'var(--text)', fontSize: 22, fontWeight: 700, marginTop: 8 }}>HEStats route not found</h1>
        <p style={{ color: 'var(--text-2)', fontSize: 13, lineHeight: 1.6, marginTop: 8 }}>
          The requested workspace is not part of the current verified public build.
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          <Link to="/universities" style={{ backgroundColor: 'var(--accent)', color: '#fff', borderRadius: 3, fontSize: 12, fontWeight: 600, padding: '7px 10px' }}>Browse universities</Link>
          <Link to="/open-data" style={{ border: '1px solid var(--border)', color: 'var(--text-2)', borderRadius: 3, fontSize: 12, padding: '7px 10px' }}>Open data</Link>
        </div>
      </div>
    </div>
  )
}

export const appRoutes: RouteObject[] = [
  {
    path: '/',
    Component: RootLayout,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, Component: HomePage },

      // Universities — the primary object in the platform
      { path: 'universities', Component: InstitutionsPage },
      { path: 'universities/:id', Component: InstitutionProfilePage },
      // Legacy aliases
      { path: 'institutions', element: <Navigate to="/universities" replace /> },
      { path: 'institutions/:id', Component: InstitutionProfilePage },

      { path: 'compare', Component: ComparePage },
      { path: 'rankings', Component: RankingsPage },

      // Explorer — unified visualisation workspace (map · graph · timeline · table)
      { path: 'explorer', Component: ExplorerPage },
      { path: 'map', element: <Navigate to="/explorer?view=map" replace /> },

      // Intelligence — consolidated news, policy, reports & sector centre
      { path: 'intelligence', Component: IntelligencePage },
      { path: 'sector', Component: SectorPage },
      { path: 'reports', Component: ReportsPage },
      { path: 'graduate-outcomes', Component: GraduateOutcomesPage },
      { path: 'employers', Component: EmployersPage },
      { path: 'degrees', Component: DegreesPage },
      { path: 'career-explorer', Component: CareerExplorerPage },
      { path: 'student-journey', Component: StudentJourneyPage },

      { path: 'open-data', Component: OpenDataPage },
      { path: 'api', Component: ApiPage },
      { path: 'about', Component: AboutPage },
      { path: 'brand', Component: BrandPage },
      { path: 'support', Component: SupportPage },

      { path: '*', loader: () => { throw new Response('Not Found', { status: 404 }) } },
    ],
  },
]

export const router = createBrowserRouter(appRoutes)
