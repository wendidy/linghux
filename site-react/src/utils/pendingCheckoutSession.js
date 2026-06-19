const PENDING_CHECKOUT_SESSION_KEY = 'linghux.pendingCheckoutSession'

function storage() {
  if (typeof window === 'undefined') return null
  return window.sessionStorage || null
}

export function rememberPendingCheckoutSession(sessionId) {
  if (!sessionId) return
  const store = storage()
  if (!store) return

  store.setItem(
    PENDING_CHECKOUT_SESSION_KEY,
    JSON.stringify({
      sessionId,
      createdAt: Date.now(),
    })
  )
}

export function readPendingCheckoutSession() {
  const store = storage()
  if (!store) return null

  try {
    const parsed = JSON.parse(store.getItem(PENDING_CHECKOUT_SESSION_KEY) || 'null')
    return parsed?.sessionId ? parsed : null
  } catch {
    return null
  }
}

export function clearPendingCheckoutSession(sessionId) {
  const pending = readPendingCheckoutSession()
  if (!pending) return
  if (sessionId && pending.sessionId !== sessionId) return

  storage()?.removeItem(PENDING_CHECKOUT_SESSION_KEY)
}
