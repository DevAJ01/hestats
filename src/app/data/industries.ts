import { dfeLeoIndustries } from './generated/leoRecords'

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
  source_status: 'verified' | 'pending'
  source_id: 'dfe-leo'
  source_url: string
  source_reference: string
  retrieved_date: string
  last_verified: string
  confidence: 'high' | 'awaiting'
  included_in_aggregates: boolean
}

export const INDUSTRIES: Industry[] = dfeLeoIndustries

export function getIndustryById(id: string): Industry | undefined {
  return INDUSTRIES.find((industry) => industry.id === id)
}

export function getIndustriesByOutlook(): Record<Industry['outlook'], Industry[]> {
  return INDUSTRIES.reduce<Record<Industry['outlook'], Industry[]>>((groups, industry) => {
    groups[industry.outlook] = [...(groups[industry.outlook] ?? []), industry]
    return groups
  }, {
    Excellent: [],
    Good: [],
    Stable: [],
    Challenging: [],
    Pending: [],
  })
}
