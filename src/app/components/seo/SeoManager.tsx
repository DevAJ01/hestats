import { useEffect, useMemo } from 'react'
import { useLocation } from 'react-router'
import {
  OG_IMAGE_URL,
  SITE_NAME,
  buildJsonLdGraph,
  getSeoForPath,
} from '../../seo/metadata'

function upsertMetaByName(name: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute('name', name)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function upsertMetaByProperty(property: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute('property', property)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function upsertLink(rel: string, href: string) {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', rel)
    document.head.appendChild(element)
  }
  element.setAttribute('href', href)
}

function upsertJsonLd(id: string, data: unknown) {
  let element = document.head.querySelector<HTMLScriptElement>(`script#${id}`)
  if (!element) {
    element = document.createElement('script')
    element.id = id
    element.type = 'application/ld+json'
    document.head.appendChild(element)
  }
  element.textContent = JSON.stringify(data)
}

export function SeoManager() {
  const location = useLocation()
  const seo = useMemo(() => getSeoForPath(location.pathname), [location.pathname])

  useEffect(() => {
    document.documentElement.lang = 'en-GB'
    document.title = seo.title

    const robots = seo.noIndex
      ? 'noindex,follow'
      : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'

    upsertMetaByName('description', seo.description)
    upsertMetaByName('robots', robots)
    upsertMetaByName('author', 'Ashan Jeevanathan')
    upsertMetaByName('creator', 'Ashan Jeevanathan')
    upsertMetaByName('publisher', SITE_NAME)
    upsertMetaByName('keywords', seo.keywords.join(', '))

    upsertMetaByProperty('og:site_name', SITE_NAME)
    upsertMetaByProperty('og:type', 'website')
    upsertMetaByProperty('og:title', seo.title)
    upsertMetaByProperty('og:description', seo.description)
    upsertMetaByProperty('og:url', seo.canonicalUrl)
    upsertMetaByProperty('og:image', OG_IMAGE_URL)
    upsertMetaByProperty('og:locale', 'en_GB')

    upsertMetaByName('twitter:card', 'summary_large_image')
    upsertMetaByName('twitter:title', seo.title)
    upsertMetaByName('twitter:description', seo.description)
    upsertMetaByName('twitter:image', OG_IMAGE_URL)

    upsertLink('canonical', seo.canonicalUrl)
    upsertJsonLd('hestats-jsonld', buildJsonLdGraph(seo))
  }, [seo])

  return null
}
