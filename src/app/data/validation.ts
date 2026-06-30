import { AVAILABLE_YEARS, financials } from './financials'
import { institutions } from './institutions'
import { DataQualityIssue, isOfficialUkprn, isPendingUkprn } from './schema'
import { FinancialYear, Institution } from './types'

const FISCAL_YEAR = /^\d{4}-\d{2}$/

function issue(
  severity: DataQualityIssue['severity'],
  code: string,
  message: string,
  details: Pick<DataQualityIssue, 'institution_id' | 'fiscal_year'> = {},
): DataQualityIssue {
  return { severity, code, message, ...details }
}

export function validateInstitutions(rows: Institution[] = institutions): DataQualityIssue[] {
  const issues: DataQualityIssue[] = []
  const ids = new Map<string, string[]>()
  const ukprns = new Map<string, string[]>()

  for (const row of rows) {
    ids.set(row.id, [...(ids.get(row.id) ?? []), row.canonical_name])
    if (!row.canonical_name.trim()) issues.push(issue('error', 'institution.name_missing', 'Institution name is required.', { institution_id: row.id }))
    if (!row.short_name.trim()) issues.push(issue('error', 'institution.short_name_missing', 'Institution short name is required.', { institution_id: row.id }))
    if (!row.city.trim()) issues.push(issue('error', 'institution.city_missing', 'Institution city is required.', { institution_id: row.id }))

    if (isPendingUkprn(row.ukprn)) {
      issues.push(issue('warning', 'institution.ukprn_pending', 'UKPRN is pending manual verification.', { institution_id: row.id }))
    } else if (!isOfficialUkprn(row.ukprn)) {
      issues.push(issue('error', 'institution.ukprn_invalid', `UKPRN '${row.ukprn}' is not in official 100xxxxx format.`, { institution_id: row.id }))
    } else {
      ukprns.set(row.ukprn, [...(ukprns.get(row.ukprn) ?? []), row.id])
    }
  }

  for (const [id, matches] of ids) {
    if (matches.length > 1) {
      issues.push(issue('error', 'institution.id_duplicate', `Institution id '${id}' appears ${matches.length} times.`, { institution_id: id }))
    }
  }

  for (const [ukprn, matches] of ukprns) {
    if (matches.length > 1) {
      issues.push(issue('error', 'institution.ukprn_duplicate', `Official UKPRN '${ukprn}' is shared by ${matches.join(', ')}.`))
    }
  }

  return issues
}

export function validateFinancials(
  rows: FinancialYear[] = financials,
  institutionRows: Institution[] = institutions,
): DataQualityIssue[] {
  const issues: DataQualityIssue[] = []
  const institutionIds = new Set(institutionRows.map((row) => row.id))
  const seen = new Set<string>()

  for (const row of rows) {
    const details = { institution_id: row.institution_id, fiscal_year: row.fiscal_year }
    const key = `${row.institution_id}:${row.fiscal_year}`

    if (seen.has(key)) issues.push(issue('error', 'financial.duplicate_year', `Duplicate financial row for ${key}.`, details))
    seen.add(key)

    if (!institutionIds.has(row.institution_id)) issues.push(issue('error', 'financial.orphan_institution', 'Financial row references an unknown institution.', details))
    if (!FISCAL_YEAR.test(row.fiscal_year) || !AVAILABLE_YEARS.includes(row.fiscal_year)) {
      issues.push(issue('error', 'financial.year_invalid', `Fiscal year '${row.fiscal_year}' is outside the supported range.`, details))
    }
    if (!['verified', 'estimated', 'pending'].includes(row.data_source)) {
      issues.push(issue('error', 'financial.data_source_invalid', `Invalid data source '${row.data_source}'.`, details))
    }
    if (!['found', 'archived', 'missing'].includes(row.status)) {
      issues.push(issue('error', 'financial.status_invalid', `Invalid source status '${row.status}'.`, details))
    }
    if (row.data_source === 'verified' && row.status === 'missing') {
      issues.push(issue('error', 'financial.verified_missing', 'Verified rows cannot have missing source status.', details))
    }
    if (row.revenue_gbp_m <= 0) issues.push(issue('error', 'financial.revenue_invalid', 'Revenue must be greater than zero.', details))
    if (row.total_expenditure_gbp_m <= 0) issues.push(issue('error', 'financial.expenditure_invalid', 'Total expenditure must be greater than zero.', details))
    if (row.staff_costs_gbp_m > row.total_expenditure_gbp_m + 0.5) issues.push(issue('error', 'financial.staff_exceeds_expenditure', 'Staff costs exceed total expenditure.', details))
    if (row.cash_gbp_m < 0 || row.borrowing_gbp_m < 0 || row.student_fte_total < 0) {
      issues.push(issue('error', 'financial.negative_balance', 'Cash, borrowing, and student FTE values must not be negative.', details))
    }

    const incomeTotal = row.research_income_gbp_m + row.tuition_fee_income_gbp_m + row.other_income_gbp_m
    if (Math.abs(incomeTotal - row.revenue_gbp_m) > 1.5) {
      issues.push(issue('warning', 'financial.income_components_mismatch', 'Income components do not reconcile to total revenue within £1.5m.', details))
    }
    const expectedSurplus = row.revenue_gbp_m - row.total_expenditure_gbp_m
    if (Math.abs(expectedSurplus - row.surplus_gbp_m) > 1.5) {
      issues.push(issue('warning', 'financial.surplus_mismatch', 'Surplus does not reconcile to revenue minus expenditure within £1.5m.', details))
    }
  }

  return issues
}

export function validateData(): DataQualityIssue[] {
  return [...validateInstitutions(), ...validateFinancials()]
}

export function blockingIssues(issues: DataQualityIssue[]): DataQualityIssue[] {
  return issues.filter((item) => item.severity === 'error')
}

export function assertDataValid(issues: DataQualityIssue[] = validateData()): void {
  const errors = blockingIssues(issues)
  if (!errors.length) return
  const summary = errors.map((item) => `${item.code}: ${item.message}`).join('\n')
  throw new Error(`HEStats data validation failed:\n${summary}`)
}
