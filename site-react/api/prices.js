import Stripe from 'stripe'
import { fetchPricesByItemIds, normalizeItemIds, serializePrice } from './stripeProducts.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed')
    return
  }

  try {
    const itemIds = normalizeItemIds(req.body?.itemIds)

    if (itemIds.length === 0) {
      res.status(400).json({ error: 'No item IDs provided' })
      return
    }
    // console.log("KEY:", process.env.STRIPE_SECRET_KEY?.slice(0, 8), "itemIds:", itemIds)
    const priceMap = await fetchPricesByItemIds(stripe, itemIds)
    const prices = Array.from(priceMap.entries())
      .map(([itemId, { price }]) => serializePrice(itemId, price))
      .filter(Boolean)

    res.status(200).json({ prices })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch prices' })
  }
}
