import { NullableMetric } from './types'

export interface GraduateOutcome {
  institution_id: string
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
  source_status: 'pending'
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
}

export const OUTCOMES: GraduateOutcome[] = []

export function getOutcomesByInstitution(_id: string): GraduateOutcome | undefined {
  return undefined
}

export function getAllOutcomes(): GraduateOutcome[] {
  return OUTCOMES
}

export function getSectorOutcomes(): SectorOutcomeSummary {
  return {
    avg_employment_rate: null,
    avg_graduate_role_pct: null,
    avg_unemployed_pct: null,
    avg_further_study_pct: null,
    avg_salary_k: null,
    avg_median_salary_k: null,
    avg_months_to_job: null,
    avg_nss: null,
    total_graduates_annually: null,
  }
}

export function getTopByOutcome(
  _metric: keyof GraduateOutcome,
  _n = 10,
  _order: 'desc' | 'asc' = 'desc',
): GraduateOutcome[] {
  return []
}
