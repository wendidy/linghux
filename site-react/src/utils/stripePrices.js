export function formatCurrency(cents, currency = 'USD', locale = 'en-US') {
  if (typeof cents !== 'number' || Number.isNaN(cents)) return ''
  // Show a plain dollar-style symbol ("$") for both USD and CAD,
  // and append the currency code separately in formatStripePrice.
  // Using en-US + USD produces a clean "$1,234.56" without a "CA" prefix.
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(cents / 100)
  return formatted
}

export function formatStripePrice(price, locale = 'en-US') {
  if (!price || typeof price.unit_amount !== 'number') return ''
  const currencyCode = price.currency ? price.currency.toUpperCase() : 'USD'
  const formattedPrice = formatCurrency(price.unit_amount, price.currency, locale)
  return `${formattedPrice} ${currencyCode}`
}

export const PRICE_LABELS = {
  loading: 'Loading price…',
  missing: 'Missing item ID',
  unavailable: 'Price unavailable',
}

export function priceLabel({
  itemId,
  price,
  loading = false,
  missingLabel = PRICE_LABELS.missing,
  loadingLabel = PRICE_LABELS.loading,
  unavailableLabel = PRICE_LABELS.unavailable,
  formatter = formatStripePrice,
} = {}) {
  if (!itemId) return missingLabel
  if (price) return formatter(price)
  if (loading) return loadingLabel
  return unavailableLabel
}

export async function fetchStripePrices(itemIds, currency = 'USD', { signal } = {}) {
  const uniqueIds = [...new Set((Array.isArray(itemIds) ? itemIds : []).filter(Boolean))]
  if (uniqueIds.length === 0) return {}

  const res = await fetch('/api/prices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemIds: uniqueIds, currency }),
    signal,
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data?.error || 'Unable to load prices')
  }

  const map = {}
  for (const price of data.prices || []) {
    if (price?.item_id) map[price.item_id] = price
  }
  return map
}
