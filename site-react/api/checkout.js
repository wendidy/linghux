import Stripe from 'stripe'
import { listActivePricesByLookupKeys, mapPricesByLookupKey, normalizeLookupKeys } from './stripeLookup.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

function resolvePriceByLookupKeys(primaryKey, fallbackKey, priceByKey) {
  if (primaryKey && priceByKey[primaryKey]) return priceByKey[primaryKey]
  if (fallbackKey && priceByKey[fallbackKey]) return priceByKey[fallbackKey]
  return null
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

  try {
    const items = Array.isArray(req.body) ? req.body : []

    if (!items.length) {
      res.status(400).json({ error: 'Cart is empty' })
      return
    }

    const lookupKeys = normalizeLookupKeys(items.flatMap((item) => [
      item?.lookupKey,
      item?.fallbackLookupKey,
    ]))

    if (!lookupKeys.length) {
      res.status(400).json({ error: 'No price lookup keys provided' })
      return
    }

    const prices = await listActivePricesByLookupKeys(stripe, lookupKeys)
    const priceByKey = mapPricesByLookupKey(prices)

    const lineItems = items.map((item) => {
      const price = resolvePriceByLookupKeys(
        item?.lookupKey,
        item?.fallbackLookupKey,
        priceByKey
      )
      if (!price?.id) {
        throw new Error('Unable to resolve Stripe price for cart item')
      }
      const quantity = Number.isInteger(item.quantity) && item.quantity > 0 ? item.quantity : 1
      return {
        price: price.id,
        quantity,
      }
    })

    const baseUrl = getBaseUrl(req)

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: `${baseUrl}/success`,
      cancel_url: `${baseUrl}/cancel`,
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['US', 'CA'],
      },
    })

    res.status(200).json({ url: session.url })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Checkout failed' })
  }
}
