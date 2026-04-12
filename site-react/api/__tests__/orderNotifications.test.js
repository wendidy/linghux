import { describe, it, expect, beforeEach, vi } from 'vitest'
import { sendOrderNotification } from '../orderNotifications.js'

// Mock fetch globally
global.fetch = vi.fn()

describe('Order Notifications (Resend)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.RESEND_API_KEY
    delete process.env.ORDER_NOTIFICATION_EMAIL_TO
    delete process.env.ORDER_NOTIFICATION_EMAIL_FROM
  })

  const createMockOrder = (overrides = {}) => ({
    id: 'order-123',
    paymentStatus: 'paid',
    amountTotal: 10000,
    currency: 'USD',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    customerPhone: '555-1234',
    shippingName: 'John Doe',
    shippingPhone: '555-1234',
    items: [
      {
        title: 'Artwork Print',
        quantity: 1,
        amountTotal: 10000,
        currency: 'USD',
      },
    ],
    shippingAddress: {
      line1: '123 Main St',
      line2: 'Apt 4B',
      city: 'Austin',
      state: 'TX',
      postal_code: '78701',
      country: 'US',
    },
    billingAddress: {
      line1: '123 Main St',
      city: 'Austin',
      state: 'TX',
      postal_code: '78701',
      country: 'US',
    },
    ...overrides,
  })

  describe('Configuration handling', () => {
    it('should return disabled status when no env vars are set', async () => {
      const order = createMockOrder()
      const result = await sendOrderNotification(order)

      expect(result).toEqual({ enabled: false, sent: false })
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should throw error when partially configured', async () => {
      process.env.RESEND_API_KEY = 'test-key'
      // Missing ORDER_NOTIFICATION_EMAIL_TO and FROM

      const order = createMockOrder()
      await expect(sendOrderNotification(order)).rejects.toThrow(
        'Resend notification is partially configured'
      )
    })
  })

  describe('Sending notifications', () => {
    beforeEach(() => {
      process.env.RESEND_API_KEY = 'test-key'
      process.env.ORDER_NOTIFICATION_EMAIL_TO = 'admin@example.com'
      process.env.ORDER_NOTIFICATION_EMAIL_FROM = 'orders@example.com'
    })

    it('should successfully send order notification', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      })

      const order = createMockOrder()
      const result = await sendOrderNotification(order)

      expect(result).toEqual({ enabled: true, sent: true })
      expect(global.fetch).toHaveBeenCalledOnce()
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          method: 'POST',
          headers: {
            Authorization: 'Bearer test-key',
            'Content-Type': 'application/json',
          },
        })
      )
    })

    it('should include order details in email body', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      })

      const order = createMockOrder()
      await sendOrderNotification(order)

      const callArgs = global.fetch.mock.calls[0][1]
      const body = JSON.parse(callArgs.body)

      expect(body.to).toEqual(['admin@example.com'])
      expect(body.from).toBe('orders@example.com')
      expect(body.subject).toBe('New order order-123')
      expect(body.text).toContain('Order ID: order-123')
      expect(body.text).toContain('john@example.com')
      expect(body.text).toContain('John Doe')
      expect(body.text).toContain('$100.00')
    })

    it('should handle Resend API errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      })

      const order = createMockOrder()
      await expect(sendOrderNotification(order)).rejects.toThrow(
        'Resend notification failed: 401 Unauthorized'
      )
    })

    it('should handle network failures', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      const order = createMockOrder()
      await expect(sendOrderNotification(order)).rejects.toThrow('Network error')
    })
  })

  describe('Email formatting', () => {
    beforeEach(() => {
      process.env.RESEND_API_KEY = 'test-key'
      process.env.ORDER_NOTIFICATION_EMAIL_TO = 'admin@example.com'
      process.env.ORDER_NOTIFICATION_EMAIL_FROM = 'orders@example.com'
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      })
    })

    it('should format currency correctly', async () => {
      const order = createMockOrder({
        items: [
          {
            title: 'Item 1',
            quantity: 2,
            amountTotal: 5000,
            currency: 'USD',
          },
        ],
      })

      await sendOrderNotification(order)

      const callArgs = global.fetch.mock.calls[0][1]
      const body = JSON.parse(callArgs.body)

      expect(body.text).toContain('$50.00')
    })

    it('should handle missing address fields', async () => {
      const order = createMockOrder({
        shippingAddress: {
          line1: '123 Main St',
          country: 'US',
        },
      })

      await sendOrderNotification(order)

      const callArgs = global.fetch.mock.calls[0][1]
      const body = JSON.parse(callArgs.body)

      expect(body.text).toContain('123 Main St')
      expect(body.text).toContain('US')
    })

    it('should handle null addresses', async () => {
      const order = createMockOrder({
        shippingAddress: null,
        billingAddress: null,
      })

      await sendOrderNotification(order)

      const callArgs = global.fetch.mock.calls[0][1]
      const body = JSON.parse(callArgs.body)

      expect(body.text).toContain('Not provided')
    })

    it('should handle multiple items', async () => {
      const order = createMockOrder({
        items: [
          {
            title: 'Print A',
            quantity: 1,
            amountTotal: 5000,
            currency: 'USD',
          },
          {
            title: 'Print B',
            quantity: 2,
            amountTotal: 5000,
            currency: 'USD',
          },
        ],
      })

      await sendOrderNotification(order)

      const callArgs = global.fetch.mock.calls[0][1]
      const body = JSON.parse(callArgs.body)

      expect(body.text).toContain('Print A x1')
      expect(body.text).toContain('Print B x2')
    })

    it('should handle unavailable prices', async () => {
      const order = createMockOrder({
        items: [
          {
            title: 'Item',
            quantity: 1,
            amountTotal: null,
          },
        ],
      })

      await sendOrderNotification(order)

      const callArgs = global.fetch.mock.calls[0][1]
      const body = JSON.parse(callArgs.body)

      expect(body.text).toContain('Unavailable')
    })
  })
})
