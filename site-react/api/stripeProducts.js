import { MAX_ITEM_IDS, MAX_ITEM_ID_LENGTH, invalidItemIds, isValidItemId } from './security.js'

const STRIPE_CACHE_TTL_MS = 5 * 60 * 1000
const stripeCaches = new WeakMap()

function cacheFor(stripe) {
  let cache = stripeCaches.get(stripe)
  if (!cache) {
    cache = {
      productCache: new Map(),
      priceCache: new Map(),
      productRequests: new Map(),
      priceRequests: new Map(),
    }
    stripeCaches.set(stripe, cache)
  }
  return cache
}

function cachedValue(cache, key) {
  const entry = cache.get(key)
  if (!entry) return undefined
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key)
    return undefined
  }
  return entry.value
}

function cacheValue(cache, key, value) {
  cache.set(key, { value, expiresAt: Date.now() + STRIPE_CACHE_TTL_MS })
  return value
}

function normalizeItemIds(itemIds, { maxItems = MAX_ITEM_IDS } = {}) {
  const input = Array.isArray(itemIds) ? itemIds : []
  return [
    ...new Set(
      input
        .filter(isValidItemId)
        .map((itemId) => itemId.trim())
    ),
  ].slice(0, maxItems)
}

function escapeSearchValue(value) {
  if (typeof value !== 'string') return ''
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

async function findProductByName(stripe, name) {
  const escaped = escapeSearchValue(name)
  if (!escaped) return null
  const query = `name:\"${escaped}\" AND active:\"true\"`
  const result = await stripe.products.search({
    query,
    limit: 1,
    expand: ['data.default_price'],
  })
  return result?.data?.[0] || null
}

async function resolvePriceForProduct(stripe, product) {
  if (!product) return null
  const defaultPrice = product.default_price
  if (defaultPrice && typeof defaultPrice === 'object') {
    return defaultPrice
  }
  if (typeof defaultPrice === 'string') {
    return stripe.prices.retrieve(defaultPrice)
  }
  const prices = await stripe.prices.list({
    product: product.id,
    active: true,
    limit: 1,
  })
  return prices?.data?.[0] || null
}

function serializePrice(itemId, price) {
  if (!price?.id) return null
  return {
    item_id: itemId,
    id: price.id,
    unit_amount: price.unit_amount,
    currency: price.currency,
    nickname: price.nickname || null,
    product: price.product,
  }
}


// itemIds can be: ["artworkId", "artworkId:category:size", ...]
// For limited/open edition prints, expect keys like "artworkId:category:size"
// For Stripe product lookup, extract just "category:size" for open edition prints
function extractSearchId(itemId) {
  // If it looks like "id:category:size", extract "category:size" for open edition prints
  if (itemId && itemId.includes(':')) {
    const parts = itemId.split(':')
    if (parts.length === 3) {
      const category = parts[1]
      const size = parts[2]
      // For open edition prints, search by category:size only
      if (category === 'open-edition-prints') {
        return `${category}:${size}`
      }
    }
  }
  return itemId
}

export async function fetchProductsByItemIds(stripe, itemIds) {
  const uniqueIds = normalizeItemIds(itemIds)
  if (!uniqueIds.length) return new Map()
  const { productCache, productRequests } = cacheFor(stripe)
  const entries = await Promise.all(
    uniqueIds.map(async (itemId) => {
      const cached = cachedValue(productCache, itemId)
      if (cached !== undefined) return [itemId, cached]
      if (productRequests.has(itemId)) return [itemId, await productRequests.get(itemId)]

      // For open edition prints, search by category:size instead of full variant ID
      const searchId = extractSearchId(itemId)
      const request = findProductByName(stripe, searchId)
        .then((product) => cacheValue(productCache, itemId, product))
        .finally(() => productRequests.delete(itemId))
      productRequests.set(itemId, request)
      const product = await request
      return [itemId, product]
    })
  )
  return new Map(entries)
}

export async function fetchPricesByItemIds(stripe, itemIds) {
  const productsByItemId = await fetchProductsByItemIds(stripe, itemIds)
  const { priceCache, priceRequests } = cacheFor(stripe)
  const entries = await Promise.all(
    Array.from(productsByItemId.entries()).map(async ([itemId, product]) => {
      const cacheKey = `USD:${itemId}`
      const cached = cachedValue(priceCache, cacheKey)
      if (cached !== undefined) return [itemId, { product, price: cached }]
      if (priceRequests.has(cacheKey)) {
        return [itemId, { product, price: await priceRequests.get(cacheKey) }]
      }
      const request = resolvePriceForProduct(stripe, product)
        .then((price) => cacheValue(priceCache, cacheKey, price))
        .finally(() => priceRequests.delete(cacheKey))
      priceRequests.set(cacheKey, request)
      const price = await request
      return [itemId, { product, price }]
    })
  )
  return new Map(entries)
}

export async function fetchPricesByItemIdsAndCurrency(stripe, itemIds, currency = 'USD') {
  const productsByItemId = await fetchProductsByItemIds(stripe, itemIds)
  const { priceCache, priceRequests } = cacheFor(stripe)
  const entries = await Promise.all(
    Array.from(productsByItemId.entries()).map(async ([itemId, product]) => {
      const cacheKey = `${currency.toUpperCase()}:${itemId}`
      const cached = cachedValue(priceCache, cacheKey)
      if (cached !== undefined) return [itemId, { product, price: cached }]
      if (priceRequests.has(cacheKey)) {
        return [itemId, { product, price: await priceRequests.get(cacheKey) }]
      }
      const request = resolvePriceForProductAndCurrency(stripe, product, currency)
        .then((price) => cacheValue(priceCache, cacheKey, price))
        .finally(() => priceRequests.delete(cacheKey))
      priceRequests.set(cacheKey, request)
      const price = await request
      return [itemId, { product, price }]
    })
  )
  return new Map(entries)
}

async function resolvePriceForProductAndCurrency(stripe, product, currency = 'USD') {
  if (!product) return null
  
  // List all active prices for this product in the specified currency
  const prices = await stripe.prices.list({
    product: product.id,
    active: true,
    currency: currency.toLowerCase(), // 'usd' or 'cad'
    limit: 1,
  })
  
  return prices?.data?.[0] || null
}

export {
  MAX_ITEM_IDS,
  MAX_ITEM_ID_LENGTH,
  invalidItemIds,
  isValidItemId,
  normalizeItemIds,
  serializePrice,
}
