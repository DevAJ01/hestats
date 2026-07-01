import { FinancialYear } from './types'

export type DataConfidence = 'verified' | 'pending'
export type ProvenanceConfidence = 'high' | 'medium' | 'provisional' | 'awaiting'
export type DataQualitySeverity = 'error' | 'warning'

export interface SourceDocument {
  id: string
  institution_id: string
  fiscal_year: string
  title: string
  publisher: string
  source_url: string
  retrieved_date: string
  confidence: ProvenanceConfidence
  source_page?: string
}

export interface MetricProvenance {
  institution_id: string
  fiscal_year: string
  metric: keyof FinancialYear
  source_document_id: string
  confidence: ProvenanceConfidence
  extraction_note?: string
}

export interface DatasetVersion {
  id: string
  label: string
  generated_at: string
  fiscal_years: string[]
  record_count: number
  verified_record_count: number
  pending_record_count: number
}

export interface DataQualityIssue {
  severity: DataQualitySeverity
  code: string
  message: string
  institution_id?: string
  fiscal_year?: string
}

export const PENDING_UKPRN_PREFIX = 'PENDING-'

export function isPendingUkprn(ukprn: string): boolean {
  return ukprn.startsWith(PENDING_UKPRN_PREFIX)
}

export function isOfficialUkprn(ukprn: string | null | undefined): boolean {
  return typeof ukprn === 'string' && /^100\d{5}$/.test(ukprn)
}
