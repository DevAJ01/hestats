import { institutions } from './institutions'
import { verifiedStudentEnrolmentRecords } from './generated/studentRecords'

export const STUDENT_YEARS = ['2024-25'] as const
export type StudentYear = (typeof STUDENT_YEARS)[number]

export const HESA_STUDENT_FIGURE7_URL = 'https://www.hesa.ac.uk/data-and-analysis/sb273/figure-7.csv'
export const HESA_STUDENT_FIGURE7_RESOURCE_URL = 'https://ckan.publishing.service.gov.uk/dataset/higher-education-student-statistics-uk-2024-25/resource/b384f0c7-8072-43a9-8154-367f06806cf4'

export type StudentSourceStatus = 'verified' | 'pending'
export type StudentConfidence = 'high' | 'awaiting'

export interface StudentEnrolmentRecord {
  institution_id: string
  ukprn: string | null
  academic_year: StudentYear
  total_enrolments: number | null
  uk_enrolments: number | null
  non_uk_enrolments: number | null
  unknown_domicile_enrolments: number | null
  source_status: StudentSourceStatus
  source_id: 'hesa-students'
  source_url: string
  source_reference: string
  retrieved_date: string
  last_verified: string
  confidence: StudentConfidence
  included_in_aggregates: boolean
  notes?: string
}

const SOURCE_REFERENCE = 'Figure 7 - HE student enrolments by HE provider and permanent address 2024/25'
const DEFAULT_RETRIEVED_DATE = '2026-07-01'

function pendingStudentRow(institution_id: string, ukprn: string | null, academic_year: StudentYear): StudentEnrolmentRecord {
  return {
    institution_id,
    ukprn,
    academic_year,
    total_enrolments: null,
    uk_enrolments: null,
    non_uk_enrolments: null,
    unknown_domicile_enrolments: null,
    source_status: 'pending',
    source_id: 'hesa-students',
    source_url: HESA_STUDENT_FIGURE7_RESOURCE_URL,
    source_reference: SOURCE_REFERENCE,
    retrieved_date: DEFAULT_RETRIEVED_DATE,
    last_verified: DEFAULT_RETRIEVED_DATE,
    confidence: 'awaiting',
    included_in_aggregates: false,
    notes: 'Awaiting source row from the official HESA Student Statistics Figure 7 CSV.',
  }
}

function generateStudentCoverage(): StudentEnrolmentRecord[] {
  const byKey = new Map<string, StudentEnrolmentRecord>()

  for (const institution of institutions) {
    for (const year of STUDENT_YEARS) {
      const row = pendingStudentRow(institution.id, institution.ukprn, year)
      byKey.set(`${row.institution_id}:${row.academic_year}`, row)
    }
  }

  for (const row of verifiedStudentEnrolmentRecords) {
    byKey.set(`${row.institution_id}:${row.academic_year}`, row)
  }

  return [...byKey.values()].sort((a, b) => {
    const inst = a.institution_id.localeCompare(b.institution_id)
    if (inst !== 0) return inst
    return b.academic_year.localeCompare(a.academic_year)
  })
}

export const studentEnrolments: StudentEnrolmentRecord[] = generateStudentCoverage()

export function isKnownStudentNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export function isVerifiedStudentRecord(row: StudentEnrolmentRecord): boolean {
  return row.source_status === 'verified' && isKnownStudentNumber(row.total_enrolments)
}

export function getStudentEnrolmentsByInstitution(id: string): StudentEnrolmentRecord[] {
  return studentEnrolments
    .filter((row) => row.institution_id === id)
    .sort((a, b) => b.academic_year.localeCompare(a.academic_year))
}

export function getLatestStudentEnrolment(id: string): StudentEnrolmentRecord | undefined {
  return getStudentEnrolmentsByInstitution(id)[0]
}

export function formatStudentCount(value: number | null | undefined): string {
  return isKnownStudentNumber(value) ? value.toLocaleString() : 'Pending'
}

export function getStudentCoverage(year: StudentYear = STUDENT_YEARS[0]) {
  const rows = studentEnrolments.filter((row) => row.academic_year === year)
  const verified = rows.filter(isVerifiedStudentRecord)
  return {
    academic_year: year,
    total_institutions: rows.length,
    verified: verified.length,
    pending: rows.length - verified.length,
    included_in_aggregates: rows.filter((row) => row.included_in_aggregates).length,
  }
}
