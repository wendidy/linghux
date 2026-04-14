import { describe, it, expect, beforeEach, vi } from 'vitest'

// Set environment before importing handler
process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123'

// Use hoisted to create mock instance before vi.mock
const { mockStripeInstance } = vi.hoisted(() => {
  return {
    mockStripeInstance: {
      webhooks: {
        constructEvent: vi.fn(),
      },
      checkout: {
        sessions: {
          listLineItems: vi.fn(),
        },
      },
    },
  }
})

// Mock Stripe
vi.mock('stripe', () => ({
  default: vi.fn(() => mockStripeInstance),
}))

vi.mock('../inventory.js', () => ({
  finalizeReservations: vi.fn(),
  releaseReservations: vi.fn(),
}))

vi.mock('../orders.js', () => ({
  upsertCompletedOrder: vi.fn(),
  markOrderNotificationSent: vi.fn(),
  markOrderNotificationFailed: vi.fn(),
}))

vi.mock('../orderNotifications.js', () => ({
  sendOrderNotification: vi.fn(),
}))

import handler from '../stripe-webhook.js'
import Stripe from 'stripe'
import { finalizeReservations, releaseReservations } from '../inventory.js'
import {
  upsertCompletedOrder,
  markOrderNotificationSent,
  markOrderNotificationFailed,
} from '../orders.js'
import { sendOrderNotification } from '../orderNotifications.js'

describe('Stripe Webhook Handler', () => {
  let req, res

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123'

    mockStripeInstance.webhooks.constructEvent.mockReturnValue({})
    mockStripeInstance.checkout.sessions.listLineItems.mockResolvedValue({
      data: [],
    })

    req = {
      method: 'POST',
      headers: {
        'stripe-signature': 'valid_signature',
      },
      on: vi.fn((event, callback) => {
        if (event === 'data') {
          process.nextTick(() => callback(Buffer.from('test')))
        } else if (event === 'end') {
          process.nextTick(callback)
        }
      }),
      once: vi.fn(),
      [Symbol.asyncIterator]: async function* () {
        yield Buffer.from('test')
      },
    }

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      send: vi.fn(),
    }
  })

  describe('Method validation', () => {
    it('should reject non-POST requests', async () => {
      req.method = 'GET'

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(405)
      expect(res.send).toHaveBeenCalledWith('Method not allowed')
    })
  })

  describe('Webhook secret validation', () => {
    it('should return 500 if webhook secret not configured', async () => {
      delete process.env.STRIPE_WEBHOOK_SECRET

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'STRIPE_WEBHOOK_SECRET is not set',
        })
      )
    })

    it('should return 400 for invalid signature', async () => {
      mockStripeInstance.webhooks.constructEvent.mockImplementationOnce(() => {
        throw new Error('Invalid signature')
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Webhook Error'),
        })
      )
    })
  })

  describe('checkout.session.completed event', () => {
    it('should handle completed checkout session', async () => {
      mockStripeInstance.webhooks.constructEvent.mockReturnValueOnce({
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            payment_status: 'paid',
          },
        },
      })

      mockStripeInstance.checkout.sessions.listLineItems.mockResolvedValueOnce({
        data: [
          {
            id: 'li_1',
            description: 'Test Item',
            quantity: 1,
            amount_total: 10000,
            price: {
              id: 'price_1',
              unit_amount: 10000,
              currency: 'USD',
            },
          },
        ],
      })

      upsertCompletedOrder.mockResolvedValueOnce({
        id: 'cs_test_123',
        notifiedAt: null,
      })

      sendOrderNotification.mockResolvedValueOnce({
        enabled: true,
        sent: true,
      })

      await handler(req, res)

      expect(finalizeReservations).toHaveBeenCalledWith([])
      expect(upsertCompletedOrder).toHaveBeenCalledOnce()
      expect(sendOrderNotification).toHaveBeenCalledOnce()
      expect(markOrderNotificationSent).toHaveBeenCalledWith('cs_test_123')
    })

    it('should handle reservation IDs from metadata', async () => {
      mockStripeInstance.webhooks.constructEvent.mockReturnValueOnce({
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            metadata: {
              reservation_ids: '["res_1", "res_2"]',
            },
          },
        },
      })

      mockStripeInstance.checkout.sessions.listLineItems.mockResolvedValueOnce({
        data: [],
      })

      upsertCompletedOrder.mockResolvedValueOnce({
        id: 'cs_test_123',
        notifiedAt: null,
      })

      sendOrderNotification.mockResolvedValueOnce({
        enabled: false,
        sent: false,
      })

      await handler(req, res)

      expect(finalizeReservations).toHaveBeenCalledWith(['res_1', 'res_2'])
    })

    it('should handle invalid JSON in reservation_ids', async () => {
      mockStripeInstance.webhooks.constructEvent.mockReturnValueOnce({
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            metadata: {
              reservation_ids: 'invalid json',
            },
          },
        },
      })

      mockStripeInstance.checkout.sessions.listLineItems.mockResolvedValueOnce({
        data: [],
      })

      upsertCompletedOrder.mockResolvedValueOnce({
        id: 'cs_test_123',
        notifiedAt: null,
      })

      sendOrderNotification.mockResolvedValueOnce({
        enabled: false,
        sent: false,
      })

      await handler(req, res)

      expect(finalizeReservations).toHaveBeenCalledWith([])
    })

    it('should skip notification if already notified', async () => {
      mockStripeInstance.webhooks.constructEvent.mockReturnValueOnce({
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
          },
        },
      })

      mockStripeInstance.checkout.sessions.listLineItems.mockResolvedValueOnce({
        data: [],
      })

      upsertCompletedOrder.mockResolvedValueOnce({
        id: 'cs_test_123',
        notifiedAt: '2024-01-01T00:00:00Z',
      })

      await handler(req, res)

      expect(sendOrderNotification).not.toHaveBeenCalled()
      expect(markOrderNotificationSent).not.toHaveBeenCalled()
    })

    it('should handle notification failures', async () => {
      mockStripeInstance.webhooks.constructEvent.mockReturnValueOnce({
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
          },
        },
      })

      mockStripeInstance.checkout.sessions.listLineItems.mockResolvedValueOnce({
        data: [],
      })

      upsertCompletedOrder.mockResolvedValueOnce({
        id: 'cs_test_123',
        notifiedAt: null,
      })

      const notificationError = new Error('Resend API error')
      sendOrderNotification.mockRejectedValueOnce(notificationError)

      await handler(req, res)

      expect(markOrderNotificationFailed).toHaveBeenCalledWith(
        'cs_test_123',
        'Resend API error'
      )
    })

    it('should handle when line items fetch fails', async () => {
      mockStripeInstance.webhooks.constructEvent.mockReturnValueOnce({
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
          },
        },
      })

      mockStripeInstance.checkout.sessions.listLineItems.mockRejectedValueOnce(
        new Error('Failed to fetch line items')
      )

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
    })
  })

  describe('checkout.session.expired event', () => {
    it('should handle expired checkout session', async () => {
      mockStripeInstance.webhooks.constructEvent.mockReturnValueOnce({
        type: 'checkout.session.expired',
        data: {
          object: {
            id: 'cs_test_456',
            metadata: {
              reservation_ids: '["res_3", "res_4"]',
            },
          },
        },
      })

      await handler(req, res)

      expect(releaseReservations).toHaveBeenCalledWith(['res_3', 'res_4'])
    })

    it('should handle expired session with no reservations', async () => {
      mockStripeInstance.webhooks.constructEvent.mockReturnValueOnce({
        type: 'checkout.session.expired',
        data: {
          object: {
            id: 'cs_test_456',
          },
        },
      })

      await handler(req, res)

      expect(releaseReservations).toHaveBeenCalledWith([])
    })
  })

  describe('Unhandled events', () => {
    it('should respond 200 for unhandled events', async () => {
      mockStripeInstance.webhooks.constructEvent.mockReturnValueOnce({
        type: 'payment_intent.created',
        data: {
          object: {},
        },
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ received: true })
    })
  })

  describe('Error handling', () => {
    it('should return 400 for invalid webhook events', async () => {
      mockStripeInstance.webhooks.constructEvent.mockImplementationOnce(() => {
        throw new Error('Invalid event')
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('should handle unexpected errors gracefully', async () => {
      mockStripeInstance.webhooks.constructEvent.mockReturnValueOnce({
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
          },
        },
      })

      mockStripeInstance.checkout.sessions.listLineItems.mockRejectedValueOnce(
        new Error('Unexpected error')
      )

      await handler(req, res)

      expect(res.status).not.toHaveBeenCalledWith(200)
    })
  })

  describe('Response format', () => {
    it('should return valid JSON response', async () => {
      mockStripeInstance.webhooks.constructEvent.mockReturnValueOnce({
        type: 'payment_intent.created',
      })

      await handler(req, res)

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          received: expect.any(Boolean),
        })
      )
    })
  })
})
