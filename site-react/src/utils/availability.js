const AVAILABILITY_FETCH_CHUNK_SIZE = 20

async function fetchAvailabilityChunk(itemIds, signal) {
  const res = await fetch('/api/availability', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemIds }),
    signal,
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data?.error || 'Unable to load availability')
  }

  return data?.availability || {}
}

export async function fetchAvailability(itemIds, { signal } = {}) {
  const uniqueIds = [...new Set((Array.isArray(itemIds) ? itemIds : []).filter(Boolean))]
  if (uniqueIds.length === 0) return {}

  const chunks = []
  for (let index = 0; index < uniqueIds.length; index += AVAILABILITY_FETCH_CHUNK_SIZE) {
    chunks.push(uniqueIds.slice(index, index + AVAILABILITY_FETCH_CHUNK_SIZE))
  }

  const availability = {}
  const errors = []

  for (const chunk of chunks) {
    try {
      Object.assign(availability, await fetchAvailabilityChunk(chunk, signal))
    } catch (error) {
      if (error?.name === 'AbortError') throw error
      errors.push(error)
    }
  }

  if (Object.keys(availability).length === 0 && errors.length > 0) {
    throw errors[0]
  }

  return availability
}
