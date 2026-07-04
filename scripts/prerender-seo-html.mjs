import ts from 'typescript'
import { JSDOM } from 'jsdom'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const distDir = join(rootDir, 'dist')
const siteUrl = 'https://hestats.co.uk'
const founderId = `${siteUrl}/about/#ashan-jeevanathan`
const organizationId = `${siteUrl}/#organization`
const websiteId = `${siteUrl}/#website`
const softwareId = `${siteUrl}/#software`
const ogImageUrl = `${siteUrl}/og-image.svg`

function absoluteUrl(path) {
  const [rawPath, fragment] = path.split('#')
  const normalizedPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`
  const suffix = fragment ? `#${fragment}` : ''

  if (normalizedPath === '/') return `${siteUrl}${suffix}`

  return `${siteUrl}${normalizedPath.endsWith('/') ? normalizedPath : `${normalizedPath}/`}${suffix}`
}

async function parseSource(path) {
  const source = await readFile(join(rootDir, path), 'utf8')
  return ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
}

function findArrayInitializer(sourceFile, variableName) {
  let initializer = null

  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === variableName &&
      node.initializer &&
      ts.isArrayLiteralExpression(node.initializer)
    ) {
      initializer = node.initializer
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  if (!initializer) throw new Error(`Could not find ${variableName} array initializer`)
  return initializer
}

function getPropertyInitializer(objectLiteral, propertyName) {
  for (const property of objectLiteral.properties) {
    if (!ts.isPropertyAssignment(property)) continue

    const name = property.name
    const key =
      ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)
        ? name.text
        : null

    if (key === propertyName) return property.initializer
  }

  return null
}

function literalText(node) {
  if (!node) return ''
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text
  if (ts.isNumericLiteral(node)) return node.text
  return ''
}

function arrayLiteralStrings(node) {
  if (!node || !ts.isArrayLiteralExpression(node)) return []
  return node.elements
    .filter((element) => ts.isStringLiteral(element) || ts.isNoSubstitutionTemplateLiteral(element))
    .map((element) => element.text)
}

function parseSeoPages(sourceFile) {
  const array = findArrayInitializer(sourceFile, 'SEO_PAGES')

  return array.elements
    .filter(ts.isObjectLiteralExpression)
    .map((page) => ({
      path: literalText(getPropertyInitializer(page, 'path')),
      title: literalText(getPropertyInitializer(page, 'title')),
      description: literalText(getPropertyInitializer(page, 'description')),
      keywords: arrayLiteralStrings(getPropertyInitializer(page, 'keywords')),
    }))
    .filter((page) => page.path && page.title && page.description)
}

function parseInstitutions(sourceFile) {
  const array = findArrayInitializer(sourceFile, 'institutions')

  return array.elements
    .filter(ts.isObjectLiteralExpression)
    .map((institution) => ({
      id: literalText(getPropertyInitializer(institution, 'id')),
      canonicalName: literalText(getPropertyInitializer(institution, 'canonical_name')),
      shortName: literalText(getPropertyInitializer(institution, 'short_name')),
      ukprn: literalText(getPropertyInitializer(institution, 'ukprn')),
      city: literalText(getPropertyInitializer(institution, 'city')),
      nation: literalText(getPropertyInitializer(institution, 'nation')),
      founded: Number(literalText(getPropertyInitializer(institution, 'founded')) || '0'),
      officialWebsite: literalText(getPropertyInitializer(institution, 'official_website')),
    }))
    .filter((institution) => institution.id && institution.canonicalName)
}

function institutionSeo(institution) {
  const path = `/universities/${institution.id}`
  return {
    path,
    canonicalUrl: absoluteUrl(path),
    title: `${institution.canonicalName} Finance Profile | HEStats`,
    description: `${institution.canonicalName} HEStats profile: UKPRN ${institution.ukprn}, ${institution.city}, ${institution.nation}, with financial health, rankings, source coverage and open data provenance.`,
    keywords: [
      institution.canonicalName,
      `${institution.shortName} finance`,
      `${institution.shortName} university profile`,
      `UKPRN ${institution.ukprn}`,
      'university financial health',
    ],
    institution,
  }
}

function baseGraph(seo) {
  const graph = [
    {
      '@type': 'Organization',
      '@id': organizationId,
      name: 'HEStats',
      url: siteUrl,
      logo: `${siteUrl}/favicon.svg`,
      description: 'HEStats is an independent, open-source UK higher education financial intelligence platform for university finances, rankings, graduate outcomes, open data and sector analysis.',
      email: 'mailto:ashanj1@outlook.com',
      foundingDate: '2026',
      founder: { '@id': founderId },
      creator: { '@id': founderId },
      sameAs: ['https://github.com/DevAJ01/hestats'],
    },
    {
      '@type': 'Person',
      '@id': founderId,
      name: 'Ashan Jeevanathan',
      url: founderId,
      sameAs: ['https://github.com/DevAJ01', 'https://ko-fi.com/ashanjeevanathan', 'https://buymeacoffee.com/ashanj1q'],
      jobTitle: 'Founder and developer of HEStats',
      worksFor: { '@id': organizationId },
      knowsAbout: ['UK higher education finance', 'open data', 'data visualisation', 'institutional financial analysis', 'graduate outcomes'],
    },
    {
      '@type': 'WebSite',
      '@id': websiteId,
      name: 'HEStats',
      url: siteUrl,
      inLanguage: 'en-GB',
      publisher: { '@id': organizationId },
      creator: { '@id': founderId },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${absoluteUrl('/universities')}?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'WebPage',
      '@id': `${seo.canonicalUrl}#webpage`,
      url: seo.canonicalUrl,
      name: seo.title,
      description: seo.description,
      inLanguage: 'en-GB',
      isPartOf: { '@id': websiteId },
      publisher: { '@id': organizationId },
      creator: { '@id': founderId },
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: ogImageUrl,
        width: 1200,
        height: 630,
      },
      mainEntity: seo.institution
        ? { '@id': `${seo.canonicalUrl}#institution` }
        : seo.path === '/open-data'
          ? { '@id': `${absoluteUrl('/open-data')}#catalog` }
          : seo.path === '/api'
            ? { '@id': `${absoluteUrl('/api')}#api` }
            : { '@id': softwareId },
      keywords: seo.keywords,
    },
  ]

  if (seo.institution) {
    const officialUrl = seo.institution.officialWebsite ? `https://${seo.institution.officialWebsite}` : undefined
    graph.push({
      '@type': 'CollegeOrUniversity',
      '@id': `${seo.canonicalUrl}#institution`,
      name: seo.institution.canonicalName,
      alternateName: seo.institution.shortName,
      url: officialUrl ?? seo.canonicalUrl,
      sameAs: officialUrl ? [officialUrl] : undefined,
      identifier: [
        { '@type': 'PropertyValue', propertyID: 'UKPRN', value: seo.institution.ukprn },
        { '@type': 'PropertyValue', propertyID: 'HEStats ID', value: seo.institution.id },
      ],
      foundingDate: seo.institution.founded > 0 ? String(seo.institution.founded) : undefined,
      address: {
        '@type': 'PostalAddress',
        addressLocality: seo.institution.city,
        addressRegion: seo.institution.nation,
        addressCountry: 'GB',
      },
      subjectOf: { '@id': `${seo.canonicalUrl}#webpage` },
    })
  }

  if (seo.path === '/open-data') {
    graph.push({
      '@type': 'DataCatalog',
      '@id': `${absoluteUrl('/open-data')}#catalog`,
      name: 'HEStats Open Data Catalogue',
      url: absoluteUrl('/open-data'),
      description: 'Open data exports for UK higher education institutions, financial records, source coverage, graduate outcomes and sector intelligence.',
      creator: { '@id': founderId },
      publisher: { '@id': organizationId },
      license: 'https://creativecommons.org/licenses/by/4.0/',
    })
  }

  if (seo.path === '/api') {
    graph.push({
      '@type': 'WebAPI',
      '@id': `${absoluteUrl('/api')}#api`,
      name: 'HEStats API',
      url: absoluteUrl('/api'),
      description: 'API reference for HEStats higher education finance, provider, ranking and open-data endpoints.',
      provider: { '@id': organizationId },
      documentation: absoluteUrl('/api'),
    })
  }

  return {
    '@context': 'https://schema.org',
    '@graph': JSON.parse(JSON.stringify(graph)),
  }
}

function upsertMeta(doc, selector, attribute, value) {
  const element = doc.querySelector(selector)
  if (element) element.setAttribute(attribute, value)
}

function renderHtml(baseHtml, seo) {
  const dom = new JSDOM(baseHtml)
  const doc = dom.window.document

  doc.documentElement.lang = 'en-GB'
  doc.title = seo.title

  upsertMeta(doc, 'meta[name="description"]', 'content', seo.description)
  upsertMeta(doc, 'meta[name="keywords"]', 'content', seo.keywords.join(', '))
  upsertMeta(doc, 'meta[property="og:title"]', 'content', seo.title)
  upsertMeta(doc, 'meta[property="og:description"]', 'content', seo.description)
  upsertMeta(doc, 'meta[property="og:url"]', 'content', seo.canonicalUrl)
  upsertMeta(doc, 'meta[property="og:image"]', 'content', ogImageUrl)
  upsertMeta(doc, 'meta[name="twitter:title"]', 'content', seo.title)
  upsertMeta(doc, 'meta[name="twitter:description"]', 'content', seo.description)
  upsertMeta(doc, 'meta[name="twitter:image"]', 'content', ogImageUrl)

  const canonical = doc.querySelector('link[rel="canonical"]')
  if (canonical) canonical.setAttribute('href', seo.canonicalUrl)

  const jsonLd = doc.querySelector('script#hestats-jsonld')
  if (jsonLd) jsonLd.textContent = JSON.stringify(baseGraph(seo))

  return `<!doctype html>\n${doc.documentElement.outerHTML}\n`
}

function outputPathForRoute(routePath) {
  if (routePath === '/') return join(distDir, 'index.html')
  return join(distDir, routePath.slice(1), 'index.html')
}

async function main() {
  const [baseHtml, seoSource, institutionSource] = await Promise.all([
    readFile(join(distDir, 'index.html'), 'utf8'),
    parseSource('src/app/seo/metadata.ts'),
    parseSource('src/app/data/institutions.ts'),
  ])

  const pages = parseSeoPages(seoSource).map((page) => ({
    ...page,
    canonicalUrl: absoluteUrl(page.path),
  }))
  const institutions = parseInstitutions(institutionSource)
  const seoRoutes = [...pages, ...institutions.map(institutionSeo)]

  await Promise.all(seoRoutes.map(async (seo) => {
    const outputPath = outputPathForRoute(seo.path)
    await mkdir(dirname(outputPath), { recursive: true })
    await writeFile(outputPath, renderHtml(baseHtml, seo))
  }))

  console.log(`Prerendered SEO HTML for ${seoRoutes.length} routes.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
