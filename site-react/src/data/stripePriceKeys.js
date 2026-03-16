const WORK_ID_PATTERN = /-/g

export function lookupKeyFromItemId(id) {
  if (typeof id !== 'string') return ''
  return id.replace(WORK_ID_PATTERN, '_')
}

export function fallbackLookupKeyFromCategorySize(category, size) {
  if (typeof category !== 'string' || typeof size !== 'string') return ''
  const safeCategory = category.trim()
  const safeSize = size.trim()
  if (!safeCategory || !safeSize) return ''
  return `${safeCategory}:${safeSize}`
}

export function primaryLookupKeyForItem(item) {
  return lookupKeyFromItemId(item?.id)
}

export function fallbackLookupKeyForItem(item) {
  return fallbackLookupKeyFromCategorySize(item?.category, item?.size)
}

export function lookupKeysForItem(item) {
  const keys = [primaryLookupKeyForItem(item), fallbackLookupKeyForItem(item)]
  return keys.filter(Boolean)
}

export function resolvePriceByLookupKeys(primaryKey, fallbackKey, priceByKey = {}) {
  if (primaryKey && priceByKey[primaryKey]) return priceByKey[primaryKey]
  if (fallbackKey && priceByKey[fallbackKey]) return priceByKey[fallbackKey]
  return null
}

export function resolvePriceForItem(item, priceByKey = {}) {
  return resolvePriceByLookupKeys(
    primaryLookupKeyForItem(item),
    fallbackLookupKeyForItem(item),
    priceByKey
  )
}
