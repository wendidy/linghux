import { useEffect, useMemo, useState } from 'react'
import { fetchAvailability } from '../utils/availability'

export function useAvailability(itemIds) {
  const ids = useMemo(() => {
    const input = Array.isArray(itemIds) ? itemIds : []
    return [...new Set(input.filter(Boolean))]
  }, [itemIds])
  const idsKey = useMemo(() => ids.join('|'), [ids])
  const [availabilityById, setAvailabilityById] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let isActive = true
    const controller = new AbortController()

    if (ids.length === 0) {
      setAvailabilityById({})
      setLoading(false)
      setError('')
      return () => controller.abort()
    }

    setLoading(true)
    setError('')

    fetchAvailability(ids, { signal: controller.signal })
      .then((map) => {
        if (!isActive) return
        setAvailabilityById(map)
      })
      .catch((err) => {
        if (!isActive || err?.name === 'AbortError') return
        setAvailabilityById({})
        setError(err?.message || 'Failed to load availability')
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

  return { availabilityById, loading, error }
}
