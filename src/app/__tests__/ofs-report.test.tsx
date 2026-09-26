import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { OfsReportPanel } from '../components/intelligence/OfsReportPanel'

afterEach(cleanup)

describe('annual report evidence panel', () => {
  it('distinguishes forecasts and exposes linked source pages across topic switches', () => {
    render(<MemoryRouter><OfsReportPanel /></MemoryRouter>)
    expect(screen.getByText('42.7%')).toBeInTheDocument()
    expect(screen.getByText('Forecast')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /forecasting a deficit: report page 54/ })).toHaveAttribute('href', expect.stringContaining('#page=55'))
    fireEvent.click(screen.getByRole('button', { name: 'Student experience' }))
    expect(screen.getByRole('button', { name: 'Student experience' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('£13.9m')).toBeInTheDocument()
    expect(screen.getByText('Financial year 2025-26')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Public funding' }))
    expect(screen.getByText('£1,386.853m')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Coverage & interpretation'))
    expect(within(screen.getByText('Coverage & interpretation').closest('details')!).getByText(/Re-presented comparator/)).toBeInTheDocument()
  })
})
