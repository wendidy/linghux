import Stripe from 'stripe'
import { finalizeReservations, releaseReservations } from './inventory.js'
import {
  markOrderNotificationFailed,
  markOrderNotificationSent,
  upsertCompletedOrder,
} from './orders.js'
import { sendOrderNotification } from './orderNotifications.js'
import { withApiSecurity } from './security.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const MAX_WEBHOOK_BODY_BYTES = 1024 * 1024

async function readRawBody(req) {
  const chunks = []
  let totalBytes = 0
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    totalBytes += buffer.length
    if (totalBytes > MAX_WEBHOOK_BODY_BYTES) {
      const error = new Error('Webhook payload is too large')
      error.statusCode = 413
      throw error
    }
    chunks.push(buffer)
  }
  return Buffer.concat(chunks)
}

function parseReservationIds(metadata) {
  if (!metadata?.reservation_ids) return []
  try {
    const parsed = JSON.parse(metadata.reservation_ids)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function isPaidSession(session) {
  return session?.payment_status === 'paid' || session?.payment_status === 'no_payment_required'
}

async function stripeWebhookHandler(req, res) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    res.status(500).json({ error: 'STRIPE_WEBHOOK_SECRET is not set' })
    return
  }

  let event
  try {
    const rawBody = await readRawBody(req)
    const signature = req.headers['stripe-signature']
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (error) {
    res.status(error.statusCode || 400).json({ error: `Webhook Error: ${error.message}` })
    return
  }

  try {
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object
      if (event.type === 'checkout.session.completed' && session.payment_status && !isPaidSession(session)) {
        res.status(200).json({ received: true })
        return
      }

      let reservationIds = parseReservationIds(session.metadata)
      // Fallback: some setups attach metadata to the PaymentIntent instead
      if (!reservationIds.length && session.payment_intent) {
        try {
          const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id
          if (paymentIntentId) {
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
            reservationIds = parseReservationIds(paymentIntent.metadata)
          }
        } catch (err) {
          // ignore retrieval errors and proceed with whatever we have
        }
      }
      await finalizeReservations(reservationIds)
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        limit: 100,
        expand: ['data.price.product'],
      })
      const order = await upsertCompletedOrder(session, lineItems)

      if (!order.notifiedAt) {
        try {
          const notification = await sendOrderNotification(order)
          if (notification.sent) {
            await markOrderNotificationSent(order.id)
          }
        } catch (error) {
          await markOrderNotificationFailed(order.id, error.message)
          throw error
        }
      }
    }

    if (event.type === 'checkout.session.expired' || event.type === 'checkout.session.async_payment_failed') {
      const session = event.data.object
      let reservationIds = parseReservationIds(session.metadata)
      if (!reservationIds.length && session.payment_intent) {
        try {
          const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id
          if (paymentIntentId) {
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
            reservationIds = parseReservationIds(paymentIntent.metadata)
          }
        } catch (err) {
          // ignore
        }
      }
      await releaseReservations(reservationIds)
    }

    if (event.type === 'payment_intent.canceled') {
      const paymentIntent = event.data.object
      const reservationIds = parseReservationIds(paymentIntent.metadata)
      await releaseReservations(reservationIds)
    }
  } catch (error) {
    res.status(500).json({ error: error.message || 'Webhook handler failed' })
    return
  }

  res.status(200).json({ received: true })
}

export default withApiSecurity(stripeWebhookHandler, {
  checkOrigin: false,
  requireJson: false,
})
