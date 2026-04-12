import { withClient } from './db.js'

function normalizeAddress(address) {
  if (!address) return null

  return {
    line1: address.line1 || null,
    line2: address.line2 || null,
    city: address.city || null,
    state: address.state || null,
    postal_code: address.postal_code || null,
    country: address.country || null,
  }
}

function normalizeLineItems(lineItems, orderId) {
  const items = Array.isArray(lineItems?.data) ? lineItems.data : []

  return items.map((lineItem, index) => {
    const price = typeof lineItem.price === 'string' ? null : lineItem.price
    const product =
      price && price.product && typeof price.product !== 'string'
        ? price.product
        : null

    return {
      id: lineItem.id || `${orderId}:${index + 1}`,
      priceId: typeof lineItem.price === 'string' ? lineItem.price : price?.id || null,
      productId: product?.id || (typeof price?.product === 'string' ? price.product : null),
      title: lineItem.description || product?.name || 'Artwork order item',
      quantity: Number.isInteger(lineItem.quantity) && lineItem.quantity > 0 ? lineItem.quantity : 1,
      unitAmount: typeof price?.unit_amount === 'number' ? price.unit_amount : null,
      amountSubtotal: typeof lineItem.amount_subtotal === 'number' ? lineItem.amount_subtotal : null,
      amountTotal: typeof lineItem.amount_total === 'number' ? lineItem.amount_total : null,
      currency: lineItem.currency || price?.currency || null,
      productMetadata: product?.metadata || null,
    }
  })
}

function buildOrderRecord(session, items) {
  const customerDetails = session.customer_details || {}
  const shippingDetails = session.shipping_details || {}

  return {
    id: session.id,
    paymentIntentId:
      typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null,
    customerEmail: customerDetails.email || session.customer_email || null,
    customerName: customerDetails.name || null,
    customerPhone: customerDetails.phone || null,
    shippingName: shippingDetails.name || customerDetails.name || null,
    shippingPhone: shippingDetails.phone || customerDetails.phone || null,
    shippingAddress: normalizeAddress(shippingDetails.address),
    billingAddress: normalizeAddress(customerDetails.address),
    currency: session.currency || items[0]?.currency || null,
    amountSubtotal: typeof session.amount_subtotal === 'number' ? session.amount_subtotal : null,
    amountTotal: typeof session.amount_total === 'number' ? session.amount_total : null,
    paymentStatus: session.payment_status || null,
    items,
  }
}

export async function upsertCompletedOrder(session, lineItems) {
  const items = normalizeLineItems(lineItems, session.id)
  const order = buildOrderRecord(session, items)

  return withClient(async (client) => {
    await client.query('BEGIN')

    try {
      const { rows } = await client.query(
        `INSERT INTO orders (
           id,
           payment_intent_id,
           customer_email,
           customer_name,
           customer_phone,
           shipping_name,
           shipping_phone,
           shipping_address,
           billing_address,
           currency,
           amount_subtotal,
           amount_total,
           payment_status,
           updated_at
         )
         VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10, $11, $12, $13, NOW()
         )
         ON CONFLICT (id) DO UPDATE
         SET payment_intent_id = EXCLUDED.payment_intent_id,
             customer_email = EXCLUDED.customer_email,
             customer_name = EXCLUDED.customer_name,
             customer_phone = EXCLUDED.customer_phone,
             shipping_name = EXCLUDED.shipping_name,
             shipping_phone = EXCLUDED.shipping_phone,
             shipping_address = EXCLUDED.shipping_address,
             billing_address = EXCLUDED.billing_address,
             currency = EXCLUDED.currency,
             amount_subtotal = EXCLUDED.amount_subtotal,
             amount_total = EXCLUDED.amount_total,
             payment_status = EXCLUDED.payment_status,
             updated_at = NOW()
         RETURNING notified_at`,
        [
          order.id,
          order.paymentIntentId,
          order.customerEmail,
          order.customerName,
          order.customerPhone,
          order.shippingName,
          order.shippingPhone,
          JSON.stringify(order.shippingAddress),
          JSON.stringify(order.billingAddress),
          order.currency,
          order.amountSubtotal,
          order.amountTotal,
          order.paymentStatus,
        ]
      )

      await client.query('DELETE FROM order_items WHERE order_id = $1', [order.id])

      for (const item of order.items) {
        await client.query(
          `INSERT INTO order_items (
             id,
             order_id,
             price_id,
             product_id,
             title,
             quantity,
             unit_amount,
             amount_subtotal,
             amount_total,
             currency,
             product_metadata
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)`,
          [
            item.id,
            order.id,
            item.priceId,
            item.productId,
            item.title,
            item.quantity,
            item.unitAmount,
            item.amountSubtotal,
            item.amountTotal,
            item.currency,
            JSON.stringify(item.productMetadata),
          ]
        )
      }

      await client.query('COMMIT')

      return {
        ...order,
        notifiedAt: rows[0]?.notified_at || null,
      }
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
  })
}

export async function markOrderNotificationSent(orderId) {
  await withClient(async (client) => {
    await client.query(
      `UPDATE orders
       SET notified_at = NOW(),
           notification_error = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [orderId]
    )
  })
}

export async function markOrderNotificationFailed(orderId, errorMessage) {
  await withClient(async (client) => {
    await client.query(
      `UPDATE orders
       SET notification_error = $2,
           updated_at = NOW()
       WHERE id = $1`,
      [orderId, errorMessage || 'Unknown notification error']
    )
  })
}
