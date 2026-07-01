import { describe, expect, it } from 'vitest'
import { ALL_FINANCIAL_VALUE_KEYS, AVAILABLE_YEARS, financials } from './financials'
import { DEGREES } from './degrees'
import { EMPLOYERS } from './employers'
import { ESTATE_VALUE_KEYS, ESTATE_YEARS, estateRecords } from './estates'
import { institutions } from './institutions'
import { INTELLIGENCE_RECORDS } from './intelligence'
import { nationalStudentFinanceRecords } from './nationalStudentFinance'
import { providerFinanceCoverage } from './providerFinanceCoverage'
import { providerSourceCoverage } from './providerSourceCoverage'
import { HESA_STUDENT_PROVIDER_COUNT_2024_25, providerUniverse } from './providers'
import { STAFF_VALUE_KEYS, STAFF_YEARS, staffRecords } from './staff'
import { STUDENT_YEARS, studentEnrolments } from './students'
import { TEF_ASSESSMENT_YEARS, tefRecords } from './tef'
import { OUTCOMES } from './outcomes'
import { blockingIssues, validateData, validateDegreeIntelligence, validateEmployerMarkets, validateEstateRecords, validateFinancials, validateGraduateOutcomes, validateInstitutionCoordinates, validateInstitutions, validateIntelligenceRecords, validateMapOutline, validateNationalStudentFinance, validateProviderFinanceCoverage, validateProviderSourceCoverage, validateProviderUniverse, validateStaffRecords, validateStudentEnrolments, validateTefRecords } from './validation'

describe('HEStats data validation', () => {
  it('has no blocking errors in the bundled verified dataset', () => {
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

  it('keeps a 304-row HESA provider universe without inventing pending identifiers', () => {
    expect(institutions).toHaveLength(HESA_STUDENT_PROVIDER_COUNT_2024_25)
    expect(providerUniverse).toHaveLength(HESA_STUDENT_PROVIDER_COUNT_2024_25)
    expect(blockingIssues(validateProviderUniverse())).toEqual([])
    expect(providerUniverse.filter((row) => row.platform_status === 'full_profile')).toHaveLength(institutions.length)

    const pendingRows = providerUniverse.filter((row) => row.source_status === 'pending')
    expect(pendingRows).toHaveLength(0)
    expect(providerUniverse.every((row) => row.institution_id !== null && row.ukprn !== null)).toBe(true)
  })

  it('keeps provider finance coverage at 304 providers across the decade panel', () => {
    const keys = new Set(providerFinanceCoverage.map((row) => `${row.provider_id}:${row.fiscal_year}`))
    expect(providerFinanceCoverage).toHaveLength(providerUniverse.length * AVAILABLE_YEARS.length)
    expect(keys.size).toBe(providerFinanceCoverage.length)
    expect(blockingIssues(validateProviderFinanceCoverage())).toEqual([])
  })

  it('keeps Nottingham 2024-25 explicit pending until an official source row is attached', () => {
    const row = financials.find((item) => item.institution_id === 'nottingham' && item.fiscal_year === '2024-25')
    expect(row).toBeDefined()
    expect(row?.data_source).toBe('pending')
    expect(row?.revenue_gbp_m).toBeNull()

    const coverage = providerFinanceCoverage.find((item) => item.institution_id === 'nottingham' && item.fiscal_year === '2024-25')
    expect(coverage?.source_status).toBe('pending')
    expect(coverage?.included_in_aggregates).toBe(false)
  })

  it('does not allow estimated rows in the primary financial dataset', () => {
    expect(financials.some((row) => (row.data_source as string) === 'estimated')).toBe(false)

    const row = { ...financials[0], data_source: 'estimated' as never }
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

  it('keeps complete student enrolment coverage for tracked institutions', () => {
    const keys = new Set(studentEnrolments.map((row) => `${row.institution_id}:${row.academic_year}`))
    expect(studentEnrolments).toHaveLength(institutions.length * STUDENT_YEARS.length)
    expect(keys.size).toBe(studentEnrolments.length)

    for (const institution of institutions) {
      for (const year of STUDENT_YEARS) {
        expect(keys.has(`${institution.id}:${year}`)).toBe(true)
      }
    }
  })

  it('keeps explicit provider coverage rows for students, outcomes, staff, estates and TEF', () => {
    expect(providerSourceCoverage).toHaveLength(providerUniverse.length * 5)
    expect(blockingIssues(validateProviderSourceCoverage())).toEqual([])
    expect(providerSourceCoverage.every((row) => row.source_url.startsWith('https://'))).toBe(true)
    expect(providerSourceCoverage.filter((row) => row.source_status === 'pending').every((row) => !row.included_in_aggregates)).toBe(true)
    expect(providerSourceCoverage.filter((row) => row.domain === 'outcomes' && row.source_status === 'verified').length).toBeGreaterThan(200)
  })

  it('keeps complete staff coverage across the decade panel', () => {
    const keys = new Set(staffRecords.map((row) => `${row.institution_id}:${row.academic_year}`))
    expect(staffRecords).toHaveLength(institutions.length * STAFF_YEARS.length)
    expect(keys.size).toBe(staffRecords.length)
    expect(blockingIssues(validateStaffRecords())).toEqual([])

    const pendingRows = staffRecords.filter((row) => row.source_status === 'pending')
    expect(pendingRows.length).toBeGreaterThan(0)
    expect(pendingRows.every((row) => !row.included_in_aggregates)).toBe(true)
    expect(pendingRows.every((row) => STAFF_VALUE_KEYS.every((key) => row[key] === null))).toBe(true)
  })

  it('keeps complete estates coverage for published HESA estates years', () => {
    const keys = new Set(estateRecords.map((row) => `${row.institution_id}:${row.academic_year}`))
    expect(estateRecords).toHaveLength(institutions.length * ESTATE_YEARS.length)
    expect(keys.size).toBe(estateRecords.length)
    expect(blockingIssues(validateEstateRecords())).toEqual([])
    expect(ESTATE_YEARS).not.toContain('2024-25')

    const pendingRows = estateRecords.filter((row) => row.source_status === 'pending')
    expect(pendingRows.length).toBeGreaterThan(0)
    expect(pendingRows.every((row) => !row.included_in_aggregates)).toBe(true)
    expect(pendingRows.every((row) => ESTATE_VALUE_KEYS.every((key) => row[key] === null))).toBe(true)
  })

  it('keeps TEF coverage as assessment ratings rather than annual rankings', () => {
    const keys = new Set(tefRecords.map((row) => `${row.institution_id}:${row.assessment_year}`))
    expect(tefRecords).toHaveLength(institutions.length * TEF_ASSESSMENT_YEARS.length)
    expect(keys.size).toBe(tefRecords.length)
    expect(blockingIssues(validateTefRecords())).toEqual([])
    expect(tefRecords.every((row) => row.source_id === 'ofs-tef')).toBe(true)
    expect(tefRecords.every((row) => row.source_reference.toLowerCase().includes('not annual ranking'))).toBe(true)
    expect(tefRecords.filter((row) => row.source_status === 'pending').every((row) => row.overall_rating === null && !row.included_in_aggregates)).toBe(true)
  })

  it('keeps national student finance records source-backed and excludes forecasts from aggregates', () => {
    expect(nationalStudentFinanceRecords.length).toBeGreaterThan(10)
    expect(blockingIssues(validateNationalStudentFinance())).toEqual([])
    expect(nationalStudentFinanceRecords.some((row) => row.source_id === 'slc-statistics')).toBe(true)
    expect(nationalStudentFinanceRecords.some((row) => row.source_id === 'dfe-student-loan-forecasts')).toBe(true)
    expect(nationalStudentFinanceRecords.filter((row) => row.source_status === 'forecast').every((row) => !row.included_in_aggregates)).toBe(true)
  })

  it('keeps pending student rows numeric-null and excluded from aggregates', () => {
    const pendingRows = studentEnrolments.filter((row) => row.source_status === 'pending')
    expect(pendingRows.length).toBeGreaterThan(0)
    expect(pendingRows.every((row) => !row.included_in_aggregates)).toBe(true)
    expect(pendingRows.every((row) => row.total_enrolments === null)).toBe(true)
    expect(pendingRows.every((row) => row.uk_enrolments === null)).toBe(true)
    expect(pendingRows.every((row) => row.non_uk_enrolments === null)).toBe(true)
    expect(pendingRows.every((row) => row.unknown_domicile_enrolments === null)).toBe(true)
  })

  it('keeps source-backed graduate outcomes for every platform institution', () => {
    expect(OUTCOMES).toHaveLength(institutions.length)
    expect(OUTCOMES.filter((row) => row.source_status === 'verified').length).toBeGreaterThan(200)
    expect(OUTCOMES.every((row) => row.source_url.startsWith('https://'))).toBe(true)
    expect(blockingIssues(validateGraduateOutcomes())).toEqual([])

    const row = { ...OUTCOMES[0], source_url: '', source_reference: '' }
    const errors = blockingIssues(validateGraduateOutcomes([row], [institutions.find((item) => item.id === row.institution_id) ?? institutions[0]]))
    expect(errors.map((item) => item.code)).toContain('outcomes.provenance_incomplete')
  })

  it('keeps degree intelligence populated and separates AI external analysis', () => {
    expect(DEGREES.length).toBeGreaterThanOrEqual(30)
    expect(DEGREES.every((row) => row.source_id === 'dfe-leo')).toBe(true)
    expect(DEGREES.every((row) => row.ai_source_status === 'external_analysis')).toBe(true)
    expect(blockingIssues(validateDegreeIntelligence())).toEqual([])
  })

  it('keeps employer market intelligence as official industry-section rows', () => {
    expect(EMPLOYERS.length).toBeGreaterThan(10)
    expect(EMPLOYERS.every((row) => row.market_type === 'industry_section')).toBe(true)
    expect(EMPLOYERS.every((row) => row.source_id === 'dfe-leo')).toBe(true)
    expect(blockingIssues(validateEmployerMarkets())).toEqual([])
  })

  it('fails when a student row lacks source metadata', () => {
    const row = { ...studentEnrolments[0], source_url: '', source_reference: '' }
    const errors = blockingIssues(validateStudentEnrolments([row], [institutions[0]]))
    expect(errors.map((item) => item.code)).toContain('student.provenance_incomplete')
  })

  it('has valid map coordinates for every tracked institution', () => {
    const errors = blockingIssues(validateInstitutionCoordinates(institutions))
    expect(errors).toEqual([])
  })

  it('has a source-backed UK map outline', () => {
    const errors = blockingIssues(validateMapOutline())
    expect(errors).toEqual([])
  })

  it('requires every intelligence claim and metric to carry source provenance', () => {
    expect(INTELLIGENCE_RECORDS.length).toBeGreaterThan(5)
    const errors = blockingIssues(validateIntelligenceRecords())
    expect(errors).toEqual([])

    const row = { ...INTELLIGENCE_RECORDS[0], source_url: '', source_reference: '' }
    const broken = blockingIssues(validateIntelligenceRecords([row]))
    expect(broken.map((item) => item.code)).toContain('intelligence.provenance_incomplete')
  })

  it('keeps external analysis separate from official aggregate data', () => {
    const externalRows = INTELLIGENCE_RECORDS.filter((row) => row.claim_type === 'external-analysis')
    expect(externalRows.length).toBeGreaterThan(0)
    expect(externalRows.every((row) => row.source_status === 'external_analysis')).toBe(true)
    expect(externalRows.every((row) => row.confidence !== 'high')).toBe(true)
    expect(externalRows.every((row) => row.metrics.every((metric) => !metric.included_in_aggregates))).toBe(true)

    const row = {
      ...externalRows[0],
      confidence: 'high' as const,
      metrics: [{ ...externalRows[0].metrics[0], included_in_aggregates: true }],
    }
    const errors = blockingIssues(validateIntelligenceRecords([row]))
    expect(errors.map((item) => item.code)).toContain('intelligence.external_high_confidence')
    expect(errors.map((item) => item.code)).toContain('intelligence.external_metric_in_aggregate')
  })
})
