import { describe, expect, it } from 'vitest'
import { getOverallRankingsForYear } from './rankings'

describe('overall evidence rankings', () => {
  it('only ranks evidence-backed rows and keeps scores within 0–100', () => {
    const rows = getOverallRankingsForYear('2024-25')
    const ranked = rows.filter((row) => row.rank !== null)

    expect(ranked.length).toBeGreaterThan(100)
    expect(ranked.every((row) => row.overall_score !== null && row.overall_score >= 0 && row.overall_score <= 100)).toBe(true)
    expect(ranked.every((row) => row.dimensions_available >= 2)).toBe(true)
    expect(ranked.every((row) => row.coverage_pct > 0 && row.coverage_pct <= 100)).toBe(true)
  })

  it('keeps Nottingham rankable from its verified accounts and outcomes evidence', () => {
    const row = getOverallRankingsForYear('2024-25').find((item) => item.institution_id === 'nottingham')
    expect(row?.finance_score).not.toBeNull()
    expect(row?.overall_score).not.toBeNull()
  })
})
