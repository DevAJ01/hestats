import { providerUniverse } from './providers'

export type ProviderDomain = 'students' | 'outcomes' | 'staff' | 'estates'
export type ProviderDomainCoverageStatus = 'verified' | 'pending'

export interface ProviderSourceCoverageRecord {
  provider_id: string
  institution_id: string | null
  ukprn: string | null
  canonical_name: string
  domain: ProviderDomain
  period: string
  source_status: ProviderDomainCoverageStatus
  source_id: string
  source_url: string
  source_reference: string
  retrieved_date: string
  last_verified: string
  confidence: 'high' | 'awaiting'
  included_in_aggregates: boolean
  notes: string
}

const RETRIEVED_DATE = '2026-07-01'

const DOMAIN_SOURCE: Record<ProviderDomain, Pick<ProviderSourceCoverageRecord, 'source_id' | 'source_url' | 'source_reference' | 'period'>> = {
  students: {
    source_id: 'hesa-students',
    source_url: 'https://ckan.publishing.service.gov.uk/dataset/higher-education-student-statistics-uk-2024-25/resource/b384f0c7-8072-43a9-8154-367f06806cf4',
    source_reference: 'Figure 7 - HE student enrolments by HE provider and permanent address 2024/25',
    period: '2024-25',
  },
  outcomes: {
    source_id: 'hesa-graduate-outcomes',
    source_url: 'https://www.hesa.ac.uk/data-and-analysis/graduates/releases',
    source_reference: 'HESA Graduate Outcomes releases; provider-level metrics awaiting internal source row reconciliation',
    period: 'Latest available release by provider',
  },
  staff: {
    source_id: 'hesa-staff',
    source_url: 'https://www.hesa.ac.uk/news/19-02-2026/sb274-higher-education-staff-statistics',
    source_reference: 'HESA Staff Statistics 2024/25 release; provider-level metrics awaiting internal source row reconciliation',
    period: '2024-25',
  },
  estates: {
    source_id: 'hesa-estates',
    source_url: 'https://www.hesa.ac.uk/data-and-analysis/estates',
    source_reference: 'HESA Estates open data; provider-level metrics awaiting internal source row reconciliation',
    period: 'Latest available estates year',
  },
}

export const providerSourceCoverage: ProviderSourceCoverageRecord[] = providerUniverse.flatMap((provider) =>
  (Object.keys(DOMAIN_SOURCE) as ProviderDomain[]).map((domain) => {
    const source = DOMAIN_SOURCE[domain]
    return {
      provider_id: provider.provider_id,
      institution_id: provider.institution_id,
      ukprn: provider.ukprn,
      canonical_name: provider.canonical_name,
      domain,
      period: source.period,
      source_status: 'pending',
      source_id: source.source_id,
      source_url: source.source_url,
      source_reference: source.source_reference,
      retrieved_date: RETRIEVED_DATE,
      last_verified: RETRIEVED_DATE,
      confidence: 'awaiting',
      included_in_aggregates: false,
      notes: 'Coverage row is present so the platform can show explicit gaps. Numeric metrics remain null until an official provider-level source row is loaded.',
    }
  }),
)

export function getProviderSourceCoverageSummary() {
  const byDomain = (Object.keys(DOMAIN_SOURCE) as ProviderDomain[]).map((domain) => {
    const rows = providerSourceCoverage.filter((row) => row.domain === domain)
    return {
      domain,
      total: rows.length,
      verified: rows.filter((row) => row.source_status === 'verified').length,
      pending: rows.filter((row) => row.source_status === 'pending').length,
    }
  })
  return {
    total_rows: providerSourceCoverage.length,
    domains: byDomain,
  }
}
