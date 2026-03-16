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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed')
    return
  }

  try {
    const lookupKeys = Array.isArray(req.body?.lookupKeys) ? req.body.lookupKeys : []
    const uniqueKeys = [...new Set(lookupKeys.filter(Boolean))]

    if (uniqueKeys.length === 0) {
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
    const prices = responses.flatMap((response) => response.data || []).map((price) => ({
      id: price.id,
      lookup_key: price.lookup_key || null,
      unit_amount: price.unit_amount,
      currency: price.currency,
      nickname: price.nickname || null,
      product: price.product,
    }))

    res.status(200).json({ prices })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch prices' })
  }
}
