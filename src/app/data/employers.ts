export interface Employer {
  id: string
  name: string
  sector: string
  hq_city: string
  annual_graduate_intake: number
  avg_starting_salary_k: number
  retention_rate: number
  ai_exposure_pct: number
  description: string
  top_universities: { id: string; name: string; annual_hires: number }[]
  top_subjects: string[]
  internship_pipeline_pct: number
  placement_partnerships: string[]
}

export const EMPLOYERS: Employer[] = []
export const EMPLOYER_SECTORS: string[] = []

export function getEmployerById(_id: string): Employer | undefined {
  return undefined
}

export function getEmployersBySector(): Record<string, Employer[]> {
  return {}
}

export function getTopEmployersForInstitution(_instId: string, _n = 5): Employer[] {
  return []
}
