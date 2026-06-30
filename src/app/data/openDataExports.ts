import { computeHealthScore } from './health'
import { financials, getAllLatestFinancials } from './financials'
import { institutions } from './institutions'

export type Format = 'csv' | 'json'

function confidenceFor(dataSource: string) {
  return dataSource
}

function csvText(value: string | undefined) {
  return `"${(value ?? '').replaceAll('"', '""')}"`
}

export function generateInstitutionsCsv() {
  const header = 'id,ukprn,canonical_name,short_name,city,nation,founded,mission_group,official_website'
  const rows = institutions.map((i) =>
    [i.id, i.ukprn, `"${i.canonical_name}"`, `"${i.short_name}"`, `"${i.city}"`, i.nation, i.founded, `"${i.mission_group ?? ''}"`, `"${i.official_website ?? ''}"`].join(','),
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

export function generateAllFinancialsCsv() {
  const header = 'institution_id,fiscal_year,revenue_gbp_m,surplus_gbp_m,surplus_margin_pct,research_income_gbp_m,tuition_fee_income_gbp_m,other_income_gbp_m,staff_costs_gbp_m,total_expenditure_gbp_m,cash_gbp_m,borrowing_gbp_m,liquidity_days,international_fte_pct,student_fte_total,capital_expenditure_gbp_m,net_assets_gbp_m,risk_flag,data_source,source_status,source_pdf,confidence'
  const rows = financials.map((f) =>
    [f.institution_id, f.fiscal_year, f.revenue_gbp_m, f.surplus_gbp_m, f.surplus_margin_pct.toFixed(2),
      f.research_income_gbp_m, f.tuition_fee_income_gbp_m, f.other_income_gbp_m,
      f.staff_costs_gbp_m, f.total_expenditure_gbp_m, f.cash_gbp_m, f.borrowing_gbp_m,
      f.liquidity_days, f.international_fte_pct, f.student_fte_total,
      f.capital_expenditure_gbp_m, f.net_assets_gbp_m, f.risk_flag, f.data_source,
      f.status, csvText(f.source_pdf), confidenceFor(f.data_source)].join(','),
  )
  return [header, ...rows].join('\n')
}

export function generateAllFinancialsJson() {
  return JSON.stringify(financials.map((f) => ({
    ...f,
    source_status: f.status,
    confidence: confidenceFor(f.data_source),
  })), null, 2)
}

export function generateLatestSnapshotCsv() {
  const latest = getAllLatestFinancials()
  const header = 'institution_id,fiscal_year,revenue_gbp_m,surplus_gbp_m,surplus_margin_pct,research_income_gbp_m,tuition_fee_income_gbp_m,staff_costs_gbp_m,cash_gbp_m,borrowing_gbp_m,liquidity_days,international_fte_pct,student_fte_total,capital_expenditure_gbp_m,net_assets_gbp_m,risk_flag,data_source,source_status,source_pdf,confidence,health_score,health_grade'
  const rows = latest.map((f) => {
    const h = computeHealthScore(f)
    return [f.institution_id, f.fiscal_year, f.revenue_gbp_m, f.surplus_gbp_m, f.surplus_margin_pct.toFixed(2),
      f.research_income_gbp_m, f.tuition_fee_income_gbp_m, f.staff_costs_gbp_m,
      f.cash_gbp_m, f.borrowing_gbp_m, f.liquidity_days, f.international_fte_pct,
      f.student_fte_total, f.capital_expenditure_gbp_m, f.net_assets_gbp_m,
      f.risk_flag, f.data_source, f.status, csvText(f.source_pdf), confidenceFor(f.data_source), h.score, h.grade].join(',')
  })
  return [header, ...rows].join('\n')
}

export function generateLatestSnapshotJson() {
  return JSON.stringify(getAllLatestFinancials().map((f) => {
    const h = computeHealthScore(f)
    return {
      ...f,
      source_status: f.status,
      confidence: confidenceFor(f.data_source),
      health_score: h.score,
      health_grade: h.grade,
    }
  }), null, 2)
}

export function generateHealthScoresCsv() {
  const latest = getAllLatestFinancials()
  const header = 'institution_id,fiscal_year,health_score,health_grade,liquidity,surplus_margin,borrowing_burden,cash_cover,income_diversity,research_intensity,data_source,confidence'
  const rows = latest.map((f) => {
    const h = computeHealthScore(f)
    return [f.institution_id, f.fiscal_year, h.score, h.grade,
      h.components.liquidity.toFixed(1), h.components.surplusMargin.toFixed(1),
      h.components.borrowingBurden.toFixed(1), h.components.cashCover.toFixed(1),
      h.components.incomeDiversity.toFixed(1), h.components.researchIntensity.toFixed(1),
      f.data_source, confidenceFor(f.data_source)].join(',')
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
      confidence: confidenceFor(f.data_source),
    }
  }), null, 2)
}

export function getDataset(id: string, fmt: Format): string {
  if (id === 'institutions') return fmt === 'csv' ? generateInstitutionsCsv() : generateInstitutionsJson()
  if (id === 'all-financials') return fmt === 'csv' ? generateAllFinancialsCsv() : generateAllFinancialsJson()
  if (id === 'latest-snapshot') return fmt === 'csv' ? generateLatestSnapshotCsv() : generateLatestSnapshotJson()
  if (id === 'health-scores') return fmt === 'csv' ? generateHealthScoresCsv() : generateHealthScoresJson()
  return ''
}
