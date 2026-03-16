const DEFAULT_BATCH_SIZE = 10

export function normalizeLookupKeys(lookupKeys) {
  const input = Array.isArray(lookupKeys) ? lookupKeys : []
  return [...new Set(input.filter(Boolean))]
}

export function chunkArray(values, size = DEFAULT_BATCH_SIZE) {
  const chunks = []
  for (let i = 0; i < values.length; i += size) {
    chunks.push(values.slice(i, i + size))
  }
  return chunks
}

export async function listActivePricesByLookupKeys(stripe, lookupKeys, { batchSize = DEFAULT_BATCH_SIZE } = {}) {
  const uniqueKeys = normalizeLookupKeys(lookupKeys)
  if (!uniqueKeys.length) return []
  const batches = chunkArray(uniqueKeys, batchSize)
  const responses = await Promise.all(
    batches.map((keys) =>
      stripe.prices.list({
        lookup_keys: keys,
        active: true,
        limit: 100,
      })
    )
  )
  return responses.flatMap((response) => response.data || [])
}

export function mapPricesByLookupKey(prices) {
  const map = {}
  for (const price of prices || []) {
    if (price?.lookup_key) {
      map[price.lookup_key] = price
    }
  }
  return map
}
