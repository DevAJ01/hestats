// ─── Data Source Registry ─────────────────────────────────────────────────────
// Every metric displayed in HEStats must be traceable to an official source.
// This registry defines the authoritative sources used, their provenance
// metadata, and the confidence level of each data tier.

import { generatedFinancialProvenance } from './generated/financialRecords'

export type SourceTier = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
export type Confidence = 'high' | 'medium' | 'provisional' | 'awaiting'
export type Licence = 'OGL-3.0' | 'CC-BY-4.0' | 'Crown-Copyright' | 'Institutional-Copyright' | 'Companies-House' | 'Charity-Commission'

export interface DataSourceDef {
  id: string
  tier: SourceTier
  publisher: string
  publisher_url: string
  dataset: string
  dataset_url: string
  description: string
  licence: Licence
  licence_url: string
  update_frequency: string
  methodology_url: string
  known_limitations: string[]
  coverage: string
}

export interface RecordProvenance {
  institution_id: string
  fiscal_year: string
  source_id: string
  publication: string
  source_url: string
  page_reference?: string
  retrieved_date: string
  last_verified: string
  confidence: Confidence
  notes?: string
}

// ─── Official Data Sources (8 tiers per the spec) ────────────────────────────
export const DATA_SOURCES: DataSourceDef[] = [
  // TIER 1: HESA
  {
    id: 'hesa-finance',
    tier: 1,
    publisher: 'Higher Education Statistics Agency (HESA)',
    publisher_url: 'https://www.hesa.ac.uk',
    dataset: 'Finance Open Data',
    dataset_url: 'https://www.hesa.ac.uk/data-and-analysis/finances',
    description: 'Sector-wide annual finance data covering income, expenditure, assets and liabilities for all UK HE providers. Published annually, typically 12–14 months after the financial year end.',
    licence: 'CC-BY-4.0',
    licence_url: 'https://www.hesa.ac.uk/about/copyright',
    update_frequency: 'Annual',
    methodology_url: 'https://www.hesa.ac.uk/data-and-analysis/finances/methodology',
    known_limitations: [
      'May 2026 finance extract includes 2015/16 to 2024/25 where providers are included in HESA Finance open data',
      'Some derived metrics (liquidity days) computed by HEStats from raw HESA figures',
      'Consolidated group accounts used — excludes some subsidiaries prior to 2014-15',
    ],
    coverage: '2015-16 to 2024-25 (HESA Finance Open Data, last updated May-26)',
  },
  {
    id: 'hesa-students',
    tier: 1,
    publisher: 'Higher Education Statistics Agency (HESA)',
    publisher_url: 'https://www.hesa.ac.uk',
    dataset: 'Student Open Data',
    dataset_url: 'https://www.hesa.ac.uk/data-and-analysis/students',
    description: 'Full student enrolment data by institution, domicile, subject, level and mode. Used for international student percentages and total FTE.',
    licence: 'CC-BY-4.0',
    licence_url: 'https://www.hesa.ac.uk/about/copyright',
    update_frequency: 'Annual (typically January)',
    methodology_url: 'https://www.hesa.ac.uk/data-and-analysis/students/methodology',
    known_limitations: [
      'FTE calculations use standard HESA mode-of-study weights',
      'Some provider-level breakdowns suppressed for disclosure control',
    ],
    coverage: '2015-16 to 2023-24',
  },
  {
    id: 'hesa-staff',
    tier: 1,
    publisher: 'Higher Education Statistics Agency (HESA)',
    publisher_url: 'https://www.hesa.ac.uk',
    dataset: 'Staff Open Data',
    dataset_url: 'https://www.hesa.ac.uk/data-and-analysis/staff',
    description: 'Academic and professional services staff headcount and FTE by institution.',
    licence: 'CC-BY-4.0',
    licence_url: 'https://www.hesa.ac.uk/about/copyright',
    update_frequency: 'Annual',
    methodology_url: 'https://www.hesa.ac.uk/data-and-analysis/staff/methodology',
    known_limitations: ['Some small provider data suppressed'],
    coverage: '2015-16 to 2023-24',
  },
  // TIER 2: DfE
  {
    id: 'dfe-ees',
    tier: 2,
    publisher: 'Department for Education',
    publisher_url: 'https://www.gov.uk/government/organisations/department-for-education',
    dataset: 'Explore Education Statistics',
    dataset_url: 'https://explore-education-statistics.service.gov.uk',
    description: 'DfE statistical releases covering graduate outcomes (LEO), student loan forecasts, and HE participation rates.',
    licence: 'OGL-3.0',
    licence_url: 'https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/',
    update_frequency: 'Varies by release — typically annual',
    methodology_url: 'https://explore-education-statistics.service.gov.uk/methodology',
    known_limitations: [
      'Graduate outcomes data subject to 3–5 year lag from graduation year',
      'LEO data matched on earnings — lower-earning graduates may be under-represented',
    ],
    coverage: 'Academic years 2015-16 to 2023-24 (varies by dataset)',
  },
  // TIER 3: SLC
  {
    id: 'slc-statistics',
    tier: 3,
    publisher: 'Student Loans Company',
    publisher_url: 'https://www.slc.co.uk',
    dataset: 'SLC Statistics: Student support for higher education',
    dataset_url: 'https://www.slc.co.uk/official-statistics.aspx',
    description: 'Official statistics on student loan balances, repayments, and tuition fee loan disbursements by provider.',
    licence: 'OGL-3.0',
    licence_url: 'https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/',
    update_frequency: 'Annual (Financial Year data)',
    methodology_url: 'https://www.slc.co.uk/statistical-methodology.aspx',
    known_limitations: [
      'Provider-level data only available in aggregate',
      'Repayment data cannot be attributed to specific providers',
    ],
    coverage: '2015-16 to 2023-24',
  },
  // TIER 4: OfS
  {
    id: 'ofs-register',
    tier: 4,
    publisher: 'Office for Students',
    publisher_url: 'https://www.officeforstudents.org.uk',
    dataset: 'OfS Register of Higher Education Providers',
    dataset_url: 'https://www.officeforstudents.org.uk/advice-and-guidance/the-register/the-ofs-register/',
    description: 'Definitive register of all OfS-registered higher education providers in England, including provider status, conditions of registration, and regulatory decisions.',
    licence: 'OGL-3.0',
    licence_url: 'https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/',
    update_frequency: 'Continuously updated',
    methodology_url: 'https://www.officeforstudents.org.uk/advice-and-guidance/regulation/registration-with-the-ofs/',
    known_limitations: [
      'England providers only — HESA data used for Scotland/Wales/Northern Ireland',
      'Registration status changes may not be immediately reflected in HEStats',
    ],
    coverage: '2018 to present (OfS established 2018)',
  },
  {
    id: 'ofs-afr',
    tier: 4,
    publisher: 'Office for Students',
    publisher_url: 'https://www.officeforstudents.org.uk',
    dataset: 'Annual Financial Return (AFR)',
    dataset_url: 'https://www.officeforstudents.org.uk/data-and-analysis/financial-health-of-the-he-sector/',
    description: 'The OfS AFR workbook defines the canonical concept families for English HE finances. HEStats normalises all financial metrics to AFR categories.',
    licence: 'OGL-3.0',
    licence_url: 'https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/',
    update_frequency: 'Annual (submitted by registered providers)',
    methodology_url: 'https://www.officeforstudents.org.uk/publications/annual-financial-return-guidance/',
    known_limitations: [
      'AFR submission data not publicly released at provider level',
      'Sector-level analysis published by OfS — institution figures from HESA/annual reports',
    ],
    coverage: '2018-19 to 2023-24 (AFR concept framework)',
  },
  // TIER 5: UCAS
  {
    id: 'ucas-stats',
    tier: 5,
    publisher: 'UCAS',
    publisher_url: 'https://www.ucas.com',
    dataset: 'UCAS End of Cycle Data Resources',
    dataset_url: 'https://www.ucas.com/data-and-analysis/undergraduate-statistics-and-reports',
    description: 'Annual applications, offers, and acceptances by subject and institution. Used for demand and applicant demographics analysis.',
    licence: 'CC-BY-4.0',
    licence_url: 'https://www.ucas.com/about-us/terms-conditions-and-policies/data-use',
    update_frequency: 'Annual (January after cycle end)',
    methodology_url: 'https://www.ucas.com/data-and-analysis/ucas-statistical-releases/ucas-undergraduate-end-cycle-data-resources',
    known_limitations: [
      'Covers UCAS-coordinated admissions only — postgraduate data limited',
      'Some small providers may have cells suppressed',
    ],
    coverage: '2015 to 2024 application cycles',
  },
  // TIER 6: Institution Annual Reports
  {
    id: 'institution-accounts',
    tier: 6,
    publisher: 'Individual Higher Education Institutions',
    publisher_url: 'https://www.universities.ac.uk',
    dataset: 'Audited Annual Report and Financial Statements',
    dataset_url: '',
    description: 'Statutory audited accounts published by each institution, typically covering the financial year ending 31 July. Includes consolidated income statement, balance sheet, cash flow statement, and notes including pension liabilities and borrowing.',
    licence: 'Institutional-Copyright',
    licence_url: '',
    update_frequency: 'Annual — typically published 4–6 months after year end (November–February)',
    methodology_url: 'https://www.universitiesuk.ac.uk/universities-uk-international/latest-news-and-announcements/best-practice-guidance-financial-reporting',
    known_limitations: [
      'Published under institutional copyright — PDFs linked by permission of fair use',
      'Some metrics require normalisation across different accounting treatments',
      'Pension liability disclosure varies significantly between institutions',
      'Comparison across institutions requires care due to different fiscal year periods for some Scottish institutions',
    ],
    coverage: 'Varies by institution — typically 2015-16 to 2024-25 where published',
  },
  // TIER 7: Companies House
  {
    id: 'companies-house',
    tier: 7,
    publisher: 'Companies House',
    publisher_url: 'https://www.companieshouse.gov.uk',
    dataset: 'Company Filing History',
    dataset_url: 'https://find-and-update.company-information.service.gov.uk',
    description: 'Filed accounts and charges for institutions that are incorporated companies, including subsidiary companies and spinout entities.',
    licence: 'Companies-House',
    licence_url: 'https://www.gov.uk/guidance/companies-house-data-products',
    update_frequency: 'Continuous (as filed)',
    methodology_url: 'https://www.gov.uk/guidance/understanding-companies-house-data',
    known_limitations: [
      'Applies only to companies incorporated under the Companies Act — many charitably incorporated institutions exempt',
      'Data quality depends on timely filing by institutions',
    ],
    coverage: 'Full filing history where applicable',
  },
  // TIER 8: Charity Commission
  {
    id: 'charity-commission',
    tier: 8,
    publisher: 'Charity Commission for England and Wales',
    publisher_url: 'https://www.charitycommission.gov.uk',
    dataset: 'Charity Register and Annual Returns',
    dataset_url: 'https://register-of-charities.charitycommission.gov.uk',
    description: 'Charity annual returns, financial statements and trustee information for institutions registered as charities.',
    licence: 'OGL-3.0',
    licence_url: 'https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/',
    update_frequency: 'Annual (charity return)',
    methodology_url: 'https://www.charitycommission.gov.uk/running-a-charity/reporting-and-accounts/',
    known_limitations: [
      'Scottish charities registered with OSCR, not Charity Commission',
      'Summary financials only for most institutions — full accounts via institution website',
    ],
    coverage: '2015 to present',
  },
]

// ─── Source lookup helpers ────────────────────────────────────────────────────
export function getSourceById(id: string): DataSourceDef | undefined {
  return DATA_SOURCES.find((s) => s.id === id)
}

export function getSourcesByTier(tier: SourceTier): DataSourceDef[] {
  return DATA_SOURCES.filter((s) => s.tier === tier)
}

// ─── Per-institution provenance registry ─────────────────────────────────────
// Verified institutions have full provenance; others show "awaiting official publication"
export const PROVENANCE: RecordProvenance[] = generatedFinancialProvenance
export function getProvenance(institution_id: string, fiscal_year: string): RecordProvenance | undefined {
  return PROVENANCE.find((p) => p.institution_id === institution_id && p.fiscal_year === fiscal_year)
}

export function getInstitutionProvenance(institution_id: string): RecordProvenance[] {
  return PROVENANCE.filter((p) => p.institution_id === institution_id)
    .sort((a, b) => b.fiscal_year.localeCompare(a.fiscal_year))
}

// ─── Confidence level metadata ────────────────────────────────────────────────
export const CONFIDENCE_META: Record<Confidence, { label: string; color: string; description: string }> = {
  high: {
    label: 'Verified',
    color: 'var(--positive)',
    description: 'Sourced from audited annual financial statements published by the institution. Figures cross-referenced against HESA Finance Open Data where available.',
  },
  medium: {
    label: 'Cross-checked',
    color: 'var(--warning)',
    description: 'Sourced from an official publication but not yet cross-referenced against a second source. May be revised when HESA publishes its annual dataset.',
  },
  provisional: {
    label: 'Provisional',
    color: 'var(--warning)',
    description: 'Based on a draft or management accounts release. Will be replaced with audited figures once the institution publishes its annual report.',
  },
  awaiting: {
    label: 'Awaiting official publication',
    color: 'var(--muted)',
    description: 'Official figures have not yet been published for this year and institution. No estimated values are displayed — this cell will be populated automatically when the official source is released.',
  },
}

// ─── Metric-to-source mapping ─────────────────────────────────────────────────
// Each financial metric is sourced from a primary and optional cross-check source
export const METRIC_SOURCES: Record<string, { primary: string; crossCheck?: string; concept: string; unit: string }> = {
  revenue_gbp_m: { primary: 'institution-accounts', crossCheck: 'hesa-finance', concept: 'OfS AFR Group 1 — Total Income', unit: '£ millions, consolidated group' },
  surplus_gbp_m: { primary: 'institution-accounts', crossCheck: 'hesa-finance', concept: 'OfS AFR Group 4 — Operating Surplus / (Deficit)', unit: '£ millions' },
  surplus_margin_pct: { primary: 'institution-accounts', concept: 'Derived: Surplus ÷ Total Income × 100', unit: 'percentage points' },
  research_income_gbp_m: { primary: 'institution-accounts', crossCheck: 'hesa-finance', concept: 'OfS AFR Group 1 Category 3 — Research Grants and Contracts', unit: '£ millions' },
  tuition_fee_income_gbp_m: { primary: 'institution-accounts', crossCheck: 'hesa-finance', concept: 'OfS AFR Group 1 Category 1 — Tuition Fees and Education Contracts', unit: '£ millions' },
  other_income_gbp_m: { primary: 'institution-accounts', crossCheck: 'hesa-finance', concept: 'OfS AFR Group 1 (Other) — all income not in categories 1–3', unit: '£ millions' },
  staff_costs_gbp_m: { primary: 'institution-accounts', crossCheck: 'hesa-finance', concept: 'OfS AFR Group 2 — Staff Costs', unit: '£ millions, includes pension service charges' },
  total_expenditure_gbp_m: { primary: 'institution-accounts', crossCheck: 'hesa-finance', concept: 'OfS AFR Group 2 — Total Expenditure', unit: '£ millions' },
  cash_gbp_m: { primary: 'institution-accounts', concept: 'Balance Sheet — Cash and Cash Equivalents', unit: '£ millions at year end' },
  borrowing_gbp_m: { primary: 'institution-accounts', concept: 'Balance Sheet — External Borrowing (current + non-current)', unit: '£ millions at year end' },
  liquidity_days: { primary: 'institution-accounts', concept: 'Derived: (Cash + Short-term Investments) ÷ (Total Expenditure ÷ 365)', unit: 'calendar days' },
  international_fte_pct: { primary: 'hesa-students', concept: 'HESA Students — Non-UK domicile FTE as % total FTE', unit: 'percentage of total FTE' },
  student_fte_total: { primary: 'hesa-students', concept: 'HESA Students — Total FTE all modes and levels', unit: 'full-time equivalents' },
  capital_expenditure_gbp_m: { primary: 'institution-accounts', concept: 'Cash Flow — Capital Expenditure on fixed assets', unit: '£ millions' },
  net_assets_gbp_m: { primary: 'institution-accounts', concept: 'Balance Sheet — Total Net Assets', unit: '£ millions at year end' },
}

// ─── Licence display names ────────────────────────────────────────────────────
export const LICENCE_DISPLAY: Record<Licence, { name: string; url: string }> = {
  'OGL-3.0': { name: 'Open Government Licence v3.0', url: 'https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/' },
  'CC-BY-4.0': { name: 'Creative Commons Attribution 4.0', url: 'https://creativecommons.org/licenses/by/4.0/' },
  'Crown-Copyright': { name: 'Crown Copyright', url: 'https://www.nationalarchives.gov.uk/information-management/re-using-public-sector-information/uk-government-licensing-framework/crown-copyright/' },
  'Institutional-Copyright': { name: 'Institutional Copyright — linked under fair use', url: '' },
  'Companies-House': { name: 'Companies House — Public Register', url: 'https://www.gov.uk/guidance/companies-house-data-products' },
  'Charity-Commission': { name: 'Charity Commission Public Register', url: 'https://www.charitycommission.gov.uk' },
}
