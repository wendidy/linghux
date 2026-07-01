export const SITE_URL = 'https://www.linghux.com'
export const SITE_NAME = 'linghux'
export const ARTIST_NAME = 'Wendy Zhang'
export const TWITTER_SITE = '@linghux'
export const DEFAULT_SHARE_IMAGE = '/images/signalHill/signalHill.jpg'
export const ORGANIZATION_SCHEMA_ID = `${SITE_URL}/#organization`
export const WEBSITE_SCHEMA_ID = `${SITE_URL}/#website`
export const ARTIST_SCHEMA_ID = `${SITE_URL}/about#wendy-zhang`

export function toAbsoluteUrl(value = '/') {
  if (!value) return `${SITE_URL}/`
  try {
    return new URL(value, `${SITE_URL}/`).href
  } catch {
    return value
  }
}

export function canonicalForPath(pathname = '/') {
  return toAbsoluteUrl(pathname === '/' ? '/' : pathname)
}

export const DEFAULT_SEO = {
  title: 'linghux watercolor art by Wendy Zhang | Original paintings and prints',
  description:
    'Shop original watercolors and archival prints by Wendy Zhang, the Canadian artist behind linghux, with plein air landscapes from Newfoundland, Colorado, and beyond.',
  keywords:
    'linghux art, Wendy Zhang artist, original watercolor paintings, watercolor prints, Canadian watercolor artist, Newfoundland watercolor, Colorado plein air paintings',
  image: toAbsoluteUrl(DEFAULT_SHARE_IMAGE),
}

export function buildAboutPageJsonLd({ title, description, url }) {
  const absoluteUrl = toAbsoluteUrl(url)
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    '@id': `${absoluteUrl}#about-page`,
    name: title,
    description,
    url: absoluteUrl,
    isPartOf: { '@id': WEBSITE_SCHEMA_ID },
    about: { '@id': ARTIST_SCHEMA_ID },
    mainEntity: { '@id': ARTIST_SCHEMA_ID },
  }
}

export function buildContactPageJsonLd({ title, description, url }) {
  const absoluteUrl = toAbsoluteUrl(url)
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    '@id': `${absoluteUrl}#contact-page`,
    name: title,
    description,
    url: absoluteUrl,
    isPartOf: { '@id': WEBSITE_SCHEMA_ID },
    about: { '@id': ORGANIZATION_SCHEMA_ID },
    mainEntity: {
      '@type': 'ContactPoint',
      email: 'linghuxiaolhx@gmail.com',
      contactType: 'customer support',
      areaServed: [
        { '@type': 'Country', name: 'Canada' },
        { '@type': 'Country', name: 'United States' },
      ],
    },
  }
}

export function buildShippingServiceJsonLd({ title, description, url }) {
  const absoluteUrl = toAbsoluteUrl(url)
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${absoluteUrl}#shipping-service`,
    name: title,
    description,
    url: absoluteUrl,
    provider: { '@id': ORGANIZATION_SCHEMA_ID },
    areaServed: [
      { '@type': 'Country', name: 'Canada' },
      { '@type': 'Country', name: 'United States' },
    ],
    serviceType: 'Artwork shipping and delivery',
  }
}

export function buildImageAlt(item) {
  if (!item) return `Original watercolor painting by ${ARTIST_NAME}`
  const parts = [`${item.title} watercolor painting by ${ARTIST_NAME}`, item.location, item.medium].filter(Boolean)
  return parts.join(' — ')
}

export function buildProductPageDescription(item) {
  if (!item) return DEFAULT_SEO.description
  const kind = item.category === 'originals'
    ? 'original watercolor painting'
    : item.category === 'limited-edition-prints'
      ? 'limited edition watercolor print'
      : 'open edition watercolor print'
  const article = /^[aeiou]/i.test(kind) ? 'an' : 'a'
  const locationText = item.location ? ` inspired by ${item.location}` : ''
  const base = `${item.title} is ${article} ${kind} by ${ARTIST_NAME}${locationText}. ${item.description || ''}`.trim()
  const maxLength = 160
  if (base.length <= maxLength) return base
  return `${base.slice(0, maxLength - 3).trim()}...`
}

export function buildBreadcrumbJsonLd(crumbs) {
  const itemListElement = crumbs
    .filter((crumb) => crumb?.name && crumb?.url)
    .map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: toAbsoluteUrl(crumb.url),
    }))

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement,
  }
}

export function buildCollectionPageJsonLd({ name, description, url, items = [] }) {
  const absoluteUrl = toAbsoluteUrl(url)
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${absoluteUrl}#collection`,
    name,
    description,
    url: absoluteUrl,
    isPartOf: { '@id': WEBSITE_SCHEMA_ID },
    publisher: { '@id': ORGANIZATION_SCHEMA_ID },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        url: toAbsoluteUrl(item.url),
      })),
    },
  }
}

export function buildArtistPageJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    '@id': `${SITE_URL}/about#profile`,
    name: `About ${ARTIST_NAME}`,
    url: `${SITE_URL}/about`,
    description: `${ARTIST_NAME} is the Canadian watercolor artist behind ${SITE_NAME}, creating original plein air paintings and archival watercolor prints.`,
    mainEntity: {
      '@type': 'Person',
      '@id': ARTIST_SCHEMA_ID,
      name: ARTIST_NAME,
      alternateName: SITE_NAME,
      url: `${SITE_URL}/about`,
      jobTitle: 'Watercolor artist',
      worksFor: { '@id': ORGANIZATION_SCHEMA_ID },
      knowsAbout: [
        'watercolor painting',
        'plein air painting',
        'landscape painting',
        'Newfoundland landscape art',
        'Colorado landscape art',
        'archival art prints',
      ],
    },
  }
}

export function buildProductJsonLd({
  item,
  url,
  images = [],
  description,
  priceInfo,
  availability,
  selectedVariant,
}) {
  if (!item) return null

  const absoluteUrl = toAbsoluteUrl(url)
  const imageUrls = (images.length > 0 ? images : [item.image]).filter(Boolean).map(toAbsoluteUrl)
  const variantSize = selectedVariant?.size || item.size
  const framedSize = selectedVariant?.framedSize || item.framedSize
  const additionalProperty = [
    item.medium && { '@type': 'PropertyValue', name: 'Medium', value: item.medium },
    item.location && { '@type': 'PropertyValue', name: 'Location', value: item.location },
    item.date && { '@type': 'PropertyValue', name: 'Artwork date', value: item.date },
    framedSize && { '@type': 'PropertyValue', name: 'Framed size', value: framedSize },
  ].filter(Boolean)

  const product = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${absoluteUrl}#product`,
    name: `${item.title} by ${ARTIST_NAME}`,
    image: imageUrls,
    description,
    sku: selectedVariant?.id || item.id,
    url: absoluteUrl,
    brand: {
      '@type': 'Brand',
      name: SITE_NAME,
    },
    creator: {
      '@type': 'Person',
      '@id': ARTIST_SCHEMA_ID,
      name: ARTIST_NAME,
    },
    category: item.category,
    material: item.medium,
    size: Array.isArray(variantSize) ? variantSize.join(', ') : variantSize,
    additionalProperty,
  }

  if (priceInfo && typeof priceInfo.unit_amount === 'number') {
    product.offers = {
      '@type': 'Offer',
      url: absoluteUrl,
      priceCurrency: priceInfo.currency ? priceInfo.currency.toUpperCase() : 'USD',
      price: (priceInfo.unit_amount / 100).toFixed(2),
      availability: availability?.soldOut ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@id': ORGANIZATION_SCHEMA_ID,
      },
    }
  }

  return product
}
