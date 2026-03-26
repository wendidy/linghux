import Stripe from 'stripe'
import { withClient } from './db.js'
import { fetchPricesByItemIds, normalizeItemIds } from './stripeProducts.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

function parseEditionCap(product) {
  const raw = product?.metadata?.edition_cap
  if (raw == null) return null
  const cap = Number.parseInt(raw, 10)
  return Number.isInteger(cap) && cap > 0 ? cap : null
}

async function getInventoryByProductId(productIds) {
  if (!productIds.length) return new Map()
  return withClient(async (client) => {
    const { rows } = await client.query(
      `SELECT product_id, cap, sold, reserved
       FROM inventory
       WHERE product_id = ANY($1)`,
      [productIds]
    )
    return new Map(rows.map((row) => [row.product_id, row]))
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed')
    return
  }

  try {
    const itemIds = normalizeItemIds(req.body?.itemIds)
    if (!itemIds.length) {
      res.status(400).json({ error: 'No item IDs provided' })
      return
    }

    const priceMap = await fetchPricesByItemIds(stripe, itemIds)
    const productIds = [
      ...new Set(
        Array.from(priceMap.values())
          .map((entry) => entry?.product?.id || entry?.price?.product)
          .filter(Boolean)
      ),
    ]
    const products = await Promise.all(productIds.map((id) => stripe.products.retrieve(id)))
    const productById = new Map(products.map((product) => [product.id, product]))
    const inventoryByProductId = await getInventoryByProductId(productIds)

    const availability = {}
    for (const itemId of itemIds) {
      const entry = priceMap.get(itemId)
      const price = entry?.price
      const productId = entry?.product?.id || price?.product

      if (!price || !productId) {
        availability[itemId] = { status: 'missing', soldOut: false }
        continue
      }

      const product = productById.get(productId)
      const cap = parseEditionCap(product)
      if (!cap) {
        availability[itemId] = {
          status: 'unlimited',
          soldOut: false,
          productId,
        }
        continue
      }

      const inventoryRow = inventoryByProductId.get(productId)
      const sold = Number.parseInt(inventoryRow?.sold ?? 0, 10) || 0
      const reserved = Number.parseInt(inventoryRow?.reserved ?? 0, 10) || 0
      const available = cap - sold - reserved
      availability[itemId] = {
        status: available <= 0 ? 'sold_out' : 'available',
        soldOut: available <= 0,
        productId,
        cap,
        sold,
        reserved,
        available,
      }
    }

    res.status(200).json({ availability })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch availability' })
  }
}
