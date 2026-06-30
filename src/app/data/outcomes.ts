import { institutions } from './institutions'
import { getAllLatestFinancials } from './financials'
import { computeHealthScore } from './health'

export interface GraduateOutcome {
  institution_id: string
  employment_rate_15mo: number       // % in employment or further study 15 months after graduation
  graduate_role_pct: number          // % in graduate-level roles
  unemployed_pct: number             // % unemployed
  further_study_pct: number          // % pursuing postgraduate study
  self_employed_pct: number          // % self-employed / freelance
  business_starts_pct: number        // % starting businesses
  working_internationally_pct: number
  avg_salary_k: number               // £k avg 15 months after graduation
  median_salary_k: number
  salary_1yr_k: number               // median salary 1 year post-graduation
  salary_3yr_k: number
  salary_5yr_k: number
  avg_months_to_job: number          // average months to first graduate job
  nss_overall_pct: number            // NSS overall satisfaction
  tef_rating: 'Gold' | 'Silver' | 'Bronze'
  placement_participation_pct: number
  placement_employment_boost_pp: number  // extra employment pp for placement students
  placement_salary_boost_k: number       // extra salary for placement graduates
}

export interface SectorOutcomeSummary {
  avg_employment_rate: number
  avg_graduate_role_pct: number
  avg_unemployed_pct: number
  avg_further_study_pct: number
  avg_salary_k: number
  avg_median_salary_k: number
  avg_months_to_job: number
  avg_nss: number
  total_graduates_annually: number
}

// ─── Tier baselines (employment rate, salary) ──────────────────────────────────
const TIER_BASELINES: Record<string, { emp: number; salary: number; graduate_role: number; nss: number; placement: number }> = {
  'Russell Group':      { emp: 93, salary: 32, graduate_role: 79, nss: 85, placement: 24 },
  'University Alliance':{ emp: 89, salary: 28, graduate_role: 71, nss: 83, placement: 31 },
  'MillionPlus':        { emp: 87, salary: 26, graduate_role: 64, nss: 80, placement: 28 },
  'GuildHE':            { emp: 88, salary: 27, graduate_role: 68, nss: 82, placement: 22 },
  'default':            { emp: 88, salary: 27, graduate_role: 67, nss: 81, placement: 26 },
}

function seed(id: string): number {
  return id.split('').reduce((s, c) => s + c.charCodeAt(0), 0)
}

function rng(s: number, min: number, max: number, offset = 0): number {
  return min + ((s + offset * 97) % (Math.round((max - min) * 100) + 1)) / 100
}

function rngInt(s: number, min: number, max: number, offset = 0): number {
  return Math.round(rng(s, min, max, offset))
}

// Generate outcomes for all institutions
function generateOutcomes(): Map<string, GraduateOutcome> {
  const map = new Map<string, GraduateOutcome>()
  const fins = getAllLatestFinancials()
  const finMap = new Map(fins.map((f) => [f.institution_id, f]))

  for (const inst of institutions) {
    const s = seed(inst.id)
    const fin = finMap.get(inst.id)
    const healthScore = fin ? computeHealthScore(fin).score : 55
    const tier = TIER_BASELINES[inst.mission_group ?? 'default'] ?? TIER_BASELINES.default

    // Health bonus: each 10 points above 50 → +0.5pp employment, +£0.5k salary
    const healthBonus = Math.max(0, (healthScore - 50) / 10)

    const emp = Math.min(98, Math.round(tier.emp + healthBonus * 0.5 + rng(s, -3, 3, 1)))
    const further = rngInt(s, 10, 22, 2)
    const unemployed = Math.max(1, Math.round(100 - emp - further - rngInt(s, 2, 5, 3)))
    const grad_role = Math.min(emp - 2, Math.round(tier.graduate_role + healthBonus * 0.3 + rng(s, -4, 4, 4)))
    const self_emp = rngInt(s, 3, 9, 5)
    const biz = rngInt(s, 1, 4, 6)
    const intl = Math.min(15, rngInt(s, 3, 14, 7))

    const salary = +(tier.salary + healthBonus * 0.5 + rng(s, -2, 4, 8)).toFixed(1)
    const median = +(salary * rng(s, 0.88, 0.96, 9)).toFixed(1)

    const tef_val = (s + 11) % 3
    const tef: GraduateOutcome['tef_rating'] = tef_val === 0 ? 'Gold' : tef_val === 1 ? 'Silver' : 'Bronze'

    const placement_pct = Math.round(tier.placement + rng(s, -8, 12, 10))
    const placement_emp_boost = +(rng(s, 4, 12, 11)).toFixed(1)
    const placement_sal_boost = +(rng(s, 1.5, 4.5, 12)).toFixed(1)

    map.set(inst.id, {
      institution_id: inst.id,
      employment_rate_15mo: emp,
      graduate_role_pct: grad_role,
      unemployed_pct: Math.max(1, unemployed),
      further_study_pct: further,
      self_employed_pct: self_emp,
      business_starts_pct: biz,
      working_internationally_pct: intl,
      avg_salary_k: salary,
      median_salary_k: median,
      salary_1yr_k: +(median * 0.92).toFixed(1),
      salary_3yr_k: +(median * 1.18).toFixed(1),
      salary_5yr_k: +(median * 1.38).toFixed(1),
      avg_months_to_job: +(rng(s, 2.5, 6.5, 13)).toFixed(1),
      nss_overall_pct: Math.round(tier.nss + rng(s, -6, 6, 14)),
      tef_rating: tef,
      placement_participation_pct: placement_pct,
      placement_employment_boost_pp: placement_emp_boost,
      placement_salary_boost_k: placement_sal_boost,
    })
  }
  return map
}

const OUTCOMES_MAP = generateOutcomes()

export function getOutcomesByInstitution(id: string): GraduateOutcome | undefined {
  return OUTCOMES_MAP.get(id)
}

export function getAllOutcomes(): GraduateOutcome[] {
  return Array.from(OUTCOMES_MAP.values())
}

export function getSectorOutcomes(): SectorOutcomeSummary {
  const all = getAllOutcomes()
  const n = all.length
  return {
    avg_employment_rate:   +(all.reduce((s, o) => s + o.employment_rate_15mo, 0) / n).toFixed(1),
    avg_graduate_role_pct: +(all.reduce((s, o) => s + o.graduate_role_pct, 0) / n).toFixed(1),
    avg_unemployed_pct:    +(all.reduce((s, o) => s + o.unemployed_pct, 0) / n).toFixed(1),
    avg_further_study_pct: +(all.reduce((s, o) => s + o.further_study_pct, 0) / n).toFixed(1),
    avg_salary_k:          +(all.reduce((s, o) => s + o.avg_salary_k, 0) / n).toFixed(1),
    avg_median_salary_k:   +(all.reduce((s, o) => s + o.median_salary_k, 0) / n).toFixed(1),
    avg_months_to_job:     +(all.reduce((s, o) => s + o.avg_months_to_job, 0) / n).toFixed(1),
    avg_nss:               +(all.reduce((s, o) => s + o.nss_overall_pct, 0) / n).toFixed(1),
    total_graduates_annually: 350000, // HESA sector figure
  }
}

export function getTopByOutcome(
  metric: keyof GraduateOutcome,
  n = 10,
  order: 'desc' | 'asc' = 'desc',
): GraduateOutcome[] {
  return getAllOutcomes()
    .filter((o) => typeof o[metric] === 'number')
    .sort((a, b) =>
      order === 'desc'
        ? (b[metric] as number) - (a[metric] as number)
        : (a[metric] as number) - (b[metric] as number),
    )
    .slice(0, n)
}
