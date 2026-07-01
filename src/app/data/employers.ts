import { dfeLeoEmployerMarkets } from './generated/leoRecords'

export type EmployerSourceStatus = 'verified' | 'pending'

export interface Employer {
  id: string
  name: string
  sector: string
  hq_city: string
  annual_graduate_intake: number
  avg_starting_salary_k: number | null
  retention_rate: number | null
  ai_exposure_pct: number
  description: string
  top_universities: { id: string; name: string; annual_hires: number }[]
  top_subjects: string[]
  internship_pipeline_pct: number | null
  placement_partnerships: string[]
  market_type: 'industry_section'
  source_status: EmployerSourceStatus
  source_id: 'dfe-leo'
  source_url: string
  source_reference: string
  retrieved_date: string
  last_verified: string
  confidence: 'high' | 'awaiting'
  included_in_aggregates: boolean
  notes?: string
}

export const EMPLOYERS: Employer[] = dfeLeoEmployerMarkets
export const EMPLOYER_SECTORS: string[] = [...new Set(EMPLOYERS.map((employer) => employer.sector))].sort()

export function getEmployerById(id: string): Employer | undefined {
  return EMPLOYERS.find((employer) => employer.id === id)
}

export function getEmployersBySector(): Record<string, Employer[]> {
  return EMPLOYERS.reduce<Record<string, Employer[]>>((groups, employer) => {
    groups[employer.sector] = [...(groups[employer.sector] ?? []), employer]
    return groups
  }, {})
}

export function getTopEmployersForInstitution(_instId: string, n = 5): Employer[] {
  return [...EMPLOYERS]
    .sort((a, b) => b.annual_graduate_intake - a.annual_graduate_intake)
    .slice(0, n)
}
