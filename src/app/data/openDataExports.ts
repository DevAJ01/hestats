import { computeHealthScore } from './health'
import { INTELLIGENCE_RECORDS } from './intelligence'
import { financials, getAllLatestFinancials } from './financials'
import { institutions } from './institutions'
import { nationalStudentFinanceRecords } from './nationalStudentFinance'
import { providerFinanceCoverage } from './providerFinanceCoverage'
import { providerSourceCoverage } from './providerSourceCoverage'
import { providerUniverse } from './providers'
import { getProvenance } from './sources'
import { studentEnrolments } from './students'

export type Format = 'csv' | 'json'

function csvText(value: string | undefined) {
  return `"${(value ?? '').replaceAll('"', '""')}"`
}

function csvNullable(value: number | null) {
  return value === null ? '' : String(value)
}

export function generateInstitutionsCsv() {
  const header = 'id,ukprn,canonical_name,short_name,city,nation,founded,mission_group,official_website'
  const rows = institutions.map((i) =>
    [i.id, i.ukprn ?? '', `"${i.canonical_name}"`, `"${i.short_name}"`, `"${i.city}"`, i.nation, i.founded, `"${i.mission_group ?? ''}"`, `"${i.official_website ?? ''}"`].join(','),
  )
  return [header, ...rows].join('\n')
}

export function generateInstitutionsJson() {
  return JSON.stringify(institutions.map((i) => ({
    id: i.id,
    ukprn: i.ukprn,
    canonical_name: i.canonical_name,
    short_name: i.short_name,
    city: i.city,
    nation: i.nation,
    founded: i.founded,
    mission_group: i.mission_group ?? null,
    official_website: i.official_website ?? null,
  })), null, 2)
}

export function generateProviderUniverseCsv() {
  const header = 'provider_id,institution_id,canonical_name,ukprn,hesa_instid,provider_type,nation,regulator,reports_hesa_student_2024_25,reports_hesa_finance_2024_25,platform_status,source_status,source_id,source_url,source_reference,retrieved_date,last_verified,confidence,website,notes'
  const rows = providerUniverse.map((row) => [
    row.provider_id,
    row.institution_id ?? '',
    csvText(row.canonical_name),
    row.ukprn ?? '',
    row.hesa_instid ?? '',
    row.provider_type,
    row.nation,
    row.regulator,
    row.reports_hesa_student_2024_25,
    row.reports_hesa_finance_2024_25 === null ? '' : row.reports_hesa_finance_2024_25,
    row.platform_status,
    row.source_status,
    row.source_id,
    csvText(row.source_url),
    csvText(row.source_reference),
    row.retrieved_date,
    row.last_verified,
    row.confidence,
    csvText(row.website ?? ''),
    csvText(row.notes),
  ].join(','))
  return [header, ...rows].join('\n')
}

export function generateProviderUniverseJson() {
  return JSON.stringify(providerUniverse, null, 2)
}

export function generateProviderFinanceCoverageCsv() {
  const header = 'provider_id,institution_id,ukprn,canonical_name,fiscal_year,source_status,verified_metric_count,has_any_value,included_in_aggregates,source_id,source_url,source_reference,retrieved_date,last_verified,confidence,notes'
  const rows = providerFinanceCoverage.map((row) => [
    row.provider_id,
    row.institution_id ?? '',
    row.ukprn ?? '',
    csvText(row.canonical_name),
    row.fiscal_year,
    row.source_status,
    row.verified_metric_count,
    row.has_any_value,
    row.included_in_aggregates,
    row.source_id,
    csvText(row.source_url),
    csvText(row.source_reference),
    row.retrieved_date,
    row.last_verified,
    row.confidence,
    csvText(row.notes),
  ].join(','))
  return [header, ...rows].join('\n')
}

export function generateProviderFinanceCoverageJson() {
  return JSON.stringify(providerFinanceCoverage, null, 2)
}

export function generateProviderSourceCoverageCsv() {
  const header = 'provider_id,institution_id,ukprn,canonical_name,domain,period,source_status,source_id,source_url,source_reference,retrieved_date,last_verified,confidence,included_in_aggregates,notes'
  const rows = providerSourceCoverage.map((row) => [
    row.provider_id,
    row.institution_id ?? '',
    row.ukprn ?? '',
    csvText(row.canonical_name),
    row.domain,
    csvText(row.period),
    row.source_status,
    row.source_id,
    csvText(row.source_url),
    csvText(row.source_reference),
    row.retrieved_date,
    row.last_verified,
    row.confidence,
    row.included_in_aggregates,
    csvText(row.notes),
  ].join(','))
  return [header, ...rows].join('\n')
}

export function generateProviderSourceCoverageJson() {
  return JSON.stringify(providerSourceCoverage, null, 2)
}

export function generateNationalStudentFinanceCsv() {
  const header = 'id,geography,academic_year,financial_year,category,metric,value,unit,source_status,source_id,publisher,source_url,source_reference,published_date,retrieved_date,last_verified,confidence,included_in_aggregates,notes'
  const rows = nationalStudentFinanceRecords.map((row) => [
    row.id,
    row.geography,
    row.academic_year ?? '',
    row.financial_year ?? '',
    row.category,
    csvText(row.metric),
    csvNullable(row.value),
    csvText(row.unit),
    row.source_status,
    row.source_id,
    csvText(row.publisher),
    csvText(row.source_url),
    csvText(row.source_reference),
    row.published_date,
    row.retrieved_date,
    row.last_verified,
    row.confidence,
    row.included_in_aggregates,
    csvText(row.notes),
  ].join(','))
  return [header, ...rows].join('\n')
}

export function generateNationalStudentFinanceJson() {
  return JSON.stringify(nationalStudentFinanceRecords, null, 2)
}

export function generateAllFinancialsCsv() {
  const header = 'institution_id,fiscal_year,revenue_gbp_m,surplus_gbp_m,surplus_margin_pct,research_income_gbp_m,tuition_fee_income_gbp_m,other_income_gbp_m,staff_costs_gbp_m,total_expenditure_gbp_m,cash_gbp_m,borrowing_gbp_m,liquidity_days,international_fte_pct,student_fte_total,capital_expenditure_gbp_m,net_assets_gbp_m,risk_flag,data_source,source_status,source_pdf,source_url,source_reference,confidence,included_in_aggregates'
  const rows = financials.map((f) => {
    const prov = getProvenance(f.institution_id, f.fiscal_year)
    return [f.institution_id, f.fiscal_year, csvNullable(f.revenue_gbp_m), csvNullable(f.surplus_gbp_m), csvNullable(f.surplus_margin_pct),
      csvNullable(f.research_income_gbp_m), csvNullable(f.tuition_fee_income_gbp_m), csvNullable(f.other_income_gbp_m),
      csvNullable(f.staff_costs_gbp_m), csvNullable(f.total_expenditure_gbp_m), csvNullable(f.cash_gbp_m), csvNullable(f.borrowing_gbp_m),
      csvNullable(f.liquidity_days), csvNullable(f.international_fte_pct), csvNullable(f.student_fte_total),
      csvNullable(f.capital_expenditure_gbp_m), csvNullable(f.net_assets_gbp_m), f.risk_flag, f.data_source,
      f.status, csvText(f.source_pdf), csvText(prov?.source_url), csvText(prov?.page_reference), f.confidence, f.included_in_aggregates].join(',')
  })
  return [header, ...rows].join('\n')
}

export function generateAllFinancialsJson() {
  return JSON.stringify(financials.map((f) => ({
    ...f,
    source_status: f.status,
    source_documents: getProvenance(f.institution_id, f.fiscal_year) ?? null,
  })), null, 2)
}

export function generateLatestSnapshotCsv() {
  const latest = getAllLatestFinancials()
  const header = 'institution_id,fiscal_year,revenue_gbp_m,surplus_gbp_m,surplus_margin_pct,research_income_gbp_m,tuition_fee_income_gbp_m,staff_costs_gbp_m,cash_gbp_m,borrowing_gbp_m,liquidity_days,international_fte_pct,student_fte_total,capital_expenditure_gbp_m,net_assets_gbp_m,risk_flag,data_source,source_status,source_pdf,source_url,confidence,included_in_aggregates,health_score,health_grade'
  const rows = latest.map((f) => {
    const h = computeHealthScore(f)
    const prov = getProvenance(f.institution_id, f.fiscal_year)
    return [f.institution_id, f.fiscal_year, csvNullable(f.revenue_gbp_m), csvNullable(f.surplus_gbp_m), csvNullable(f.surplus_margin_pct),
      csvNullable(f.research_income_gbp_m), csvNullable(f.tuition_fee_income_gbp_m), csvNullable(f.staff_costs_gbp_m),
      csvNullable(f.cash_gbp_m), csvNullable(f.borrowing_gbp_m), csvNullable(f.liquidity_days), csvNullable(f.international_fte_pct),
      csvNullable(f.student_fte_total), csvNullable(f.capital_expenditure_gbp_m), csvNullable(f.net_assets_gbp_m),
      f.risk_flag, f.data_source, f.status, csvText(f.source_pdf), csvText(prov?.source_url), f.confidence, f.included_in_aggregates, h.score ?? '', h.grade].join(',')
  })
  return [header, ...rows].join('\n')
}

export function generateLatestSnapshotJson() {
  return JSON.stringify(getAllLatestFinancials().map((f) => {
    const h = computeHealthScore(f)
    return {
      ...f,
      source_status: f.status,
      source_documents: getProvenance(f.institution_id, f.fiscal_year) ?? null,
      health_score: h.score,
      health_grade: h.grade,
    }
  }), null, 2)
}

export function generateHealthScoresCsv() {
  const latest = getAllLatestFinancials()
  const header = 'institution_id,fiscal_year,health_score,health_grade,liquidity,surplus_margin,borrowing_burden,cash_cover,income_diversity,research_intensity,data_source,confidence,included_in_aggregates'
  const rows = latest.map((f) => {
    const h = computeHealthScore(f)
    return [f.institution_id, f.fiscal_year, h.score ?? '', h.grade,
      h.components.liquidity ?? '', h.components.surplusMargin ?? '',
      h.components.borrowingBurden ?? '', h.components.cashCover ?? '',
      h.components.incomeDiversity ?? '', h.components.researchIntensity ?? '',
      f.data_source, f.confidence, f.included_in_aggregates].join(',')
  })
  return [header, ...rows].join('\n')
}

export function generateHealthScoresJson() {
  return JSON.stringify(getAllLatestFinancials().map((f) => {
    const h = computeHealthScore(f)
    return {
      institution_id: f.institution_id,
      fiscal_year: f.fiscal_year,
      health_score: h.score,
      health_grade: h.grade,
      components: h.components,
      data_source: f.data_source,
      confidence: f.confidence,
      included_in_aggregates: f.included_in_aggregates,
    }
  }), null, 2)
}

export function generateStudentEnrolmentsCsv() {
  const header = 'institution_id,ukprn,academic_year,total_enrolments,uk_enrolments,non_uk_enrolments,unknown_domicile_enrolments,source_status,source_id,source_url,source_reference,retrieved_date,last_verified,confidence,included_in_aggregates,notes'
  const rows = studentEnrolments.map((row) => [
    row.institution_id,
    row.ukprn ?? '',
    row.academic_year,
    csvNullable(row.total_enrolments),
    csvNullable(row.uk_enrolments),
    csvNullable(row.non_uk_enrolments),
    csvNullable(row.unknown_domicile_enrolments),
    row.source_status,
    row.source_id,
    csvText(row.source_url),
    csvText(row.source_reference),
    row.retrieved_date,
    row.last_verified,
    row.confidence,
    row.included_in_aggregates,
    csvText(row.notes),
  ].join(','))
  return [header, ...rows].join('\n')
}

export function generateStudentEnrolmentsJson() {
  return JSON.stringify(studentEnrolments, null, 2)
}

export function generateIntelligenceCsv() {
  const header = 'id,title,category,claim_type,source_status,confidence,publisher,source_id,source_url,source_reference,published_date,retrieved_date,last_verified,geography,period,metric_count,metrics_json,notes'
  const rows = INTELLIGENCE_RECORDS.map((row) => [
    row.id,
    csvText(row.title),
    row.category,
    row.claim_type,
    row.source_status,
    row.confidence,
    csvText(row.publisher),
    row.source_id,
    csvText(row.source_url),
    csvText(row.source_reference),
    row.published_date,
    row.retrieved_date,
    row.last_verified,
    csvText(row.geography),
    csvText(row.period),
    row.metrics.length,
    csvText(JSON.stringify(row.metrics)),
    csvText(row.notes),
  ].join(','))
  return [header, ...rows].join('\n')
}

export function generateIntelligenceJson() {
  return JSON.stringify(INTELLIGENCE_RECORDS, null, 2)
}

export function getDataset(id: string, fmt: Format): string {
  if (id === 'provider-universe') return fmt === 'csv' ? generateProviderUniverseCsv() : generateProviderUniverseJson()
  if (id === 'provider-finance-coverage') return fmt === 'csv' ? generateProviderFinanceCoverageCsv() : generateProviderFinanceCoverageJson()
  if (id === 'provider-source-coverage') return fmt === 'csv' ? generateProviderSourceCoverageCsv() : generateProviderSourceCoverageJson()
  if (id === 'national-student-finance') return fmt === 'csv' ? generateNationalStudentFinanceCsv() : generateNationalStudentFinanceJson()
  if (id === 'institutions') return fmt === 'csv' ? generateInstitutionsCsv() : generateInstitutionsJson()
  if (id === 'all-financials') return fmt === 'csv' ? generateAllFinancialsCsv() : generateAllFinancialsJson()
  if (id === 'latest-snapshot') return fmt === 'csv' ? generateLatestSnapshotCsv() : generateLatestSnapshotJson()
  if (id === 'health-scores') return fmt === 'csv' ? generateHealthScoresCsv() : generateHealthScoresJson()
  if (id === 'student-enrolments') return fmt === 'csv' ? generateStudentEnrolmentsCsv() : generateStudentEnrolmentsJson()
  if (id === 'intelligence') return fmt === 'csv' ? generateIntelligenceCsv() : generateIntelligenceJson()
  return ''
}
