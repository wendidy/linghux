export function formatCurrency(cents, currency = 'USD', locale = 'en-US') {
  if (typeof cents !== 'number' || Number.isNaN(cents)) return ''
  const safeCurrency = typeof currency === 'string' && currency.trim() ? currency.toUpperCase() : 'USD'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: safeCurrency,
  }).format(cents / 100)
}

export function formatStripePrice(price, locale = 'en-US') {
  if (!price || typeof price.unit_amount !== 'number') return ''
  return formatCurrency(price.unit_amount, price.currency, locale)
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

export async function fetchStripePrices(itemIds, { signal } = {}) {
  const uniqueIds = [...new Set((Array.isArray(itemIds) ? itemIds : []).filter(Boolean))]
  if (uniqueIds.length === 0) return {}

  const res = await fetch('/api/prices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemIds: uniqueIds }),
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
