import { cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { appRoutes } from '../routes'
import { ThemeProvider } from '../context/ThemeContext'
import { YearProvider } from '../context/YearContext'
import { WorkspaceProvider } from '../context/WorkspaceContext'
import { ContextPanelProvider } from '../context/ContextPanelContext'

const PUBLIC_ROUTE_SMOKE_CASES = [
  '/',
  '/universities',
  '/universities/oxford',
  '/institutions',
  '/institutions/oxford',
  '/rankings?sort=revenue',
  '/compare?ids=oxford,cambridge',
  '/explorer',
  '/map',
  '/intelligence',
  '/social-studio',
  '/sector',
  '/reports',
  '/graduate-outcomes',
  '/employers',
  '/degrees',
  '/career-explorer',
  '/student-journey',
  '/open-data',
  '/api',
  '/about',
  '/support',
]

async function renderRoute(path: string) {
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] })
  const view = render(
    <ThemeProvider>
      <YearProvider>
        <WorkspaceProvider>
          <ContextPanelProvider>
            <RouterProvider router={router} />
          </ContextPanelProvider>
        </WorkspaceProvider>
      </YearProvider>
    </ThemeProvider>,
  )
  await waitFor(() => {
    const text = view.container.textContent ?? ''
    expect(text).not.toMatch(/route unavailable/i)
    expect(text.length).toBeGreaterThan(200)
  })
}

afterEach(() => cleanup())

describe('public route smoke tests', () => {
  it.each(PUBLIC_ROUTE_SMOKE_CASES)('renders %s', async (path) => {
    await renderRoute(path)
  })
})
