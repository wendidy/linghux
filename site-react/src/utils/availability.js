export async function fetchAvailability(itemIds, { signal } = {}) {
  const uniqueIds = [...new Set((Array.isArray(itemIds) ? itemIds : []).filter(Boolean))]
  if (uniqueIds.length === 0) return {}

  const res = await fetch('/api/availability', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemIds: uniqueIds }),
    signal,
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data?.error || 'Unable to load availability')
  }

  return data?.availability || {}
}
