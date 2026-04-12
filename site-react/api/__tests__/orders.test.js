import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { upsertCompletedOrder } from '../orders.js'

// Mock db.js
vi.mock('../db.js', () => ({
  withClient: vi.fn(async (callback) => {
    const mockClient = {
      query: vi.fn(async (sql, params) => {
        // Simulate basic responses based on SQL
        if (sql.includes('INSERT INTO orders') || sql.includes('ON CONFLICT')) {
          return { rows: [{ notified_at: null }] }
        }
        if (sql.includes('DELETE FROM order_items')) {
          return { rows: [] }
        }
        if (sql.includes('INSERT INTO order_items')) {
          return { rows: [] }
        }
        return { rows: [] }
      }),
    }
    return callback(mockClient)
  }),
}))

import { withClient } from '../db.js'

describe('Orders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createMockSession = (overrides = {}) => ({
    id: 'cs_test_123',
    payment_status: 'paid',
    customer_details: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '555-1234',
      address: {
        line1: '123 Main St',
        line2: 'Apt 4B',
        city: 'Austin',
        state: 'TX',
        postal_code: '78701',
        country: 'US',
      },
    },
    shipping_details: {
      name: 'John Doe',
      phone: '555-1234',
      address: {
        line1: '123 Main St',
        line2: 'Apt 4B',
        city: 'Austin',
        state: 'TX',
        postal_code: '78701',
        country: 'US',
      },
    },
    payment_intent: 'pi_test_123',
    currency: 'USD',
    amount_subtotal: 9000,
    amount_total: 10000,
    customer_email: 'john@example.com',
    ...overrides,
  })

  const createMockLineItems = () => ({
    data: [
      {
        id: 'li_test_1',
        description: 'Artwork Print',
        quantity: 1,
        amount_subtotal: 9000,
        amount_total: 10000,
        currency: 'USD',
        price: {
          id: 'price_test_1',
          unit_amount: 10000,
          currency: 'USD',
          product: {
            id: 'prod_test_1',
            name: 'Artwork Print',
            metadata: { edition_cap: '10' },
          },
        },
      },
    ],
  })

  describe('upsertCompletedOrder', () => {
    it('should create order from Stripe session', async () => {
      const session = createMockSession()
      const lineItems = createMockLineItems()

      const order = await upsertCompletedOrder(session, lineItems)

      expect(order.id).toBe('cs_test_123')
      expect(order.customerEmail).toBe('john@example.com')
      expect(order.customerName).toBe('John Doe')
      expect(order.customerPhone).toBe('555-1234')
      expect(order.paymentStatus).toBe('paid')
      expect(order.amountTotal).toBe(10000)
      expect(order.currency).toBe('USD')
    })

    it('should normalize addresses', async () => {
      const session = createMockSession()
      const lineItems = createMockLineItems()

      const order = await upsertCompletedOrder(session, lineItems)

      expect(order.shippingAddress).toEqual({
        line1: '123 Main St',
        line2: 'Apt 4B',
        city: 'Austin',
        state: 'TX',
        postal_code: '78701',
        country: 'US',
      })
    })

    it('should handle missing address fields', async () => {
      const session = createMockSession({
        shipping_details: {
          address: {
            line1: '123 Main St',
            country: 'US',
          },
        },
      })
      const lineItems = createMockLineItems()

      const order = await upsertCompletedOrder(session, lineItems)

      expect(order.shippingAddress.line1).toBe('123 Main St')
      expect(order.shippingAddress.city).toBeNull()
      expect(order.shippingAddress.state).toBeNull()
    })

    it('should handle null addresses', async () => {
      const session = createMockSession({
        shipping_details: {},
        customer_details: {},
      })
      const lineItems = createMockLineItems()

      const order = await upsertCompletedOrder(session, lineItems)

      expect(order.shippingAddress).toBeNull()
      expect(order.billingAddress).toBeNull()
    })

    it('should normalize line items', async () => {
      const session = createMockSession()
      const lineItems = createMockLineItems()

      const order = await upsertCompletedOrder(session, lineItems)

      expect(order.items).toHaveLength(1)
      expect(order.items[0]).toEqual({
        id: 'li_test_1',
        priceId: 'price_test_1',
        productId: 'prod_test_1',
        title: 'Artwork Print',
        quantity: 1,
        unitAmount: 10000,
        amountSubtotal: 9000,
        amountTotal: 10000,
        currency: 'USD',
        productMetadata: { edition_cap: '10' },
      })
    })

    it('should handle missing line item details', async () => {
      const session = createMockSession()
      const lineItems = {
        data: [
          {
            id: 'li_test_1',
            quantity: 1,
            amount_subtotal: 5000,
            amount_total: 5000,
            currency: 'USD',
            price: 'price_test_1', // String reference instead of object
          },
        ],
      }

      const order = await upsertCompletedOrder(session, lineItems)

      expect(order.items[0].priceId).toBe('price_test_1')
      expect(order.items[0].productId).toBeNull()
      expect(order.items[0].title).toBe('Artwork order item')
    })

    it('should default empty line items to empty array', async () => {
      const session = createMockSession()
      const lineItems = { data: [] }

      const order = await upsertCompletedOrder(session, lineItems)

      expect(order.items).toEqual([])
    })

    it('should use customer name from customer_details', async () => {
      const session = createMockSession({
        customer_details: {
          name: 'Customer Name',
        },
        shipping_details: {
          name: 'Shipping Name',
        },
      })
      const lineItems = createMockLineItems()

      const order = await upsertCompletedOrder(session, lineItems)

      expect(order.customerName).toBe('Customer Name')
      expect(order.shippingName).toBe('Shipping Name')
    })

    it('should fallback to customer email for shipping name', async () => {
      const session = createMockSession({
        customer_details: { name: 'John' },
        shipping_details: {},
      })
      const lineItems = createMockLineItems()

      const order = await upsertCompletedOrder(session, lineItems)

      expect(order.shippingName).toBe('John')
    })

    it('should call database with transaction', async () => {
      const session = createMockSession()
      const lineItems = createMockLineItems()

      await upsertCompletedOrder(session, lineItems)

      expect(withClient).toHaveBeenCalledOnce()
      const callback = withClient.mock.calls[0][0]
      expect(typeof callback).toBe('function')
    })

    it('should handle empty line items array', async () => {
      const session = createMockSession()
      const lineItems = null

      const order = await upsertCompletedOrder(session, lineItems)

      expect(order.items).toEqual([])
    })

    it('should validate integer quantities', async () => {
      const session = createMockSession()
      const lineItems = {
        data: [
          {
            id: 'li_1',
            quantity: 2.5,
            amount_total: 5000,
            price: {
              id: 'price_1',
              product: 'prod_1',
            },
          },
          {
            id: 'li_2',
            quantity: 0,
            amount_total: 5000,
            price: {
              id: 'price_2',
              product: 'prod_2',
            },
          },
        ],
      }

      const order = await upsertCompletedOrder(session, lineItems)

      expect(order.items[0].quantity).toBe(1) // Defaults to 1 for invalid quantities
      expect(order.items[1].quantity).toBe(1) // Defaults to 1 for 0 quantity
    })
  })
})
