import Stripe from 'stripe'
import { finalizeReservations, releaseReservations } from './inventory.js'

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
    }

    if (event.type === 'checkout.session.expired') {
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
