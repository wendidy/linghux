import Stripe from 'stripe'
import { fetchPricesByItemIds, fetchPricesByItemIdsAndCurrency, normalizeItemIds, serializePrice } from './stripeProducts.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed')
    return
  }

  try {
    const itemIds = normalizeItemIds(req.body?.itemIds)
    const currency = (req.body?.currency || 'USD').toUpperCase()

    if (itemIds.length === 0) {
      res.status(400).json({ error: 'No item IDs provided' })
      return
    }

    // For per-size pricing, itemIds may be id:category:size.
    // Display requests can fall back to default Stripe prices if a selected
    // display currency has not been configured for every product yet.
    let priceMap = currency && currency !== 'USD'
      ? await fetchPricesByItemIdsAndCurrency(stripe, itemIds, currency)
      : await fetchPricesByItemIds(stripe, itemIds)

    if (currency && currency !== 'USD') {
      const missingIds = Array.from(priceMap.entries())
        .filter(([, entry]) => !entry?.price)
        .map(([itemId]) => itemId)

      if (missingIds.length > 0) {
        const fallbackMap = await fetchPricesByItemIds(stripe, missingIds)
        priceMap = new Map([
          ...Array.from(priceMap.entries()),
          ...Array.from(fallbackMap.entries()).filter(([, entry]) => entry?.price),
        ])
      }
    }

    const prices = Array.from(priceMap.entries())
      .map(([itemId, { price }]) => serializePrice(itemId, price))
      .filter(Boolean)

    res.status(200).json({ prices })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch prices' })
  }
}
