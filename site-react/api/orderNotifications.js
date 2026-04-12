function formatCurrency(amount, currency) {
  if (typeof amount !== 'number') return 'Unavailable'

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: (currency || 'USD').toUpperCase(),
    }).format(amount / 100)
  } catch {
    return `${(amount / 100).toFixed(2)} ${(currency || 'USD').toUpperCase()}`
  }
}

function formatAddress(address) {
  if (!address) return 'Not provided'

  const lines = [address.line1, address.line2, [address.city, address.state].filter(Boolean).join(', '), [address.postal_code, address.country].filter(Boolean).join(' ')]
    .map((line) => (typeof line === 'string' ? line.trim() : ''))
    .filter(Boolean)

  return lines.length > 0 ? lines.join('\n') : 'Not provided'
}

function buildOrderEmailText(order) {
  const itemsText = order.items
    .map((item) => {
      const priceText =
        typeof item.amountTotal === 'number'
          ? formatCurrency(item.amountTotal, item.currency || order.currency)
          : 'Unavailable'
      return `- ${item.title} x${item.quantity} (${priceText})`
    })
    .join('\n')

  return [
    'New artwork order received',
    '',
    `Order ID: ${order.id}`,
    `Payment status: ${order.paymentStatus || 'unknown'}`,
    `Total: ${formatCurrency(order.amountTotal, order.currency)}`,
    '',
    'Customer',
    `Name: ${order.customerName || order.shippingName || 'Not provided'}`,
    `Email: ${order.customerEmail || 'Not provided'}`,
    `Phone: ${order.customerPhone || order.shippingPhone || 'Not provided'}`,
    '',
    'Shipping address',
    formatAddress(order.shippingAddress),
    '',
    'Billing address',
    formatAddress(order.billingAddress),
    '',
    'Items',
    itemsText || 'No line items found',
  ].join('\n')
}

async function sendViaResend(order) {
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.ORDER_NOTIFICATION_EMAIL_TO
  const from = process.env.ORDER_NOTIFICATION_EMAIL_FROM

  if (!apiKey && !to && !from) {
    return { enabled: false, sent: false }
  }

  if (!apiKey || !to || !from) {
    throw new Error('Resend notification is partially configured. Set RESEND_API_KEY, ORDER_NOTIFICATION_EMAIL_TO, and ORDER_NOTIFICATION_EMAIL_FROM.')
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `New order ${order.id}`,
      text: buildOrderEmailText(order),
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Resend notification failed: ${response.status} ${errorText}`)
  }

  return { enabled: true, sent: true }
}

export async function sendOrderNotification(order) {
  const result = await sendViaResend(order)

  if (!result.enabled) {
    console.warn(`Order ${order.id} saved, but no notification channel is configured.`)
  }

  return result
}
