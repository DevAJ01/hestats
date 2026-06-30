import { FinancialYear } from './types'
import { financials, getAllLatestFinancials } from './financials'

export interface HealthScore {
  score: number
  grade: string
  components: {
    liquidity: number
    surplusMargin: number
    borrowingBurden: number
    cashCover: number
    incomeDiversity: number
    researchIntensity: number
  }
}

function clamp(v: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, v))
}

function normalise(v: number, low: number, high: number): number {
  if (high === low) return 50
  return clamp(((v - low) / (high - low)) * 100)
}

// Score each component 0–100 using domain-calibrated benchmarks
function scoreLiquidity(days: number): number {
  // <30d = 0, 30-90d = 30-60, 90-180d = 60-85, >180d = 85-100
  if (days <= 0) return 0
  if (days < 30) return normalise(days, 0, 30) * 0.3
  if (days < 90) return 30 + normalise(days, 30, 90) * 30
  if (days < 180) return 60 + normalise(days, 90, 180) * 25
  return clamp(85 + normalise(days, 180, 365) * 15)
}

function scoreSurplusMargin(pct: number): number {
  // <-5% = 0, -5 to 0 = 0-25, 0 to 5 = 25-65, 5-10 = 65-85, >10 = 85-100
  if (pct < -10) return 0
  if (pct < -5) return normalise(pct, -10, -5) * 10
  if (pct < 0) return 10 + normalise(pct, -5, 0) * 15
  if (pct < 5) return 25 + normalise(pct, 0, 5) * 40
  if (pct < 10) return 65 + normalise(pct, 5, 10) * 20
  return clamp(85 + normalise(pct, 10, 20) * 15)
}

function scoreBorrowingBurden(ratio: number): number {
  // ratio = borrowing / revenue; lower is better
  // 0 = 100, 0.5 = 60, 1.0 = 30, >2.0 = 0
  if (ratio <= 0) return 100
  if (ratio < 0.25) return 100 - normalise(ratio, 0, 0.25) * 20
  if (ratio < 0.75) return 80 - normalise(ratio, 0.25, 0.75) * 30
  if (ratio < 1.5) return 50 - normalise(ratio, 0.75, 1.5) * 30
  return clamp(20 - normalise(ratio, 1.5, 3.0) * 20)
}

function scoreCashCover(ratio: number): number {
  // ratio = cash / total_expenditure; 0 = 0, 0.1 = 40, 0.2 = 70, >0.3 = 85-100
  if (ratio <= 0) return 0
  if (ratio < 0.05) return normalise(ratio, 0, 0.05) * 25
  if (ratio < 0.15) return 25 + normalise(ratio, 0.05, 0.15) * 30
  if (ratio < 0.25) return 55 + normalise(ratio, 0.15, 0.25) * 25
  return clamp(80 + normalise(ratio, 0.25, 0.5) * 20)
}

function scoreIncomeDiversity(tuitionRatio: number): number {
  // tuitionRatio = tuition / revenue; lower is better (more diversified)
  // 0.9+ = 0, 0.7 = 30, 0.5 = 60, <0.3 = 85-100
  const diversity = 1 - tuitionRatio
  if (diversity <= 0.1) return normalise(diversity, 0, 0.1) * 10
  if (diversity < 0.3) return 10 + normalise(diversity, 0.1, 0.3) * 30
  if (diversity < 0.5) return 40 + normalise(diversity, 0.3, 0.5) * 30
  return clamp(70 + normalise(diversity, 0.5, 0.8) * 30)
}

function scoreResearchIntensity(ratio: number): number {
  // ratio = research / revenue; 0 = 0, 0.1 = 40, 0.25 = 70, >0.4 = 85-100
  if (ratio <= 0) return 0
  if (ratio < 0.05) return normalise(ratio, 0, 0.05) * 25
  if (ratio < 0.15) return 25 + normalise(ratio, 0.05, 0.15) * 30
  if (ratio < 0.3) return 55 + normalise(ratio, 0.15, 0.3) * 25
  return clamp(80 + normalise(ratio, 0.3, 0.5) * 20)
}

export function computeHealthScore(fin: FinancialYear): HealthScore {
  const borrowingRatio = fin.revenue_gbp_m > 0 ? fin.borrowing_gbp_m / fin.revenue_gbp_m : 0
  const cashCoverRatio = fin.total_expenditure_gbp_m > 0 ? fin.cash_gbp_m / fin.total_expenditure_gbp_m : 0
  const tuitionRatio = fin.revenue_gbp_m > 0 ? fin.tuition_fee_income_gbp_m / fin.revenue_gbp_m : 0
  const researchRatio = fin.revenue_gbp_m > 0 ? fin.research_income_gbp_m / fin.revenue_gbp_m : 0

  const components = {
    liquidity: Math.round(scoreLiquidity(fin.liquidity_days)),
    surplusMargin: Math.round(scoreSurplusMargin(fin.surplus_margin_pct)),
    borrowingBurden: Math.round(scoreBorrowingBurden(borrowingRatio)),
    cashCover: Math.round(scoreCashCover(cashCoverRatio)),
    incomeDiversity: Math.round(scoreIncomeDiversity(tuitionRatio)),
    researchIntensity: Math.round(scoreResearchIntensity(researchRatio)),
  }

  const score = Math.round(
    components.liquidity * 0.25 +
    components.surplusMargin * 0.20 +
    components.borrowingBurden * 0.20 +
    components.cashCover * 0.15 +
    components.incomeDiversity * 0.10 +
    components.researchIntensity * 0.10,
  )

  return { score, grade: scoreToGrade(score), components }
}

export function scoreToGrade(score: number): string {
  if (score >= 85) return 'AAA'
  if (score >= 75) return 'AA'
  if (score >= 65) return 'A'
  if (score >= 55) return 'BBB'
  if (score >= 45) return 'BB'
  if (score >= 35) return 'B'
  return 'CCC'
}

export function getGradeColor(grade: string): string {
  if (grade === 'AAA' || grade === 'AA') return 'var(--positive)'
  if (grade === 'A' || grade === 'BBB') return 'var(--warning)'
  return 'var(--negative)'
}

export function getGradeBg(grade: string): string {
  if (grade === 'AAA' || grade === 'AA') return 'var(--positive-bg)'
  if (grade === 'A' || grade === 'BBB') return 'var(--warning-bg)'
  return 'var(--negative-bg)'
}

/** Returns health score for every institution's latest financials */
export function getAllHealthScores(): { institution_id: string; score: number; grade: string }[] {
  return getAllLatestFinancials().map((fin) => {
    const { score, grade } = computeHealthScore(fin)
    return { institution_id: fin.institution_id, score, grade }
  })
}

/** Sector average health score */
export function getSectorAverageScore(): number {
  const scores = getAllHealthScores().map((h) => h.score)
  if (!scores.length) return 0
  return Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
}
