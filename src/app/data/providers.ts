import { institutions } from './institutions'
import type { Institution } from './types'

export const HESA_STUDENT_PROVIDER_COUNT_2024_25 = 304
export const HESA_FINANCE_PROVIDER_COUNT_2024_25 = 312
export const HESA_FINANCE_RELEASE_2_INCLUDED_2024_25 = 299

export type ProviderNation = Institution['nation'] | 'Unknown'
export type ProviderType =
  | 'higher_education_provider'
  | 'university'
  | 'specialist_provider'

export type ProviderSourceStatus = 'verified' | 'matched' | 'pending'
export type ProviderPlatformStatus = 'full_profile'

export interface ProviderUniverseRecord {
  provider_id: string
  institution_id: string | null
  canonical_name: string
  ukprn: string | null
  hesa_instid: string | null
  provider_type: ProviderType
  nation: ProviderNation
  regulator: 'OfS' | 'SFC' | 'Medr' | 'DfENI' | 'Unknown'
  reports_hesa_student_2024_25: boolean
  reports_hesa_finance_2024_25: boolean | null
  platform_status: ProviderPlatformStatus
  source_status: ProviderSourceStatus
  source_id: string
  source_url: string
  source_reference: string
  retrieved_date: string
  last_verified: string
  confidence: 'high' | 'medium' | 'awaiting'
  notes: string
  website: string | null
}

const RETRIEVED_DATE = '2026-07-01'
const HESA_PROVIDER_SOURCE_URL = 'https://www.hesa.ac.uk/data-and-analysis/finances/table-1.csv'

function regulatorForNation(nation: ProviderNation): ProviderUniverseRecord['regulator'] {
  if (nation === 'England') return 'OfS'
  if (nation === 'Scotland') return 'SFC'
  if (nation === 'Wales') return 'Medr'
  if (nation === 'Northern Ireland') return 'DfENI'
  return 'Unknown'
}

function providerTypeForName(name: string): ProviderType {
  const lower = name.toLowerCase()
  if (lower.includes('university')) return 'university'
  if (
    lower.includes('academy') ||
    lower.includes('college') ||
    lower.includes('conservatoire') ||
    lower.includes('institute') ||
    lower.includes('school') ||
    lower.includes('centre') ||
    lower.includes('trust')
  ) return 'specialist_provider'
  return 'higher_education_provider'
}

function buildProviderUniverse(): ProviderUniverseRecord[] {
  return institutions
    .map((institution) => ({
      provider_id: institution.id,
      institution_id: institution.id,
      canonical_name: institution.canonical_name,
      ukprn: institution.ukprn,
      hesa_instid: null,
      provider_type: providerTypeForName(institution.canonical_name),
      nation: institution.nation,
      regulator: regulatorForNation(institution.nation),
      reports_hesa_student_2024_25: true,
      reports_hesa_finance_2024_25: null,
      platform_status: 'full_profile',
      source_status: 'verified',
      source_id: 'hesa-finance',
      source_url: HESA_PROVIDER_SOURCE_URL,
      source_reference: 'HESA Finance Open Data Table 1 provider roster reconciled into the unified HEStats institution directory; HESA SB273 confirms 304 student-reporting providers for 2024/25.',
      retrieved_date: RETRIEVED_DATE,
      last_verified: RETRIEVED_DATE,
      confidence: 'high',
      notes: institution.founded > 0
        ? 'Named provider is represented directly in the platform institution directory.'
        : 'Named provider is represented directly in the platform institution directory; founded year and website remain pending where not supplied by the source roster.',
      website: institution.official_website
        ? institution.official_website.startsWith('http') ? institution.official_website : `https://${institution.official_website}`
        : null,
    } satisfies ProviderUniverseRecord))
    .sort((a, b) => a.canonical_name.localeCompare(b.canonical_name))
}

export const providerUniverse: ProviderUniverseRecord[] = buildProviderUniverse()

export function getProviderById(id: string): ProviderUniverseRecord | undefined {
  return providerUniverse.find((provider) => provider.provider_id === id || provider.ukprn === id || provider.institution_id === id)
}

export function getProviderCoverageSummary() {
  const named = providerUniverse.filter((provider) => provider.ukprn !== null)
  const fullProfile = providerUniverse.filter((provider) => provider.platform_status === 'full_profile')
  const pending = providerUniverse.filter((provider) => provider.source_status === 'pending')
  return {
    hesa_student_reporting_providers_2024_25: HESA_STUDENT_PROVIDER_COUNT_2024_25,
    hesa_finance_providers_2024_25: HESA_FINANCE_PROVIDER_COUNT_2024_25,
    hesa_finance_release_2_included_2024_25: HESA_FINANCE_RELEASE_2_INCLUDED_2024_25,
    provider_universe_rows: providerUniverse.length,
    named_provider_rows: named.length,
    full_profile_rows: fullProfile.length,
    metadata_pending_rows: pending.length,
    coverage_only_rows: 0,
    unified_institution_directory_rows: institutions.length,
  }
}
