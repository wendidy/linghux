import { useEffect, useMemo, useState } from 'react'
import { useCurrency } from '../context/CurrencyContext'
import { fetchStripePrices } from '../utils/stripePrices'

const priceCache = new Map()

function cacheKey(currency, itemId) {
  return `${currency}:${itemId}`
}

function cachedPricesFor(ids, currency) {
  const prices = {}
  for (const id of ids) {
    const cached = priceCache.get(cacheKey(currency, id))
    if (cached) prices[id] = cached
  }
  return prices
}

function cachePrices(prices, currency) {
  for (const [itemId, price] of Object.entries(prices)) {
    if (price) priceCache.set(cacheKey(currency, itemId), price)
  }
}

function mergeKnownPrices(ids, currency, prices) {
  const known = cachedPricesFor(ids, currency)
  return { ...known, ...prices }
}

function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timeoutId)
      reject(new DOMException('Aborted', 'AbortError'))
    }, { once: true })
  })
}

async function fetchPricesWithRetry(ids, currency, options) {
  const first = await fetchStripePrices(ids, currency, options)
  const missingIds = ids.filter((id) => !first[id])
  if (missingIds.length === 0) return first

  await delay(250, options?.signal)
  const retry = await fetchStripePrices(missingIds, currency, options)
  const prices = { ...first, ...retry }
  const stillMissingIds = ids.filter((id) => !prices[id])
  if (stillMissingIds.length === 0) return prices

  await delay(500, options?.signal)
  const finalRetry = await fetchStripePrices(stillMissingIds, currency, options)
  return { ...prices, ...finalRetry }
}

export function useStripePrices(itemIds) {
  const { currency } = useCurrency()
  const ids = useMemo(() => {
    const input = Array.isArray(itemIds) ? itemIds : []
    return [...new Set(input.filter(Boolean))]
  }, [itemIds])
  const idsKey = useMemo(() => [...ids].sort().join('|'), [ids])
  const [priceById, setPriceById] = useState(() => cachedPricesFor(ids, currency))
  const [loading, setLoading] = useState(() => ids.some((id) => !priceCache.get(cacheKey(currency, id))))
  const [error, setError] = useState('')

  useEffect(() => {
    let isActive = true
    const controller = new AbortController()

    if (ids.length === 0) {
      setPriceById({})
      setLoading(false)
      setError('')
      return () => controller.abort()
    }

    setLoading(true)
    setError('')
    setPriceById((current) => mergeKnownPrices(ids, currency, current))

    fetchPricesWithRetry(ids, currency, { signal: controller.signal })
      .then((map) => {
        if (!isActive) return
        cachePrices(map, currency)
        setPriceById((current) => mergeKnownPrices(ids, currency, { ...current, ...map }))
      })
      .catch((err) => {
        if (!isActive || err?.name === 'AbortError') return
        setError(err?.message || 'Failed to load prices')
      })
      .finally(() => {
        if (!isActive) return
        setLoading(false)
      })

    return () => {
      isActive = false
      controller.abort()
    }
  }, [idsKey, currency])

  return { priceById, loading, error }
}
