import { useEffect, useMemo, useState } from 'react'
import { fetchStripePrices } from '../utils/stripePrices'

export function useStripePrices(priceIds) {
  const ids = useMemo(() => {
    const input = Array.isArray(priceIds) ? priceIds : []
    return [...new Set(input.filter(Boolean))]
  }, [priceIds])
  const idsKey = useMemo(() => ids.join('|'), [ids])
  const [priceById, setPriceById] = useState({})
  const [loading, setLoading] = useState(false)
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

    fetchStripePrices(ids, { signal: controller.signal })
      .then((map) => {
        if (!isActive) return
        setPriceById(map)
      })
      .catch((err) => {
        if (!isActive || err?.name === 'AbortError') return
        setPriceById({})
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
  }, [idsKey])

  return { priceById, loading, error }
}

export function useStripePrice(priceId) {
  const { priceById, loading, error } = useStripePrices(priceId ? [priceId] : [])
  return {
    price: priceId ? priceById[priceId] || null : null,
    loading,
    error,
  }
}
