import { institutions } from './institutions'
import { verifiedTefRecords } from './generated/tefRecords'

export const TEF_ASSESSMENT_YEARS = ['2023'] as const
export type TefAssessmentYear = (typeof TEF_ASSESSMENT_YEARS)[number]

export type TefRating = 'Gold' | 'Silver' | 'Bronze' | 'Requires improvement' | null
export type TefSourceStatus = 'verified' | 'pending'
export type TefConfidence = 'high' | 'awaiting'

export interface TefRecord {
  institution_id: string
  ukprn: string | null
  assessment_year: TefAssessmentYear
  valid_academic_years: string[]
  overall_rating: TefRating
  student_experience_rating: TefRating
  student_outcomes_rating: TefRating
  source_status: TefSourceStatus
  source_id: 'ofs-tef'
  source_url: string
  source_reference: string
  retrieved_date: string
  last_verified: string
  confidence: TefConfidence
  included_in_aggregates: boolean
  notes?: string
}

export const OFS_TEF_RATINGS_URL = 'https://www.officeforstudents.org.uk/for-providers/quality-and-standards/tef-2023-ratings/'
export const OFS_TEF_DASHBOARD_URL = 'https://www.officeforstudents.org.uk/data-and-analysis/tef-data-dashboard/get-the-data/'
const DEFAULT_RETRIEVED_DATE = '2026-07-01'
const SOURCE_REFERENCE = 'OfS TEF 2023 ratings. TEF ratings are assessment ratings, not annual rankings; published ratings normally last for four years.'

function pendingTefRow(institution_id: string, ukprn: string | null): TefRecord {
  return {
    institution_id,
    ukprn,
    assessment_year: '2023',
    valid_academic_years: ['2023-24', '2024-25', '2025-26', '2026-27'],
    overall_rating: null,
    student_experience_rating: null,
    student_outcomes_rating: null,
    source_status: 'pending',
    source_id: 'ofs-tef',
    source_url: OFS_TEF_RATINGS_URL,
    source_reference: SOURCE_REFERENCE,
    retrieved_date: DEFAULT_RETRIEVED_DATE,
    last_verified: DEFAULT_RETRIEVED_DATE,
    confidence: 'awaiting',
    included_in_aggregates: false,
    notes: 'Awaiting official OfS TEF 2023 provider rating row in the internal data pipeline. No annual TEF ranking is inferred.',
  }
}

function generateTefCoverage(): TefRecord[] {
  const byKey = new Map<string, TefRecord>()

  for (const institution of institutions) {
    const row = pendingTefRow(institution.id, institution.ukprn)
    byKey.set(`${row.institution_id}:${row.assessment_year}`, row)
  }

  for (const row of verifiedTefRecords) {
    byKey.set(`${row.institution_id}:${row.assessment_year}`, row)
  }

  return [...byKey.values()].sort((a, b) => a.institution_id.localeCompare(b.institution_id))
}

export const tefRecords: TefRecord[] = generateTefCoverage()

export function isVerifiedTefRecord(row: TefRecord): boolean {
  return row.source_status === 'verified' && row.overall_rating !== null
}

export function getTefByInstitution(id: string): TefRecord | undefined {
  return tefRecords.find((row) => row.institution_id === id)
}

export function getTefCoverage() {
  const verified = tefRecords.filter(isVerifiedTefRecord)
  return {
    assessment_year: '2023',
    total_institutions: tefRecords.length,
    verified: verified.length,
    pending: tefRecords.length - verified.length,
    included_in_aggregates: tefRecords.filter((row) => row.included_in_aggregates).length,
  }
}
