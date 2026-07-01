import { AVAILABLE_YEARS, financials, hasAnyFinancialValue } from './financials'
import { providerUniverse } from './providers'
import { getProvenance } from './sources'

export type ProviderFinanceSourceStatus = 'verified' | 'pending'

export interface ProviderFinanceCoverageRecord {
  provider_id: string
  institution_id: string | null
  ukprn: string | null
  canonical_name: string
  fiscal_year: string
  source_status: ProviderFinanceSourceStatus
  verified_metric_count: number
  has_any_value: boolean
  included_in_aggregates: boolean
  source_id: string
  source_url: string
  source_reference: string
  retrieved_date: string
  last_verified: string
  confidence: 'high' | 'awaiting'
  notes: string
}

const FINANCIAL_METRIC_KEYS = [
  'revenue_gbp_m',
  'surplus_gbp_m',
  'surplus_margin_pct',
  'research_income_gbp_m',
  'tuition_fee_income_gbp_m',
  'other_income_gbp_m',
  'staff_costs_gbp_m',
  'total_expenditure_gbp_m',
  'cash_gbp_m',
  'borrowing_gbp_m',
  'liquidity_days',
  'international_fte_pct',
  'student_fte_total',
  'capital_expenditure_gbp_m',
  'net_assets_gbp_m',
] as const

const DEFAULT_SOURCE_URL = 'https://www.hesa.ac.uk/news/14-05-2026/he-provider-data-finance-release-2-202425'
const DEFAULT_RETRIEVED_DATE = '2026-07-01'

const financialByKey = new Map(financials.map((row) => [`${row.institution_id}:${row.fiscal_year}`, row]))

function metricCount(row: (typeof financials)[number]) {
  return FINANCIAL_METRIC_KEYS.filter((metric) => row[metric] !== null).length
}

export const providerFinanceCoverage: ProviderFinanceCoverageRecord[] = providerUniverse.flatMap((provider) =>
  AVAILABLE_YEARS.map((year) => {
    const financial = provider.institution_id ? financialByKey.get(`${provider.institution_id}:${year}`) : undefined
    const provenance = financial ? getProvenance(financial.institution_id, financial.fiscal_year) : undefined
    const verified = Boolean(financial && financial.data_source === 'verified' && hasAnyFinancialValue(financial))

    return {
      provider_id: provider.provider_id,
      institution_id: provider.institution_id,
      ukprn: provider.ukprn,
      canonical_name: provider.canonical_name,
      fiscal_year: year,
      source_status: verified ? 'verified' : 'pending',
      verified_metric_count: verified && financial ? metricCount(financial) : 0,
      has_any_value: verified,
      included_in_aggregates: verified && Boolean(financial?.included_in_aggregates),
      source_id: verified && provenance ? provenance.source_id : 'hesa-finance',
      source_url: verified && provenance ? provenance.source_url : DEFAULT_SOURCE_URL,
      source_reference: verified && provenance
        ? provenance.page_reference ?? 'HESA Finance Open Data'
        : 'Coverage row created from the HESA 2024/25 finance release scope; metrics remain null until source rows are reconciled.',
      retrieved_date: verified && provenance ? provenance.retrieved_date : DEFAULT_RETRIEVED_DATE,
      last_verified: verified && provenance ? provenance.last_verified : DEFAULT_RETRIEVED_DATE,
      confidence: verified ? 'high' : 'awaiting',
      notes: verified
        ? 'Provider financial metrics are present in the primary verified financial dataset.'
        : 'No verified provider-level finance values are attached for this provider-year. Values must stay null/pending.',
    }
  }),
)

export function getProviderFinanceCoverageSummary(year = AVAILABLE_YEARS[0]) {
  const rows = providerFinanceCoverage.filter((row) => row.fiscal_year === year)
  return {
    fiscal_year: year,
    total_provider_rows: rows.length,
    verified: rows.filter((row) => row.source_status === 'verified').length,
    pending: rows.filter((row) => row.source_status === 'pending').length,
    included_in_aggregates: rows.filter((row) => row.included_in_aggregates).length,
  }
}
