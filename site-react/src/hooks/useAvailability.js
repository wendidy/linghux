import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  const requestIdRef = useRef(0)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      requestIdRef.current += 1
    }
  }, [])

  const loadAvailability = useCallback(async ({ signal } = {}) => {
    const requestId = ++requestIdRef.current
    const requestIds = idsKey ? idsKey.split('|') : []

    if (requestIds.length === 0) {
      setAvailabilityById({})
      setLoading(false)
      setError('')
      return {}
    }

    setLoading(true)
    setError('')

    try {
      const map = await fetchAvailability(requestIds, { signal })
      if (mountedRef.current && requestId === requestIdRef.current) {
        setAvailabilityById(map)
      }
      return map
    } catch (err) {
      if (err?.name === 'AbortError') return null
      if (mountedRef.current && requestId === requestIdRef.current) {
        setAvailabilityById({})
        setError(err?.message || 'Failed to load availability')
      }
      throw err
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }, [idsKey])

  useEffect(() => {
    const controller = new AbortController()
    loadAvailability({ signal: controller.signal }).catch(() => {})

    return () => {
      controller.abort()
    }
  }, [loadAvailability])

  const refreshAvailability = useCallback(
    () => loadAvailability(),
    [loadAvailability]
  )

  return { availabilityById, loading, error, refreshAvailability }
}
