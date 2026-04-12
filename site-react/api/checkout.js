import Stripe from 'stripe'
import { fetchPricesByItemIds, normalizeItemIds } from './stripeProducts.js'
import { reserveInventory, releaseReservations } from './inventory.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

function parseEditionCap(product) {
  const raw = product?.metadata?.edition_cap
  if (raw == null) return null
  const cap = Number.parseInt(raw, 10)
  return Number.isInteger(cap) && cap > 0 ? cap : null
}

function getBaseUrl(req) {
  if (process.env.SITE_URL) {
    return process.env.SITE_URL.replace(/\/$/, '')
  }

  const proto = req.headers['x-forwarded-proto'] || 'https'
  const host = req.headers['x-forwarded-host'] || req.headers.host
  return `${proto}://${host}`.replace(/\/$/, '')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed')
    return
  }

  let reservationIds = []
  try {
    const items = Array.isArray(req.body) ? req.body : []

    if (!items.length) {
      res.status(400).json({ error: 'Cart is empty' })
      return
    }

    const itemIds = normalizeItemIds(items.map((item) => item?.id))

    if (!itemIds.length) {
      res.status(400).json({ error: 'No item IDs provided' })
      return
    }

    const priceMap = await fetchPricesByItemIds(stripe, itemIds)

    const lineItems = items.map((item) => {
      const entry = priceMap.get(item?.id)
      const price = entry?.price
      if (!price?.id) {
        throw new Error('Unable to resolve Stripe price for cart item')
      }
      const quantity = Number.isInteger(item.quantity) && item.quantity > 0 ? item.quantity : 1
      return {
        price: price.id,
        quantity,
        productId: price.product,
      }
    })

    const productIds = [...new Set(lineItems.map((line) => line.productId).filter(Boolean))]
    const products = await Promise.all(productIds.map((id) => stripe.products.retrieve(id)))
    const productById = new Map(products.map((product) => [product.id, product]))

    const requestedByProduct = new Map()
    for (const line of lineItems) {
      const product = productById.get(line.productId)
      const cap = parseEditionCap(product)
      if (!cap) continue
      requestedByProduct.set(line.productId, (requestedByProduct.get(line.productId) || 0) + line.quantity)
    }

    const reservationRequests = Array.from(requestedByProduct.entries()).map(([productId, quantity]) => ({
      productId,
      quantity,
      cap: parseEditionCap(productById.get(productId)),
    }))

    if (reservationRequests.length > 0) {
      const reservations = await reserveInventory(reservationRequests)
      reservationIds = reservations.map((reservation) => reservation.id)
    }

    const baseUrl = getBaseUrl(req)

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems.map(({ price, quantity }) => ({ price, quantity })),
      success_url: `${baseUrl}/success`,
      cancel_url: `${baseUrl}/cancel`,
      billing_address_collection: 'required',
      phone_number_collection: {
        enabled: true,
      },
      shipping_address_collection: {
        allowed_countries: ['US', 'CA'],
      },
      metadata: reservationIds.length > 0
        ? { reservation_ids: JSON.stringify(reservationIds) }
        : undefined,
    })

    res.status(200).json({ url: session.url })
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
