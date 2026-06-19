import { describe, it, expect, beforeEach, vi } from 'vitest'

process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key'

const { mockStripeInstance } = vi.hoisted(() => {
  return {
    mockStripeInstance: {
      checkout: {
        sessions: {
          retrieve: vi.fn(),
          expire: vi.fn(),
        },
      },
      paymentIntents: {
        retrieve: vi.fn(),
      },
    },
  }
})

vi.mock('stripe', () => ({
  default: vi.fn(() => mockStripeInstance),
}))

vi.mock('../inventory.js', () => ({
  releaseReservations: vi.fn(),
}))

import handler from '../checkout-cancel.js'
import { releaseReservations } from '../inventory.js'

describe('Checkout Cancel API Handler', () => {
  let req, res

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key'

    mockStripeInstance.checkout.sessions.retrieve.mockResolvedValue({
      id: 'cs_test_123',
      status: 'open',
      payment_status: 'unpaid',
      metadata: {
        reservation_ids: '["res_1"]',
      },
    })
    mockStripeInstance.checkout.sessions.expire.mockResolvedValue({
      id: 'cs_test_123',
      status: 'expired',
    })

    req = {
      method: 'POST',
      body: {
        sessionId: 'cs_test_123',
      },
    }

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      send: vi.fn(),
    }
  })

  it('should reject non-POST requests', async () => {
    req.method = 'GET'

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(405)
    expect(res.send).toHaveBeenCalledWith('Method not allowed')
  })

  it('should reject missing session IDs', async () => {
    req.body = {}

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('should expire open checkout sessions before releasing reservations', async () => {
    await handler(req, res)

    expect(mockStripeInstance.checkout.sessions.retrieve).toHaveBeenCalledWith('cs_test_123')
    expect(mockStripeInstance.checkout.sessions.expire).toHaveBeenCalledWith('cs_test_123')
    expect(releaseReservations).toHaveBeenCalledWith(['res_1'])
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        released: true,
        expired: true,
      })
    )
  })

  it('should not release paid sessions', async () => {
    mockStripeInstance.checkout.sessions.retrieve.mockResolvedValueOnce({
      id: 'cs_test_123',
      status: 'complete',
      payment_status: 'paid',
      metadata: {
        reservation_ids: '["res_1"]',
      },
    })

    await handler(req, res)

    expect(mockStripeInstance.checkout.sessions.expire).not.toHaveBeenCalled()
    expect(releaseReservations).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('should release already expired checkout sessions without expiring again', async () => {
    mockStripeInstance.checkout.sessions.retrieve.mockResolvedValueOnce({
      id: 'cs_test_123',
      status: 'expired',
      payment_status: 'unpaid',
      metadata: {
        reservation_ids: '["res_1", "res_2"]',
      },
    })

    await handler(req, res)

    expect(mockStripeInstance.checkout.sessions.expire).not.toHaveBeenCalled()
    expect(releaseReservations).toHaveBeenCalledWith(['res_1', 'res_2'])
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('should fall back to payment intent metadata when session metadata is missing', async () => {
    mockStripeInstance.checkout.sessions.retrieve.mockResolvedValueOnce({
      id: 'cs_test_123',
      status: 'expired',
      payment_status: 'unpaid',
      payment_intent: 'pi_123',
      metadata: {},
    })
    mockStripeInstance.paymentIntents.retrieve.mockResolvedValueOnce({
      metadata: {
        reservation_ids: '["res_pi"]',
      },
    })

    await handler(req, res)

    expect(mockStripeInstance.paymentIntents.retrieve).toHaveBeenCalledWith('pi_123')
    expect(releaseReservations).toHaveBeenCalledWith(['res_pi'])
  })
})
