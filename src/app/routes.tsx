import { createBrowserRouter, Navigate } from 'react-router'
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

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
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
      { path: 'support', Component: SupportPage },

      { path: '*', loader: () => { throw new Response('Not Found', { status: 404 }) } },
    ],
  },
])
