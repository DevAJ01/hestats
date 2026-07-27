import { estateRecords, isKnownEstateNumber, isVerifiedEstateRecord } from './estates'
import { financials, isKnownNumber } from './financials'
import { computeHealthScore } from './health'
import { institutions } from './institutions'
import { OUTCOMES } from './outcomes'

export type RankingConfidence = 'high' | 'medium' | 'limited'

export interface OverallInstitutionRanking {
  institution_id: string
  fiscal_year: string
  overall_score: number | null
  finance_score: number | null
  outcomes_score: number | null
  research_score: number | null
  sustainability_score: number | null
  coverage_pct: number
  dimensions_available: number
  confidence: RankingConfidence
  rank: number | null
}

export const OVERALL_RANKING_METHOD = {
  label: 'HEStats Overall Evidence Score',
  version: '1.0',
  weights: {
    finance: 0.35,
    graduate_outcomes: 0.35,
    research_intensity: 0.15,
    estate_efficiency: 0.15,
  },
  minimum_dimensions: 2,
  notes: 'Available dimensions are reweighted to 100%. Coverage is always shown and low-coverage rows are labelled; missing or suppressed values are never converted to zero.',
  sources: [
    'https://www.hesa.ac.uk/data-and-analysis/finances',
    'https://explore-education-statistics.service.gov.uk/find-statistics/graduate-outcomes-leo',
    'https://www.hesa.ac.uk/data-and-analysis/estates/environmental',
  ],
} as const

function round(value: number, digits = 1) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function percentileMap(values: Map<string, number>, lowerIsBetter = false): Map<string, number> {
  const ordered = [...values.entries()].sort((a, b) => a[1] - b[1])
  const result = new Map<string, number>()
  if (!ordered.length) return result
  if (ordered.length === 1) {
    result.set(ordered[0][0], 50)
    return result
  }

  let start = 0
  while (start < ordered.length) {
    let end = start
    while (end + 1 < ordered.length && ordered[end + 1][1] === ordered[start][1]) end += 1
    const midpointRank = (start + end) / 2
    const percentile = (midpointRank / (ordered.length - 1)) * 100
    for (let index = start; index <= end; index += 1) {
      result.set(ordered[index][0], round(lowerIsBetter ? 100 - percentile : percentile))
    }
    start = end + 1
  }
  return result
}

function average(values: Array<number | null | undefined>): number | null {
  const known = values.filter(isKnownNumber)
  if (!known.length) return null
  return round(known.reduce((sum, value) => sum + value, 0) / known.length)
}

function latestEstateForYear(institutionId: string, fiscalYear: string) {
  return estateRecords.find((row) => (
    row.institution_id === institutionId &&
    row.academic_year === fiscalYear &&
    isVerifiedEstateRecord(row)
  ))
}

export function getOverallRankingsForYear(fiscalYear = '2024-25'): OverallInstitutionRanking[] {
  const financeById = new Map(
    financials
      .filter((row) => row.fiscal_year === fiscalYear)
      .map((row) => [row.institution_id, row]),
  )
  const outcomeById = new Map(OUTCOMES.filter((row) => row.included_in_aggregates).map((row) => [row.institution_id, row]))

  const employment = new Map<string, number>()
  const graduateRole = new Map<string, number>()
  const salary = new Map<string, number>()
  const unemployment = new Map<string, number>()
  const researchIntensity = new Map<string, number>()
  const energyIntensity = new Map<string, number>()

  for (const institution of institutions) {
    const outcome = outcomeById.get(institution.id)
    if (outcome && isKnownNumber(outcome.employment_rate_15mo)) employment.set(institution.id, outcome.employment_rate_15mo)
    if (outcome && isKnownNumber(outcome.graduate_role_pct)) graduateRole.set(institution.id, outcome.graduate_role_pct)
    if (outcome && isKnownNumber(outcome.median_salary_k)) salary.set(institution.id, outcome.median_salary_k)
    if (outcome && isKnownNumber(outcome.unemployed_pct)) unemployment.set(institution.id, outcome.unemployed_pct)

    const finance = financeById.get(institution.id)
    if (
      finance &&
      finance.included_in_aggregates &&
      isKnownNumber(finance.research_income_gbp_m) &&
      isKnownNumber(finance.revenue_gbp_m) &&
      finance.revenue_gbp_m > 0
    ) {
      researchIntensity.set(institution.id, finance.research_income_gbp_m / finance.revenue_gbp_m)
    }

    const estate = latestEstateForYear(institution.id, fiscalYear)
    if (
      estate &&
      isKnownEstateNumber(estate.energy_consumption_kwh) &&
      isKnownEstateNumber(estate.total_estate_area_sqm) &&
      estate.total_estate_area_sqm > 0
    ) {
      energyIntensity.set(institution.id, estate.energy_consumption_kwh / estate.total_estate_area_sqm)
    }
  }

  const employmentPct = percentileMap(employment)
  const graduateRolePct = percentileMap(graduateRole)
  const salaryPct = percentileMap(salary)
  const unemploymentPct = percentileMap(unemployment, true)
  const researchPct = percentileMap(researchIntensity)
  const sustainabilityPct = percentileMap(energyIntensity, true)
  const weightByDimension = {
    finance_score: OVERALL_RANKING_METHOD.weights.finance,
    outcomes_score: OVERALL_RANKING_METHOD.weights.graduate_outcomes,
    research_score: OVERALL_RANKING_METHOD.weights.research_intensity,
    sustainability_score: OVERALL_RANKING_METHOD.weights.estate_efficiency,
  } as const

  const rows = institutions.map((institution): OverallInstitutionRanking => {
    const finance = financeById.get(institution.id)
    const health = finance?.included_in_aggregates ? computeHealthScore(finance) : null
    const dimensions = {
      finance_score: health?.score ?? null,
      outcomes_score: average([
        employmentPct.get(institution.id),
        graduateRolePct.get(institution.id),
        salaryPct.get(institution.id),
        unemploymentPct.get(institution.id),
      ]),
      research_score: researchPct.get(institution.id) ?? null,
      sustainability_score: sustainabilityPct.get(institution.id) ?? null,
    }

    const available = Object.entries(dimensions).filter((entry): entry is [keyof typeof dimensions, number] => isKnownNumber(entry[1]))
    const availableWeight = available.reduce((sum, [key]) => sum + weightByDimension[key], 0)
    const overall = available.length >= OVERALL_RANKING_METHOD.minimum_dimensions && availableWeight > 0
      ? round(available.reduce((sum, [key, value]) => sum + value * weightByDimension[key], 0) / availableWeight)
      : null
    const coveragePct = round(availableWeight * 100, 0)

    return {
      institution_id: institution.id,
      fiscal_year: fiscalYear,
      overall_score: overall,
      ...dimensions,
      coverage_pct: coveragePct,
      dimensions_available: available.length,
      confidence: coveragePct >= 85 ? 'high' : coveragePct >= 65 ? 'medium' : 'limited',
      rank: null,
    }
  })

  let rank = 0
  return rows
    .sort((a, b) => (b.overall_score ?? -1) - (a.overall_score ?? -1))
    .map((row) => ({
      ...row,
      rank: row.overall_score === null ? null : ++rank,
    }))
}
