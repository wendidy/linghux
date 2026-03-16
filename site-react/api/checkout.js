import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const LOOKUP_KEYS_BATCH_SIZE = 10

function chunkArray(values, size) {
  const chunks = []
  for (let i = 0; i < values.length; i += size) {
    chunks.push(values.slice(i, i + size))
  }
  return chunks
}

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

    const lookupKeys = items.flatMap((item) => [
      item?.lookupKey,
      item?.fallbackLookupKey,
    ]).filter(Boolean)
    const uniqueKeys = [...new Set(lookupKeys)]

    if (!uniqueKeys.length) {
      res.status(400).json({ error: 'No price lookup keys provided' })
      return
    }

    const batches = chunkArray(uniqueKeys, LOOKUP_KEYS_BATCH_SIZE)
    const responses = await Promise.all(
      batches.map((keys) =>
        stripe.prices.list({
          lookup_keys: keys,
          active: true,
          limit: 100,
        })
      )
    )
    const priceByKey = {}
    for (const response of responses) {
      for (const price of response.data || []) {
        if (price?.lookup_key) {
          priceByKey[price.lookup_key] = price
        }
      }
    }

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
