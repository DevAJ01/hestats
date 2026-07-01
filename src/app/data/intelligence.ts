import type { Confidence } from './sources'

export type IntelligenceCategory =
  | 'he-finance'
  | 'students'
  | 'graduate-outcomes'
  | 'labour-market'
  | 'ai-exposure'
  | 'policy'
  | 'map-data'

export type IntelligenceClaimType =
  | 'official-statistic'
  | 'regulator-publication'
  | 'government-policy'
  | 'external-analysis'
  | 'geospatial-reference'

export type IntelligenceSourceStatus = 'verified' | 'external_analysis' | 'pending' | 'archived'

export interface IntelligenceMetric {
  key: string
  label: string
  value: number | null
  unit: string
  period: string
  source_reference: string
  included_in_aggregates: boolean
  notes?: string
}

export interface IntelligenceRecord {
  id: string
  title: string
  summary: string
  category: IntelligenceCategory
  claim_type: IntelligenceClaimType
  source_status: IntelligenceSourceStatus
  source_id: string
  publisher: string
  source_url: string
  source_reference: string
  published_date: string
  retrieved_date: string
  last_verified: string
  confidence: Confidence
  geography: string
  period: string
  metrics: IntelligenceMetric[]
  notes?: string
}

export const INTELLIGENCE_RECORDS: IntelligenceRecord[] = [
  {
    id: 'hesa-provider-universe-2024-25',
    title: 'HESA 2024-25 student provider universe has 304 reporting providers',
    summary: 'The platform institution directory now tracks the full HESA 2024-25 student-reporting provider count. Each provider is represented as a named institution row with a UKPRN and explicit nullable coverage metadata.',
    category: 'students',
    claim_type: 'official-statistic',
    source_status: 'verified',
    source_id: 'hesa-students',
    publisher: 'Higher Education Statistics Agency (HESA)',
    source_url: 'https://www.hesa.ac.uk/news/27-01-2026/sb273-higher-education-student-statistics/location',
    source_reference: 'Location release: 304 HE providers reported student data for 2024/25',
    published_date: '2026-01-27',
    retrieved_date: '2026-07-01',
    last_verified: '2026-07-01',
    confidence: 'high',
    geography: 'United Kingdom',
    period: '2024-25',
    metrics: [
      {
        key: 'student_reporting_providers',
        label: 'HESA student-reporting providers',
        value: 304,
        unit: 'providers',
        period: '2024-25',
        source_reference: 'HESA SB273 location release provider count',
        included_in_aggregates: false,
      },
    ],
  },
  {
    id: 'hesa-finance-release-2-2024-25-coverage',
    title: 'HESA Finance 2024-25 release 2 includes 299 of 312 finance providers',
    summary: 'HESA Finance release 2 is the canonical comparable source for 2024/25 provider finance. The release reports 299 of 312 finance providers and excludes 13 providers that do not appear in all source tables used for the release.',
    category: 'he-finance',
    claim_type: 'official-statistic',
    source_status: 'verified',
    source_id: 'hesa-finance',
    publisher: 'Higher Education Statistics Agency (HESA)',
    source_url: 'https://www.hesa.ac.uk/news/14-05-2026/he-provider-data-finance-release-2-202425',
    source_reference: 'HESA HE Provider Data: Finance release 2 2024/25 coverage statement',
    published_date: '2026-05-14',
    retrieved_date: '2026-07-01',
    last_verified: '2026-07-01',
    confidence: 'high',
    geography: 'United Kingdom',
    period: '2024-25',
    metrics: [
      {
        key: 'finance_release_2_included_providers',
        label: 'Finance providers included',
        value: 299,
        unit: 'providers',
        period: '2024-25 release 2',
        source_reference: 'HESA Finance 2024/25 release 2 provider coverage',
        included_in_aggregates: false,
      },
      {
        key: 'finance_release_2_total_providers',
        label: 'Finance provider universe',
        value: 312,
        unit: 'providers',
        period: '2024-25 release 2',
        source_reference: 'HESA Finance 2024/25 release 2 provider coverage',
        included_in_aggregates: false,
      },
    ],
  },
  {
    id: 'slc-england-student-support-2025',
    title: 'SLC England 2025 reports GBP20.3bn higher education support for 2024-25',
    summary: 'The latest SLC England release reports provisional 2024/25 support paid or awarded, including GBP20.3bn total support, 1.43m applicants/students, and separate maintenance, tuition and postgraduate loan indicators.',
    category: 'policy',
    claim_type: 'official-statistic',
    source_status: 'verified',
    source_id: 'slc-statistics',
    publisher: 'Student Loans Company',
    source_url: 'https://www.gov.uk/government/statistics/student-support-for-higher-education-in-england-2025/student-support-for-higher-education-in-england-2025',
    source_reference: 'Executive summary and Figure 1 narrative',
    published_date: '2025-11-27',
    retrieved_date: '2026-07-01',
    last_verified: '2026-07-01',
    confidence: 'provisional',
    geography: 'England',
    period: '2024-25',
    metrics: [
      {
        key: 'total_support_paid_gbp_bn',
        label: 'Student support awarded/paid',
        value: 20.3,
        unit: 'GBP billion',
        period: '2024-25',
        source_reference: 'SLC England 2025 executive summary',
        included_in_aggregates: false,
      },
      {
        key: 'support_recipients',
        label: 'Applicants/students awarded or paid support',
        value: 1430000,
        unit: 'students',
        period: '2024-25',
        source_reference: 'SLC England 2025 Figure 1 narrative',
        included_in_aggregates: false,
      },
    ],
    notes: 'The latest academic-year values are provisional in the SLC release.',
  },
  {
    id: 'dfe-student-loan-forecasts-2024-25',
    title: 'DfE 2024-25 student loan forecasts are context, not observed provider finance',
    summary: 'DfE forecasts estimate average borrowing, repayment and long-term loan-balance outcomes for England. HEStats labels these as forecasts and excludes them from official provider aggregates.',
    category: 'policy',
    claim_type: 'official-statistic',
    source_status: 'verified',
    source_id: 'dfe-student-loan-forecasts',
    publisher: 'Department for Education',
    source_url: 'https://explore-education-statistics.service.gov.uk/find-statistics/student-loan-forecasts-for-england/2024-25',
    source_reference: 'Headline facts and long-term projections',
    published_date: '2025-07-03',
    retrieved_date: '2026-07-01',
    last_verified: '2026-07-01',
    confidence: 'provisional',
    geography: 'England',
    period: '2024-25',
    metrics: [
      {
        key: 'average_borrowing_full_time_ug',
        label: 'Expected average borrowing for 2024/25 entrants',
        value: 44690,
        unit: 'GBP',
        period: '2024-25 entrant cohort',
        source_reference: 'DfE student loan forecasts headline facts',
        included_in_aggregates: false,
      },
      {
        key: 'expected_full_repay_pct',
        label: 'Full-time UG borrowers expected to repay in full',
        value: 56,
        unit: 'percent',
        period: '2024-25 entrant cohort',
        source_reference: 'DfE student loan forecasts headline facts',
        included_in_aggregates: false,
      },
    ],
    notes: 'Forecast metrics are official statistics based on DfE forecast methods and are excluded from observed official aggregates.',
  },
  {
    id: 'ofs-financial-sustainability-2026',
    title: 'OfS 2026 sustainability report is the current regulator view',
    summary: 'The May 2026 OfS report is the latest annual regulator assessment of financial condition and resilience for English higher education providers; the report and Annex E were republished in June 2026 after typology corrections.',
    category: 'he-finance',
    claim_type: 'regulator-publication',
    source_status: 'verified',
    source_id: 'ofs-financial-sustainability',
    publisher: 'Office for Students',
    source_url: 'https://www.officeforstudents.org.uk/publications/financial-sustainability-of-higher-education-providers-in-england-2026/',
    source_reference: 'Publication page; date, archive and update notes',
    published_date: '2026-05-14',
    retrieved_date: '2026-07-01',
    last_verified: '2026-07-01',
    confidence: 'high',
    geography: 'England',
    period: '2026',
    metrics: [],
    notes: 'Use as sector/regulatory context only; institution-level financial rows remain sourced from HESA Finance and audited accounts.',
  },
  {
    id: 'hesa-student-enrolments-2024-25',
    title: 'UK HE enrolments fell in 2024-25',
    summary: 'HESA reported 2,863,180 higher education student enrolments in 2024-25, down around 1 percent from 2023-24.',
    category: 'students',
    claim_type: 'official-statistic',
    source_status: 'verified',
    source_id: 'hesa-students',
    publisher: 'Higher Education Statistics Agency (HESA)',
    source_url: 'https://www.hesa.ac.uk/news/27-01-2026/sb273-higher-education-student-statistics',
    source_reference: 'Higher Education Student Statistics: UK, 2024/25 headline release',
    published_date: '2026-01-27',
    retrieved_date: '2026-07-01',
    last_verified: '2026-07-01',
    confidence: 'high',
    geography: 'United Kingdom',
    period: '2024-25',
    metrics: [
      {
        key: 'total_he_enrolments',
        label: 'Total HE student enrolments',
        value: 2863180,
        unit: 'students',
        period: '2024-25',
        source_reference: 'HESA headline release, UK 2024/25 total',
        included_in_aggregates: false,
      },
      {
        key: 'annual_change_pct',
        label: 'Annual enrolment change',
        value: -1,
        unit: 'percent',
        period: '2024-25 versus 2023-24',
        source_reference: 'HESA headline release, annual decrease statement',
        included_in_aggregates: false,
      },
    ],
  },
  {
    id: 'dfe-leo-graduate-labour-market-2023-24',
    title: 'DfE LEO 2023-24 is the latest graduate labour-market release',
    summary: 'The 2026 DfE LEO release combines graduate labour-market statistics with graduate and postgraduate outcomes, including earnings and employment by subject and characteristics.',
    category: 'graduate-outcomes',
    claim_type: 'official-statistic',
    source_status: 'verified',
    source_id: 'dfe-leo',
    publisher: 'Department for Education',
    source_url: 'https://explore-education-statistics.service.gov.uk/find-statistics/graduate-labour-market-outcomes-leo/2023-24',
    source_reference: 'Release home; headline facts and background information',
    published_date: '2026-06-25',
    retrieved_date: '2026-07-01',
    last_verified: '2026-07-01',
    confidence: 'high',
    geography: 'Great Britain / England provider coverage as defined in release',
    period: 'Tax year 2023-24',
    metrics: [
      {
        key: 'female_stem_earnings_premium_min',
        label: 'Female STEM graduate earnings premium, lower bound',
        value: 8700,
        unit: 'GBP annualised earnings',
        period: '2023-24 tax year, ten years after GCSEs',
        source_reference: 'Headline facts and figures, female STEM graduate comparison by GCSE attainment quintile',
        included_in_aggregates: false,
      },
      {
        key: 'female_stem_earnings_premium_max',
        label: 'Female STEM graduate earnings premium, upper bound',
        value: 12800,
        unit: 'GBP annualised earnings',
        period: '2023-24 tax year, ten years after GCSEs',
        source_reference: 'Headline facts and figures, female STEM graduate comparison by GCSE attainment quintile',
        included_in_aggregates: false,
      },
    ],
    notes: 'The release explicitly warns that these comparisons should not be treated as a single causal return estimate.',
  },
  {
    id: 'ons-bics-ai-adoption-march-2026',
    title: 'ONS BICS reports rising UK business AI adoption',
    summary: 'In March 2026, ONS reported that 26 percent of businesses used at least one AI technology and 18 percent planned adoption within three months.',
    category: 'labour-market',
    claim_type: 'official-statistic',
    source_status: 'verified',
    source_id: 'ons-bics-ai',
    publisher: 'Office for National Statistics',
    source_url: 'https://www.ons.gov.uk/businessindustryandtrade/business/businessservices/bulletins/businessinsightsandimpactontheukeconomy/2april2026',
    source_reference: 'Main points, AI technology bullets, Wave 153',
    published_date: '2026-04-02',
    retrieved_date: '2026-07-01',
    last_verified: '2026-07-01',
    confidence: 'provisional',
    geography: 'United Kingdom / Great Britain by BICS coverage',
    period: '16 to 29 March 2026',
    metrics: [
      {
        key: 'businesses_using_ai_pct',
        label: 'Businesses using at least one AI technology',
        value: 26,
        unit: 'percent',
        period: 'March 2026',
        source_reference: 'ONS BICS main points, AI technology use',
        included_in_aggregates: false,
      },
      {
        key: 'large_businesses_using_ai_pct',
        label: 'Businesses with 250+ employees using AI',
        value: 45,
        unit: 'percent',
        period: 'March 2026',
        source_reference: 'ONS BICS main points, AI technology use by size',
        included_in_aggregates: false,
      },
      {
        key: 'businesses_planning_ai_adoption_pct',
        label: 'Businesses planning AI adoption within three months',
        value: 18,
        unit: 'percent',
        period: 'March 2026',
        source_reference: 'ONS BICS main points, planned AI adoption',
        included_in_aggregates: false,
      },
      {
        key: 'ai_users_reporting_headcount_reduction_pct',
        label: 'AI-using businesses reporting headcount reduction',
        value: 5,
        unit: 'percent',
        period: 'March 2026',
        source_reference: 'ONS BICS main points, workforce headcount impact',
        included_in_aggregates: false,
      },
    ],
    notes: 'ONS labels these BICS measures as official statistics in development and advises caution.',
  },
  {
    id: 'gov-ai-action-plan-one-year-2026',
    title: 'UK AI Opportunities Action Plan reports 38 of 50 actions met',
    summary: 'The January 2026 government update reports progress against the AI Opportunities Action Plan, including 38 of 50 actions met, five AI Growth Zones and more than one million AI upskilling courses delivered.',
    category: 'policy',
    claim_type: 'government-policy',
    source_status: 'verified',
    source_id: 'gov-ai-action-plan-one-year',
    publisher: 'Department for Science, Innovation and Technology',
    source_url: 'https://www.gov.uk/government/publications/ai-opportunities-action-plan-one-year-on/ai-opportunities-action-plan-one-year-on',
    source_reference: 'Foreword, introduction and section 1 progress statements',
    published_date: '2026-01-29',
    retrieved_date: '2026-07-01',
    last_verified: '2026-07-01',
    confidence: 'medium',
    geography: 'United Kingdom',
    period: '2025 to 2026',
    metrics: [
      {
        key: 'actions_met',
        label: 'AI Action Plan commitments met',
        value: 38,
        unit: 'actions',
        period: 'January 2026 update',
        source_reference: 'Introduction, delivery against 38 of 50 actions',
        included_in_aggregates: false,
      },
      {
        key: 'total_actions',
        label: 'AI Action Plan commitments tracked',
        value: 50,
        unit: 'actions',
        period: 'January 2026 update',
        source_reference: 'Introduction, delivery against 38 of 50 actions',
        included_in_aggregates: false,
      },
      {
        key: 'ai_growth_zones',
        label: 'AI Growth Zones designated',
        value: 5,
        unit: 'zones',
        period: 'January 2026 update',
        source_reference: 'Section 1, AI Growth Zones',
        included_in_aggregates: false,
      },
      {
        key: 'ai_courses_delivered',
        label: 'AI upskilling courses delivered',
        value: 1000000,
        unit: 'courses',
        period: 'January 2026 update',
        source_reference: 'Foreword and skills section, more than one million courses',
        included_in_aggregates: false,
      },
    ],
    notes: 'Policy delivery figures are source-backed government claims, not official statistics.',
  },
  {
    id: 'wef-future-jobs-2025',
    title: 'WEF employer survey covers 2025 to 2030 workforce transformation',
    summary: 'The WEF Future of Jobs Report 2025 uses a global employer survey to examine job and skill change across 2025 to 2030.',
    category: 'labour-market',
    claim_type: 'external-analysis',
    source_status: 'external_analysis',
    source_id: 'wef-future-jobs-2025',
    publisher: 'World Economic Forum',
    source_url: 'https://www.weforum.org/publications/the-future-of-jobs-report-2025/',
    source_reference: 'Publication page, report scope statement',
    published_date: '2025-01-07',
    retrieved_date: '2026-07-01',
    last_verified: '2026-07-01',
    confidence: 'medium',
    geography: 'Global',
    period: '2025 to 2030',
    metrics: [
      {
        key: 'employers_surveyed',
        label: 'Employers represented',
        value: 1000,
        unit: 'employers, more than',
        period: '2025 report',
        source_reference: 'Publication page, survey scope',
        included_in_aggregates: false,
      },
      {
        key: 'workers_represented',
        label: 'Workers represented by surveyed employers',
        value: 14000000,
        unit: 'workers, more than',
        period: '2025 report',
        source_reference: 'Publication page, survey scope',
        included_in_aggregates: false,
      },
      {
        key: 'industry_clusters',
        label: 'Industry clusters covered',
        value: 22,
        unit: 'clusters',
        period: '2025 report',
        source_reference: 'Publication page, survey scope',
        included_in_aggregates: false,
      },
      {
        key: 'economies_covered',
        label: 'Economies covered',
        value: 55,
        unit: 'economies',
        period: '2025 report',
        source_reference: 'Publication page, survey scope',
        included_in_aggregates: false,
      },
    ],
    notes: 'This is external outlook analysis and is not used as an official UK outcome statistic.',
  },
  {
    id: 'ilo-genai-jobs-exposure-2025',
    title: 'ILO estimates one in four workers has some GenAI exposure',
    summary: 'The 2025 ILO working paper estimates global occupational exposure to generative AI, with clerical occupations continuing to show the highest exposure.',
    category: 'ai-exposure',
    claim_type: 'external-analysis',
    source_status: 'external_analysis',
    source_id: 'ilo-genai-jobs-2025',
    publisher: 'International Labour Organization',
    source_url: 'https://www.ilo.org/publications/generative-ai-and-jobs-refined-global-index-occupational-exposure',
    source_reference: 'Working Paper 140 publication page and abstract',
    published_date: '2025-05-20',
    retrieved_date: '2026-07-01',
    last_verified: '2026-07-01',
    confidence: 'medium',
    geography: 'Global',
    period: '2025',
    metrics: [
      {
        key: 'workers_with_some_genai_exposure_pct',
        label: 'Workers in occupations with some GenAI exposure',
        value: 25,
        unit: 'percent',
        period: '2025 working paper',
        source_reference: 'Abstract, global employment exposure statement',
        included_in_aggregates: false,
      },
      {
        key: 'highest_exposure_global_employment_pct',
        label: 'Global employment in highest exposure category',
        value: 3.3,
        unit: 'percent',
        period: '2025 working paper',
        source_reference: 'Abstract, Gradient 4 global share',
        included_in_aggregates: false,
      },
      {
        key: 'highest_exposure_female_pct',
        label: 'Female employment in highest exposure category',
        value: 4.7,
        unit: 'percent',
        period: '2025 working paper',
        source_reference: 'Abstract, female Gradient 4 share',
        included_in_aggregates: false,
      },
      {
        key: 'highest_exposure_male_pct',
        label: 'Male employment in highest exposure category',
        value: 2.4,
        unit: 'percent',
        period: '2025 working paper',
        source_reference: 'Abstract, male Gradient 4 share',
        included_in_aggregates: false,
      },
    ],
    notes: 'Exposure is not equivalent to automation or job loss; ILO frames job transformation as the more likely effect for most occupations.',
  },
  {
    id: 'mckinsey-superagency-workplace-2025',
    title: 'McKinsey reports high AI investment intent but low deployment maturity',
    summary: 'McKinsey reports that 92 percent of companies plan to increase AI investments over three years, while only 1 percent of leaders describe their company as AI mature.',
    category: 'ai-exposure',
    claim_type: 'external-analysis',
    source_status: 'external_analysis',
    source_id: 'mckinsey-superagency-2025',
    publisher: 'McKinsey & Company',
    source_url: 'https://www.mckinsey.com/capabilities/tech-and-ai/our-insights/superagency-in-the-workplace-empowering-people-to-unlock-ais-full-potential-at-work',
    source_reference: 'Report page, opening research summary',
    published_date: '2025-01-28',
    retrieved_date: '2026-07-01',
    last_verified: '2026-07-01',
    confidence: 'medium',
    geography: 'Global / corporate survey',
    period: '2025 report',
    metrics: [
      {
        key: 'companies_increasing_ai_investment_pct',
        label: 'Companies planning to increase AI investments',
        value: 92,
        unit: 'percent',
        period: 'Next three years from 2025 report',
        source_reference: 'Opening report summary, investment plans',
        included_in_aggregates: false,
      },
      {
        key: 'leaders_reporting_ai_maturity_pct',
        label: 'Leaders reporting AI maturity',
        value: 1,
        unit: 'percent',
        period: '2025 report',
        source_reference: 'Opening report summary, AI maturity',
        included_in_aggregates: false,
      },
      {
        key: 'long_term_productivity_potential_usd_tn',
        label: 'Estimated long-term productivity potential',
        value: 4.4,
        unit: 'USD trillion',
        period: 'Referenced McKinsey generative AI research',
        source_reference: 'Opening report summary, productivity potential citation',
        included_in_aggregates: false,
      },
    ],
    notes: 'Consultancy research is displayed as external analysis and excluded from official HEStats aggregates.',
  },
]

export function getIntelligenceByCategory(category: IntelligenceCategory): IntelligenceRecord[] {
  return INTELLIGENCE_RECORDS.filter((record) => record.category === category)
}

export function getLatestIntelligence(limit = 6): IntelligenceRecord[] {
  return [...INTELLIGENCE_RECORDS]
    .sort((a, b) => b.published_date.localeCompare(a.published_date))
    .slice(0, limit)
}

export function getOfficialIntelligence(): IntelligenceRecord[] {
  return INTELLIGENCE_RECORDS.filter((record) => record.claim_type !== 'external-analysis')
}

export function getExternalAnalysisIntelligence(): IntelligenceRecord[] {
  return INTELLIGENCE_RECORDS.filter((record) => record.claim_type === 'external-analysis')
}
