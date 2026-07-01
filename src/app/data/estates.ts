import { institutions } from './institutions'
import { verifiedEstateRecords } from './generated/estateRecords'
import { NullableMetric } from './types'

export const ESTATE_YEARS = [
  '2023-24', '2022-23', '2021-22', '2020-21', '2019-20',
  '2018-19', '2017-18', '2016-17', '2015-16',
] as const
export type EstateYear = (typeof ESTATE_YEARS)[number]

export type EstateSourceStatus = 'verified' | 'pending'
export type EstateConfidence = 'high' | 'awaiting'

export interface EstateRecord {
  institution_id: string
  ukprn: string | null
  academic_year: EstateYear
  total_estate_area_sqm: NullableMetric
  academic_estate_area_sqm: NullableMetric
  residential_estate_area_sqm: NullableMetric
  scope1_2_emissions_tonnes_co2e: NullableMetric
  energy_consumption_kwh: NullableMetric
  water_consumption_m3: NullableMetric
  waste_tonnes: NullableMetric
  condition_a_b_pct: NullableMetric
  source_status: EstateSourceStatus
  source_id: 'hesa-estates'
  source_url: string
  source_reference: string
  retrieved_date: string
  last_verified: string
  confidence: EstateConfidence
  included_in_aggregates: boolean
  notes?: string
}

export const HESA_ESTATES_SOURCE_URL = 'https://www.hesa.ac.uk/data-and-analysis/estates/environmental'
const SOURCE_REFERENCE = 'HESA Estates Management open data tables 1-5 - provider estates, environmental and condition metrics, 2015/16 to 2023/24'
const DEFAULT_RETRIEVED_DATE = '2026-07-01'

const ESTATE_NUMERIC_KEYS = [
  'total_estate_area_sqm',
  'academic_estate_area_sqm',
  'residential_estate_area_sqm',
  'scope1_2_emissions_tonnes_co2e',
  'energy_consumption_kwh',
  'water_consumption_m3',
  'waste_tonnes',
  'condition_a_b_pct',
] as const

export type EstateNumericKey = (typeof ESTATE_NUMERIC_KEYS)[number]
export const ESTATE_VALUE_KEYS: readonly EstateNumericKey[] = ESTATE_NUMERIC_KEYS

function pendingEstateRow(institution_id: string, ukprn: string | null, academic_year: EstateYear): EstateRecord {
  return {
    institution_id,
    ukprn,
    academic_year,
    total_estate_area_sqm: null,
    academic_estate_area_sqm: null,
    residential_estate_area_sqm: null,
    scope1_2_emissions_tonnes_co2e: null,
    energy_consumption_kwh: null,
    water_consumption_m3: null,
    waste_tonnes: null,
    condition_a_b_pct: null,
    source_status: 'pending',
    source_id: 'hesa-estates',
    source_url: HESA_ESTATES_SOURCE_URL,
    source_reference: SOURCE_REFERENCE,
    retrieved_date: DEFAULT_RETRIEVED_DATE,
    last_verified: DEFAULT_RETRIEVED_DATE,
    confidence: 'awaiting',
    included_in_aggregates: false,
    notes: 'Awaiting official HESA Estates provider-level source rows in the internal data pipeline. HESA Estates latest public open data covers 2015/16 to 2023/24.',
  }
}

function generateEstateCoverage(): EstateRecord[] {
  const byKey = new Map<string, EstateRecord>()

  for (const institution of institutions) {
    for (const year of ESTATE_YEARS) {
      const row = pendingEstateRow(institution.id, institution.ukprn, year)
      byKey.set(`${row.institution_id}:${row.academic_year}`, row)
    }
  }

  for (const row of verifiedEstateRecords) {
    byKey.set(`${row.institution_id}:${row.academic_year}`, row)
  }

  return [...byKey.values()].sort((a, b) => {
    const inst = a.institution_id.localeCompare(b.institution_id)
    if (inst !== 0) return inst
    return b.academic_year.localeCompare(a.academic_year)
  })
}

export const estateRecords: EstateRecord[] = generateEstateCoverage()

export function isKnownEstateNumber(value: NullableMetric | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export function isVerifiedEstateRecord(row: EstateRecord): boolean {
  return row.source_status === 'verified' && ESTATE_VALUE_KEYS.some((key) => isKnownEstateNumber(row[key]))
}

export function getEstateRecordsByInstitution(id: string): EstateRecord[] {
  return estateRecords
    .filter((row) => row.institution_id === id)
    .sort((a, b) => b.academic_year.localeCompare(a.academic_year))
}

export function getLatestEstate(id: string): EstateRecord | undefined {
  return getEstateRecordsByInstitution(id)[0]
}

export function formatEstateValue(value: NullableMetric | undefined, unit = ''): string {
  if (!isKnownEstateNumber(value)) return 'Pending'
  return `${value.toLocaleString()}${unit}`
}

export function getEstateCoverage(year: EstateYear = ESTATE_YEARS[0]) {
  const rows = estateRecords.filter((row) => row.academic_year === year)
  const verified = rows.filter(isVerifiedEstateRecord)
  return {
    academic_year: year,
    total_institutions: rows.length,
    verified: verified.length,
    pending: rows.length - verified.length,
    included_in_aggregates: rows.filter((row) => row.included_in_aggregates).length,
  }
}
