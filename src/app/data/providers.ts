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
  | 'unreconciled_hesa_provider'

export type ProviderSourceStatus = 'verified' | 'matched' | 'pending'
export type ProviderPlatformStatus = 'full_profile' | 'metadata_pending'

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
const STUDENT_SOURCE_URL = 'https://www.hesa.ac.uk/news/27-01-2026/sb273-higher-education-student-statistics/location'
const HESA_PROVIDER_SOURCE_URL = 'https://www.hesa.ac.uk/support/providers/all-hesa-providers'

function regulatorForNation(nation: ProviderNation): ProviderUniverseRecord['regulator'] {
  if (nation === 'England') return 'OfS'
  if (nation === 'Scotland') return 'SFC'
  if (nation === 'Wales') return 'Medr'
  if (nation === 'Northern Ireland') return 'DfENI'
  return 'Unknown'
}

function providerTypeForName(name: string): ProviderType {
  const lower = name.toLowerCase()
  if (lower.includes('school') || lower.includes('conservatoire') || lower.includes('institute')) return 'specialist_provider'
  if (lower.includes('university')) return 'university'
  return 'higher_education_provider'
}

function buildProviderUniverse(): ProviderUniverseRecord[] {
  const byUkprn = new Map<string, ProviderUniverseRecord>()

  for (const institution of institutions) {
    const provider: ProviderUniverseRecord = {
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
      source_status: 'matched',
      source_id: 'hesa-provider-tools',
      source_url: HESA_PROVIDER_SOURCE_URL,
      source_reference: 'All HESA providers and their history; platform institution matched by UKPRN',
      retrieved_date: RETRIEVED_DATE,
      last_verified: RETRIEVED_DATE,
      confidence: 'medium',
      notes: 'Institution already has a full HEStats profile; UKPRN retained from the platform metadata audit.',
      website: institution.official_website.startsWith('http') ? institution.official_website : `https://${institution.official_website}`,
    }
    if (provider.ukprn) byUkprn.set(provider.ukprn, provider)
  }

  const namedProviders = [...byUkprn.values()].sort((a, b) => a.canonical_name.localeCompare(b.canonical_name))
  const pendingCount = Math.max(0, HESA_STUDENT_PROVIDER_COUNT_2024_25 - namedProviders.length)
  const pendingProviders: ProviderUniverseRecord[] = Array.from({ length: pendingCount }, (_, index) => {
    const n = String(index + 1).padStart(3, '0')
    return {
      provider_id: `hesa-2024-25-unreconciled-${n}`,
      institution_id: null,
      canonical_name: `Unreconciled HESA 2024-25 student reporting provider ${n}`,
      ukprn: null,
      hesa_instid: null,
      provider_type: 'unreconciled_hesa_provider',
      nation: 'Unknown',
      regulator: 'Unknown',
      reports_hesa_student_2024_25: true,
      reports_hesa_finance_2024_25: null,
      platform_status: 'metadata_pending',
      source_status: 'pending',
      source_id: 'hesa-students',
      source_url: STUDENT_SOURCE_URL,
      source_reference: 'HESA SB273 location release states 304 HE providers reported student data for 2024/25',
      retrieved_date: RETRIEVED_DATE,
      last_verified: RETRIEVED_DATE,
      confidence: 'awaiting',
      notes: 'The HESA provider count is verified, but this slot has not yet been reconciled to a named provider/UKPRN by the internal pipeline. No identifier is invented.',
      website: null,
    }
  })

  return [...namedProviders, ...pendingProviders]
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
  }
}
