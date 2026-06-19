const DEFAULT_RATE_LIMIT_WINDOW_MS = 60 * 1000
const MAX_RATE_LIMIT_KEYS = 1000
export const MAX_ITEM_IDS = 20
export const MAX_ITEM_ID_LENGTH = 96
export const MAX_LINE_ITEM_QUANTITY = 10
export const ALLOWED_CURRENCIES = Object.freeze(['USD', 'CAD'])
const ITEM_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9:_-]*$/
const rateLimitBuckets = new Map()

function isTestEnv() {
  return process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST)
}

function setHeader(res, key, value) {
  if (typeof res?.setHeader === 'function') {
    res.setHeader(key, value)
  }
}

export function setApiSecurityHeaders(res) {
  setHeader(res, 'X-Content-Type-Options', 'nosniff')
  setHeader(res, 'Referrer-Policy', 'strict-origin-when-cross-origin')
  setHeader(res, 'Cache-Control', 'no-store')
}

export function isValidItemId(itemId) {
  if (typeof itemId !== 'string') return false
  const trimmed = itemId.trim()
  return (
    trimmed.length > 0 &&
    trimmed.length <= MAX_ITEM_ID_LENGTH &&
    ITEM_ID_PATTERN.test(trimmed)
  )
}

export function invalidItemIds(itemIds) {
  const input = Array.isArray(itemIds) ? itemIds : []
  return input.filter((itemId) => itemId != null && itemId !== '' && !isValidItemId(itemId))
}

export function normalizeCurrency(value, fallback = 'USD') {
  const normalized = typeof value === 'string' ? value.trim().toUpperCase() : fallback
  return ALLOWED_CURRENCIES.includes(normalized) ? normalized : null
}

export function isValidStripeCheckoutSessionId(sessionId) {
  return typeof sessionId === 'string' && /^cs_(test|live)_[A-Za-z0-9_]+$/.test(sessionId)
}

function normalizedHeader(headers, name) {
  if (!headers) return ''
  const value = headers[name] || headers[name.toLowerCase()]
  return Array.isArray(value) ? value[0] : value || ''
}

function normalizeOrigin(value) {
  if (!value || typeof value !== 'string') return ''
  try {
    return new URL(value).origin
  } catch {
    return ''
  }
}

function requestOrigin(req) {
  return normalizeOrigin(normalizedHeader(req.headers, 'origin'))
}

function requestHostOrigin(req) {
  const host = normalizedHeader(req.headers, 'x-forwarded-host') || normalizedHeader(req.headers, 'host')
  if (!host) return ''
  const proto = normalizedHeader(req.headers, 'x-forwarded-proto') || 'https'
  return normalizeOrigin(`${proto}://${host}`)
}

function allowedOrigins(req) {
  return new Set(
    [
      normalizeOrigin(process.env.SITE_URL),
      process.env.VERCEL_URL ? normalizeOrigin(`https://${process.env.VERCEL_URL}`) : '',
      requestHostOrigin(req),
      process.env.NODE_ENV !== 'production' ? 'http://localhost:5173' : '',
      process.env.NODE_ENV !== 'production' ? 'http://127.0.0.1:5173' : '',
    ].filter(Boolean)
  )
}

function isAllowedOrigin(req) {
  const origin = requestOrigin(req)
  if (!origin) return true
  return allowedOrigins(req).has(origin)
}

function hasJsonContentType(req) {
  const contentType = normalizedHeader(req.headers, 'content-type')
  if (!contentType && isTestEnv()) return true
  return /^application\/json(?:;|$)/i.test(contentType)
}

function requestIp(req) {
  const forwardedFor = normalizedHeader(req.headers, 'x-forwarded-for')
  if (forwardedFor) return forwardedFor.split(',')[0].trim()
  return normalizedHeader(req.headers, 'x-real-ip') || req.socket?.remoteAddress || 'unknown'
}

function pruneRateLimitBuckets(now) {
  if (rateLimitBuckets.size <= MAX_RATE_LIMIT_KEYS) return
  for (const [key, bucket] of rateLimitBuckets) {
    if (bucket.resetAt <= now) rateLimitBuckets.delete(key)
  }
  while (rateLimitBuckets.size > MAX_RATE_LIMIT_KEYS) {
    const oldestKey = rateLimitBuckets.keys().next().value
    if (!oldestKey) break
    rateLimitBuckets.delete(oldestKey)
  }
}

function isRateLimited(req, { key = 'api', max = 60, windowMs = DEFAULT_RATE_LIMIT_WINDOW_MS } = {}) {
  if (isTestEnv()) return null

  const now = Date.now()
  pruneRateLimitBuckets(now)

  const bucketKey = `${key}:${requestIp(req)}`
  const bucket = rateLimitBuckets.get(bucketKey)
  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(bucketKey, { count: 1, resetAt: now + windowMs })
    return null
  }

  bucket.count += 1
  if (bucket.count <= max) return null

  return {
    retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  }
}

function rejectMethod(res, methods) {
  setHeader(res, 'Allow', methods.join(', '))
  res.status(405).send('Method not allowed')
}

export function withApiSecurity(handler, options = {}) {
  const {
    methods = ['POST'],
    requireJson = true,
    checkOrigin = true,
    rateLimit,
  } = options

  return async function securedHandler(req, res) {
    setApiSecurityHeaders(res)

    if (!methods.includes(req.method)) {
      rejectMethod(res, methods)
      return
    }

    if (checkOrigin && !isAllowedOrigin(req)) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    if (requireJson && req.method !== 'GET' && req.method !== 'HEAD' && !hasJsonContentType(req)) {
      res.status(415).json({ error: 'Content-Type must be application/json' })
      return
    }

    const limit = rateLimit ? isRateLimited(req, rateLimit) : null
    if (limit) {
      setHeader(res, 'Retry-After', String(limit.retryAfterSeconds))
      res.status(429).json({ error: 'Too many requests. Please try again shortly.' })
      return
    }

    await handler(req, res)
  }
}
