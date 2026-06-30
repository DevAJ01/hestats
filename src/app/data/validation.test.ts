import { describe, expect, it } from 'vitest'
import { AVAILABLE_YEARS, financials } from './financials'
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
})
