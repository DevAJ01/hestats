import {
  ALL_FINANCIAL_VALUE_KEYS,
  AVAILABLE_YEARS,
  financials,
  hasAnyFinancialValue,
  isKnownNumber,
} from './financials'
import { institutions } from './institutions'
import { INSTITUTION_COORDS, UK_BOUNDS } from './coordinates'
import { INTELLIGENCE_RECORDS, IntelligenceRecord } from './intelligence'
import { DataQualityIssue, isOfficialUkprn } from './schema'
import { DATA_SOURCES, PROVENANCE } from './sources'
import { STUDENT_YEARS, StudentEnrolmentRecord, isKnownStudentNumber, studentEnrolments } from './students'
import { FinancialYear, Institution } from './types'
import { UK_OUTLINE_PATH, UK_OUTLINE_SOURCE } from './ukOutline'

const FISCAL_YEAR = /^\d{4}-\d{2}$/
const DATE = /^\d{4}-\d{2}-\d{2}$/

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

    if (row.ukprn === null) {
      issues.push(issue('warning', 'institution.ukprn_pending', 'UKPRN is pending official verification.', { institution_id: row.id }))
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
  const provenanceKeys = new Set(PROVENANCE.map((row) => `${row.institution_id}:${row.fiscal_year}`))
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
    const dataSource = row.data_source as string
    if (!['verified', 'pending'].includes(dataSource)) {
      issues.push(issue('error', 'financial.data_source_invalid', `Invalid data source '${row.data_source}'.`, details))
    }
    if (dataSource === 'estimated') {
      issues.push(issue('error', 'financial.estimated_in_primary_dataset', 'Estimated rows are not allowed in the official primary dataset.', details))
    }
    if (!['found', 'archived', 'missing'].includes(row.status)) {
      issues.push(issue('error', 'financial.status_invalid', `Invalid source status '${row.status}'.`, details))
    }
    if (row.data_source === 'verified' && row.status === 'missing') {
      issues.push(issue('error', 'financial.verified_missing', 'Verified rows cannot have missing source status.', details))
    }
    if (row.data_source === 'pending' && hasAnyFinancialValue(row)) {
      issues.push(issue('error', 'financial.pending_has_value', 'Pending rows must not contain numeric financial values.', details))
    }
    if (row.data_source === 'verified' && hasAnyFinancialValue(row) && !provenanceKeys.has(key)) {
      issues.push(issue('error', 'financial.verified_missing_provenance', 'Verified rows with numeric values require source provenance.', details))
    }

    if (row.data_source === 'verified') {
      if (!isKnownNumber(row.revenue_gbp_m) || row.revenue_gbp_m <= 0) issues.push(issue('error', 'financial.revenue_invalid', 'Verified revenue must be greater than zero.', details))
      if (!isKnownNumber(row.total_expenditure_gbp_m) || row.total_expenditure_gbp_m <= 0) issues.push(issue('error', 'financial.expenditure_invalid', 'Verified total expenditure must be greater than zero.', details))
      if (isKnownNumber(row.staff_costs_gbp_m) && isKnownNumber(row.total_expenditure_gbp_m) && row.staff_costs_gbp_m > row.total_expenditure_gbp_m + 0.5) {
        issues.push(issue('error', 'financial.staff_exceeds_expenditure', 'Staff costs exceed total expenditure.', details))
      }
      if (
        (isKnownNumber(row.cash_gbp_m) && row.cash_gbp_m < 0) ||
        (isKnownNumber(row.borrowing_gbp_m) && row.borrowing_gbp_m < 0) ||
        (isKnownNumber(row.student_fte_total) && row.student_fte_total < 0)
      ) {
        issues.push(issue('error', 'financial.negative_balance', 'Cash, borrowing, and student FTE values must not be negative.', details))
      }
    }

    const incomeValues = [row.research_income_gbp_m, row.tuition_fee_income_gbp_m, row.other_income_gbp_m]
    if (incomeValues.every(isKnownNumber) && isKnownNumber(row.revenue_gbp_m)) {
      const incomeTotal = incomeValues.reduce((sum, value) => sum + value, 0)
      if (Math.abs(incomeTotal - row.revenue_gbp_m) > 1.5) {
        issues.push(issue('warning', 'financial.income_components_mismatch', 'Income components do not reconcile to total revenue within £1.5m.', details))
      }
    }

    if (isKnownNumber(row.revenue_gbp_m) && isKnownNumber(row.total_expenditure_gbp_m) && isKnownNumber(row.surplus_gbp_m)) {
      const expectedSurplus = row.revenue_gbp_m - row.total_expenditure_gbp_m
      if (Math.abs(expectedSurplus - row.surplus_gbp_m) > 1.5) {
        issues.push(issue('warning', 'financial.surplus_mismatch', 'Surplus does not reconcile to revenue minus expenditure within £1.5m.', details))
      }
    }

    for (const metric of ALL_FINANCIAL_VALUE_KEYS) {
      const value = row[metric]
      if (value !== null && !Number.isFinite(value)) {
        issues.push(issue('error', 'financial.metric_invalid', `Metric '${metric}' must be finite or null.`, details))
      }
    }
  }

  for (const institution of institutionRows) {
    for (const year of AVAILABLE_YEARS) {
      const key = `${institution.id}:${year}`
      if (!seen.has(key)) {
        issues.push(issue('error', 'financial.coverage_missing', `Missing financial coverage row for ${key}.`, { institution_id: institution.id, fiscal_year: year }))
      }
    }
  }

  const expectedRows = institutionRows.length * AVAILABLE_YEARS.length
  if (seen.size !== expectedRows) {
    issues.push(issue('error', 'financial.coverage_count_mismatch', `Expected ${expectedRows} institution-year rows, found ${seen.size}.`))
  }

  for (const prov of PROVENANCE) {
    const sourceKey = `${prov.institution_id}:${prov.fiscal_year}`
    if (!seen.has(sourceKey)) {
      issues.push(issue('error', 'provenance.orphan_financial_row', 'Provenance references a financial row that is not present.', { institution_id: prov.institution_id, fiscal_year: prov.fiscal_year }))
    }
    if (!prov.source_id || !prov.source_url || !prov.retrieved_date || !prov.last_verified) {
      issues.push(issue('error', 'provenance.incomplete', 'Financial provenance must include source id, URL, retrieved date, and last verified date.', { institution_id: prov.institution_id, fiscal_year: prov.fiscal_year }))
    }
    if (!['high', 'medium', 'provisional', 'awaiting'].includes(prov.confidence)) {
      issues.push(issue('error', 'provenance.confidence_invalid', `Invalid provenance confidence '${prov.confidence}'.`, { institution_id: prov.institution_id, fiscal_year: prov.fiscal_year }))
    }
  }

  return issues
}

export function validateStudentEnrolments(
  rows: StudentEnrolmentRecord[] = studentEnrolments,
  institutionRows: Institution[] = institutions,
): DataQualityIssue[] {
  const issues: DataQualityIssue[] = []
  const institutionIds = new Set(institutionRows.map((row) => row.id))
  const seen = new Set<string>()
  const numericKeys = ['total_enrolments', 'uk_enrolments', 'non_uk_enrolments', 'unknown_domicile_enrolments'] as const

  for (const row of rows) {
    const details = { institution_id: row.institution_id, fiscal_year: row.academic_year }
    const key = `${row.institution_id}:${row.academic_year}`

    if (seen.has(key)) issues.push(issue('error', 'student.duplicate_year', `Duplicate student row for ${key}.`, details))
    seen.add(key)

    if (!institutionIds.has(row.institution_id)) issues.push(issue('error', 'student.orphan_institution', 'Student row references an unknown institution.', details))
    if (!FISCAL_YEAR.test(row.academic_year) || !(STUDENT_YEARS as readonly string[]).includes(row.academic_year)) {
      issues.push(issue('error', 'student.year_invalid', `Academic year '${row.academic_year}' is outside the supported range.`, details))
    }
    if (!['verified', 'pending'].includes(row.source_status)) {
      issues.push(issue('error', 'student.source_status_invalid', `Invalid source status '${row.source_status}'.`, details))
    }
    if (!['high', 'awaiting'].includes(row.confidence)) {
      issues.push(issue('error', 'student.confidence_invalid', `Invalid confidence '${row.confidence}'.`, details))
    }
    if (row.source_id !== 'hesa-students' || !row.source_url || !row.source_reference || !row.retrieved_date || !row.last_verified) {
      issues.push(issue('error', 'student.provenance_incomplete', 'Student rows must include source id, URL, reference, retrieved date, and last verified date.', details))
    }

    if (row.source_status === 'pending') {
      if (row.included_in_aggregates) issues.push(issue('error', 'student.pending_in_aggregates', 'Pending student rows must be excluded from aggregates.', details))
      if (numericKeys.some((metric) => row[metric] !== null)) {
        issues.push(issue('error', 'student.pending_has_value', 'Pending student rows must not contain numeric values.', details))
      }
    }

    if (row.source_status === 'verified') {
      if (!row.included_in_aggregates) issues.push(issue('error', 'student.verified_not_in_aggregates', 'Verified student rows should be included in aggregates.', details))
      if (!isKnownStudentNumber(row.total_enrolments)) {
        issues.push(issue('error', 'student.verified_total_missing', 'Verified student rows require a total enrolment count.', details))
      }
    }

    for (const metric of numericKeys) {
      const value = row[metric]
      if (value !== null && (!Number.isFinite(value) || value < 0)) {
        issues.push(issue('error', 'student.metric_invalid', `Metric '${metric}' must be a non-negative finite number or null.`, details))
      }
    }
  }

  for (const institution of institutionRows) {
    for (const year of STUDENT_YEARS) {
      const key = `${institution.id}:${year}`
      if (!seen.has(key)) {
        issues.push(issue('error', 'student.coverage_missing', `Missing student coverage row for ${key}.`, { institution_id: institution.id, fiscal_year: year }))
      }
    }
  }

  const expectedRows = institutionRows.length * STUDENT_YEARS.length
  if (seen.size !== expectedRows) {
    issues.push(issue('error', 'student.coverage_count_mismatch', `Expected ${expectedRows} institution-year rows, found ${seen.size}.`))
  }

  return issues
}

export function validateInstitutionCoordinates(
  institutionRows: Institution[] = institutions,
): DataQualityIssue[] {
  const issues: DataQualityIssue[] = []

  for (const row of institutionRows) {
    const coords = INSTITUTION_COORDS[row.id]
    if (!coords) {
      issues.push(issue('error', 'coordinates.missing', 'Institution is missing map coordinates.', { institution_id: row.id }))
      continue
    }

    const [lat, lng] = coords
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      issues.push(issue('error', 'coordinates.invalid', 'Institution map coordinates must be finite numbers.', { institution_id: row.id }))
      continue
    }

    if (lat < UK_BOUNDS.minLat || lat > UK_BOUNDS.maxLat || lng < UK_BOUNDS.minLng || lng > UK_BOUNDS.maxLng) {
      issues.push(issue('error', 'coordinates.out_of_bounds', 'Institution map coordinates fall outside the supported UK map bounds.', { institution_id: row.id }))
    }
  }

  return issues
}

export function validateMapOutline(): DataQualityIssue[] {
  const issues: DataQualityIssue[] = []
  const sourceIds = new Set(DATA_SOURCES.map((source) => source.id))

  if (!UK_OUTLINE_PATH.includes('M ') || !UK_OUTLINE_PATH.includes('L ') || UK_OUTLINE_PATH.length < 5000) {
    issues.push(issue('error', 'map.outline_invalid', 'UK map outline path is missing or too low-detail.'))
  }
  if (!sourceIds.has(UK_OUTLINE_SOURCE.source_id)) {
    issues.push(issue('error', 'map.outline_source_unknown', `UK outline references unknown source '${UK_OUTLINE_SOURCE.source_id}'.`))
  }
  if (!UK_OUTLINE_SOURCE.source_url.startsWith('https://') || !UK_OUTLINE_SOURCE.source_reference || !UK_OUTLINE_SOURCE.retrieved_date || !UK_OUTLINE_SOURCE.last_verified) {
    issues.push(issue('error', 'map.outline_provenance_incomplete', 'UK outline source requires URL, reference, retrieved date, and last verified date.'))
  }

  return issues
}

export function validateIntelligenceRecords(
  rows: IntelligenceRecord[] = INTELLIGENCE_RECORDS,
): DataQualityIssue[] {
  const issues: DataQualityIssue[] = []
  const sourceIds = new Set(DATA_SOURCES.map((source) => source.id))
  const seen = new Set<string>()

  for (const row of rows) {
    if (seen.has(row.id)) issues.push(issue('error', 'intelligence.duplicate_id', `Duplicate intelligence record '${row.id}'.`))
    seen.add(row.id)

    if (!row.title.trim() || !row.summary.trim()) {
      issues.push(issue('error', 'intelligence.copy_missing', `Intelligence record '${row.id}' requires title and summary.`))
    }
    if (!sourceIds.has(row.source_id)) {
      issues.push(issue('error', 'intelligence.source_unknown', `Intelligence record '${row.id}' references unknown source '${row.source_id}'.`))
    }
    if (!row.publisher.trim() || !row.source_url.startsWith('https://') || !row.source_reference.trim()) {
      issues.push(issue('error', 'intelligence.provenance_incomplete', `Intelligence record '${row.id}' requires publisher, HTTPS source URL, and source reference.`))
    }
    if (!DATE.test(row.published_date) || !DATE.test(row.retrieved_date) || !DATE.test(row.last_verified)) {
      issues.push(issue('error', 'intelligence.date_invalid', `Intelligence record '${row.id}' has an invalid provenance date.`))
    }
    if (!['high', 'medium', 'provisional', 'awaiting'].includes(row.confidence)) {
      issues.push(issue('error', 'intelligence.confidence_invalid', `Intelligence record '${row.id}' has invalid confidence '${row.confidence}'.`))
    }
    if (!['verified', 'external_analysis', 'pending', 'archived'].includes(row.source_status)) {
      issues.push(issue('error', 'intelligence.status_invalid', `Intelligence record '${row.id}' has invalid source status '${row.source_status}'.`))
    }
    if (row.claim_type === 'external-analysis') {
      if (row.source_status !== 'external_analysis') {
        issues.push(issue('error', 'intelligence.external_status_invalid', `External analysis '${row.id}' must use external_analysis source status.`))
      }
      if (row.confidence === 'high') {
        issues.push(issue('error', 'intelligence.external_high_confidence', `External analysis '${row.id}' cannot be labelled high confidence.`))
      }
    }

    for (const metric of row.metrics) {
      if (!metric.key.trim() || !metric.label.trim() || !metric.unit.trim() || !metric.period.trim() || !metric.source_reference.trim()) {
        issues.push(issue('error', 'intelligence.metric_provenance_incomplete', `Metric '${metric.key}' in '${row.id}' requires key, label, unit, period and source reference.`))
      }
      if (metric.value !== null && !Number.isFinite(metric.value)) {
        issues.push(issue('error', 'intelligence.metric_invalid', `Metric '${metric.key}' in '${row.id}' must be finite or null.`))
      }
      if (row.claim_type === 'external-analysis' && metric.included_in_aggregates) {
        issues.push(issue('error', 'intelligence.external_metric_in_aggregate', `External metric '${metric.key}' in '${row.id}' must be excluded from aggregates.`))
      }
      if (row.source_status === 'pending' && metric.value !== null) {
        issues.push(issue('error', 'intelligence.pending_has_value', `Pending intelligence metric '${metric.key}' in '${row.id}' must be null.`))
      }
    }
  }

  return issues
}

export function validateData(): DataQualityIssue[] {
  return [...validateInstitutions(), ...validateFinancials(), ...validateStudentEnrolments(), ...validateInstitutionCoordinates(), ...validateMapOutline(), ...validateIntelligenceRecords()]
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
