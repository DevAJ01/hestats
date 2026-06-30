import { RouterProvider } from 'react-router'
import { router } from './routes'
import { ThemeProvider } from './context/ThemeContext'
import { YearProvider } from './context/YearContext'
import { WorkspaceProvider } from './context/WorkspaceContext'
import { ContextPanelProvider } from './context/ContextPanelContext'

export default function App() {
  return (
    <ThemeProvider>
      <YearProvider>
        <WorkspaceProvider>
          <ContextPanelProvider>
            <RouterProvider router={router} />
          </ContextPanelProvider>
        </WorkspaceProvider>
      </YearProvider>
    </ThemeProvider>
  )
}
