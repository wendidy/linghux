function normalizeItemIds(itemIds) {
  const input = Array.isArray(itemIds) ? itemIds : []
  return [...new Set(input.filter(Boolean))]
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
export async function fetchProductsByItemIds(stripe, itemIds) {
  const uniqueIds = normalizeItemIds(itemIds)
  if (!uniqueIds.length) return new Map()
  const entries = await Promise.all(
    uniqueIds.map(async (itemId) => {
      // If id is in the form artworkId:category:size, use as is
      // Otherwise, fallback to original id
      const product = await findProductByName(stripe, itemId)
      return [itemId, product]
    })
  )
  return new Map(entries)
}

export async function fetchPricesByItemIds(stripe, itemIds) {
  const productsByItemId = await fetchProductsByItemIds(stripe, itemIds)
  const entries = await Promise.all(
    Array.from(productsByItemId.entries()).map(async ([itemId, product]) => {
      const price = await resolvePriceForProduct(stripe, product)
      return [itemId, { product, price }]
    })
  )
  return new Map(entries)
}

export async function fetchPricesByItemIdsAndCurrency(stripe, itemIds, currency = 'USD') {
  const productsByItemId = await fetchProductsByItemIds(stripe, itemIds)
  const entries = await Promise.all(
    Array.from(productsByItemId.entries()).map(async ([itemId, product]) => {
      const price = await resolvePriceForProductAndCurrency(stripe, product, currency)
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

export { normalizeItemIds, serializePrice }
