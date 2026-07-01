import { describe, expect, it } from 'vitest'
import { ALL_FINANCIAL_VALUE_KEYS, AVAILABLE_YEARS, financials } from './financials'
import { institutions } from './institutions'
import { blockingIssues, validateData, validateFinancials, validateInstitutions } from './validation'

describe('HEStats data validation', () => {
  it('has no blocking errors in the bundled prototype dataset', () => {
    const errors = blockingIssues(validateData())
    expect(errors).toEqual([])
  })

  it('fails on duplicate official UKPRNs', () => {
    const duplicateRows = [
      ...institutions.slice(0, 2),
      { ...institutions[1], id: 'duplicate-cambridge' },
    ]
    const errors = blockingIssues(validateInstitutions(duplicateRows))
    expect(errors.some((item) => item.code === 'institution.ukprn_duplicate')).toBe(true)
  })

  it('fails on orphan financial rows', () => {
    const row = { ...financials[0], institution_id: 'missing-provider', fiscal_year: AVAILABLE_YEARS[0] }
    const errors = blockingIssues(validateFinancials([row], institutions))
    expect(errors.some((item) => item.code === 'financial.orphan_institution')).toBe(true)
  })

  it('fails on invalid source states', () => {
    const row = {
      ...financials[0],
      fiscal_year: AVAILABLE_YEARS[0],
      data_source: 'spreadsheet' as never,
      status: 'unreviewed' as never,
    }
    const errors = blockingIssues(validateFinancials([row], institutions))
    expect(errors.map((item) => item.code)).toContain('financial.data_source_invalid')
    expect(errors.map((item) => item.code)).toContain('financial.status_invalid')
  })

  it('keeps a complete institution-year decade coverage matrix', () => {
    const keys = new Set(financials.map((row) => `${row.institution_id}:${row.fiscal_year}`))
    expect(financials).toHaveLength(institutions.length * AVAILABLE_YEARS.length)
    expect(keys.size).toBe(financials.length)

    for (const institution of institutions) {
      for (const year of AVAILABLE_YEARS) {
        expect(keys.has(`${institution.id}:${year}`)).toBe(true)
      }
    }
  })

  it('does not allow estimated rows in the primary financial dataset', () => {
    expect(financials.some((row) => row.data_source === 'estimated')).toBe(false)

    const row = { ...financials[0], data_source: 'estimated' as const }
    const errors = blockingIssues(validateFinancials([row], [institutions[0]]))
    expect(errors.map((item) => item.code)).toContain('financial.estimated_in_primary_dataset')
  })

  it('keeps pending rows numeric-null and excluded from aggregates', () => {
    const pendingRows = financials.filter((row) => row.data_source === 'pending')
    expect(pendingRows.length).toBeGreaterThan(0)
    expect(pendingRows.every((row) => !row.included_in_aggregates)).toBe(true)
    expect(pendingRows.every((row) => ALL_FINANCIAL_VALUE_KEYS.every((key) => row[key] === null))).toBe(true)
  })

  it('fails when a verified numeric row lacks provenance', () => {
    const pendingTemplate = financials.find((item) => item.data_source === 'pending') ?? financials[0]
    const row = {
      ...pendingTemplate,
      data_source: 'verified' as const,
      status: 'found' as const,
      confidence: 'high' as const,
      included_in_aggregates: true,
      revenue_gbp_m: 100,
      surplus_gbp_m: 5,
      surplus_margin_pct: 5,
      research_income_gbp_m: 20,
      tuition_fee_income_gbp_m: 60,
      other_income_gbp_m: 20,
      staff_costs_gbp_m: 45,
      total_expenditure_gbp_m: 95,
      cash_gbp_m: 30,
      borrowing_gbp_m: 25,
      liquidity_days: 60,
      international_fte_pct: 20,
      student_fte_total: 10000,
      capital_expenditure_gbp_m: 10,
      net_assets_gbp_m: 200,
    }
    const errors = blockingIssues(validateFinancials([row], [institutions[0]]))
    expect(errors.map((item) => item.code)).toContain('financial.verified_missing_provenance')
  })
})
