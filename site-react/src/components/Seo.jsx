import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { canonicalForPath, DEFAULT_SEO, SITE_NAME, toAbsoluteUrl } from '../utils/seo'

function updateMeta(attribute, name, content) {
  if (!content) return
  const selector = attribute === 'property' ? `meta[property="${name}"]` : `meta[name="${name}"]`
  let element = document.head.querySelector(selector)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, name)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function updateLink(rel, href) {
  if (!href) return
  let element = document.head.querySelector(`link[rel="${rel}"]`)
  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', rel)
    document.head.appendChild(element)
  }
  element.setAttribute('href', href)
}

function updateJsonLd(jsonLd) {
  document.head.querySelectorAll('script[data-seo-json-ld="true"]').forEach((element) => {
    element.remove()
  })

  const entries = Array.isArray(jsonLd) ? jsonLd.filter(Boolean) : [jsonLd].filter(Boolean)
  entries.forEach((entry) => {
    const element = document.createElement('script')
    element.type = 'application/ld+json'
    element.dataset.seoJsonLd = 'true'
    element.text = JSON.stringify(entry)
    document.head.appendChild(element)
  })
}

export default function Seo({
  title,
  description,
  url,
  image,
  keywords,
  robots = 'index, follow',
  type = 'website',
  jsonLd,
}) {
  const { pathname } = useLocation()
  const jsonLdString = JSON.stringify(jsonLd || null)

  useEffect(() => {
    const pageTitle = title || DEFAULT_SEO.title
    const pageDescription = description || DEFAULT_SEO.description
    const pageUrl = url ? toAbsoluteUrl(url) : canonicalForPath(pathname)
    const pageImage = image ? toAbsoluteUrl(image) : DEFAULT_SEO.image
    const pageKeywords = typeof keywords === 'string'
      ? keywords
      : Array.isArray(keywords)
        ? keywords.join(', ')
        : DEFAULT_SEO.keywords

    document.title = pageTitle
    updateLink('canonical', pageUrl)
    updateMeta('name', 'description', pageDescription)
    updateMeta('name', 'keywords', pageKeywords)
    updateMeta('name', 'robots', robots)
    updateMeta('property', 'og:site_name', SITE_NAME)
    updateMeta('property', 'og:title', pageTitle)
    updateMeta('property', 'og:description', pageDescription)
    updateMeta('property', 'og:type', type)
    updateMeta('property', 'og:url', pageUrl)
    updateMeta('property', 'og:image', pageImage)
    updateMeta('name', 'twitter:card', 'summary_large_image')
    updateMeta('name', 'twitter:title', pageTitle)
    updateMeta('name', 'twitter:description', pageDescription)
    updateMeta('name', 'twitter:image', pageImage)
    updateJsonLd(jsonLd ? JSON.parse(jsonLdString) : null)
  }, [title, description, url, image, keywords, robots, type, pathname, jsonLdString])

  return null
}
