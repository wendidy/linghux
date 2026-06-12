import Stripe from 'stripe'
import { releaseReservations } from './inventory.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

function parseReservationIds(metadata) {
  if (!metadata?.reservation_ids) return []
  try {
    const parsed = JSON.parse(metadata.reservation_ids)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed')
    return
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    res.status(500).json({ error: 'STRIPE_SECRET_KEY is not set' })
    return
  }

  const { sessionId } = req.body || {}
  if (!sessionId || typeof sessionId !== 'string') {
    res.status(400).json({ error: 'Missing or invalid sessionId' })
    return
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (!session) {
      res.status(404).json({ error: 'Checkout session not found' })
      return
    }

    if (session.payment_status === 'paid') {
      res.status(400).json({ error: 'Checkout session is already paid and cannot be cancelled' })
      return
    }

    const reservationIds = parseReservationIds(session.metadata)
    if (reservationIds.length === 0) {
      res.status(200).json({ released: false, message: 'No reserved items found for this checkout session.' })
      return
    }

    await releaseReservations(reservationIds)
    res.status(200).json({ released: true, message: 'Canceled checkout reservation released.' })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to release reserved checkout items' })
  }
}
