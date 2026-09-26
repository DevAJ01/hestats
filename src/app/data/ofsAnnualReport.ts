import type { IntelligenceRecord, IntelligenceMetric } from './intelligence'

export const OFS_ANNUAL_REPORT = {
  id: 'ofs-annual-report-2025-26',
  title: 'OfS Annual report and accounts 2025–26',
  url: 'https://www.officeforstudents.org.uk/media/c5wfhf2c/ofs-ara-2026_accessible.pdf',
  landing_url: 'https://www.officeforstudents.org.uk/publications/annual-report-and-accounts-for-the-office-for-students/',
  published: '2026-07-14',
  reviewed: '2026-09-26',
  period: '1 April 2025 to 31 March 2026',
  scope: 'England; each metric retains its own population and reporting period.',
} as const

export interface OfsReportMetric extends IntelligenceMetric {
  value: number
  status: 'reported' | 'forecast' | 'approximate'
  printed_page: number
  source_url: string
}

function metric(key: string, label: string, value: number, unit: string, period: string, page: number, notes: string, status: OfsReportMetric['status'] = 'reported'): OfsReportMetric {
  return { key, label, value, unit, period, printed_page: page, status, notes,
    source_reference: `OfS Annual report and accounts 2025–26, printed p. ${page} (PDF p. ${page + 1})`,
    source_url: `${OFS_ANNUAL_REPORT.url}#page=${page + 1}`, included_in_aggregates: false }
}

export const OFS_REPORT_METRICS = {
  deficit_actual: metric('deficit_actual', 'Institutions reporting a deficit', 35.8, 'percent', '2024-25', 54, 'English providers in OfS financial sustainability analysis; not the UK HESA panel.'),
  deficit_forecast: metric('deficit_forecast', 'Institutions forecasting a deficit', 42.7, 'percent', '2025-26 forecast', 54, 'Provider forecasts, not realised 2025-26 accounts.', 'forecast'),
  formal_monitoring: metric('formal_monitoring', 'Providers under formal monitoring', 108, 'providers', 'Close of AFR24 monitoring cycle', 57, 'AFR collection cycle, not a census at 31 March 2026. Monitoring does not mean insolvency.'),
  prior_monitoring: metric('prior_monitoring', 'Formal monitoring in previous cycle', 71, 'providers', 'Previous monitoring cycle', 57, 'Previous-cycle count quoted by OfS; not a like-for-like failure rate.'),
  monitored: metric('monitored', 'Providers in completed monitoring cycle', 280, 'providers', 'Cycle completed during 2025-26', 53, 'Universities and colleges for which OfS is the primary regulator.'),
  protection: metric('protection', 'Finalised student protection directions', 6, 'directions', '31 March 2026', 12, 'Finalised directions in force at financial year end.'),
  uk_growth: metric('uk_growth', 'UK recruitment change', 3.5, 'percent', '2024-25 vs 2023-24', 54, 'Providers submitting both AFR24 and AFR25.'),
  uk_shortfall: metric('uk_shortfall', 'UK recruitment against forecast', -8.6, 'percent', '2024-25', 54, 'Providers submitting both AFR24 and AFR25; negative means below forecast.'),
  international_growth: metric('international_growth', 'International recruitment change', -7.7, 'percent', '2024-25 vs 2023-24', 54, 'Providers submitting both AFR24 and AFR25.'),
  international_shortfall: metric('international_shortfall', 'International recruitment against forecast', -9, 'percent', '2024-25', 54, 'Providers submitting both AFR24 and AFR25; not a UK-wide enrolment total.'),
  restructuring: metric('restructuring', 'Sector restructuring costs', 218.2, 'GBP million', '2024-25', 55, 'OfS financial sustainability analysis; not provider-level costs.'),
  restructuring_growth: metric('restructuring_growth', 'Restructuring cost increase', 20.7, 'percent', '2024-25 vs 2023-24', 55, 'Year-on-year increase reported by OfS.'),
  forecast_accuracy: metric('forecast_accuracy', 'Course fee income against forecast', -7.3, 'percent', '2024-25', 74, 'KPM 7 aggregate forecast accuracy; negative indicates optimistic forecasts.'),
  forecast_accuracy_prior: metric('forecast_accuracy_prior', 'Course fee income against forecast', -3.4, 'percent', '2023-24', 74, 'KPM 7; not a change in actual income year on year.'),
  forecast_accuracy_earlier: metric('forecast_accuracy_earlier', 'Course fee income against forecast', 2.1, 'percent', '2022-23', 74, 'KPM 7; positive indicates pessimistic forecasts.'),
  mental_health: metric('mental_health', 'Student mental health funding', 13.9, 'GBP million', 'Financial year 2025-26', 51, 'Student transitions and mental health premium. Note 100 (p. 85): £6.1m April–July plus £7.8m August–March. Not an academic-year allocation.'),
  mental_health_prior: metric('mental_health_prior', 'Student mental health funding', 18.6, 'GBP million', 'Financial year 2024-25', 51, 'Prior financial-year comparison in the report.'),
  uni_connect: metric('uni_connect', 'Uni Connect funding', 20, 'GBP million', 'Academic year 2025-26', 50, 'Supports 29 regional partnerships; do not add to financial-year grant totals.'),
  uni_connect_partnerships: metric('uni_connect_partnerships', 'Uni Connect regional partnerships', 29, 'partnerships', 'Academic year 2025-26', 50, 'Programme coverage, not a count of universities.'),
  disability_full_time: metric('disability_full_time', 'Full-time undergraduates reporting disability', 19.9, 'percent', 'Academic year 2023-24', 50, 'England; reported disability, not all mental distress.'),
  disability_part_time: metric('disability_part_time', 'Part-time undergraduates reporting disability', 24.6, 'percent', 'Academic year 2023-24', 50, 'England; not interchangeable with full-time undergraduate prevalence.'),
  harassment: metric('harassment', 'Respondents reporting sexual harassment', 24.5, 'percent', 'Sexual misconduct survey 2025', 51, 'Final-year undergraduate respondents in England, since starting studies; not all students.'),
  assault: metric('assault', 'Respondents reporting sexual assault or violence', 14.1, 'percent', 'Sexual misconduct survey 2025', 51, 'Final-year undergraduate respondents in England, since starting studies; not an annual incidence rate.'),
  teaching_positive: metric('teaching_positive', 'Positive about teaching', 86.9, 'percent', 'NSS 2025', 46, 'Students studying in England; theme positivity, not overall satisfaction.'),
  teaching_positive_prior: metric('teaching_positive_prior', 'Positive about teaching', 85.3, 'percent', 'NSS 2024', 46, 'England; same teaching theme comparison.'),
  organisation_positive: metric('organisation_positive', 'Positive about organisation and management', 78.5, 'percent', 'NSS 2025', 46, 'England. Uses precise text value, not rounded infographic value on p. 45.'),
  teaching_grant: metric('teaching_grant', 'Teaching grants', 1244.090, 'GBP million', 'Year ended 31 March 2026', 138, 'Note 3: £1,244,090 thousand, converted to millions. OfS grant expenditure, not total university income.'),
  national_grant: metric('national_grant', 'National facilities and regulatory initiatives', 49.886, 'GBP million', 'Year ended 31 March 2026', 138, 'Note 3: £49,886 thousand, converted to millions.'),
  capital_grant: metric('capital_grant', 'Capital grants', 84.474, 'GBP million', 'Year ended 31 March 2026', 138, 'Note 3: £84,474 thousand, converted to millions; not university estate values.'),
  other_grant: metric('other_grant', 'Other government allocations', 8.403, 'GBP million', 'Year ended 31 March 2026', 138, 'Note 3: £8,403 thousand, converted to millions.'),
  total_grant: metric('total_grant', 'Total OfS grants', 1386.853, 'GBP million', 'Year ended 31 March 2026', 138, 'Sum of Note 3 categories, separate from OfS operating expenses and university aggregates.'),
  total_grant_prior: metric('total_grant_prior', 'Total OfS grants, prior year', 1573.922, 'GBP million', 'Year ended 31 March 2025', 138, 'Re-presented comparator excludes reclassified non-pay programme costs; not the originally published total.'),
  subcontract_leads: metric('subcontract_leads', 'Registered lead providers', 104, 'providers', 'Academic year 2024-25', 60, 'Providers using subcontractual arrangements.'),
  subcontract_partners: metric('subcontract_partners', 'Delivery partners', 335, 'partners', 'Academic year 2024-25', 60, 'Report says around 335; preserve approximation.', 'approximate'),
  subcontract_registered: metric('subcontract_registered', 'OfS-registered delivery partners', 106, 'partners', 'Academic year 2024-25', 60, 'Subset of delivery partners; not all subcontracting is high risk.'),
  ai_funding: metric('ai_funding', 'AI conversion course allocations', 8.17, 'GBP million', 'Academic year 2024-25', 44, 'Allocated to 25 lead providers; not general research funding.'),
  ai_enrolments: metric('ai_enrolments', 'AI conversion course enrolments', 4460, 'enrolments', 'Academic year 2024-25', 44, 'Programme cohort only, not all AI students.'),
  ai_scholarships: metric('ai_scholarships', 'AI conversion scholarships awarded', 810, 'awards', 'Academic year 2024-25', 44, 'Actual awards, distinct from multi-year funding capacity.'),
} satisfies Record<string, OfsReportMetric>

type MetricKey = keyof typeof OFS_REPORT_METRICS
function record(id: string, title: string, summary: string, category: IntelligenceRecord['category'], keys: MetricKey[]): IntelligenceRecord {
  const metrics = keys.map((key) => OFS_REPORT_METRICS[key])
  return { id: `ofs-ara-2026-${id}`, title, summary, category, claim_type: 'regulator-publication', source_status: 'verified',
    source_id: OFS_ANNUAL_REPORT.id, publisher: 'Office for Students', source_url: metrics[0].source_url,
    source_reference: [...new Set(metrics.map((m) => m.source_reference))].join('; '),
    published_date: OFS_ANNUAL_REPORT.published, retrieved_date: OFS_ANNUAL_REPORT.reviewed,
    last_verified: OFS_ANNUAL_REPORT.reviewed, confidence: 'high', geography: 'England',
    period: '2025-26 report; individual metric periods retained', metrics,
    notes: 'Verified transcription of the supplied official report. Forecasts remain forecasts. Excluded from provider aggregates and System Watch v1.0 calculation.' }
}

export const OFS_ANNUAL_REPORT_RECORDS: IntelligenceRecord[] = [
  record('resilience', 'Financial monitoring intensified across English higher education', 'OfS reports 108 providers under formal monitoring after AFR24, compared with 71 in the previous cycle. Six finalised student protection directions were in force at 31 March 2026. These are regulatory measures, not counts of failed institutions.', 'he-finance', ['formal_monitoring', 'prior_monitoring', 'monitored', 'protection']),
  record('deficits', '2025–26 deficit forecasts remain above the reported 2024–25 share', '35.8% of institutions reported a deficit in 2024–25; 42.7% forecast one in 2025–26. Restructuring costs reached £218.2m. These England-level results do not replace UK provider accounts.', 'he-finance', ['deficit_actual', 'deficit_forecast', 'restructuring', 'restructuring_growth']),
  record('recruitment', 'Recruitment fell short of provider forecasts', 'Among providers submitting both AFR24 and AFR25, UK recruitment grew by 3.5% but was 8.6% below forecast; international recruitment declined by 7.7% and was 9.0% below forecast.', 'students', ['uk_growth', 'uk_shortfall', 'international_growth', 'international_shortfall']),
  record('forecasting', 'Course fee forecasts became more optimistic', 'OfS KPM 7 reports actual fee income 7.3% below forecast in 2024–25, compared with 3.4% below in 2023–24 and 2.1% above in 2022–23. This measures forecast accuracy, not annual income growth.', 'he-finance', ['forecast_accuracy', 'forecast_accuracy_prior', 'forecast_accuracy_earlier']),
  record('support', 'Student support funding spans distinct financial and academic years', 'The report records £13.9m for student transitions and mental health in financial year 2025–26 and £20m for Uni Connect in academic year 2025–26. These are separate programmes and periods.', 'students', ['mental_health', 'mental_health_prior', 'uni_connect', 'uni_connect_partnerships']),
  record('experience', 'NSS teaching positivity increased in England', '86.9% responded positively to teaching in NSS 2025, up from 85.3% in 2024. Organisation and management positivity was 78.5%. Theme scores must not be labelled overall satisfaction.', 'students', ['teaching_positive', 'teaching_positive_prior', 'organisation_positive']),
  record('protection', 'Student experience evidence highlights disability and safety concerns', 'The report combines 2023–24 disability statistics with the 2025 sexual misconduct survey. Survey prevalence refers to final-year undergraduate respondents in England since starting their studies, not all students or incidents in one year.', 'students', ['disability_full_time', 'disability_part_time', 'harassment', 'assault']),
  record('grants', 'OfS distributed £1.387bn in grants in financial year 2025–26', 'Note 3 records £1,386.853m in grant expenditure, including £1,244.090m teaching and £84.474m capital funding. The £1,573.922m prior-year comparator is re-presented. These are regulator disbursements, not total sector income.', 'he-finance', ['total_grant', 'total_grant_prior', 'teaching_grant', 'capital_grant', 'national_grant', 'other_grant']),
  record('subcontracting', 'Subcontractual provision involved 104 registered lead providers', 'In 2024–25, 104 lead providers worked with around 335 delivery partners, of which 106 were registered with OfS. These counts describe coverage, not individual compliance judgements.', 'policy', ['subcontract_leads', 'subcontract_partners', 'subcontract_registered']),
  record('ai-courses', 'AI conversion programmes supported 4,460 enrolments', 'In 2024–25, OfS allocated £8.17m to 25 lead providers for AI and data science conversion courses; the programme recorded 4,460 enrolments and 810 scholarship awards.', 'students', ['ai_funding', 'ai_enrolments', 'ai_scholarships']),
]
