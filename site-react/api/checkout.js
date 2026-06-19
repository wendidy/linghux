import Stripe from 'stripe'
import { fetchPricesByItemIdsAndCurrency, normalizeItemIds } from './stripeProducts.js'
import { reserveInventory, releaseReservations, reservationExpiresAt } from './inventory.js'
import { inventoryCapFor } from './catalogInventory.js'
import {
  MAX_ITEM_IDS,
  MAX_LINE_ITEM_QUANTITY,
  invalidItemIds,
  isValidItemId,
  normalizeCurrency,
  withApiSecurity,
} from './security.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const SHIPPING_RATE_RULES = {
  CA: {
    currency: 'CAD',
    freeThreshold: 30000,
    freeRateId: 'shr_1TcEfb2VIu8UkxmlkxZowGRw',
    paidRateId: 'shr_1TgZ262VIu8UkxmlOSPsiF6x',
    // paidRateId: 'shr_1TcEfA2VIu8Ukxml9abGIJNN',
  },
  US: {
    currency: 'USD',
    freeThreshold: 25000,
    freeRateId: 'shr_1TcEfq2VIu8UkxmlOZkXPLlw',
    paidRateId: 'shr_1TgZ2d2VIu8UkxmlKM89ukTI',
    // paidRateId: 'shr_1TcEee2VIu8UkxmlUSw3XsDr',
  },
}
const ALLOWED_SHIPPING_COUNTRIES = Object.freeze(Object.keys(SHIPPING_RATE_RULES))
const DEFAULT_SHIPPING_COUNTRY_BY_CURRENCY = {
  CAD: 'CA',
  USD: 'US',
}
const METADATA_TEXT_MAX_LENGTH = 120

function getBaseUrl(req) {
  if (process.env.SITE_URL) {
    return process.env.SITE_URL.replace(/\/$/, '')
  }

  const proto = req.headers['x-forwarded-proto'] || 'https'
  const host = req.headers['x-forwarded-host'] || req.headers.host
  return `${proto}://${host}`.replace(/\/$/, '')
}

function normalizeShippingCountry(country, currency = 'USD') {
  const normalizedCountry = typeof country === 'string' ? country.trim().toUpperCase() : ''
  if (ALLOWED_SHIPPING_COUNTRIES.includes(normalizedCountry)) return normalizedCountry

  if (!normalizedCountry) {
    return DEFAULT_SHIPPING_COUNTRY_BY_CURRENCY[currency] || 'US'
  }

  return null
}

function shippingRateFor(country, subtotal) {
  const rule = SHIPPING_RATE_RULES[country]
  if (!rule) return null
  return subtotal >= rule.freeThreshold ? rule.freeRateId : rule.paidRateId
}

function cleanMetadataText(value) {
  if (typeof value !== 'string') return undefined
  const cleaned = value
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned ? cleaned.slice(0, METADATA_TEXT_MAX_LENGTH) : undefined
}

function quantityFor(item) {
  if (item?.quantity == null) return 1
  if (
    Number.isInteger(item.quantity) &&
    item.quantity > 0 &&
    item.quantity <= MAX_LINE_ITEM_QUANTITY
  ) {
    return item.quantity
  }
  return null
}

async function checkoutHandler(req, res) {
  let reservationIds = []
  try {
    // Handle both old format (array) and new format ({ lineItems, currency })
    let items = []
    let currency = 'USD'
    let shippingCountry = 'US'
    
    if (Array.isArray(req.body)) {
      items = req.body
    } else if (req.body && typeof req.body === 'object') {
      items = Array.isArray(req.body.lineItems) ? req.body.lineItems : []
      currency = normalizeCurrency(req.body.currency || 'USD')
      if (!currency) {
        res.status(400).json({ error: 'Unsupported currency' })
        return
      }
      shippingCountry = normalizeShippingCountry(req.body.shippingCountry, currency)
    }

    if (!shippingCountry) {
      res.status(400).json({ error: 'Shipping is only available within Canada and the United States' })
      return
    }

    currency = SHIPPING_RATE_RULES[shippingCountry]?.currency || currency

    if (!items.length) {
      res.status(400).json({ error: 'Cart is empty' })
      return
    }

    if (items.length > MAX_ITEM_IDS) {
      res.status(400).json({ error: `Too many line items. Maximum is ${MAX_ITEM_IDS}.` })
      return
    }

    const rawItemIds = items.map((item) => item?.id)
    if (invalidItemIds(rawItemIds).length > 0) {
      res.status(400).json({ error: 'One or more item IDs are invalid' })
      return
    }

    if (items.some((item) => item?.itemId && !isValidItemId(item.itemId))) {
      res.status(400).json({ error: 'One or more item IDs are invalid' })
      return
    }

    if (items.some((item) => quantityFor(item) === null)) {
      res.status(400).json({ error: `Quantity must be between 1 and ${MAX_LINE_ITEM_QUANTITY}` })
      return
    }

    const itemIds = normalizeItemIds(items.map((item) => item?.id))

    if (!itemIds.length) {
      res.status(400).json({ error: 'No item IDs provided' })
      return
    }

    // console.log(`[/api/checkout] Processing ${items.length} items, ${itemIds.length} unique IDs:`, itemIds)

    const priceMap = await fetchPricesByItemIdsAndCurrency(stripe, itemIds, currency)

    const lineItems = items.map((item) => {
      const entry = priceMap.get(item?.id)
      const price = entry?.price
      if (!price?.id) {
        // console.error(`[/api/checkout] ✗ No price found for item: ${item?.id}`)
        throw new Error(`Unable to resolve Stripe ${currency} price for cart item`)
      }
      // console.log(`[/api/checkout] ✓ Price found for ${item?.id}: ${price.id} (${price.currency} ${price.unit_amount})`)
      const quantity = quantityFor(item)
      const metadataItemId = isValidItemId(item.itemId) ? item.itemId.trim() : item.id
      return {
        itemId: metadataItemId,
        itemTitle: cleanMetadataText(item.title),
        category: cleanMetadataText(item.category),
        price: price.id,
        quantity,
        productId: price.product,
        unitAmount: price.unit_amount,
      }
    })
    const subtotal = lineItems.reduce((sum, line) => sum + line.unitAmount * line.quantity, 0)
    const shippingRateId = shippingRateFor(shippingCountry, subtotal)

    const productIds = [...new Set(lineItems.map((line) => line.productId).filter(Boolean))]
    const products = await Promise.all(productIds.map((id) => stripe.products.retrieve(id)))
    const productById = new Map(products.map((product) => [product.id, product]))

    const requestedByProduct = new Map()
    for (const line of lineItems) {
      const product = productById.get(line.productId)
      const cap = inventoryCapFor(product, line)
      if (!cap) continue
      const current = requestedByProduct.get(line.productId) || {
        productId: line.productId,
        sku: line.itemId,
        quantity: 0,
        cap,
      }
      current.quantity += line.quantity
      requestedByProduct.set(line.productId, current)
    }

    const reservationRequests = Array.from(requestedByProduct.values())
    const checkoutExpiresAt = reservationExpiresAt()

    if (reservationRequests.length > 0) {
      const reservations = await reserveInventory(reservationRequests, { expiresAt: checkoutExpiresAt })
      reservationIds = reservations.map((reservation) => reservation.id)
    }

    const baseUrl = getBaseUrl(req)

    const metadata = {}
    if (reservationIds.length > 0) {
      metadata.reservation_ids = JSON.stringify(reservationIds)
    }
    // Store currency for reference in webhook
    metadata.currency = currency
    metadata.shipping_country = shippingCountry
    if (shippingRateId) metadata.shipping_rate_id = shippingRateId
    
    // Store item metadata (id and title for each item purchased)
    const itemMetadata = lineItems.map((line) => ({
      itemId: line.itemId,
      title: line.itemTitle,
    }))
    metadata.items = JSON.stringify(itemMetadata)

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems.map(({ price, quantity }) => ({ price, quantity })),
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cancel?session_id={CHECKOUT_SESSION_ID}`,
      expires_at: Math.floor(checkoutExpiresAt.getTime() / 1000),
      billing_address_collection: 'required',
      phone_number_collection: {
        enabled: true,
      },
      shipping_address_collection: {
        allowed_countries: [shippingCountry],
      },
      shipping_options: shippingRateId ? [{ shipping_rate: shippingRateId }] : undefined,
      payment_intent_data: {
        metadata,
      },
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    })

    res.status(200).json({
      url: session.url,
      sessionId: session.id,
    })
  } catch (error) {
    if (reservationIds.length > 0) {
      try {
        await releaseReservations(reservationIds)
      } catch {
        // Ignore cleanup errors to preserve original failure response.
      }
    }
    res.status(500).json({ error: error.message || 'Checkout failed' })
  }
}

export default withApiSecurity(checkoutHandler, {
  rateLimit: { key: 'checkout', max: 20 },
})
