import Stripe from 'stripe'
import { finalizeReservations, releaseReservations } from './inventory.js'
import {
  markOrderNotificationFailed,
  markOrderNotificationSent,
  upsertCompletedOrder,
} from './orders.js'
import { sendOrderNotification } from './orderNotifications.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

async function readRawBody(req) {
  const chunks = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed')
    return
  }

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
    res.status(400).json({ error: `Webhook Error: ${error.message}` })
    return
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const reservationIds = parseReservationIds(session.metadata)
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
      const reservationIds = parseReservationIds(session.metadata)
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
