export interface Industry {
  id: string
  name: string
  description: string
  annual_graduate_intake: number | null
  avg_starting_salary_k: number | null
  avg_5yr_salary_k: number | null
  employment_growth_pct: number | null
  ai_exposure_pct: number | null
  retention_rate: number | null
  top_universities: string[]
  top_degrees: string[]
  regional_hubs: { city: string; pct: number | null }[]
  skills_demand: string[]
  outlook: 'Excellent' | 'Good' | 'Stable' | 'Challenging' | 'Pending'
  outlook_note: string
  source_status: 'pending'
}

export const INDUSTRIES: Industry[] = []

export function getIndustryById(_id: string): Industry | undefined {
  return undefined
}

export function getIndustriesByOutlook(): Record<Industry['outlook'], Industry[]> {
  return {
    Excellent: [],
    Good: [],
    Stable: [],
    Challenging: [],
    Pending: [],
  }
}
