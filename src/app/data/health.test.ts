import { describe, expect, it } from 'vitest'
import { computeHealthScore, getAllHealthScores } from './health'
import { FinancialYear } from './types'

const baseline: FinancialYear = {
  institution_id: 'test-provider',
  fiscal_year: '2024-25',
  revenue_gbp_m: 100,
  surplus_gbp_m: 5,
  surplus_margin_pct: 5,
  research_income_gbp_m: 15,
  tuition_fee_income_gbp_m: 55,
  other_income_gbp_m: 30,
  staff_costs_gbp_m: 50,
  total_expenditure_gbp_m: 95,
  cash_gbp_m: 20,
  borrowing_gbp_m: 25,
  liquidity_days: 90,
  international_fte_pct: 20,
  student_fte_total: 10_000,
  capital_expenditure_gbp_m: 8,
  net_assets_gbp_m: 120,
  risk_flag: 'Low',
  data_source: 'verified',
  status: 'found',
  confidence: 'high',
  included_in_aggregates: true,
  published: '2026-01-01',
  source_pdf: 'https://example.com/accounts.pdf',
}

describe('financial health scoring', () => {
  it('keeps the headline and every component within the documented 0–100 range', () => {
    const rows = [...getAllHealthScores(), { institution_id: baseline.institution_id, ...computeHealthScore(baseline) }]

    for (const row of rows) {
      if (row.score !== null) expect(row.score).toBeGreaterThanOrEqual(0)
      if (row.score !== null) expect(row.score).toBeLessThanOrEqual(100)
      for (const value of Object.values(row.components)) {
        if (value !== null) expect(value).toBeGreaterThanOrEqual(0)
        if (value !== null) expect(value).toBeLessThanOrEqual(100)
      }
    }
  })

  it('scores a balanced reference institution in the middle of the scale', () => {
    const result = computeHealthScore(baseline)
    expect(result.score).toBeGreaterThanOrEqual(45)
    expect(result.score).toBeLessThanOrEqual(80)
  })
})
