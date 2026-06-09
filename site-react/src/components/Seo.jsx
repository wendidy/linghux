import { useEffect } from 'react'
import { DEFAULT_SEO } from '../utils/seo'

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

export default function Seo({ title, description, url, image }) {
  useEffect(() => {
    const pageTitle = title || DEFAULT_SEO.title
    const pageDescription = description || DEFAULT_SEO.description

    document.title = pageTitle
    updateMeta('name', 'description', pageDescription)
    updateMeta('property', 'og:title', pageTitle)
    updateMeta('property', 'og:description', pageDescription)
    updateMeta('property', 'og:type', 'website')
    if (url) updateMeta('property', 'og:url', url)
    if (image) updateMeta('property', 'og:image', image)
    updateMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary')
    updateMeta('name', 'twitter:title', pageTitle)
    updateMeta('name', 'twitter:description', pageDescription)
  }, [title, description, url, image])

  return null
}
