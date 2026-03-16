import Stripe from 'stripe'
import { listActivePricesByLookupKeys, normalizeLookupKeys } from './stripeLookup.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed')
    return
  }

  try {
    const lookupKeys = normalizeLookupKeys(req.body?.lookupKeys)

    if (lookupKeys.length === 0) {
      res.status(400).json({ error: 'No price lookup keys provided' })
      return
    }

    const prices = (await listActivePricesByLookupKeys(stripe, lookupKeys)).map((price) => ({
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
