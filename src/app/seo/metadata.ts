import { SUPPORT_LINKS } from '../data/links'
import { institutions } from '../data/institutions'
import type { Institution } from '../data/types'

export const SITE_URL = 'https://hestats.co.uk'
export const SITE_NAME = 'HEStats'
export const FOUNDER_NAME = 'Ashan Jeevanathan'
export const FOUNDER_ID = `${SITE_URL}/about/#ashan-jeevanathan`
export const ORGANIZATION_ID = `${SITE_URL}/#organization`
export const WEBSITE_ID = `${SITE_URL}/#website`
export const SOFTWARE_ID = `${SITE_URL}/#software`
export const OG_IMAGE_URL = `${SITE_URL}/og-image.svg`

export const SITE_DESCRIPTION =
  'HEStats is an independent, open-source UK higher education financial intelligence platform for university finances, rankings, graduate outcomes, open data and sector analysis.'

export const DEFAULT_KEYWORDS = [
  'UK higher education data',
  'university finances',
  'HESA finance data',
  'UK university rankings',
  'graduate outcomes',
  'open data',
]

export type ChangeFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface SeoPage {
  path: string
  title: string
  description: string
  priority: number
  changeFrequency: ChangeFrequency
  keywords: string[]
  section: string
}

export interface ResolvedSeo extends SeoPage {
  canonicalPath: string
  canonicalUrl: string
  noIndex?: boolean
  institution?: Institution
}

export const SEO_PAGES: SeoPage[] = [
  {
    path: '/',
    title: 'HEStats | UK Higher Education Financial Intelligence',
    description:
      'Compare UK university finances, rankings, graduate outcomes and open data with HEStats, an independent higher education intelligence platform built by Ashan Jeevanathan.',
    priority: 1,
    changeFrequency: 'weekly',
    section: 'Overview',
    keywords: ['HEStats', 'UK higher education financial intelligence', ...DEFAULT_KEYWORDS],
  },
  {
    path: '/universities',
    title: 'UK University Financial Profiles | HEStats',
    description:
      'Browse UK university and higher education provider profiles with finance, location, UKPRN, source coverage and verified-or-pending data status.',
    priority: 0.95,
    changeFrequency: 'weekly',
    section: 'Universities',
    keywords: ['UK universities', 'university financial profiles', 'UKPRN', 'higher education providers'],
  },
  {
    path: '/compare',
    title: 'Compare UK Universities | HEStats',
    description:
      'Compare up to six UK universities side by side across income, surplus, liquidity, borrowing, student numbers, research income and financial health.',
    priority: 0.9,
    changeFrequency: 'weekly',
    section: 'Compare',
    keywords: ['compare universities', 'UK university comparison', 'university finance comparison'],
  },
  {
    path: '/rankings',
    title: 'UK University Finance Rankings | HEStats',
    description:
      'Rank UK universities by revenue, surplus, research income, borrowing, liquidity, staff costs, financial health and other verified financial metrics.',
    priority: 0.9,
    changeFrequency: 'weekly',
    section: 'Rankings',
    keywords: ['UK university rankings', 'university finance rankings', 'highest revenue universities'],
  },
  {
    path: '/explorer',
    title: 'Higher Education Data Explorer | HEStats',
    description:
      'Explore UK higher education finance, student, geography and trend data through map, graph, timeline and table views.',
    priority: 0.85,
    changeFrequency: 'weekly',
    section: 'Explorer',
    keywords: ['higher education data explorer', 'UK university map', 'university finance visualization'],
  },
  {
    path: '/intelligence',
    title: 'Higher Education Sector Intelligence | HEStats',
    description:
      'Follow UK higher education sector intelligence, policy signals, finance alerts, graduate outcomes, labour-market analysis and source-aware briefings.',
    priority: 0.85,
    changeFrequency: 'weekly',
    section: 'Intelligence',
    keywords: ['higher education intelligence', 'UK university policy', 'sector finance alerts'],
  },
  {
    path: '/social-studio',
    title: 'Higher Education Social Studio | HEStats',
    description:
      'Create source-aware social post drafts from verified UK higher education metrics and HEStats financial intelligence cards.',
    priority: 0.55,
    changeFrequency: 'monthly',
    section: 'Intelligence',
    keywords: ['higher education social content', 'university finance social posts'],
  },
  {
    path: '/sector',
    title: 'UK Higher Education Sector Overview | HEStats',
    description:
      'View sector-wide UK higher education financial trends, aggregate income, operating margin, liquidity, borrowing and financial health signals.',
    priority: 0.8,
    changeFrequency: 'weekly',
    section: 'Sector',
    keywords: ['UK higher education sector', 'university sector finances', 'sector financial health'],
  },
  {
    path: '/reports',
    title: 'University Annual Reports Registry | HEStats',
    description:
      'Access the HEStats registry of university annual reports, audited accounts, source documents and finance provenance for UK higher education providers.',
    priority: 0.8,
    changeFrequency: 'weekly',
    section: 'Reports',
    keywords: ['university annual reports', 'audited accounts', 'higher education finance sources'],
  },
  {
    path: '/graduate-outcomes',
    title: 'Graduate Outcomes Data | HEStats',
    description:
      'Explore graduate employment, salary and outcomes indicators for UK higher education with source status and confidence metadata.',
    priority: 0.75,
    changeFrequency: 'weekly',
    section: 'Students and Careers',
    keywords: ['graduate outcomes', 'graduate salaries', 'UK graduate employment'],
  },
  {
    path: '/employers',
    title: 'Graduate Employer Intelligence | HEStats',
    description:
      'Understand graduate employer markets, industry demand and labour-market signals connected to UK higher education outcomes.',
    priority: 0.7,
    changeFrequency: 'monthly',
    section: 'Students and Careers',
    keywords: ['graduate employers', 'labour market intelligence', 'UK graduate jobs'],
  },
  {
    path: '/degrees',
    title: 'Degree Intelligence | HEStats',
    description:
      'Compare degree and subject-level intelligence across graduate outcomes, labour markets, AI exposure and skills demand.',
    priority: 0.7,
    changeFrequency: 'monthly',
    section: 'Students and Careers',
    keywords: ['degree intelligence', 'subject outcomes', 'AI exposure degrees'],
  },
  {
    path: '/career-explorer',
    title: 'Career Explorer | HEStats',
    description:
      'Explore career pathways, labour-market signals and graduate outcome data connected to UK higher education disciplines.',
    priority: 0.65,
    changeFrequency: 'monthly',
    section: 'Students and Careers',
    keywords: ['career explorer', 'graduate career pathways', 'degree careers'],
  },
  {
    path: '/student-journey',
    title: 'Student Journey Data | HEStats',
    description:
      'Follow the UK higher education student journey from application and finance through enrolment, outcomes and graduate employment.',
    priority: 0.65,
    changeFrequency: 'monthly',
    section: 'Students and Careers',
    keywords: ['student journey', 'student finance', 'higher education applicants'],
  },
  {
    path: '/open-data',
    title: 'HEStats Open Data Catalogue',
    description:
      'Download HEStats open data exports for UK higher education institutions, finances, students, outcomes, source coverage and intelligence records.',
    priority: 0.9,
    changeFrequency: 'weekly',
    section: 'Open Data',
    keywords: ['HEStats open data', 'UK higher education dataset', 'download university data'],
  },
  {
    path: '/api',
    title: 'HEStats API Reference',
    description:
      'Use the HEStats API reference for UK higher education provider, finance, ranking, open-data and source coverage endpoints.',
    priority: 0.8,
    changeFrequency: 'monthly',
    section: 'Developers',
    keywords: ['HEStats API', 'higher education API', 'university finance API'],
  },
  {
    path: '/about',
    title: 'About HEStats and Methodology',
    description:
      'Learn about HEStats methodology, source priority, provenance standards, validation rules, legal notices and founder Ashan Jeevanathan.',
    priority: 0.8,
    changeFrequency: 'monthly',
    section: 'Methodology',
    keywords: ['HEStats methodology', 'Ashan Jeevanathan', 'higher education data provenance'],
  },
  {
    path: '/brand',
    title: 'HEStats Brand System',
    description:
      'View the HEStats brand system, logos, colours, social formats and identity assets for the UK higher education intelligence platform.',
    priority: 0.45,
    changeFrequency: 'yearly',
    section: 'Brand',
    keywords: ['HEStats brand', 'HEStats logo', 'higher education intelligence brand'],
  },
  {
    path: '/support',
    title: 'Support HEStats',
    description:
      'Support HEStats, the free and open-source UK higher education financial intelligence platform created by Ashan Jeevanathan.',
    priority: 0.75,
    changeFrequency: 'monthly',
    section: 'Support',
    keywords: ['support HEStats', 'open-source higher education data', 'Ashan Jeevanathan'],
  },
]

const SEO_PAGE_BY_PATH = new Map(SEO_PAGES.map((page) => [page.path, page]))

export function absoluteUrl(path: string) {
  const [rawPath, fragment] = path.split('#')
  const normalizedPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`
  const suffix = fragment ? `#${fragment}` : ''

  if (normalizedPath === '/') return `${SITE_URL}${suffix}`

  return `${SITE_URL}${normalizedPath.endsWith('/') ? normalizedPath : `${normalizedPath}/`}${suffix}`
}

export function normalizePathname(pathname: string) {
  let path = pathname.split('?')[0].split('#')[0] || '/'
  if (path.length > 1) path = path.replace(/\/+$/, '')

  if (path === '/institutions') return '/universities'
  if (path.startsWith('/institutions/')) return path.replace('/institutions/', '/universities/')
  if (path === '/map') return '/explorer'

  return path
}

function pageTitleLabel(title: string) {
  return title.replace(/\s+\|\s+HEStats$/, '').replace(/^HEStats\s+\|\s+/, 'HEStats')
}

function decodePathPart(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function getInstitutionFromPath(path: string) {
  const match = path.match(/^\/universities\/([^/]+)$/)
  if (!match) return null

  const id = decodePathPart(match[1])
  return institutions.find((institution) => institution.id === id) ?? null
}

function institutionSeo(institution: Institution): ResolvedSeo {
  const canonicalPath = `/universities/${institution.id}`
  const title = `${institution.canonical_name} Finance Profile | HEStats`
  const description = `${institution.canonical_name} HEStats profile: UKPRN ${institution.ukprn}, ${institution.city}, ${institution.nation}, with financial health, rankings, source coverage and open data provenance.`

  return {
    path: canonicalPath,
    canonicalPath,
    canonicalUrl: absoluteUrl(canonicalPath),
    title,
    description,
    priority: 0.7,
    changeFrequency: 'weekly',
    section: 'Universities',
    keywords: [
      institution.canonical_name,
      `${institution.short_name} finance`,
      `${institution.short_name} university profile`,
      `UKPRN ${institution.ukprn}`,
      'university financial health',
    ],
    institution,
  }
}

export function getSeoForPath(pathname: string): ResolvedSeo {
  const normalizedPath = normalizePathname(pathname)
  const institution = getInstitutionFromPath(normalizedPath)
  if (institution) return institutionSeo(institution)

  const page = SEO_PAGE_BY_PATH.get(normalizedPath)
  if (page) {
    return {
      ...page,
      canonicalPath: page.path,
      canonicalUrl: absoluteUrl(page.path),
    }
  }

  return {
    path: normalizedPath,
    canonicalPath: '/',
    canonicalUrl: SITE_URL,
    title: 'Page Not Found | HEStats',
    description: 'This HEStats route is not part of the current public build.',
    priority: 0,
    changeFrequency: 'yearly',
    section: 'Unavailable',
    keywords: ['HEStats'],
    noIndex: true,
  }
}

function buildBreadcrumbs(seo: ResolvedSeo) {
  if (seo.institution) {
    return [
      { name: SITE_NAME, item: SITE_URL },
      { name: 'Universities', item: absoluteUrl('/universities') },
      { name: seo.institution.canonical_name, item: seo.canonicalUrl },
    ]
  }

  if (seo.canonicalPath === '/') {
    return [{ name: SITE_NAME, item: SITE_URL }]
  }

  return [
    { name: SITE_NAME, item: SITE_URL },
    { name: pageTitleLabel(seo.title), item: seo.canonicalUrl },
  ]
}

function breadcrumbJsonLd(seo: ResolvedSeo) {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${seo.canonicalUrl}#breadcrumb`,
    itemListElement: buildBreadcrumbs(seo).map((breadcrumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: breadcrumb.name,
      item: breadcrumb.item,
    })),
  }
}

function institutionJsonLd(institution: Institution, seo: ResolvedSeo) {
  const officialUrl = institution.official_website ? `https://${institution.official_website}` : undefined

  return {
    '@type': 'CollegeOrUniversity',
    '@id': `${seo.canonicalUrl}#institution`,
    name: institution.canonical_name,
    alternateName: institution.short_name,
    url: officialUrl ?? seo.canonicalUrl,
    sameAs: officialUrl ? [officialUrl] : undefined,
    identifier: [
      {
        '@type': 'PropertyValue',
        propertyID: 'UKPRN',
        value: institution.ukprn,
      },
      {
        '@type': 'PropertyValue',
        propertyID: 'HEStats ID',
        value: institution.id,
      },
    ],
    foundingDate: institution.founded > 0 ? String(institution.founded) : undefined,
    address: {
      '@type': 'PostalAddress',
      addressLocality: institution.city,
      addressRegion: institution.nation,
      addressCountry: 'GB',
    },
    subjectOf: {
      '@id': `${seo.canonicalUrl}#webpage`,
    },
  }
}

function openDataJsonLd() {
  return {
    '@type': 'DataCatalog',
    '@id': `${absoluteUrl('/open-data')}#catalog`,
    name: 'HEStats Open Data Catalogue',
    url: absoluteUrl('/open-data'),
    description:
      'Open data exports for UK higher education institutions, financial records, source coverage, graduate outcomes and sector intelligence.',
    creator: { '@id': FOUNDER_ID },
    publisher: { '@id': ORGANIZATION_ID },
    license: 'https://creativecommons.org/licenses/by/4.0/',
    dataset: [
      {
        '@type': 'Dataset',
        '@id': `${absoluteUrl('/open-data')}#institutions-dataset`,
        name: 'HEStats UK higher education provider reference data',
        description: 'Provider identifiers, UKPRNs, locations and source coverage for UK higher education institutions.',
        url: absoluteUrl('/open-data'),
        creator: { '@id': FOUNDER_ID },
        publisher: { '@id': ORGANIZATION_ID },
        license: 'https://creativecommons.org/licenses/by/4.0/',
        keywords: ['UKPRN', 'higher education providers', 'UK universities', 'open data'],
      },
      {
        '@type': 'Dataset',
        '@id': `${absoluteUrl('/open-data')}#finance-dataset`,
        name: 'HEStats UK university finance records',
        description: 'Verified-or-pending financial records for UK higher education providers with source and confidence metadata.',
        url: absoluteUrl('/open-data'),
        creator: { '@id': FOUNDER_ID },
        publisher: { '@id': ORGANIZATION_ID },
        license: 'https://creativecommons.org/licenses/by/4.0/',
        keywords: ['HESA finance', 'university income', 'university borrowing', 'financial health'],
      },
    ],
  }
}

function apiJsonLd() {
  return {
    '@type': 'WebAPI',
    '@id': `${absoluteUrl('/api')}#api`,
    name: 'HEStats API',
    url: absoluteUrl('/api'),
    description: 'API reference for HEStats higher education finance, provider, ranking and open-data endpoints.',
    provider: { '@id': ORGANIZATION_ID },
    documentation: absoluteUrl('/api'),
  }
}

function pruneJsonLd<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(pruneJsonLd).filter((item) => item !== undefined) as T
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined && item !== null && item !== '')
        .map(([key, item]) => [key, pruneJsonLd(item)]),
    ) as T
  }

  return value
}

export function buildJsonLdGraph(seo: ResolvedSeo) {
  const mainEntity = seo.institution
    ? { '@id': `${seo.canonicalUrl}#institution` }
    : seo.canonicalPath === '/open-data'
      ? { '@id': `${absoluteUrl('/open-data')}#catalog` }
      : seo.canonicalPath === '/api'
        ? { '@id': `${absoluteUrl('/api')}#api` }
        : { '@id': SOFTWARE_ID }

  const graph = [
    {
      '@type': 'Organization',
      '@id': ORGANIZATION_ID,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/favicon.svg`,
      description: SITE_DESCRIPTION,
      email: `mailto:${SUPPORT_LINKS.contact_email}`,
      foundingDate: '2026',
      founder: { '@id': FOUNDER_ID },
      creator: { '@id': FOUNDER_ID },
      sameAs: [SUPPORT_LINKS.github_repo],
    },
    {
      '@type': 'Person',
      '@id': FOUNDER_ID,
      name: FOUNDER_NAME,
      url: FOUNDER_ID,
      sameAs: [
        'https://github.com/DevAJ01',
        SUPPORT_LINKS.kofi,
        SUPPORT_LINKS.buy_me_a_coffee,
      ],
      jobTitle: 'Founder and developer of HEStats',
      worksFor: { '@id': ORGANIZATION_ID },
      knowsAbout: [
        'UK higher education finance',
        'open data',
        'data visualisation',
        'institutional financial analysis',
        'graduate outcomes',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': WEBSITE_ID,
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      inLanguage: 'en-GB',
      publisher: { '@id': ORGANIZATION_ID },
      creator: { '@id': FOUNDER_ID },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${absoluteUrl('/universities')}?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': SOFTWARE_ID,
      name: SITE_NAME,
      applicationCategory: 'Data visualization and analytics',
      operatingSystem: 'Web',
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      creator: { '@id': FOUNDER_ID },
      publisher: { '@id': ORGANIZATION_ID },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'GBP',
      },
    },
    {
      '@type': 'WebPage',
      '@id': `${seo.canonicalUrl}#webpage`,
      url: seo.canonicalUrl,
      name: seo.title,
      description: seo.description,
      inLanguage: 'en-GB',
      isPartOf: { '@id': WEBSITE_ID },
      publisher: { '@id': ORGANIZATION_ID },
      creator: { '@id': FOUNDER_ID },
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: OG_IMAGE_URL,
        width: 1200,
        height: 630,
      },
      breadcrumb: { '@id': `${seo.canonicalUrl}#breadcrumb` },
      mainEntity,
      keywords: seo.keywords,
    },
    breadcrumbJsonLd(seo),
    seo.institution ? institutionJsonLd(seo.institution, seo) : undefined,
    seo.canonicalPath === '/open-data' ? openDataJsonLd() : undefined,
    seo.canonicalPath === '/api' ? apiJsonLd() : undefined,
  ]

  return pruneJsonLd({
    '@context': 'https://schema.org',
    '@graph': graph,
  })
}
