import { providerUniverse } from './providers'
import { estateRecords } from './estates'
import { OUTCOMES } from './outcomes'
import { staffRecords } from './staff'
import { studentEnrolments } from './students'
import { tefRecords } from './tef'

export type ProviderDomain = 'students' | 'outcomes' | 'staff' | 'estates' | 'tef'
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
    source_url: 'https://www.hesa.ac.uk/data-and-analysis/estates/environmental',
    source_reference: 'HESA Estates open data tables 1-5; provider-level metrics awaiting internal source row reconciliation',
    period: '2015-16 to 2023-24',
  },
  tef: {
    source_id: 'ofs-tef',
    source_url: 'https://www.officeforstudents.org.uk/for-providers/quality-and-standards/tef-2023-ratings/',
    source_reference: 'OfS TEF 2023 ratings; ratings are assessment ratings and not annual rankings',
    period: 'TEF 2023 rating cycle',
  },
}

function coverageForDomain(
  provider: (typeof providerUniverse)[number],
  domain: ProviderDomain,
): Pick<ProviderSourceCoverageRecord, 'source_status' | 'source_id' | 'source_url' | 'source_reference' | 'period' | 'confidence' | 'included_in_aggregates' | 'notes'> {
  const fallback = DOMAIN_SOURCE[domain]
  const institutionId = provider.institution_id

  if (institutionId && domain === 'students') {
    const row = studentEnrolments.find((item) => item.institution_id === institutionId)
    if (row?.source_status === 'verified') {
      return {
        period: row.academic_year,
        source_status: 'verified',
        source_id: row.source_id,
        source_url: row.source_url,
        source_reference: row.source_reference,
        confidence: row.confidence,
        included_in_aggregates: row.included_in_aggregates,
        notes: row.notes ?? 'Verified HESA Student Statistics provider row.',
      }
    }
  }

  if (institutionId && domain === 'outcomes') {
    const row = OUTCOMES.find((item) => item.institution_id === institutionId)
    if (row?.source_status === 'verified') {
      return {
        period: row.tax_year,
        source_status: 'verified',
        source_id: row.source_id,
        source_url: row.source_url,
        source_reference: row.source_reference,
        confidence: row.confidence,
        included_in_aggregates: row.included_in_aggregates,
        notes: row.notes ?? 'Verified DfE LEO graduate outcome provider row.',
      }
    }
  }

  if (institutionId && domain === 'staff') {
    const row = staffRecords.find((item) => item.institution_id === institutionId && item.source_status === 'verified')
    if (row) {
      return {
        period: row.academic_year,
        source_status: 'verified',
        source_id: row.source_id,
        source_url: row.source_url,
        source_reference: row.source_reference,
        confidence: row.confidence,
        included_in_aggregates: row.included_in_aggregates,
        notes: row.notes ?? 'Verified HESA Staff provider row.',
      }
    }
  }

  if (institutionId && domain === 'estates') {
    const row = estateRecords.find((item) => item.institution_id === institutionId && item.source_status === 'verified')
    if (row) {
      return {
        period: row.academic_year,
        source_status: 'verified',
        source_id: row.source_id,
        source_url: row.source_url,
        source_reference: row.source_reference,
        confidence: row.confidence,
        included_in_aggregates: row.included_in_aggregates,
        notes: row.notes ?? 'Verified HESA Estates provider row.',
      }
    }
  }

  if (institutionId && domain === 'tef') {
    const row = tefRecords.find((item) => item.institution_id === institutionId)
    if (row?.source_status === 'verified') {
      return {
        period: `TEF ${row.assessment_year}`,
        source_status: 'verified',
        source_id: row.source_id,
        source_url: row.source_url,
        source_reference: row.source_reference,
        confidence: row.confidence,
        included_in_aggregates: row.included_in_aggregates,
        notes: row.notes ?? 'Verified OfS TEF provider rating row.',
      }
    }
  }

  return {
    ...fallback,
    source_status: 'pending',
    confidence: 'awaiting',
    included_in_aggregates: false,
    notes: 'Coverage row is present so the platform can show explicit gaps. Numeric metrics remain null until an official provider-level source row is loaded.',
  }
}

export const providerSourceCoverage: ProviderSourceCoverageRecord[] = providerUniverse.flatMap((provider) =>
  (Object.keys(DOMAIN_SOURCE) as ProviderDomain[]).map((domain) => {
    const source = coverageForDomain(provider, domain)
    return {
      provider_id: provider.provider_id,
      institution_id: provider.institution_id,
      ukprn: provider.ukprn,
      canonical_name: provider.canonical_name,
      domain,
      period: source.period,
      source_status: source.source_status,
      source_id: source.source_id,
      source_url: source.source_url,
      source_reference: source.source_reference,
      retrieved_date: RETRIEVED_DATE,
      last_verified: RETRIEVED_DATE,
      confidence: source.confidence,
      included_in_aggregates: source.included_in_aggregates,
      notes: source.notes,
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
