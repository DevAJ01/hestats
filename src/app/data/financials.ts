import { institutions } from './institutions'
import { FinancialYear, MetricKey } from './types'
import { verifiedFinancialRecords } from './generated/financialRecords'

// Official coverage target: ten fiscal years, newest first.
export const AVAILABLE_YEARS = [
  '2024-25', '2023-24', '2022-23', '2021-22', '2020-21',
  '2019-20', '2018-19', '2017-18', '2016-17', '2015-16',
]

export const FINANCIAL_METRIC_KEYS: MetricKey[] = [
  'revenue_gbp_m',
  'surplus_gbp_m',
  'surplus_margin_pct',
  'research_income_gbp_m',
  'tuition_fee_income_gbp_m',
  'staff_costs_gbp_m',
  'cash_gbp_m',
  'borrowing_gbp_m',
  'liquidity_days',
  'international_fte_pct',
]

export const ALL_FINANCIAL_VALUE_KEYS = [
  ...FINANCIAL_METRIC_KEYS,
  'other_income_gbp_m',
  'total_expenditure_gbp_m',
  'student_fte_total',
  'capital_expenditure_gbp_m',
  'net_assets_gbp_m',
] as const

export type FinancialValueKey = (typeof ALL_FINANCIAL_VALUE_KEYS)[number]

function pendingFinancialYear(institution_id: string, fiscal_year: string): FinancialYear {
  return {
    institution_id,
    fiscal_year,
    published: '',
    revenue_gbp_m: null,
    surplus_gbp_m: null,
    surplus_margin_pct: null,
    research_income_gbp_m: null,
    tuition_fee_income_gbp_m: null,
    other_income_gbp_m: null,
    staff_costs_gbp_m: null,
    total_expenditure_gbp_m: null,
    cash_gbp_m: null,
    borrowing_gbp_m: null,
    liquidity_days: null,
    international_fte_pct: null,
    student_fte_total: null,
    capital_expenditure_gbp_m: null,
    net_assets_gbp_m: null,
    risk_flag: 'Pending',
    status: 'missing',
    data_source: 'pending',
    confidence: 'awaiting',
    included_in_aggregates: false,
  }
}

// The official primary dataset deliberately contains no modelled estimates.
// Populate verified rows only from official source extracts with metric-level
// provenance. Until those extracts are available, each institution/year is kept
// as an explicit pending row so the decade coverage matrix is complete without
// inventing numbers.
const verifiedRecords: FinancialYear[] = verifiedFinancialRecords

function generateFinancialCoverage(): FinancialYear[] {
  const byKey = new Map<string, FinancialYear>()

  for (const institution of institutions) {
    for (const year of AVAILABLE_YEARS) {
      const row = pendingFinancialYear(institution.id, year)
      byKey.set(`${row.institution_id}:${row.fiscal_year}`, row)
    }
  }

  for (const row of verifiedRecords) {
    byKey.set(`${row.institution_id}:${row.fiscal_year}`, row)
  }

  return [...byKey.values()].sort((a, b) => {
    const inst = a.institution_id.localeCompare(b.institution_id)
    if (inst !== 0) return inst
    return b.fiscal_year.localeCompare(a.fiscal_year)
  })
}

export const financials: FinancialYear[] = generateFinancialCoverage()

export function isKnownNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export function roundNullable(value: number | null | undefined, digits = 0): number | null {
  if (!isKnownNumber(value)) return null
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

export function ratioPct(numerator: number | null | undefined, denominator: number | null | undefined, digits = 1): number | null {
  if (!isKnownNumber(numerator) || !isKnownNumber(denominator) || denominator === 0) return null
  return roundNullable((numerator / denominator) * 100, digits)
}

export function sumKnown(rows: FinancialYear[], key: FinancialValueKey): number | null {
  const values = rows.map((row) => row[key]).filter(isKnownNumber)
  if (!values.length) return null
  return values.reduce((sum, value) => sum + value, 0)
}

export function averageKnown(rows: FinancialYear[], key: FinancialValueKey): number | null {
  const values = rows.map((row) => row[key]).filter(isKnownNumber)
  if (!values.length) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function compareNullableDesc(a: number | null | undefined, b: number | null | undefined): number {
  const aKnown = isKnownNumber(a)
  const bKnown = isKnownNumber(b)
  if (aKnown && bKnown) return b - a
  if (aKnown) return -1
  if (bKnown) return 1
  return 0
}

export function compareNullableAsc(a: number | null | undefined, b: number | null | undefined): number {
  const aKnown = isKnownNumber(a)
  const bKnown = isKnownNumber(b)
  if (aKnown && bKnown) return a - b
  if (aKnown) return -1
  if (bKnown) return 1
  return 0
}

export function hasFinancialMetric(row: FinancialYear, key: FinancialValueKey): boolean {
  return isKnownNumber(row[key])
}

export function hasAnyFinancialValue(row: FinancialYear): boolean {
  return ALL_FINANCIAL_VALUE_KEYS.some((key) => hasFinancialMetric(row, key))
}

export function isVerifiedFinancial(row: FinancialYear): boolean {
  return row.data_source === 'verified' && hasAnyFinancialValue(row)
}

export function isAggregateEligible(row: FinancialYear): boolean {
  return row.included_in_aggregates && row.data_source === 'verified' && hasAnyFinancialValue(row)
}

export function formatCurrencyM(value: number | null | undefined): string {
  return isKnownNumber(value) ? `£${value.toLocaleString()}m` : 'Pending'
}

export function formatPct(value: number | null | undefined): string {
  return isKnownNumber(value) ? `${value >= 0 ? '+' : ''}${value.toFixed(1)}%` : 'Pending'
}

export function formatDays(value: number | null | undefined): string {
  return isKnownNumber(value) ? `${value}d` : 'Pending'
}

export function formatNumber(value: number | null | undefined): string {
  return isKnownNumber(value) ? value.toLocaleString() : 'Pending'
}

// Public API
export function getFinancialsByInstitution(id: string): FinancialYear[] {
  return financials
    .filter((f) => f.institution_id === id)
    .sort((a, b) => b.fiscal_year.localeCompare(a.fiscal_year))
}

export function getLatestFinancial(id: string): FinancialYear | undefined {
  return getFinancialsByInstitution(id)[0]
}

export function getLatestVerifiedFinancial(id: string): FinancialYear | undefined {
  return getFinancialsByInstitution(id).find(isVerifiedFinancial)
}

export function getAllLatestFinancials(): FinancialYear[] {
  const latest = new Map<string, FinancialYear>()
  for (const f of financials) {
    const existing = latest.get(f.institution_id)
    if (!existing || f.fiscal_year > existing.fiscal_year) latest.set(f.institution_id, f)
  }
  return Array.from(latest.values())
}

export function getAggregateEligibleFinancials(year?: string): FinancialYear[] {
  return financials.filter((f) => (!year || f.fiscal_year === year) && isAggregateEligible(f))
}
