import Stripe from 'stripe'
import { releaseReservations } from './inventory.js'
import { isValidStripeCheckoutSessionId, withApiSecurity } from './security.js'

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

async function reservationIdsForSession(session) {
  let reservationIds = parseReservationIds(session.metadata)
  if (reservationIds.length || !session.payment_intent) return reservationIds

  try {
    const paymentIntentId = typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id
    if (!paymentIntentId) return reservationIds

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    reservationIds = parseReservationIds(paymentIntent.metadata)
  } catch {
    // Keep cancellation best-effort; session metadata is the primary source.
  }

  return reservationIds
}

async function checkoutCancelHandler(req, res) {
  if (!process.env.STRIPE_SECRET_KEY) {
    res.status(500).json({ error: 'STRIPE_SECRET_KEY is not set' })
    return
  }

  const { sessionId } = req.body || {}
  if (!isValidStripeCheckoutSessionId(sessionId)) {
    res.status(400).json({ error: 'Missing or invalid sessionId' })
    return
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (!session) {
      res.status(404).json({ error: 'Checkout session not found' })
      return
    }

    if (session.payment_status === 'paid' || session.status === 'complete') {
      res.status(400).json({ error: 'Checkout session is already paid and cannot be cancelled' })
      return
    }

    const reservationIds = await reservationIdsForSession(session)
    if (session.status === 'open') {
      await stripe.checkout.sessions.expire(session.id)
    }

    if (reservationIds.length === 0) {
      res.status(200).json({ released: false, expired: session.status === 'open', message: 'No reserved items found for this checkout session.' })
      return
    }

    await releaseReservations(reservationIds)
    res.status(200).json({ released: true, expired: session.status === 'open', message: 'Canceled checkout reservation released.' })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to release reserved checkout items' })
  }
}

export default withApiSecurity(checkoutCancelHandler, {
  rateLimit: { key: 'checkout-cancel', max: 30 },
})
