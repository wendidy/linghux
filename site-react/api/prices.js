import Stripe from 'stripe'
import { fetchPricesByItemIds, fetchPricesByItemIdsAndCurrency, normalizeItemIds, serializePrice } from './stripeProducts.js'
import { MAX_ITEM_IDS, invalidItemIds, normalizeCurrency, withApiSecurity } from './security.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

async function pricesHandler(req, res) {
  try {
    const rawItemIds = Array.isArray(req.body?.itemIds) ? req.body.itemIds : []
    const currency = normalizeCurrency(req.body?.currency || 'USD')

    // console.log(`[/api/prices] Looking up ${itemIds.length} items in ${currency}:`, itemIds)

    if (!currency) {
      res.status(400).json({ error: 'Unsupported currency' })
      return
    }

    if (rawItemIds.length > MAX_ITEM_IDS) {
      res.status(400).json({ error: `Too many item IDs. Maximum is ${MAX_ITEM_IDS}.` })
      return
    }

    if (invalidItemIds(rawItemIds).length > 0) {
      res.status(400).json({ error: 'One or more item IDs are invalid' })
      return
    }

    const itemIds = normalizeItemIds(rawItemIds)
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

    // console.log(`[/api/prices] Returning ${prices.length} prices`)
    if (prices.length < itemIds.length) {
      const missingItems = itemIds.filter(
        (id) => !prices.some((p) => p?.item_id === id)
      )
      // console.log(`[/api/prices] ⚠ Missing prices for: ${missingItems.join(', ')}`)
    }

    res.status(200).json({ prices })
  } catch (error) {
    // console.error('[/api/prices] Error:', error.message)
    res.status(500).json({ error: error.message || 'Failed to fetch prices' })
  }
}

export default withApiSecurity(pricesHandler, {
  rateLimit: { key: 'prices', max: 120 },
})
