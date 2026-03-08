import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

function getBaseUrl(req) {
  if (process.env.SITE_URL) {
    return process.env.SITE_URL.replace(/\/$/, '')
  }

  const proto = req.headers['x-forwarded-proto'] || 'https'
  const host = req.headers['x-forwarded-host'] || req.headers.host
  return `${proto}://${host}`.replace(/\/$/, '')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed')
    return
  }

  try {
    const items = Array.isArray(req.body) ? req.body : []

    if (!items.length) {
      res.status(400).json({ error: 'Cart is empty' })
      return
    }

    const baseUrl = getBaseUrl(req)

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: items,
      success_url: `${baseUrl}/success`,
      cancel_url: `${baseUrl}/cancel`,
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['US', 'CA'],
      },
    })

    res.status(200).json({ url: session.url })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Checkout failed' })
  }
}
