import { computeHealthScore } from './health'
import { institutions } from './institutions'
import {
  AVAILABLE_YEARS,
  formatCurrencyM,
  formatDays,
  formatPct,
  getAggregateEligibleFinancials,
  isKnownNumber,
  ratioPct,
} from './financials'
import type { FinancialYear, Institution } from './types'

export type SocialPlatform = 'linkedin' | 'x' | 'instagram' | 'threads'
export type SocialAudience = 'sector' | 'students' | 'public' | 'funders'
export type SocialTone = 'briefing' | 'campaign' | 'explainer'

export type SocialStoryCategory = 'coverage' | 'sector' | 'research' | 'pressure' | 'growth' | 'institution'

export interface SocialEvidencePoint {
  label: string
  value: string
  detail: string
  institutionId?: string
}

export interface SocialStory {
  id: string
  year: string
  category: SocialStoryCategory
  title: string
  shortTitle: string
  metricLabel: string
  valueText: string
  summary: string
  whyItMatters: string
  sourceLine: string
  evidence: SocialEvidencePoint[]
  sentiment: 'positive' | 'caution' | 'neutral'
  priority: number
  institutionId?: string
}

export interface SocialStudioSummary {
  year: string
  verifiedRows: number
  indexedInstitutions: number
  totalIncomeText: string
  deficitRows: number
  sourceLine: string
}

export interface GeneratedSocialPost {
  platform: SocialPlatform
  audience: SocialAudience
  tone: SocialTone
  headline: string
  body: string
  hashtags: string[]
  characterCount: number
  limit: number
  cta: string
  altText: string
  graphicBrief: string
}

export const SOCIAL_PLATFORMS: { id: SocialPlatform; label: string; limit: number; description: string }[] = [
  { id: 'linkedin', label: 'LinkedIn', limit: 3000, description: 'Long-form briefing' },
  { id: 'x', label: 'X', limit: 280, description: 'Short public post' },
  { id: 'instagram', label: 'Instagram', limit: 2200, description: 'Caption and card' },
  { id: 'threads', label: 'Threads', limit: 500, description: 'Conversational summary' },
]

export const SOCIAL_AUDIENCES: { id: SocialAudience; label: string }[] = [
  { id: 'sector', label: 'Sector' },
  { id: 'students', label: 'Students' },
  { id: 'public', label: 'Public' },
  { id: 'funders', label: 'Funders' },
]

export const SOCIAL_TONES: { id: SocialTone; label: string }[] = [
  { id: 'briefing', label: 'Briefing' },
  { id: 'campaign', label: 'Campaign' },
  { id: 'explainer', label: 'Explainer' },
]

const PLATFORM_LIMITS: Record<SocialPlatform, number> = Object.fromEntries(
  SOCIAL_PLATFORMS.map((platform) => [platform.id, platform.limit]),
) as Record<SocialPlatform, number>

const INSTITUTION_BY_ID = new Map(institutions.map((institution) => [institution.id, institution]))

type NumericFinancialKey = {
  [Key in keyof FinancialYear]-?: NonNullable<FinancialYear[Key]> extends number ? Key : never
}[keyof FinancialYear]

function compactCurrency(value: number | null | undefined): string {
  if (!isKnownNumber(value)) return 'Pending'
  const abs = Math.abs(value)
  if (abs >= 1000) return `£${(value / 1000).toFixed(abs >= 10_000 ? 0 : 1)}bn`
  if (abs < 10) return `£${value.toFixed(1)}m`
  return `£${Math.round(value).toLocaleString()}m`
}

function compactPct(value: number | null | undefined): string {
  if (!isKnownNumber(value)) return 'Pending'
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}

function sumKnown(rows: FinancialYear[], key: NumericFinancialKey): number | null {
  const values = rows.map((row) => row[key]).filter(isKnownNumber)
  if (!values.length) return null
  return values.reduce((total, value) => total + value, 0)
}

function weightedSurplusMargin(rows: FinancialYear[]): number | null {
  const revenue = sumKnown(rows, 'revenue_gbp_m')
  const surplus = sumKnown(rows, 'surplus_gbp_m')
  if (!isKnownNumber(revenue) || !isKnownNumber(surplus) || revenue === 0) return null
  return (surplus / revenue) * 100
}

function institutionFor(row: FinancialYear): Institution | undefined {
  return INSTITUTION_BY_ID.get(row.institution_id)
}

function sortByMetricDesc(rows: FinancialYear[], key: NumericFinancialKey): FinancialYear[] {
  return [...rows]
    .filter((row) => isKnownNumber(row[key]))
    .sort((a, b) => Number(b[key]) - Number(a[key]))
}

function sortByMetricAsc(rows: FinancialYear[], key: NumericFinancialKey): FinancialYear[] {
  return [...rows]
    .filter((row) => isKnownNumber(row[key]))
    .sort((a, b) => Number(a[key]) - Number(b[key]))
}

function sourceLine(year: string): string {
  return `Source: HESA finance table extracts loaded in HEStats, FY${year}; verified rows only.`
}

function previousYear(year: string): string | undefined {
  const index = AVAILABLE_YEARS.indexOf(year)
  return index >= 0 ? AVAILABLE_YEARS[index + 1] : undefined
}

function evidence(label: string, value: string, detail: string, institutionId?: string): SocialEvidencePoint {
  return { label, value, detail, institutionId }
}

export function getSocialStudioSummary(year = AVAILABLE_YEARS[0]): SocialStudioSummary {
  const rows = getAggregateEligibleFinancials(year)
  const totalIncome = sumKnown(rows, 'revenue_gbp_m')
  const deficitRows = rows.filter((row) => isKnownNumber(row.surplus_gbp_m) && row.surplus_gbp_m < 0).length

  return {
    year,
    verifiedRows: rows.length,
    indexedInstitutions: institutions.length,
    totalIncomeText: compactCurrency(totalIncome),
    deficitRows,
    sourceLine: sourceLine(year),
  }
}

export function buildSocialStories(year = AVAILABLE_YEARS[0]): SocialStory[] {
  const rows = getAggregateEligibleFinancials(year)
  const stories: SocialStory[] = []
  const totalIncome = sumKnown(rows, 'revenue_gbp_m')
  const totalResearch = sumKnown(rows, 'research_income_gbp_m')
  const deficitRows = rows.filter((row) => isKnownNumber(row.surplus_gbp_m) && row.surplus_gbp_m < 0)
  const margin = weightedSurplusMargin(rows)

  stories.push({
    id: `coverage-${year}`,
    year,
    category: 'coverage',
    title: `${rows.length} FY${year} provider rows are verified for social-safe use`,
    shortTitle: 'Verified coverage',
    metricLabel: 'Verified provider rows',
    valueText: rows.length.toLocaleString(),
    summary: `${rows.length} provider finance rows are currently included in HEStats aggregates for FY${year}; pending rows are excluded from shareable claims.`,
    whyItMatters: 'Coverage is the first filter before any public post: only verified rows should become share copy.',
    sourceLine: sourceLine(year),
    evidence: [
      evidence('Verified rows', rows.length.toLocaleString(), 'included in aggregates'),
      evidence('Directory size', institutions.length.toLocaleString(), 'institutions indexed'),
      evidence('Pending rows', Math.max(institutions.length - rows.length, 0).toLocaleString(), 'withheld from social claims'),
    ],
    sentiment: 'neutral',
    priority: 100,
  })

  if (rows.length && isKnownNumber(totalIncome)) {
    stories.push({
      id: `sector-income-${year}`,
      year,
      category: 'sector',
      title: `Verified HEStats income aggregate reaches ${compactCurrency(totalIncome)} in FY${year}`,
      shortTitle: 'Sector income scale',
      metricLabel: 'Verified aggregate income',
      valueText: compactCurrency(totalIncome),
      summary: `Across ${rows.length} verified provider rows, loaded income totals ${compactCurrency(totalIncome)} for FY${year}.`,
      whyItMatters: 'This gives audiences a fast, source-bounded view of the scale of UK higher education finance.',
      sourceLine: sourceLine(year),
      evidence: [
        evidence('Total income', compactCurrency(totalIncome), 'sum of verified provider rows'),
        evidence('Verified rows', rows.length.toLocaleString(), 'providers in aggregate'),
        evidence('Weighted surplus margin', compactPct(margin), 'surplus divided by income'),
      ],
      sentiment: 'neutral',
      priority: 95,
    })
  }

  const topResearch = sortByMetricDesc(rows, 'research_income_gbp_m')[0]
  const topResearchInstitution = topResearch ? institutionFor(topResearch) : undefined
  if (topResearch && topResearchInstitution && isKnownNumber(topResearch.research_income_gbp_m)) {
    const share = isKnownNumber(totalResearch) && totalResearch > 0
      ? (topResearch.research_income_gbp_m / totalResearch) * 100
      : null
    stories.push({
      id: `research-leader-${year}`,
      year,
      category: 'research',
      title: `${topResearchInstitution.short_name} leads verified research income in FY${year}`,
      shortTitle: 'Research income leader',
      metricLabel: 'Research income',
      valueText: compactCurrency(topResearch.research_income_gbp_m),
      summary: `${topResearchInstitution.canonical_name} records ${compactCurrency(topResearch.research_income_gbp_m)} in research grants and contracts, ${compactPct(share)} of the verified aggregate loaded for the year.`,
      whyItMatters: 'Research income is one of the clearest public signals of research intensity and external grant activity.',
      sourceLine: sourceLine(year),
      evidence: [
        evidence('Institution', topResearchInstitution.short_name, topResearchInstitution.nation, topResearchInstitution.id),
        evidence('Research income', compactCurrency(topResearch.research_income_gbp_m), 'research grants and contracts', topResearchInstitution.id),
        evidence('Share of loaded total', compactPct(share), 'top provider divided by verified research aggregate', topResearchInstitution.id),
      ],
      sentiment: 'positive',
      priority: 90,
      institutionId: topResearchInstitution.id,
    })
  }

  if (deficitRows.length) {
    const largestDeficit = sortByMetricAsc(deficitRows, 'surplus_gbp_m')[0]
    const deficitInstitution = largestDeficit ? institutionFor(largestDeficit) : undefined
    stories.push({
      id: `deficit-count-${year}`,
      year,
      category: 'pressure',
      title: `${deficitRows.length} verified FY${year} provider rows report operating deficits`,
      shortTitle: 'Deficit count',
      metricLabel: 'Deficit rows',
      valueText: deficitRows.length.toLocaleString(),
      summary: `${deficitRows.length} of ${rows.length} verified provider rows currently show negative operating surplus in FY${year}.`,
      whyItMatters: 'Deficit counts help turn institution-level accounts into a clearer public picture of sector pressure.',
      sourceLine: sourceLine(year),
      evidence: [
        evidence('Deficit rows', deficitRows.length.toLocaleString(), 'negative operating surplus'),
        evidence('Verified rows', rows.length.toLocaleString(), 'providers in aggregate'),
        evidence(
          'Largest loaded deficit',
          deficitInstitution && isKnownNumber(largestDeficit?.surplus_gbp_m) ? formatCurrencyM(largestDeficit.surplus_gbp_m) : 'Pending',
          deficitInstitution ? deficitInstitution.short_name : 'no institution available',
          deficitInstitution?.id,
        ),
      ],
      sentiment: 'caution',
      priority: 88,
      institutionId: deficitInstitution?.id,
    })
  }

  const lowLiquidity = sortByMetricAsc(rows, 'liquidity_days')[0]
  const lowLiquidityInstitution = lowLiquidity ? institutionFor(lowLiquidity) : undefined
  if (lowLiquidity && lowLiquidityInstitution && isKnownNumber(lowLiquidity.liquidity_days)) {
    stories.push({
      id: `liquidity-watch-${year}`,
      year,
      category: 'pressure',
      title: `${lowLiquidityInstitution.short_name} reports ${formatDays(lowLiquidity.liquidity_days)} liquidity cover`,
      shortTitle: 'Liquidity watch',
      metricLabel: 'Liquidity days',
      valueText: formatDays(lowLiquidity.liquidity_days),
      summary: `${lowLiquidityInstitution.canonical_name} has the lowest verified liquidity-days datapoint currently loaded for FY${year}.`,
      whyItMatters: 'Liquidity days convert balance-sheet data into a concrete resilience signal for non-specialist readers.',
      sourceLine: sourceLine(year),
      evidence: [
        evidence('Institution', lowLiquidityInstitution.short_name, lowLiquidityInstitution.nation, lowLiquidityInstitution.id),
        evidence('Liquidity cover', formatDays(lowLiquidity.liquidity_days), 'days of expenditure covered by liquid assets', lowLiquidityInstitution.id),
        evidence('Risk flag', lowLiquidity.risk_flag, 'loaded source row classification', lowLiquidityInstitution.id),
      ],
      sentiment: lowLiquidity.liquidity_days < 60 ? 'caution' : 'neutral',
      priority: 82,
      institutionId: lowLiquidityInstitution.id,
    })
  }

  const borrowingRows = rows
    .map((row) => {
      const borrowingRatio = ratioPct(row.borrowing_gbp_m, row.revenue_gbp_m, 2)
      return { row, borrowingRatio }
    })
    .filter((item): item is { row: FinancialYear; borrowingRatio: number } => isKnownNumber(item.borrowingRatio))
    .sort((a, b) => b.borrowingRatio - a.borrowingRatio)
  const topBorrowing = borrowingRows[0]
  const topBorrowingInstitution = topBorrowing ? institutionFor(topBorrowing.row) : undefined
  if (topBorrowing && topBorrowingInstitution) {
    stories.push({
      id: `borrowing-burden-${year}`,
      year,
      category: 'pressure',
      title: `${topBorrowingInstitution.short_name} has the highest loaded borrowing-to-income ratio`,
      shortTitle: 'Borrowing burden',
      metricLabel: 'Borrowing to income',
      valueText: compactPct(topBorrowing.borrowingRatio),
      summary: `${topBorrowingInstitution.canonical_name} reports external borrowing equal to ${compactPct(topBorrowing.borrowingRatio)} of annual income in FY${year}.`,
      whyItMatters: 'Borrowing burden is a fast way to explain balance-sheet exposure without asking readers to parse full accounts.',
      sourceLine: sourceLine(year),
      evidence: [
        evidence('Borrowing', compactCurrency(topBorrowing.row.borrowing_gbp_m), 'external borrowing', topBorrowingInstitution.id),
        evidence('Income', compactCurrency(topBorrowing.row.revenue_gbp_m), 'total income', topBorrowingInstitution.id),
        evidence('Ratio', compactPct(topBorrowing.borrowingRatio), 'borrowing divided by income', topBorrowingInstitution.id),
      ],
      sentiment: topBorrowing.borrowingRatio > 100 ? 'caution' : 'neutral',
      priority: 80,
      institutionId: topBorrowingInstitution.id,
    })
  }

  const healthRows = rows
    .map((row) => ({ row, health: computeHealthScore(row) }))
    .filter((item) => isKnownNumber(item.health.score))
    .sort((a, b) => (b.health.score ?? 0) - (a.health.score ?? 0))
  const topHealth = healthRows[0]
  const topHealthInstitution = topHealth ? institutionFor(topHealth.row) : undefined
  if (topHealth && topHealthInstitution && isKnownNumber(topHealth.health.score)) {
    stories.push({
      id: `health-leader-${year}`,
      year,
      category: 'institution',
      title: `${topHealthInstitution.short_name} leads the loaded HEStats health score table`,
      shortTitle: 'Health score leader',
      metricLabel: 'Health score',
      valueText: `${topHealth.health.score}/100`,
      summary: `${topHealthInstitution.canonical_name} records a HEStats financial health score of ${topHealth.health.score}/100 (${topHealth.health.grade}) for FY${year}.`,
      whyItMatters: 'A single grade helps audiences orient around liquidity, margin, borrowing, cash cover and income mix.',
      sourceLine: sourceLine(year),
      evidence: [
        evidence('Score', `${topHealth.health.score}/100`, topHealth.health.grade, topHealthInstitution.id),
        evidence('Liquidity', formatDays(topHealth.row.liquidity_days), 'component input', topHealthInstitution.id),
        evidence('Surplus margin', formatPct(topHealth.row.surplus_margin_pct), 'component input', topHealthInstitution.id),
      ],
      sentiment: 'positive',
      priority: 78,
      institutionId: topHealthInstitution.id,
    })
  }

  const prior = previousYear(year)
  if (prior) {
    const previousByInstitution = new Map(getAggregateEligibleFinancials(prior).map((row) => [row.institution_id, row]))
    const growthRows = rows
      .map((row) => {
        const previous = previousByInstitution.get(row.institution_id)
        const currentRevenue = row.revenue_gbp_m
        const previousRevenue = previous?.revenue_gbp_m
        if (!isKnownNumber(currentRevenue) || !isKnownNumber(previousRevenue) || previousRevenue === 0) return null
        return {
          row,
          previous,
          growthPct: ((currentRevenue - previousRevenue) / Math.abs(previousRevenue)) * 100,
        }
      })
      .filter((item): item is { row: FinancialYear; previous: FinancialYear; growthPct: number } => item !== null)
      .sort((a, b) => b.growthPct - a.growthPct)
    const fastestGrowth = growthRows[0]
    const fastestGrowthInstitution = fastestGrowth ? institutionFor(fastestGrowth.row) : undefined
    if (fastestGrowth && fastestGrowthInstitution) {
      stories.push({
        id: `income-growth-${year}`,
        year,
        category: 'growth',
        title: `${fastestGrowthInstitution.short_name} posts the fastest loaded income growth`,
        shortTitle: 'Income growth',
        metricLabel: 'Year-on-year income change',
        valueText: compactPct(fastestGrowth.growthPct),
        summary: `${fastestGrowthInstitution.canonical_name} moves from ${compactCurrency(fastestGrowth.previous.revenue_gbp_m)} in FY${prior} income to ${compactCurrency(fastestGrowth.row.revenue_gbp_m)} in FY${year}.`,
        whyItMatters: 'Year-on-year growth turns static accounts into a more shareable movement story.',
        sourceLine: sourceLine(year),
        evidence: [
          evidence(`FY${prior}`, compactCurrency(fastestGrowth.previous.revenue_gbp_m), 'previous verified income', fastestGrowthInstitution.id),
          evidence(`FY${year}`, compactCurrency(fastestGrowth.row.revenue_gbp_m), 'current verified income', fastestGrowthInstitution.id),
          evidence('Change', compactPct(fastestGrowth.growthPct), 'year-on-year movement', fastestGrowthInstitution.id),
        ],
        sentiment: fastestGrowth.growthPct >= 0 ? 'positive' : 'caution',
        priority: 75,
        institutionId: fastestGrowthInstitution.id,
      })
    }
  }

  return stories.sort((a, b) => b.priority - a.priority)
}

function categoryHashtag(category: SocialStoryCategory): string {
  const tags: Record<SocialStoryCategory, string> = {
    coverage: '#OpenData',
    sector: '#HigherEducation',
    research: '#Research',
    pressure: '#UniversityFinance',
    growth: '#EducationData',
    institution: '#Universities',
  }
  return tags[category]
}

function hashtagsFor(story: SocialStory, platform: SocialPlatform): string[] {
  const base = ['#HEStats', categoryHashtag(story.category), '#UKUniversities', '#OpenData', '#HigherEducation']
  const unique = Array.from(new Set(base))
  const count = platform === 'instagram' ? 5 : platform === 'linkedin' ? 4 : platform === 'threads' ? 3 : 2
  return unique.slice(0, count)
}

function audienceLine(audience: SocialAudience): string {
  const lines: Record<SocialAudience, string> = {
    sector: 'For sector leaders, analysts and policy teams',
    students: 'For students and families following the sector',
    public: 'For public-interest readers',
    funders: 'For funders and civic partners',
  }
  return lines[audience]
}

function toneVerb(tone: SocialTone): string {
  const verbs: Record<SocialTone, string> = {
    briefing: 'Watch the signal',
    campaign: 'Share the signal',
    explainer: 'Explain the signal',
  }
  return verbs[tone]
}

function storyUrl(story: SocialStory): string {
  if (story.institutionId) return `hestats.co.uk/universities/${story.institutionId}`
  if (story.category === 'coverage') return 'hestats.co.uk/open-data'
  return 'hestats.co.uk/sector'
}

function limitText(value: string, limit: number): string {
  if (value.length <= limit) return value
  if (limit <= 1) return value.slice(0, limit)
  return `${value.slice(0, limit - 1).trimEnd()}.`
}

function evidenceLine(story: SocialStory): string {
  return story.evidence
    .slice(0, 3)
    .map((item) => `${item.label}: ${item.value}`)
    .join(' | ')
}

export function composeSocialPost(
  story: SocialStory,
  platform: SocialPlatform,
  audience: SocialAudience,
  tone: SocialTone,
): GeneratedSocialPost {
  const hashtags = hashtagsFor(story, platform)
  const tagLine = hashtags.join(' ')
  const limit = PLATFORM_LIMITS[platform]
  const cta = `${toneVerb(tone)}: ${storyUrl(story)}`
  const altText = `${story.shortTitle}: ${story.metricLabel} is ${story.valueText} for FY${story.year}. ${story.sourceLine}`
  const graphicBrief = [
    `Hero metric: ${story.valueText}`,
    `Headline: ${story.shortTitle}`,
    `Evidence: ${evidenceLine(story)}`,
    `Footer: ${story.sourceLine}`,
  ].join('\n')

  let body: string
  if (platform === 'x') {
    const compact = `${story.shortTitle}: ${story.valueText}. ${story.summary} ${cta}`
    const room = limit - tagLine.length - 1
    body = `${limitText(compact, room)}\n${tagLine}`
  } else if (platform === 'threads') {
    const compact = [
      `${story.title}.`,
      `${story.summary}`,
      `${audienceLine(audience)}: ${story.whyItMatters}`,
      `${cta}`,
      tagLine,
    ].join('\n')
    body = limitText(compact, limit)
  } else if (platform === 'instagram') {
    body = [
      story.title,
      '',
      story.summary,
      '',
      'Key datapoints:',
      ...story.evidence.slice(0, 3).map((item) => `- ${item.label}: ${item.value} (${item.detail})`),
      '',
      story.sourceLine,
      cta,
      '',
      tagLine,
    ].join('\n')
  } else {
    body = [
      story.title,
      '',
      story.summary,
      '',
      `${audienceLine(audience)}: ${story.whyItMatters}`,
      '',
      `Evidence: ${evidenceLine(story)}`,
      story.sourceLine,
      '',
      cta,
      tagLine,
    ].join('\n')
  }

  return {
    platform,
    audience,
    tone,
    headline: story.shortTitle,
    body,
    hashtags,
    characterCount: body.length,
    limit,
    cta,
    altText,
    graphicBrief,
  }
}
