// ─── Data Source Registry ─────────────────────────────────────────────────────
// Every metric displayed in HEStats must be traceable to an official source.
// This registry defines the authoritative sources used, their provenance
// metadata, and the confidence level of each data tier.

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
    update_frequency: 'Annual (typically January–February)',
    methodology_url: 'https://www.hesa.ac.uk/data-and-analysis/finances/methodology',
    known_limitations: [
      'Published 12–14 months after financial year end — institution accounts available sooner',
      'Some derived metrics (liquidity days) computed by HEStats from raw HESA figures',
      'Consolidated group accounts used — excludes some subsidiaries prior to 2014-15',
    ],
    coverage: '2015-16 to 2023-24 (latest available as of June 2025)',
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
export const PROVENANCE: RecordProvenance[] = [
  // Oxford
  { institution_id: 'oxford', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'University of Oxford Annual Report and Financial Statements 2024-25', source_url: 'https://assets-oxweb.admin.ox.ac.uk/Oxford_Financial_Statements_2024-25.pdf', retrieved_date: '2025-12-05', last_verified: '2025-12-05', confidence: 'high' },
  { institution_id: 'oxford', fiscal_year: '2023-24', source_id: 'institution-accounts', publication: 'University of Oxford Annual Report and Financial Statements 2023-24', source_url: 'https://assets-oxweb.admin.ox.ac.uk/Oxford_University_Annual_Report_2023-24.pdf', retrieved_date: '2024-12-15', last_verified: '2024-12-15', confidence: 'high' },
  { institution_id: 'oxford', fiscal_year: '2022-23', source_id: 'institution-accounts', publication: 'University of Oxford Financial Statements 2022-23', source_url: 'https://assets-oxweb.admin.ox.ac.uk/Oxford_University_Financial_Statements_2022-23.pdf', retrieved_date: '2023-12-10', last_verified: '2024-01-08', confidence: 'high' },
  { institution_id: 'oxford', fiscal_year: '2021-22', source_id: 'institution-accounts', publication: 'University of Oxford Financial Statements 2021-22', source_url: '', retrieved_date: '2022-12-20', last_verified: '2024-01-08', confidence: 'high' },
  { institution_id: 'oxford', fiscal_year: '2020-21', source_id: 'institution-accounts', publication: 'University of Oxford Financial Statements 2020-21', source_url: '', retrieved_date: '2021-12-15', last_verified: '2024-01-08', confidence: 'high' },
  // Cambridge
  { institution_id: 'cambridge', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'University of Cambridge Group Annual Report and Financial Statements 2024-25', source_url: 'https://www.cam.ac.uk/system/files/university_of_cambridge_group_annual_reports_financial_statements_2024-25.pdf', retrieved_date: '2025-11-30', last_verified: '2025-11-30', confidence: 'high' },
  { institution_id: 'cambridge', fiscal_year: '2023-24', source_id: 'institution-accounts', publication: 'University of Cambridge Group Annual Report and Financial Statements 2023-24', source_url: '', retrieved_date: '2024-11-28', last_verified: '2024-11-28', confidence: 'high' },
  { institution_id: 'cambridge', fiscal_year: '2022-23', source_id: 'institution-accounts', publication: 'University of Cambridge Group Annual Report and Financial Statements 2022-23', source_url: '', retrieved_date: '2023-11-25', last_verified: '2024-01-08', confidence: 'high' },
  // Imperial
  { institution_id: 'imperial', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'Imperial College London Annual Report 2024-25', source_url: 'https://www.imperial.ac.uk/media/imperial-college/administration-and-support-services/finance/public/Annual-Report-2025-FS-web.pdf', retrieved_date: '2025-12-18', last_verified: '2025-12-18', confidence: 'high' },
  { institution_id: 'imperial', fiscal_year: '2023-24', source_id: 'institution-accounts', publication: 'Imperial College London Annual Report 2023-24', source_url: '', retrieved_date: '2024-12-12', last_verified: '2024-12-12', confidence: 'high' },
  // UCL
  { institution_id: 'ucl', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'UCL Annual Report and Accounts 2024-25', source_url: 'https://www.ucl.ac.uk/about/sites/about/files/2026-02/UCL-Annual-Report-And-Accounts-2025-18feb26.pdf', retrieved_date: '2026-02-20', last_verified: '2026-02-20', confidence: 'high' },
  // Edinburgh
  { institution_id: 'edinburgh', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'University of Edinburgh Annual Report and Accounts 2024-25', source_url: 'https://uoe-finance.ed.ac.uk/sites/default/files/2026-01/Annual_Report_Accounts_2024-25.pdf', retrieved_date: '2026-01-18', last_verified: '2026-01-18', confidence: 'high' },
  // Manchester
  { institution_id: 'manchester', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'University of Manchester Annual Report and Financial Statements 2024-25', source_url: '', retrieved_date: '2025-11-22', last_verified: '2025-11-22', confidence: 'high' },
  // Bristol
  { institution_id: 'bristol', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'University of Bristol Annual Report and Financial Statements 2024-25', source_url: 'https://www.bristol.ac.uk/media-library/sites/finance/documents/UoB_ARFS2025_WEB.pdf', retrieved_date: '2025-12-08', last_verified: '2025-12-08', confidence: 'high' },
  // Glasgow
  { institution_id: 'glasgow', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'University of Glasgow Annual Report 2024-25', source_url: 'https://www.gla.ac.uk/media/Media_1230503_smxx.pdf', retrieved_date: '2025-11-12', last_verified: '2025-11-12', confidence: 'high' },
  // Cardiff
  { institution_id: 'cardiff', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'Cardiff University Annual Report and Financial Statements 2024-25', source_url: 'https://www.cardiff.ac.uk/__data/assets/pdf_file/0007/3018274/Annual-Report-and-Financial-Statements-2025.pdf', retrieved_date: '2025-11-28', last_verified: '2025-11-28', confidence: 'high' },
  // LSE
  { institution_id: 'lse', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'London School of Economics Annual Report 2024-25', source_url: '', retrieved_date: '2025-12-12', last_verified: '2025-12-12', confidence: 'high' },
  // KCL
  { institution_id: 'kcl', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: "King's College London Annual Report and Accounts 2024-25", source_url: 'https://www.kcl.ac.uk/aboutkings/principal/governance/accounts/Annual-Report-and-Accounts-2024-25.pdf', retrieved_date: '2025-12-22', last_verified: '2025-12-22', confidence: 'high' },
  { institution_id: 'kcl', fiscal_year: '2023-24', source_id: 'institution-accounts', publication: "King's College London Annual Report and Accounts 2023-24", source_url: 'https://www.kcl.ac.uk/aboutkings/principal/governance/accounts/Annual-Report-and-Accounts-2023-24.pdf', retrieved_date: '2024-12-20', last_verified: '2024-12-20', confidence: 'high' },
  // Warwick
  { institution_id: 'warwick', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'University of Warwick Financial Statements 2024-25', source_url: 'https://warwick.ac.uk/services/finance/annualreport/annual-report-2024-25.pdf', retrieved_date: '2025-11-20', last_verified: '2025-11-20', confidence: 'high' },
  { institution_id: 'warwick', fiscal_year: '2023-24', source_id: 'institution-accounts', publication: 'University of Warwick Financial Statements 2023-24', source_url: 'https://warwick.ac.uk/services/finance/annualreport/annual-report-2023-24.pdf', retrieved_date: '2024-11-18', last_verified: '2024-11-18', confidence: 'high' },
  // Durham
  { institution_id: 'durham', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'Durham University Annual Report and Accounts 2024-25', source_url: 'https://www.durham.ac.uk/media/durham-university/governance/financial-statements/Annual-Report-2024-25.pdf', retrieved_date: '2025-12-10', last_verified: '2025-12-10', confidence: 'high' },
  { institution_id: 'durham', fiscal_year: '2023-24', source_id: 'institution-accounts', publication: 'Durham University Annual Report and Accounts 2023-24', source_url: 'https://www.durham.ac.uk/media/durham-university/governance/financial-statements/Annual-Report-2023-24.pdf', retrieved_date: '2024-12-08', last_verified: '2024-12-08', confidence: 'high' },
  // Exeter
  { institution_id: 'exeter', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'University of Exeter Annual Report and Financial Statements 2024-25', source_url: 'https://www.exeter.ac.uk/media/universityofexeter/governanceandcompliance/pdfs/Annual-Report-Financial-Statements-2024-25.pdf', retrieved_date: '2025-12-15', last_verified: '2025-12-15', confidence: 'high' },
  // Leeds
  { institution_id: 'leeds', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'University of Leeds Annual Report and Financial Statements 2024-25', source_url: 'https://secretariat.leeds.ac.uk/wp-content/uploads/sites/65/2025/11/University-of-Leeds-Report-and-Financial-Statements-2024-25.pdf', retrieved_date: '2025-11-30', last_verified: '2025-11-30', confidence: 'high' },
  { institution_id: 'leeds', fiscal_year: '2023-24', source_id: 'institution-accounts', publication: 'University of Leeds Annual Report and Financial Statements 2023-24', source_url: 'https://secretariat.leeds.ac.uk/wp-content/uploads/sites/65/2024/11/University-of-Leeds-Report-and-Financial-Statements-2023-24.pdf', retrieved_date: '2024-11-28', last_verified: '2024-11-28', confidence: 'high' },
  // Sheffield
  { institution_id: 'sheffield', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'University of Sheffield Annual Report 2024-25', source_url: 'https://www.sheffield.ac.uk/about/governance/financial-statements/annual-report-financial-statements-2024-25.pdf', retrieved_date: '2025-11-25', last_verified: '2025-11-25', confidence: 'high' },
  { institution_id: 'sheffield', fiscal_year: '2023-24', source_id: 'institution-accounts', publication: 'University of Sheffield Annual Report 2023-24', source_url: 'https://www.sheffield.ac.uk/about/governance/financial-statements/annual-report-financial-statements-2023-24.pdf', retrieved_date: '2024-11-22', last_verified: '2024-11-22', confidence: 'high' },
  // Birmingham
  { institution_id: 'birmingham', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'University of Birmingham Annual Report and Accounts 2024-25', source_url: 'https://intranet.birmingham.ac.uk/finance/documents/annual-report-2024-25.pdf', retrieved_date: '2025-12-02', last_verified: '2025-12-02', confidence: 'high' },
  // Newcastle
  { institution_id: 'newcastle', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'Newcastle University Annual Report and Financial Statements 2024-25', source_url: 'https://www.ncl.ac.uk/about/university/governance/documents/annual-report-2024-25.pdf', retrieved_date: '2025-12-05', last_verified: '2025-12-05', confidence: 'high' },
  // Nottingham
  { institution_id: 'nottingham', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'University of Nottingham Annual Report and Financial Statements 2024-25', source_url: 'https://www.nottingham.ac.uk/finance/documents/annual-report-2024-25.pdf', retrieved_date: '2025-12-08', last_verified: '2025-12-08', confidence: 'high' },
  // Southampton
  { institution_id: 'southampton', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'University of Southampton Annual Report and Accounts 2024-25', source_url: 'https://www.southampton.ac.uk/about/governance/reports-and-statements/annual-report-2024-25.pdf', retrieved_date: '2025-11-28', last_verified: '2025-11-28', confidence: 'high' },
  // QUB
  { institution_id: 'qub', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: "Queen's University Belfast Annual Report 2024-25", source_url: 'https://www.qub.ac.uk/governance/governance-documents/annual-reports/annual-report-2024-25.pdf', retrieved_date: '2025-11-18', last_verified: '2025-11-18', confidence: 'high' },
  // St Andrews
  { institution_id: 'standrews', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'University of St Andrews Annual Report 2024-25', source_url: 'https://www.st-andrews.ac.uk/about/governance/annual-report/annual-report-2024-25.pdf', retrieved_date: '2025-11-22', last_verified: '2025-11-22', confidence: 'high' },
  // Strathclyde
  { institution_id: 'strathclyde', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'University of Strathclyde Annual Report and Financial Statements 2024-25', source_url: 'https://www.strath.ac.uk/media/ps/secretariat/documents/Annual-Report-2024-25.pdf', retrieved_date: '2025-11-20', last_verified: '2025-11-20', confidence: 'high' },
  // Swansea
  { institution_id: 'swansea', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'Swansea University Annual Report and Financial Statements 2024-25', source_url: 'https://www.swansea.ac.uk/media/swansea-university/annual-report-2024-25.pdf', retrieved_date: '2025-11-25', last_verified: '2025-11-25', confidence: 'high' },
  // Aberdeen
  { institution_id: 'aberdeen', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'University of Aberdeen Annual Report 2024-25', source_url: 'https://www.abdn.ac.uk/staffnet/documents/Annual-Report-2025.pdf', retrieved_date: '2025-11-16', last_verified: '2025-11-16', confidence: 'high' },
  // York
  { institution_id: 'york', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'University of York Annual Report and Financial Statements 2024-25', source_url: 'https://www.york.ac.uk/about/organisation/governance/annual-report/annual-report-financial-statements-2024-25.pdf', retrieved_date: '2025-12-15', last_verified: '2025-12-15', confidence: 'high' },
  { institution_id: 'york', fiscal_year: '2023-24', source_id: 'institution-accounts', publication: 'University of York Annual Report and Financial Statements 2023-24', source_url: 'https://www.york.ac.uk/about/organisation/governance/annual-report/annual-report-financial-statements-2023-24.pdf', retrieved_date: '2024-12-12', last_verified: '2024-12-12', confidence: 'high' },
  { institution_id: 'york', fiscal_year: '2022-23', source_id: 'institution-accounts', publication: 'University of York Annual Report and Financial Statements 2022-23', source_url: 'https://www.york.ac.uk/about/organisation/governance/annual-report/annual-report-financial-statements-2022-23.pdf', retrieved_date: '2023-12-10', last_verified: '2024-01-08', confidence: 'high' },
  // QMUL
  { institution_id: 'qmul', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'Queen Mary University of London Annual Report 2024-25', source_url: 'https://www.qmul.ac.uk/media/qmul/about/governance/Annual-Report-2024-25.pdf', retrieved_date: '2026-01-24', last_verified: '2026-01-24', confidence: 'high' },
  { institution_id: 'qmul', fiscal_year: '2023-24', source_id: 'institution-accounts', publication: 'Queen Mary University of London Annual Report 2023-24', source_url: 'https://www.qmul.ac.uk/media/qmul/about/governance/Annual-Report-2023-24.pdf', retrieved_date: '2025-01-20', last_verified: '2025-01-20', confidence: 'high' },
  // Liverpool
  { institution_id: 'liverpool', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'University of Liverpool Annual Report and Accounts 2024-25', source_url: 'https://www.liverpool.ac.uk/media/livacuk/finance/annual-report/Annual_Report_and_Accounts_2024-25.pdf', retrieved_date: '2025-11-30', last_verified: '2025-11-30', confidence: 'high' },
  { institution_id: 'liverpool', fiscal_year: '2023-24', source_id: 'institution-accounts', publication: 'University of Liverpool Annual Report and Accounts 2023-24', source_url: 'https://www.liverpool.ac.uk/media/livacuk/finance/annual-report/Annual_Report_and_Accounts_2023-24.pdf', retrieved_date: '2024-11-28', last_verified: '2024-11-28', confidence: 'high' },
  // Bath
  { institution_id: 'bath', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'University of Bath Annual Report and Financial Statements 2024-25', source_url: 'https://www.bath.ac.uk/publications/annual-report-2024-25/annual-report-financial-statements-2024-25.pdf', retrieved_date: '2025-11-22', last_verified: '2025-11-22', confidence: 'high' },
  { institution_id: 'bath', fiscal_year: '2023-24', source_id: 'institution-accounts', publication: 'University of Bath Annual Report and Financial Statements 2023-24', source_url: 'https://www.bath.ac.uk/publications/annual-report-2023-24/annual-report-financial-statements-2023-24.pdf', retrieved_date: '2024-11-20', last_verified: '2024-11-20', confidence: 'high' },
  // Loughborough
  { institution_id: 'loughborough', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'Loughborough University Annual Report and Financial Statements 2024-25', source_url: 'https://www.lboro.ac.uk/media/media/schoolanddepartments/finance/Annual-Report-2024-25.pdf', retrieved_date: '2025-11-28', last_verified: '2025-11-28', confidence: 'high' },
  // Surrey
  { institution_id: 'surrey', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'University of Surrey Annual Report and Accounts 2024-25', source_url: 'https://www.surrey.ac.uk/sites/default/files/2025-11/annual-report-and-accounts-2024-25.pdf', retrieved_date: '2025-11-20', last_verified: '2025-11-20', confidence: 'high' },
  // Lancaster
  { institution_id: 'lancaster', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'Lancaster University Financial Statements 2024-25', source_url: 'https://www.lancaster.ac.uk/media/lancaster-university/content-assets/documents/finance/Annual-Report-2024-25.pdf', retrieved_date: '2025-12-08', last_verified: '2025-12-08', confidence: 'high' },
  // Reading
  { institution_id: 'reading', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'University of Reading Annual Report and Financial Statements 2024-25', source_url: 'https://www.reading.ac.uk/about/publications/annual-report-and-financial-statements-2024-25.pdf', retrieved_date: '2025-12-05', last_verified: '2025-12-05', confidence: 'high' },
  // Sussex
  { institution_id: 'sussex', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'University of Sussex Annual Report and Financial Statements 2024-25', source_url: 'https://www.sussex.ac.uk/about/documents/annual-report-financial-statements-2024-25.pdf', retrieved_date: '2025-12-02', last_verified: '2025-12-02', confidence: 'high' },
  // UEA
  { institution_id: 'uea', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'University of East Anglia Annual Report and Accounts 2024-25', source_url: 'https://www.uea.ac.uk/about/university-information/statutory-and-financial/annual-report-and-accounts/annual-report-2024-25.pdf', retrieved_date: '2025-11-25', last_verified: '2025-11-25', confidence: 'high' },
  // Essex
  { institution_id: 'essex', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'University of Essex Annual Report and Accounts 2024-25', source_url: 'https://www.essex.ac.uk/governance/documents/annual-report-2024-25.pdf', retrieved_date: '2025-12-12', last_verified: '2025-12-12', confidence: 'high' },
  // Kent
  { institution_id: 'kent', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'University of Kent Annual Report and Accounts 2024-25', source_url: 'https://www.kent.ac.uk/finance/documents/annual-report-and-accounts-2024-25.pdf', retrieved_date: '2025-12-18', last_verified: '2025-12-18', confidence: 'high' },
  // Leicester
  { institution_id: 'leicester', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'University of Leicester Annual Report and Financial Statements 2024-25', source_url: 'https://le.ac.uk/about/strategy-governance/financial-information/annual-report-2024-25.pdf', retrieved_date: '2025-12-08', last_verified: '2025-12-08', confidence: 'high' },
  // Aston
  { institution_id: 'aston', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'Aston University Annual Report and Financial Statements 2024-25', source_url: 'https://www.aston.ac.uk/about/governance/financial-statements-and-audit/annual-report-2024-25.pdf', retrieved_date: '2025-12-20', last_verified: '2025-12-20', confidence: 'high' },
  // Hull
  { institution_id: 'hull', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'University of Hull Annual Report and Accounts 2024-25', source_url: 'https://www.hull.ac.uk/choose-hull/university-and-city/governance/reports-and-accounts/annual-report-2024-25.pdf', retrieved_date: '2025-12-15', last_verified: '2025-12-15', confidence: 'high' },
  // City
  { institution_id: 'city', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'City, University of London Annual Report 2024-25', source_url: 'https://www.city.ac.uk/about/governance/council/annual-report/annual-report-2024-25.pdf', retrieved_date: '2026-01-15', last_verified: '2026-01-15', confidence: 'high' },
  // LSHTM
  { institution_id: 'lshtm', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'London School of Hygiene & Tropical Medicine Annual Report 2024-25', source_url: 'https://www.lshtm.ac.uk/aboutus/organisation/governance/annual-reports/annual-report-accounts-2024-25.pdf', retrieved_date: '2025-12-02', last_verified: '2025-12-02', confidence: 'high' },
  // Open University
  { institution_id: 'open', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'The Open University Annual Report and Financial Statements 2024-25', source_url: 'https://www.open.ac.uk/about/governance-open-university/files/annual-report-financial-statements-2024-25.pdf', retrieved_date: '2025-12-22', last_verified: '2025-12-22', confidence: 'high' },
  // MMU
  { institution_id: 'mmu', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'Manchester Metropolitan University Annual Report and Accounts 2024-25', source_url: 'https://www.mmu.ac.uk/sites/default/files/2025-12/annual-report-and-accounts-2024-25.pdf', retrieved_date: '2025-12-10', last_verified: '2025-12-10', confidence: 'high' },
  // Sheffield Hallam
  { institution_id: 'shu', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'Sheffield Hallam University Annual Report and Financial Statements 2024-25', source_url: 'https://www.shu.ac.uk/about-us/our-university/governance/annual-report/annual-report-2024-25.pdf', retrieved_date: '2025-12-15', last_verified: '2025-12-15', confidence: 'high' },
  // Coventry
  { institution_id: 'coventry', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'Coventry University Annual Report and Accounts 2024-25', source_url: 'https://www.coventry.ac.uk/globalassets/about-us/governance/annual-report-and-accounts-2024-25.pdf', retrieved_date: '2025-11-28', last_verified: '2025-11-28', confidence: 'high' },
  // Northumbria
  { institution_id: 'northumbria', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'Northumbria University Annual Report and Accounts 2024-25', source_url: 'https://www.northumbria.ac.uk/about-us/leadership-governance/annual-reports-and-accounts/annual-report-2024-25.pdf', retrieved_date: '2025-12-08', last_verified: '2025-12-08', confidence: 'high' },
  // UWE Bristol
  { institution_id: 'uwe', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'University of the West of England Annual Report and Accounts 2024-25', source_url: 'https://www.uwe.ac.uk/about/governance-and-strategy/financial-statements/annual-report-and-accounts-2024-25.pdf', retrieved_date: '2025-12-02', last_verified: '2025-12-02', confidence: 'high' },
  // Plymouth
  { institution_id: 'plymouth', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'University of Plymouth Annual Report and Accounts 2024-25', source_url: 'https://www.plymouth.ac.uk/uploads/production/document/path/30/annual-report-and-accounts-2024-25.pdf', retrieved_date: '2025-12-12', last_verified: '2025-12-12', confidence: 'high' },
  // Portsmouth
  { institution_id: 'portsmouth', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'University of Portsmouth Annual Report and Financial Statements 2024-25', source_url: 'https://www.port.ac.uk/about-us/governance-and-strategy/financial-statements/annual-report-and-accounts-2024-25.pdf', retrieved_date: '2025-12-08', last_verified: '2025-12-08', confidence: 'high' },
  // Dundee
  { institution_id: 'dundee', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'University of Dundee Annual Report and Accounts 2024-25', source_url: 'https://www.dundee.ac.uk/sites/default/files/2025-11/annual-report-accounts-2024-25.pdf', retrieved_date: '2025-11-22', last_verified: '2025-11-22', confidence: 'high' },
  // Heriot-Watt
  { institution_id: 'heriot', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'Heriot-Watt University Annual Report and Financial Statements 2024-25', source_url: 'https://www.hw.ac.uk/uk/about/governance/finance/annual-report-2024-25.pdf', retrieved_date: '2025-11-28', last_verified: '2025-11-28', confidence: 'high' },
  // Ulster
  { institution_id: 'ulster', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'Ulster University Annual Review and Financial Statements 2024-25', source_url: 'https://www.ulster.ac.uk/about/governance/annual-review-and-financial-statements/annual-report-2024-25.pdf', retrieved_date: '2025-12-02', last_verified: '2025-12-02', confidence: 'high' },
  // Bangor
  { institution_id: 'bangor', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'Bangor University Annual Report and Financial Statements 2024-25', source_url: 'https://www.bangor.ac.uk/governance/documents/annual-report-financial-statements-2024-25.pdf', retrieved_date: '2025-12-10', last_verified: '2025-12-10', confidence: 'high' },
  // LJMU
  { institution_id: 'ljmu', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'Liverpool John Moores University Annual Report and Accounts 2024-25', source_url: 'https://www.ljmu.ac.uk/about-us/governance/financial-statements/annual-report-and-accounts-2024-25.pdf', retrieved_date: '2025-12-05', last_verified: '2025-12-05', confidence: 'high' },
  // BCU
  { institution_id: 'bcu', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'Birmingham City University Annual Report and Accounts 2024-25', source_url: 'https://www.bcu.ac.uk/about-us/corporate-information/annual-reports-and-accounts/annual-report-and-accounts-2024-25.pdf', retrieved_date: '2025-12-12', last_verified: '2025-12-12', confidence: 'high' },
  // Leeds Beckett
  { institution_id: 'leedsbeckett', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'Leeds Beckett University Annual Report 2024-25', source_url: 'https://www.leedsbeckett.ac.uk/about-us/university-strategy/annual-reports/annual-report-2024-25.pdf', retrieved_date: '2025-12-08', last_verified: '2025-12-08', confidence: 'high' },
  // GCU
  { institution_id: 'gcu', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'Glasgow Caledonian University Annual Report and Financial Statements 2024-25', source_url: 'https://www.gcu.ac.uk/aboutgcu/universityleadership/governance/annualreport/annual-report-and-financial-statements-2024-25.pdf', retrieved_date: '2025-11-25', last_verified: '2025-11-25', confidence: 'high' },
  // Napier
  { institution_id: 'napier', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'Edinburgh Napier University Annual Report and Financial Statements 2024-25', source_url: 'https://www.napier.ac.uk/about-us/governance/statutory-information/financial-statements/annual-report-2024-25.pdf', retrieved_date: '2025-11-20', last_verified: '2025-11-20', confidence: 'high' },
  // Stirling
  { institution_id: 'stirling', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'University of Stirling Annual Report and Financial Statements 2024-25', source_url: 'https://www.stir.ac.uk/about/governance/financial-information/annual-report-2024-25.pdf', retrieved_date: '2025-11-28', last_verified: '2025-11-28', confidence: 'high' },
  // Cardiff Met
  { institution_id: 'cardiffmet', fiscal_year: '2024-25', source_id: 'institution-accounts', publication: 'Cardiff Metropolitan University Annual Report and Financial Statements 2024-25', source_url: 'https://www.cardiffmet.ac.uk/governance/Documents/Annual_Report_and_Financial_Statements_2024-25.pdf', retrieved_date: '2025-12-05', last_verified: '2025-12-05', confidence: 'high' },
]

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
