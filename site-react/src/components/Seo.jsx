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

function removeLink(rel) {
  document.head.querySelectorAll(`link[rel="${rel}"]`).forEach((element) => {
    element.remove()
  })
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

function truncateMeta(value, maxLength) {
  if (!value || value.length <= maxLength) return value
  const trimmed = value.slice(0, maxLength - 3).trim()
  const wordBreak = trimmed.lastIndexOf(' ')
  const cutPoint = wordBreak > maxLength * 0.6 ? wordBreak : trimmed.length
  return `${trimmed.slice(0, cutPoint).trim()}...`
}

export default function Seo({
  title,
  description,
  url,
  image,
  keywords,
  robots = 'index, follow',
  type = 'website',
  ogTitle,
  ogDescription,
  jsonLd,
}) {
  const { pathname } = useLocation()
  const jsonLdString = JSON.stringify(jsonLd || null)

  useEffect(() => {
    const pageTitle = title || DEFAULT_SEO.title
    const pageDescription = description || DEFAULT_SEO.description
    const pageUrl = url ? toAbsoluteUrl(url) : canonicalForPath(pathname)
    const pageImage = image ? toAbsoluteUrl(image) : DEFAULT_SEO.image
    const pageOgTitle = ogTitle || truncateMeta(pageTitle, 60)
    const pageOgDescription = ogDescription || truncateMeta(pageDescription, 65)
    const allowsIndexing = !robots
      .split(',')
      .map((directive) => directive.trim().toLowerCase())
      .includes('noindex')
    const pageKeywords = typeof keywords === 'string'
      ? keywords
      : Array.isArray(keywords)
        ? keywords.join(', ')
        : DEFAULT_SEO.keywords

    document.title = pageTitle
    if (allowsIndexing) {
      updateLink('canonical', pageUrl)
    } else {
      removeLink('canonical')
    }
    updateMeta('name', 'description', pageDescription)
    updateMeta('name', 'keywords', pageKeywords)
    updateMeta('name', 'robots', robots)
    updateMeta('property', 'og:site_name', SITE_NAME)
    updateMeta('property', 'og:title', pageOgTitle)
    updateMeta('property', 'og:description', pageOgDescription)
    updateMeta('property', 'og:type', type)
    updateMeta('property', 'og:url', pageUrl)
    updateMeta('property', 'og:image', pageImage)
    updateJsonLd(jsonLd ? JSON.parse(jsonLdString) : null)
  }, [title, description, url, image, keywords, robots, type, ogTitle, ogDescription, pathname, jsonLdString])

  return null
}
