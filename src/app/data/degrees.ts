export interface Degree {
  id: string
  name: string
  emoji: string
  annual_enrolments: number
  annual_graduations: number
  employment_rate_pct: number
  avg_salary_k: number
  median_salary_k: number
  further_study_pct: number
  phd_progression_pct: number
  gender_female_pct: number
  international_pct: number
  satisfaction_score: number
  ai_automation_risk_pct: number
  ai_augmentation_pct: number
  ai_demand_outlook: 'High' | 'Growing' | 'Stable' | 'Declining'
  ai_resilience_score: number
  top_institutions: string[]
  top_employers: string[]
  industry_destinations: { sector: string; pct: number }[]
  typical_job_titles: string[]
  avg_months_to_job: number
  uk_ranking_note: string
}

export interface SectorDegreeStats {
  total_subjects: number
  avg_employment_rate: number | null
  avg_salary_k: number | null
  avg_ai_risk: number | null
  highest_paid: Degree | null
  most_resilient: Degree | null
  highest_employed: Degree | null
}

export const DEGREES: Degree[] = []
export const DEGREE_SECTORS: string[] = []

export function getDegreeById(_id: string): Degree | undefined {
  return undefined
}

export function getDegreesByAIRisk(_order: 'asc' | 'desc' = 'desc'): Degree[] {
  return []
}

export function getDegreesForInstitution(_instId: string): Degree[] {
  return []
}

export function getSectorDegreeStats(): SectorDegreeStats {
  return {
    total_subjects: 0,
    avg_employment_rate: null,
    avg_salary_k: null,
    avg_ai_risk: null,
    highest_paid: null,
    most_resilient: null,
    highest_employed: null,
  }
}
