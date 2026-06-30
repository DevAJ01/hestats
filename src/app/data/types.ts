export interface Institution {
  id: string
  canonical_name: string
  short_name: string
  ukprn: string
  nation: 'England' | 'Scotland' | 'Wales' | 'Northern Ireland'
  official_website: string
  logo_initial: string
  founded: number
  mission_group?: string
  city: string
}

export interface FinancialYear {
  institution_id: string
  fiscal_year: string
  published: string
  revenue_gbp_m: number
  surplus_gbp_m: number
  surplus_margin_pct: number
  research_income_gbp_m: number
  tuition_fee_income_gbp_m: number
  other_income_gbp_m: number
  staff_costs_gbp_m: number
  total_expenditure_gbp_m: number
  cash_gbp_m: number
  borrowing_gbp_m: number
  liquidity_days: number
  international_fte_pct: number
  student_fte_total: number
  capital_expenditure_gbp_m: number
  net_assets_gbp_m: number
  risk_flag: 'Low' | 'Medium' | 'High'
  source_pdf?: string
  source_page?: string
  status: 'found' | 'archived' | 'missing'
  data_source: 'verified' | 'estimated' | 'pending'
}

export type MetricKey = keyof Pick<
  FinancialYear,
  | 'revenue_gbp_m'
  | 'surplus_gbp_m'
  | 'surplus_margin_pct'
  | 'research_income_gbp_m'
  | 'tuition_fee_income_gbp_m'
  | 'staff_costs_gbp_m'
  | 'cash_gbp_m'
  | 'borrowing_gbp_m'
  | 'liquidity_days'
  | 'international_fte_pct'
>

export interface MetricMeta {
  label: string
  unit: string
  description: string
  higherIsBetter: boolean
}

export const METRIC_META: Record<MetricKey, MetricMeta> = {
  revenue_gbp_m: { label: 'Total Income', unit: '£m', description: 'Total consolidated income', higherIsBetter: true },
  surplus_gbp_m: { label: 'Surplus', unit: '£m', description: 'Operating surplus / (deficit)', higherIsBetter: true },
  surplus_margin_pct: { label: 'Surplus Margin', unit: '%', description: 'Surplus as % of total income', higherIsBetter: true },
  research_income_gbp_m: { label: 'Research Income', unit: '£m', description: 'Research grants and contracts income', higherIsBetter: true },
  tuition_fee_income_gbp_m: { label: 'Tuition Fees', unit: '£m', description: 'Tuition fee and education contract income', higherIsBetter: true },
  staff_costs_gbp_m: { label: 'Staff Costs', unit: '£m', description: 'Total staff costs including pension charges', higherIsBetter: false },
  cash_gbp_m: { label: 'Cash & Equivalents', unit: '£m', description: 'Cash and cash equivalents on balance sheet', higherIsBetter: true },
  borrowing_gbp_m: { label: 'External Borrowing', unit: '£m', description: 'Total long and short-term external borrowing', higherIsBetter: false },
  liquidity_days: { label: 'Liquidity Days', unit: 'days', description: 'Days of operating expenditure covered by liquid assets', higherIsBetter: true },
  international_fte_pct: { label: 'Intl. Student %', unit: '%', description: 'International students as % of total FTE', higherIsBetter: true },
}
