export const ARTWORK_CATEGORIES = {
  originals: 'originals',
  limitedEditionPrints: 'limited-edition-prints',
  openEditionPrints: 'open-edition-prints',
}

export const ARTWORK_NAV_ITEMS = [
  { category: ARTWORK_CATEGORIES.originals, label: 'Originals' },
  { category: ARTWORK_CATEGORIES.limitedEditionPrints, label: 'Limited Edition Prints' },
  { category: ARTWORK_CATEGORIES.openEditionPrints, label: 'Open Edition Prints' },
]

export function isOriginal(itemOrCategory) {
  const category = typeof itemOrCategory === 'string' ? itemOrCategory : itemOrCategory?.category
  return category === ARTWORK_CATEGORIES.originals
}

export function isLimitedEdition(itemOrCategory) {
  const category = typeof itemOrCategory === 'string' ? itemOrCategory : itemOrCategory?.category
  return category === ARTWORK_CATEGORIES.limitedEditionPrints
}

export function isOpenEdition(itemOrCategory) {
  const category = typeof itemOrCategory === 'string' ? itemOrCategory : itemOrCategory?.category
  return category === ARTWORK_CATEGORIES.openEditionPrints
}

export function getArtworkPath(itemId, category) {
  return category ? `/artwork/${category}/${itemId}` : `/artwork/work/${itemId}`
}

export function getCanonicalArtworkPath(itemOrCategory, category) {
  if (typeof itemOrCategory === 'string') {
    return getArtworkPath(itemOrCategory, category)
  }

  const itemCategory = itemOrCategory?.category || category
  return getArtworkPath(itemOrCategory?.slug || itemOrCategory?.id, itemCategory)
}

export function findArtwork(items, itemId, category) {
  return items.find((item) => {
    if (category && item.category !== category) return false
    if (item.id === itemId || item.slug === itemId) return true
    return Array.isArray(item.variants) && item.variants.some((variant) => variant.id === itemId)
  })
}

export function getArtworkBadgeLabel(itemOrCategory) {
  if (isOriginal(itemOrCategory)) return 'Original Watercolor'
  if (isLimitedEdition(itemOrCategory)) return 'Limited Edition'
  return 'Open Edition Print'
}

export function getEditionLabel(itemOrCategory, availability) {
  if (!isLimitedEdition(itemOrCategory)) return ''
  const cap = availability?.cap
  return typeof cap === 'number' ? `Edition Size: ${cap}` : 'Limited edition'
}
