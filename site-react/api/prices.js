import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed')
    return
  }

  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : []
    const uniqueIds = [...new Set(ids.filter(Boolean))]

    if (uniqueIds.length === 0) {
      res.status(400).json({ error: 'No price IDs provided' })
      return
    }

    const prices = await Promise.all(
      uniqueIds.map(async (id) => {
        const price = await stripe.prices.retrieve(id)
        return {
          id: price.id,
          unit_amount: price.unit_amount,
          currency: price.currency,
          nickname: price.nickname || null,
          product: price.product,
        }
      })
    )

    res.status(200).json({ prices })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch prices' })
  }
}
