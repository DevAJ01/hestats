import { institutions } from './institutions'
import { verifiedStaffRecords } from './generated/staffRecords'
import { NullableMetric } from './types'

export const STAFF_YEARS = [
  '2024-25', '2023-24', '2022-23', '2021-22', '2020-21',
  '2019-20', '2018-19', '2017-18', '2016-17', '2015-16',
] as const
export type StaffYear = (typeof STAFF_YEARS)[number]

export type StaffSourceStatus = 'verified' | 'pending'
export type StaffConfidence = 'high' | 'awaiting'

export interface StaffRecord {
  institution_id: string
  ukprn: string | null
  academic_year: StaffYear
  total_staff_fte: NullableMetric
  academic_staff_fte: NullableMetric
  non_academic_staff_fte: NullableMetric
  total_staff_headcount: NullableMetric
  academic_staff_headcount: NullableMetric
  non_academic_staff_headcount: NullableMetric
  female_staff_pct: NullableMetric
  non_uk_staff_pct: NullableMetric
  source_status: StaffSourceStatus
  source_id: 'hesa-staff'
  source_url: string
  source_reference: string
  retrieved_date: string
  last_verified: string
  confidence: StaffConfidence
  included_in_aggregates: boolean
  notes?: string
}

export const HESA_STAFF_SOURCE_URL = 'https://www.hesa.ac.uk/data-and-analysis/staff/working-in-he'
const SOURCE_REFERENCE = 'HESA Staff open data tables 2, 11 and 24 - staff by provider, employment characteristics and nationality, 2015/16 to 2024/25'
const DEFAULT_RETRIEVED_DATE = '2026-07-01'

const STAFF_NUMERIC_KEYS = [
  'total_staff_fte',
  'academic_staff_fte',
  'non_academic_staff_fte',
  'total_staff_headcount',
  'academic_staff_headcount',
  'non_academic_staff_headcount',
  'female_staff_pct',
  'non_uk_staff_pct',
] as const

export type StaffNumericKey = (typeof STAFF_NUMERIC_KEYS)[number]
export const STAFF_VALUE_KEYS: readonly StaffNumericKey[] = STAFF_NUMERIC_KEYS

function pendingStaffRow(institution_id: string, ukprn: string | null, academic_year: StaffYear): StaffRecord {
  return {
    institution_id,
    ukprn,
    academic_year,
    total_staff_fte: null,
    academic_staff_fte: null,
    non_academic_staff_fte: null,
    total_staff_headcount: null,
    academic_staff_headcount: null,
    non_academic_staff_headcount: null,
    female_staff_pct: null,
    non_uk_staff_pct: null,
    source_status: 'pending',
    source_id: 'hesa-staff',
    source_url: HESA_STAFF_SOURCE_URL,
    source_reference: SOURCE_REFERENCE,
    retrieved_date: DEFAULT_RETRIEVED_DATE,
    last_verified: DEFAULT_RETRIEVED_DATE,
    confidence: 'awaiting',
    included_in_aggregates: false,
    notes: 'Awaiting official HESA Staff provider-level source rows in the internal data pipeline.',
  }
}

function generateStaffCoverage(): StaffRecord[] {
  const byKey = new Map<string, StaffRecord>()

  for (const institution of institutions) {
    for (const year of STAFF_YEARS) {
      const row = pendingStaffRow(institution.id, institution.ukprn, year)
      byKey.set(`${row.institution_id}:${row.academic_year}`, row)
    }
  }

  for (const row of verifiedStaffRecords) {
    byKey.set(`${row.institution_id}:${row.academic_year}`, row)
  }

  return [...byKey.values()].sort((a, b) => {
    const inst = a.institution_id.localeCompare(b.institution_id)
    if (inst !== 0) return inst
    return b.academic_year.localeCompare(a.academic_year)
  })
}

export const staffRecords: StaffRecord[] = generateStaffCoverage()

export function isKnownStaffNumber(value: NullableMetric | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export function isVerifiedStaffRecord(row: StaffRecord): boolean {
  return row.source_status === 'verified' && STAFF_VALUE_KEYS.some((key) => isKnownStaffNumber(row[key]))
}

export function getStaffByInstitution(id: string): StaffRecord[] {
  return staffRecords
    .filter((row) => row.institution_id === id)
    .sort((a, b) => b.academic_year.localeCompare(a.academic_year))
}

export function getLatestStaff(id: string): StaffRecord | undefined {
  return getStaffByInstitution(id)[0]
}

export function formatStaffValue(value: NullableMetric | undefined, unit = ''): string {
  if (!isKnownStaffNumber(value)) return 'Pending'
  return `${value.toLocaleString()}${unit}`
}

export function getStaffCoverage(year: StaffYear = STAFF_YEARS[0]) {
  const rows = staffRecords.filter((row) => row.academic_year === year)
  const verified = rows.filter(isVerifiedStaffRecord)
  return {
    academic_year: year,
    total_institutions: rows.length,
    verified: verified.length,
    pending: rows.length - verified.length,
    included_in_aggregates: rows.filter((row) => row.included_in_aggregates).length,
  }
}
