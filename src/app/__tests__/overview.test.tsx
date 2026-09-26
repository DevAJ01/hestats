import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router'
import { HomePage } from '../pages/HomePage'
import { Navbar } from '../components/layout/Navbar'
import { YearProvider } from '../context/YearContext'
import { ThemeProvider } from '../context/ThemeContext'
import { WorkspaceProvider } from '../context/WorkspaceContext'

function renderOverview() {
  return render(<MemoryRouter><ThemeProvider><YearProvider><WorkspaceProvider><Navbar /><HomePage /></WorkspaceProvider></YearProvider></ThemeProvider></MemoryRouter>)
}
afterEach(cleanup)
describe('overview analytical workflows', () => {
  it('updates sector figures, table year and chart metric from the controls', () => {
    renderOverview()
    expect(within(screen.getByRole('region', { name: 'Sector indicators for 2024-25' })).getByText('£54.79bn')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('combobox', { name: 'Financial year' }), { target: { value: '2023-24' } })
    expect(within(screen.getByRole('region', { name: 'Sector indicators for 2023-24' })).getByText('£54.21bn')).toBeInTheDocument()
    expect(screen.getByRole('table', { name: /2023-24/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Research' }))
    expect(screen.getByRole('heading', { name: 'Sector research income' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Research' })).toHaveAttribute('aria-pressed', 'true')
  })
  it('requires two institutions and carries the exact selection into comparison', () => {
    renderOverview()
    expect(screen.getByRole('button', { name: 'Compare selected' })).toBeDisabled()
    fireEvent.click(screen.getByRole('checkbox', { name: 'Compare Oxford' }))
    expect(screen.getByRole('button', { name: 'Compare selected' })).toBeDisabled()
    fireEvent.click(screen.getByRole('checkbox', { name: 'Compare Cambridge' }))
    expect(screen.getByRole('link', { name: 'Compare selected' })).toHaveAttribute('href', '/compare?ids=oxford,cambridge')
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(screen.getByRole('checkbox', { name: 'Compare Oxford' })).not.toBeChecked()
    expect(screen.getByRole('button', { name: 'Compare selected' })).toBeDisabled()
  })
  it('sorts the featured institutions and exposes readable historical values', () => {
    renderOverview()
    fireEvent.click(screen.getByRole('button', { name: /Total income/ }))
    const table = screen.getByRole('table', { name: /Leading institutions/ })
    expect(within(table).getAllByRole('row')[1]).toHaveTextContent('Imperial College London')
    fireEvent.click(screen.getByText('View trend data and coverage'))
    expect(screen.getByRole('table', { name: 'Verified sector totals by financial year' })).toHaveTextContent('2024-25')
  })
})
