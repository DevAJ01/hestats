import { describe, expect, it } from 'vitest'
import {
  FOUNDER_NAME,
  SITE_URL,
  SEO_PAGES,
  buildJsonLdGraph,
  getSeoForPath,
} from './metadata'

describe('SEO metadata', () => {
  it('defines unique canonical paths for public pages', () => {
    const paths = SEO_PAGES.map((page) => page.path)
    expect(new Set(paths).size).toBe(paths.length)
    expect(paths).toContain('/')
    expect(paths).toContain('/open-data')
    expect(paths).toContain('/about')
  })

  it('normalizes legacy institution URLs to university canonicals', () => {
    const seo = getSeoForPath('/institutions/oxford')
    expect(seo.canonicalUrl).toBe(`${SITE_URL}/universities/oxford/`)
    expect(seo.title).toContain('University of Oxford')
  })

  it('exposes Ashan Jeevanathan as the site founder in JSON-LD', () => {
    const graph = buildJsonLdGraph(getSeoForPath('/about'))
    const serialized = JSON.stringify(graph)

    expect(serialized).toContain(FOUNDER_NAME)
    expect(serialized).toContain(`${SITE_URL}/about/#ashan-jeevanathan`)
    expect(serialized).toContain('"@type":"Person"')
  })

  it('marks unknown routes as noindex', () => {
    const seo = getSeoForPath('/not-a-real-route')
    expect(seo.noIndex).toBe(true)
    expect(seo.canonicalUrl).toBe(SITE_URL)
  })
})
