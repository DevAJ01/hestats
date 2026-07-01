import { dfeLeoDegrees } from './generated/leoRecords'

export type DegreeDemandOutlook = 'High' | 'Growing' | 'Stable' | 'Declining'
export type DegreeSourceStatus = 'verified' | 'pending'
export type DegreeAiSourceStatus = 'external_analysis' | 'pending'
export type NullableNumber = number | null

export interface DegreeSourceDocument {
  source_id: string
  publisher: string
  source_url: string
  source_reference: string
  published_date?: string
  retrieved_date: string
  last_verified: string
  confidence: 'high' | 'medium' | 'provisional' | 'awaiting'
}

export interface Degree {
  id: string
  name: string
  emoji: string
  annual_enrolments: NullableNumber
  annual_graduations: NullableNumber
  employment_rate_pct: NullableNumber
  sustained_employment_pct: NullableNumber
  no_sustained_destination_pct: NullableNumber
  avg_salary_k: NullableNumber
  median_salary_k: NullableNumber
  salary_1yr_k: NullableNumber
  salary_3yr_k: NullableNumber
  salary_5yr_k: NullableNumber
  salary_10yr_k: NullableNumber
  fte_salary_1yr_k: NullableNumber
  fte_salary_3yr_k: NullableNumber
  fte_salary_5yr_k: NullableNumber
  further_study_pct: NullableNumber
  phd_progression_pct: NullableNumber
  gender_female_pct: NullableNumber
  international_pct: NullableNumber
  satisfaction_score: NullableNumber
  ai_automation_risk_pct: number
  ai_augmentation_pct: number
  ai_demand_outlook: DegreeDemandOutlook
  ai_resilience_score: number
  ai_source_status: DegreeAiSourceStatus
  top_institutions: string[]
  top_employers: string[]
  industry_destinations: { sector: string; pct: NullableNumber; count: number; median_salary_k: NullableNumber }[]
  regional_destinations: { region: string; pct: NullableNumber; count: number }[]
  typical_job_titles: string[]
  avg_months_to_job: NullableNumber
  uk_ranking_note: string
  source_status: DegreeSourceStatus
  source_id: 'dfe-leo'
  source_url: string
  source_reference: string
  retrieved_date: string
  last_verified: string
  confidence: 'high' | 'awaiting'
  included_in_aggregates: boolean
  source_documents: DegreeSourceDocument[]
}

export interface SectorDegreeStats {
  total_subjects: number
  avg_employment_rate: NullableNumber
  avg_salary_k: NullableNumber
  avg_ai_risk: NullableNumber
  highest_paid: Degree | null
  most_resilient: Degree | null
  highest_employed: Degree | null
}

export const DEGREES: Degree[] = dfeLeoDegrees
export const DEGREE_SECTORS: string[] = [...new Set(DEGREES.flatMap((degree) => degree.industry_destinations.map((item) => item.sector)))].sort()

function isKnown(value: NullableNumber): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function average(values: NullableNumber[]): NullableNumber {
  const known = values.filter(isKnown)
  if (!known.length) return null
  return Math.round((known.reduce((sum, value) => sum + value, 0) / known.length) * 10) / 10
}

function metricValue(value: NullableNumber, fallback = -Infinity) {
  return isKnown(value) ? value : fallback
}

export function getDegreeById(id: string): Degree | undefined {
  return DEGREES.find((degree) => degree.id === id)
}

export function getDegreesByAIRisk(order: 'asc' | 'desc' = 'desc'): Degree[] {
  return [...DEGREES].sort((a, b) => order === 'desc'
    ? b.ai_automation_risk_pct - a.ai_automation_risk_pct
    : a.ai_automation_risk_pct - b.ai_automation_risk_pct)
}

export function getDegreesForInstitution(instId: string): Degree[] {
  return DEGREES.filter((degree) => degree.top_institutions.includes(instId))
}

export function getSectorDegreeStats(): SectorDegreeStats {
  const aggregateRows = DEGREES.filter((degree) => degree.included_in_aggregates)
  const salaryRows = aggregateRows.filter((degree) => isKnown(degree.avg_salary_k))
  const employmentRows = aggregateRows.filter((degree) => isKnown(degree.employment_rate_pct))

  return {
    total_subjects: DEGREES.length,
    avg_employment_rate: average(aggregateRows.map((degree) => degree.employment_rate_pct)),
    avg_salary_k: average(aggregateRows.map((degree) => degree.avg_salary_k)),
    avg_ai_risk: average(aggregateRows.map((degree) => degree.ai_automation_risk_pct)),
    highest_paid: salaryRows.length
      ? salaryRows.reduce((best, degree) => metricValue(degree.avg_salary_k) > metricValue(best.avg_salary_k) ? degree : best)
      : null,
    most_resilient: aggregateRows.length
      ? aggregateRows.reduce((best, degree) => degree.ai_resilience_score > best.ai_resilience_score ? degree : best)
      : null,
    highest_employed: employmentRows.length
      ? employmentRows.reduce((best, degree) => metricValue(degree.employment_rate_pct) > metricValue(best.employment_rate_pct) ? degree : best)
      : null,
  }
}
