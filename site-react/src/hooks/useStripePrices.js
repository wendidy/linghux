import { useEffect, useMemo, useState } from 'react'
import { fetchStripePrices } from '../utils/stripePrices'

export function useStripePrices(lookupKeys) {
  const keys = useMemo(() => {
    const input = Array.isArray(lookupKeys) ? lookupKeys : []
    return [...new Set(input.filter(Boolean))]
  }, [lookupKeys])
  const keysKey = useMemo(() => keys.join('|'), [keys])
  const [priceByKey, setPriceByKey] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let isActive = true
    const controller = new AbortController()

    if (keys.length === 0) {
      setPriceByKey({})
      setLoading(false)
      setError('')
      return () => controller.abort()
    }

    setLoading(true)
    setError('')

    fetchStripePrices(keys, { signal: controller.signal })
      .then((map) => {
        if (!isActive) return
        setPriceByKey(map)
      })
      .catch((err) => {
        if (!isActive || err?.name === 'AbortError') return
        setPriceByKey({})
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
  }, [keysKey])

  return { priceByKey, loading, error }
}
