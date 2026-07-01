import { hesaGraduateOutcomesHeadline2023_24, dfeLeoGraduateOutcomes } from './generated/leoRecords'
import { NullableMetric } from './types'

export type OutcomeSourceStatus = 'verified' | 'pending'
export type OutcomeConfidence = 'high' | 'awaiting'

export interface OutcomeSourceDocument {
  source_id: string
  publisher: string
  source_url: string
  source_reference: string
  published_date?: string
  retrieved_date: string
  last_verified: string
  confidence: OutcomeConfidence | 'medium' | 'provisional'
}

export interface GraduateOutcome {
  institution_id: string
  ukprn: string | null
  academic_year: string | null
  tax_year: string
  graduates_yag1: NullableMetric
  employment_rate_15mo: NullableMetric
  graduate_role_pct: NullableMetric
  unemployed_pct: NullableMetric
  further_study_pct: NullableMetric
  self_employed_pct: NullableMetric
  business_starts_pct: NullableMetric
  working_internationally_pct: NullableMetric
  avg_salary_k: NullableMetric
  median_salary_k: NullableMetric
  salary_1yr_k: NullableMetric
  salary_3yr_k: NullableMetric
  salary_5yr_k: NullableMetric
  avg_months_to_job: NullableMetric
  nss_overall_pct: NullableMetric
  tef_rating: 'Gold' | 'Silver' | 'Bronze' | null
  placement_participation_pct: NullableMetric
  placement_employment_boost_pp: NullableMetric
  placement_salary_boost_k: NullableMetric
  source_status: OutcomeSourceStatus
  source_id: 'dfe-leo'
  source_url: string
  source_reference: string
  retrieved_date: string
  last_verified: string
  confidence: OutcomeConfidence
  included_in_aggregates: boolean
  source_documents: OutcomeSourceDocument[]
  notes?: string
}

export interface GraduateOutcomesHeadline {
  period: string
  published_date: string
  graduates_surveyed: number
  responses: number
  work_or_further_study_pct: number
  full_time_employment_pct: number
  full_time_further_study_pct: number
  unemployment_pct: number
  meaningful_activity_pct: number
  fits_future_plans_pct: number
  using_learning_pct: number
  median_salary_k: number
  medicine_and_dentistry_median_salary_k: number
  source_status: 'verified'
  source_id: 'hesa-graduate-outcomes'
  source_url: string
  source_reference: string
  retrieved_date: string
  last_verified: string
  confidence: 'high'
  included_in_aggregates: boolean
}

export interface SectorOutcomeSummary {
  avg_employment_rate: NullableMetric
  avg_graduate_role_pct: NullableMetric
  avg_unemployed_pct: NullableMetric
  avg_further_study_pct: NullableMetric
  avg_salary_k: NullableMetric
  avg_median_salary_k: NullableMetric
  avg_months_to_job: NullableMetric
  avg_nss: NullableMetric
  total_graduates_annually: NullableMetric
  verified_records: number
  pending_records: number
  included_in_aggregates: number
}

export const HESA_GRADUATE_OUTCOMES_HEADLINE = hesaGraduateOutcomesHeadline2023_24
export const OUTCOMES: GraduateOutcome[] = dfeLeoGraduateOutcomes

function isKnown(value: NullableMetric): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function average(rows: GraduateOutcome[], key: keyof GraduateOutcome): NullableMetric {
  const values = rows.map((row) => row[key]).filter((value): value is number => isKnown(value as NullableMetric))
  if (!values.length) return null
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10
}

function sum(rows: GraduateOutcome[], key: keyof GraduateOutcome): NullableMetric {
  const values = rows.map((row) => row[key]).filter((value): value is number => isKnown(value as NullableMetric))
  if (!values.length) return null
  return values.reduce((total, value) => total + value, 0)
}

export function getOutcomesByInstitution(id: string): GraduateOutcome | undefined {
  return OUTCOMES.find((row) => row.institution_id === id)
}

export function getAllOutcomes(): GraduateOutcome[] {
  return OUTCOMES
}

export function getVerifiedOutcomes(): GraduateOutcome[] {
  return OUTCOMES.filter((row) => row.source_status === 'verified')
}

export function getAggregateEligibleOutcomes(): GraduateOutcome[] {
  return OUTCOMES.filter((row) => row.included_in_aggregates)
}

export function getSectorOutcomes(): SectorOutcomeSummary {
  const aggregateRows = getAggregateEligibleOutcomes()
  return {
    avg_employment_rate: average(aggregateRows, 'employment_rate_15mo'),
    avg_graduate_role_pct: average(aggregateRows, 'graduate_role_pct'),
    avg_unemployed_pct: average(aggregateRows, 'unemployed_pct'),
    avg_further_study_pct: average(aggregateRows, 'further_study_pct'),
    avg_salary_k: average(aggregateRows, 'avg_salary_k'),
    avg_median_salary_k: average(aggregateRows, 'median_salary_k'),
    avg_months_to_job: average(aggregateRows, 'avg_months_to_job'),
    avg_nss: average(aggregateRows, 'nss_overall_pct'),
    total_graduates_annually: sum(aggregateRows, 'graduates_yag1'),
    verified_records: OUTCOMES.filter((row) => row.source_status === 'verified').length,
    pending_records: OUTCOMES.filter((row) => row.source_status === 'pending').length,
    included_in_aggregates: aggregateRows.length,
  }
}

export function getTopByOutcome(
  metric: keyof GraduateOutcome,
  n = 10,
  order: 'desc' | 'asc' = 'desc',
): GraduateOutcome[] {
  return [...OUTCOMES]
    .filter((row) => isKnown(row[metric] as NullableMetric))
    .sort((a, b) => {
      const av = a[metric] as number
      const bv = b[metric] as number
      return order === 'desc' ? bv - av : av - bv
    })
    .slice(0, n)
}
