import { getAggregateEligibleFinancials, isKnownNumber } from './financials'
import { HESA_GRADUATE_OUTCOMES_HEADLINE } from './outcomes'

export type SystemRiskLevel = 'Stable' | 'Guarded' | 'Severe' | 'Critical'

export interface SystemRiskIndicator {
  id: 'finance' | 'graduate-employment' | 'labour-demand' | 'recruitment-exposure'
  label: string
  score: number
  level: SystemRiskLevel
  period: string
  summary: string
  signals: Array<{ label: string; value: string; direction: 'positive' | 'neutral' | 'negative' }>
  source_name: string
  source_url: string
  methodology: string
}

export interface SystemRiskSnapshot {
  score: number
  level: SystemRiskLevel
  as_of: string
  fiscal_period: string
  indicators: SystemRiskIndicator[]
  coverage: {
    verified_finance_providers: number
    finance_provider_rows: number
    graduate_outcomes_period: string
    external_signal_date: string
  }
  caveat: string
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value))
}

function round(value: number, digits = 0) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

export function systemRiskLevel(score: number): SystemRiskLevel {
  if (score < 30) return 'Stable'
  if (score < 55) return 'Guarded'
  if (score < 75) return 'Severe'
  return 'Critical'
}

function pct(part: number, whole: number) {
  return whole > 0 ? (part / whole) * 100 : 0
}

export function buildSystemRiskSnapshot(): SystemRiskSnapshot {
  const financeRows = getAggregateEligibleFinancials('2024-25')
  const deficitShare = pct(
    financeRows.filter((row) => isKnownNumber(row.surplus_margin_pct) && row.surplus_margin_pct < 0).length,
    financeRows.filter((row) => isKnownNumber(row.surplus_margin_pct)).length,
  )
  const lowLiquidityShare = pct(
    financeRows.filter((row) => isKnownNumber(row.liquidity_days) && row.liquidity_days < 30).length,
    financeRows.filter((row) => isKnownNumber(row.liquidity_days)).length,
  )
  const tuitionExposedShare = pct(
    financeRows.filter((row) => (
      isKnownNumber(row.tuition_fee_income_gbp_m) &&
      isKnownNumber(row.revenue_gbp_m) &&
      row.revenue_gbp_m > 0 &&
      row.tuition_fee_income_gbp_m / row.revenue_gbp_m >= 0.7
    )).length,
    financeRows.filter((row) => (
      isKnownNumber(row.tuition_fee_income_gbp_m) &&
      isKnownNumber(row.revenue_gbp_m) &&
      row.revenue_gbp_m > 0
    )).length,
  )

  const financeScore = round((
    clamp((deficitShare / 50) * 100) +
    clamp((lowLiquidityShare / 25) * 100)
  ) / 2)
  const graduateEmploymentScore = round((
    clamp(((90 - HESA_GRADUATE_OUTCOMES_HEADLINE.work_or_further_study_pct) / 10) * 100) +
    clamp((HESA_GRADUATE_OUTCOMES_HEADLINE.unemployment_pct / 10) * 100)
  ) / 2)
  const labourDemandScore = round((
    clamp((2.5 / 10) * 100) +
    clamp(((2.5 - 1) / 2) * 100)
  ) / 2)
  const recruitmentExposureScore = round(clamp((tuitionExposedShare / 60) * 100))

  const indicators: SystemRiskIndicator[] = [
    {
      id: 'finance',
      label: 'Institution finances',
      score: financeScore,
      level: systemRiskLevel(financeScore),
      period: 'FY 2024-25',
      summary: 'Provider deficits and very low cash cover are combined into a comparable pressure score.',
      signals: [
        { label: 'Providers in deficit', value: `${round(deficitShare, 1)}%`, direction: deficitShare >= 35 ? 'negative' : 'neutral' },
        { label: 'Under 30 liquidity days', value: `${round(lowLiquidityShare, 1)}%`, direction: lowLiquidityShare >= 15 ? 'negative' : 'neutral' },
        { label: 'OfS 2025-26 deficit forecast', value: '42.7%', direction: 'negative' },
      ],
      source_name: 'HEStats verified finance panel + OfS 2026 sustainability report',
      source_url: 'https://www.officeforstudents.org.uk/publications/financial-sustainability-of-higher-education-providers-in-england-2026/',
      methodology: 'Equal-weight average of deficit prevalence against a 50% critical bound and sub-30-day liquidity prevalence against a 25% critical bound. OfS forecast is displayed as external context, not added again to the score.',
    },
    {
      id: 'graduate-employment',
      label: 'Graduate employment',
      score: graduateEmploymentScore,
      level: systemRiskLevel(graduateEmploymentScore),
      period: 'Graduates 2023-24',
      summary: 'A directional indicator based on work or further study and unemployment 15 months after graduation.',
      signals: [
        { label: 'Work or further study', value: `${HESA_GRADUATE_OUTCOMES_HEADLINE.work_or_further_study_pct}%`, direction: 'neutral' },
        { label: 'Unemployed', value: `${HESA_GRADUATE_OUTCOMES_HEADLINE.unemployment_pct}%`, direction: 'negative' },
        { label: 'Full-time employment', value: `${HESA_GRADUATE_OUTCOMES_HEADLINE.full_time_employment_pct}%`, direction: 'neutral' },
      ],
      source_name: 'HESA Graduate Outcomes 2023/24',
      source_url: 'https://www.hesa.ac.uk/news/04-06-2026/sb275-higher-education-graduate-outcomes-statistics/activities',
      methodology: 'Equal-weight average of the gap below a 90% work-or-study reference and unemployment against a 10% critical reference. HESA cautions that this self-reported measure is not an LFS unemployment rate.',
    },
    {
      id: 'labour-demand',
      label: 'UK labour demand',
      score: labourDemandScore,
      level: systemRiskLevel(labourDemandScore),
      period: 'Apr-Jun 2026',
      summary: 'The national hiring backdrop combines vacancy momentum and unemployed people per vacancy.',
      signals: [
        { label: 'UK vacancies', value: '712k', direction: 'neutral' },
        { label: 'Vacancies year on year', value: '-2.5%', direction: 'negative' },
        { label: 'Unemployed per vacancy', value: '2.5', direction: 'negative' },
      ],
      source_name: 'ONS Vacancies and jobs in the UK: July 2026',
      source_url: 'https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/employmentandemployeetypes/bulletins/jobsandvacanciesintheuk/july2026',
      methodology: 'Equal-weight average of the absolute annual vacancy decline against a 10% bound and the unemployed-to-vacancy ratio on a 1-to-3 scale.',
    },
    {
      id: 'recruitment-exposure',
      label: 'Recruitment exposure',
      score: recruitmentExposureScore,
      level: systemRiskLevel(recruitmentExposureScore),
      period: 'FY 2024-25',
      summary: 'A concentration signal showing how many reporting providers receive at least 70% of income from tuition fees.',
      signals: [
        { label: 'Tuition-exposed providers', value: `${round(tuitionExposedShare, 1)}%`, direction: tuitionExposedShare >= 40 ? 'negative' : 'neutral' },
        { label: 'Exposure threshold', value: '70% of income', direction: 'neutral' },
        { label: 'Verified finance rows', value: `${financeRows.length}`, direction: 'positive' },
      ],
      source_name: 'HESA Finance 2024/25 provider records',
      source_url: 'https://www.hesa.ac.uk/data-and-analysis/finances',
      methodology: 'Share of verified providers whose tuition-fee income is at least 70% of total income, scaled to a 60% critical bound. This is concentration exposure, not a prediction of failure.',
    },
  ]

  const score = round(
    indicators.find((row) => row.id === 'finance')!.score * 0.35 +
    indicators.find((row) => row.id === 'graduate-employment')!.score * 0.25 +
    indicators.find((row) => row.id === 'labour-demand')!.score * 0.25 +
    indicators.find((row) => row.id === 'recruitment-exposure')!.score * 0.15,
  )

  return {
    score,
    level: systemRiskLevel(score),
    as_of: '2026-07-26',
    fiscal_period: '2024-25',
    indicators,
    coverage: {
      verified_finance_providers: financeRows.length,
      finance_provider_rows: financeRows.length,
      graduate_outcomes_period: HESA_GRADUATE_OUTCOMES_HEADLINE.period,
      external_signal_date: '2026-07-21',
    },
    caveat: 'This is a transparent early-warning indicator, not a credit rating, regulatory judgement or forecast of institutional failure. Each signal retains its own reporting period.',
  }
}

export const SYSTEM_RISK_SNAPSHOT = buildSystemRiskSnapshot()
