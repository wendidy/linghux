import { items as catalogItems } from '../src/data/portfolio.js'
import { ARTWORK_CATEGORIES } from '../src/utils/artwork.js'

function parseEditionCap(product) {
  const raw = product?.metadata?.edition_cap
  if (raw == null) return null
  const cap = Number.parseInt(raw, 10)
  return Number.isInteger(cap) && cap > 0 ? cap : null
}

function categoryFromItemId(itemId) {
  if (typeof itemId !== 'string' || !itemId.includes(':')) return ''
  const parts = itemId.split(':')
  if (parts.length >= 3) return parts[1]
  if (parts.length === 2 && parts[0].endsWith('-prints')) return parts[0]
  return ''
}

function findCatalogItem(itemId) {
  if (typeof itemId !== 'string' || !itemId) return null
  return catalogItems.find((item) => {
    if (item.id === itemId || item.slug === itemId) return true
    return Array.isArray(item.variants) && item.variants.some((variant) => variant.id === itemId)
  }) || null
}

function resolveArtworkCategory({ category, id, itemId } = {}) {
  if (typeof category === 'string' && category) return category

  for (const candidate of [itemId, id]) {
    const parsedCategory = categoryFromItemId(candidate)
    if (parsedCategory) return parsedCategory

    const item = findCatalogItem(candidate)
    if (item?.category) return item.category
  }

  return ''
}

export function catalogCategoryFor(identity) {
  return resolveArtworkCategory({ id: identity?.id, itemId: identity?.itemId })
}

export function isOriginalInventoryItem(identity) {
  return resolveArtworkCategory(identity) === ARTWORK_CATEGORIES.originals
}

export function inventoryCapFor(product, identity) {
  if (isOriginalInventoryItem(identity)) return 1
  return parseEditionCap(product)
}
