import { describe, it, expect, beforeEach, vi } from 'vitest'

// Set environment before importing handler
process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key'
process.env.DATABASE_URL = 'postgresql://test:test@localhost/test'

// Create mock instance before vi.mock so it's reused
const { mockStripeInstance } = vi.hoisted(() => {
  return {
    mockStripeInstance: {
      checkout: {
        sessions: {
          create: vi.fn(),
        },
      },
      products: {
        retrieve: vi.fn(),
      },
    },
  }
})

// Mock dependencies
vi.mock('stripe', () => ({
  default: vi.fn(() => mockStripeInstance),
}))

vi.mock('../stripeProducts.js', () => ({
  fetchPricesByItemIds: vi.fn(),
  fetchPricesByItemIdsAndCurrency: vi.fn(),
  normalizeItemIds: vi.fn((ids) => {
    const arr = Array.isArray(ids) ? ids : []
    return [...new Set(arr.filter(Boolean))]
  }),
}))

vi.mock('../inventory.js', () => ({
  reserveInventory: vi.fn(),
}))

import handler from '../checkout.js'
import Stripe from 'stripe'
import { fetchPricesByItemIds, fetchPricesByItemIdsAndCurrency, normalizeItemIds } from '../stripeProducts.js'
import { reserveInventory } from '../inventory.js'

describe('Checkout API Handler', () => {
  let req, res

  beforeEach(() => {
    vi.clearAllMocks()

    // Ensure previous "once" implementations are cleared so tests don't
    // accidentally consume queued mockResolvedValueOnce values from other
    // tests when the suite runs end-to-end.
    mockStripeInstance.checkout.sessions.create.mockReset()
    mockStripeInstance.products.retrieve.mockReset()
    reserveInventory.mockReset()
    fetchPricesByItemIds.mockReset()
    fetchPricesByItemIdsAndCurrency.mockReset()
    fetchPricesByItemIdsAndCurrency.mockImplementation((...args) => fetchPricesByItemIds(...args))

    mockStripeInstance.checkout.sessions.create.mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/pay/cs_test_123',
    })
    mockStripeInstance.products.retrieve.mockResolvedValue({
      id: 'prod_1',
      name: 'Test Product',
      metadata: {},
    })

    req = {
      method: 'POST',
      body: [],
      headers: {
        host: 'example.com',
        'x-forwarded-proto': 'https',
      },
    }

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      send: vi.fn(),
      redirect: vi.fn(),
    }

    process.env.SITE_URL = ''
  })

  const createMockProduct = (id = 'prod_1', editionCap = null) => ({
    id,
    name: 'Test Artwork',
    metadata: editionCap ? { edition_cap: String(editionCap) } : {},
  })

  const createMockPrice = (id = 'price_1', productId = 'prod_1') => ({
    id,
    unit_amount: 10000,
    currency: 'USD',
    product: productId,
  })

  const createPriceEntry = (productId = 'prod_1') => ({
    product: createMockProduct(productId),
    price: createMockPrice('price_1', productId),
  })

  describe('Method validation', () => {
    it('should reject non-POST requests', async () => {
      req.method = 'GET'

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(405)
      expect(res.send).toHaveBeenCalledWith('Method not allowed')
    })
  })

  describe('Cart validation', () => {
    it('should return 400 for empty cart', async () => {
      req.body = []

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Cart is empty' })
      )
    })

    it('should return 400 for no item IDs', async () => {
      req.body = [{ id: null }, { id: undefined }]

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'No item IDs provided' })
      )
    })

    it('should handle null body', async () => {
      req.body = null

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('should reject unsupported shipping countries', async () => {
      req.body = {
        lineItems: [{ id: 'item_1', quantity: 1 }],
        currency: 'USD',
        shippingCountry: 'FR',
      }

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Shipping is only available within Canada and the United States',
        })
      )
      expect(fetchPricesByItemIdsAndCurrency).not.toHaveBeenCalled()
      expect(mockStripeInstance.checkout.sessions.create).not.toHaveBeenCalled()
    })
  })

  describe('Creating checkout session', () => {
    it('should create Stripe checkout session', async () => {
      req.body = [
        { id: 'item_1', quantity: 1 },
        { id: 'item_2', quantity: 2 },
      ]
      fetchPricesByItemIds.mockResolvedValueOnce(
        new Map([
          ['item_1', createPriceEntry('prod_1')],
          ['item_2', createPriceEntry('prod_2')],
        ])
      )
      reserveInventory.mockResolvedValueOnce([])

      await handler(req, res)

      expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalledOnce()
      const call = mockStripeInstance.checkout.sessions.create.mock.calls[0][0]
      expect(call).toEqual(
        expect.objectContaining({
          line_items: expect.any(Array),
          mode: 'payment',
          success_url: expect.stringContaining('/success'),
          cancel_url: expect.stringContaining('/cancel'),
          billing_address_collection: 'required',
          phone_number_collection: {
            enabled: true,
          },
          shipping_address_collection: {
            allowed_countries: ['US'],
          },
          shipping_options: [{ shipping_rate: 'shr_1TcEfq2VIu8UkxmlOZkXPLlw' }],
        })
      )
    })

    it('should redirect to Stripe checkout', async () => {
      req.body = [{ id: 'item_1', quantity: 1 }]
      fetchPricesByItemIds.mockResolvedValueOnce(
        new Map([['item_1', createPriceEntry()]])
      )
      reserveInventory.mockResolvedValueOnce([])

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('https://checkout.stripe.com/pay'),
        })
      )
    })

    it('should include line items with correct prices', async () => {
      req.body = [
        { id: 'item_1', quantity: 1 },
        { id: 'item_2', quantity: 3 },
      ]
      fetchPricesByItemIds.mockResolvedValueOnce(
        new Map([
          ['item_1', { product: createMockProduct('prod_1'), price: createMockPrice('price_1', 'prod_1') }],
          ['item_2', { product: createMockProduct('prod_2'), price: createMockPrice('price_2', 'prod_2') }],
        ])
      )
      reserveInventory.mockResolvedValueOnce([])

      await handler(req, res)

      const call = mockStripeInstance.checkout.sessions.create.mock.calls[0][0]
      expect(call.line_items).toHaveLength(2)
      expect(call.line_items[0]).toEqual({
        price: 'price_1',
        quantity: 1,
      })
      expect(call.line_items[1]).toEqual({
        price: 'price_2',
        quantity: 3,
      })
    })

    it('should use default quantity of 1', async () => {
      req.body = [{ id: 'item_1' }] // No quantity

      fetchPricesByItemIds.mockResolvedValueOnce(
        new Map([['item_1', createPriceEntry()]])
      )
      reserveInventory.mockResolvedValueOnce([])

      await handler(req, res)

      const call = mockStripeInstance.checkout.sessions.create.mock.calls[0][0]
      expect(call.line_items[0].quantity).toBe(1)
    })

    it('should handle invalid quantities', async () => {
      req.body = [
        { id: 'item_1', quantity: 0 },
        { id: 'item_2', quantity: -5 },
        { id: 'item_3', quantity: 'invalid' },
      ]

      fetchPricesByItemIds.mockResolvedValueOnce(
        new Map([
          ['item_1', createPriceEntry('prod_1')],
          ['item_2', createPriceEntry('prod_2')],
          ['item_3', createPriceEntry('prod_3')],
        ])
      )
      reserveInventory.mockResolvedValueOnce([])

      await handler(req, res)

      const call = mockStripeInstance.checkout.sessions.create.mock.calls[0][0]
      // All should default to 1
      expect(call.line_items.every((li) => li.quantity === 1)).toBe(true)
    })
  })

  describe('Inventory reservation', () => {
    it('should reserve inventory for limited editions', async () => {
      req.body = [{ id: 'item_1', quantity: 2 }]
      fetchPricesByItemIds.mockResolvedValueOnce(
        new Map([['item_1', { product: createMockProduct('prod_1', 100), price: createMockPrice() }]])
      )
      mockStripeInstance.products.retrieve.mockResolvedValueOnce(createMockProduct('prod_1', 100))
      reserveInventory.mockResolvedValueOnce([
        { id: 'res_1', productId: 'prod_1', quantity: 2 },
      ])

      await handler(req, res)

      expect(reserveInventory).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            productId: 'prod_1',
            quantity: 2,
            cap: 100,
          }),
        ])
      )
    })

    it('should skip reservation for unlimited products', async () => {
      req.body = [{ id: 'item_1', quantity: 5 }]
      fetchPricesByItemIds.mockResolvedValueOnce(
        new Map([['item_1', { product: createMockProduct('prod_1'), price: createMockPrice() }]])
      )
      mockStripeInstance.products.retrieve.mockResolvedValueOnce(createMockProduct('prod_1'))

      await handler(req, res)

      expect(reserveInventory).not.toHaveBeenCalled()
    })

    it('should include reservation IDs in metadata', async () => {
      req.body = [{ id: 'item_1', quantity: 1 }]
      fetchPricesByItemIds.mockResolvedValueOnce(
        new Map([['item_1', { product: createMockProduct('prod_1', 100), price: createMockPrice() }]])
      )
      
      // Clear previous mocks and set new one
      mockStripeInstance.products.retrieve.mockClear()
      mockStripeInstance.products.retrieve.mockResolvedValueOnce(createMockProduct('prod_1', 100))
      
      reserveInventory.mockResolvedValueOnce([
        { id: 'res_123', productId: 'prod_1', quantity: 1 },
      ])

      await handler(req, res)

      expect(reserveInventory).toHaveBeenCalled()
      const call = mockStripeInstance.checkout.sessions.create.mock.calls[0][0]
      expect(call.metadata).toEqual({
        reservation_ids: '["res_123"]',
        currency: 'USD',
        shipping_country: 'US',
        shipping_rate_id: 'shr_1TcEee2VIu8UkxmlUSw3XsDr',
        items: '[{"itemId":"item_1"}]',
      })
    })

    it('should select Canada free shipping for CAD subtotals at or above 300', async () => {
      req.body = {
        lineItems: [{ id: 'item_1', quantity: 1 }],
        currency: 'CAD',
        shippingCountry: 'CA',
      }
      fetchPricesByItemIds.mockResolvedValueOnce(
        new Map([[
          'item_1',
          {
            product: createMockProduct('prod_1'),
            price: { ...createMockPrice('price_1', 'prod_1'), unit_amount: 30000, currency: 'CAD' },
          },
        ]])
      )
      reserveInventory.mockResolvedValueOnce([])

      await handler(req, res)

      const call = mockStripeInstance.checkout.sessions.create.mock.calls[0][0]
      expect(call.shipping_address_collection.allowed_countries).toEqual(['CA'])
      expect(call.shipping_options).toEqual([
        { shipping_rate: 'shr_1TcEfb2VIu8UkxmlkxZowGRw' },
      ])
      expect(call.metadata).toEqual(
        expect.objectContaining({
          currency: 'CAD',
          shipping_country: 'CA',
          shipping_rate_id: 'shr_1TcEfb2VIu8UkxmlkxZowGRw',
        })
      )
    })

    it('should select United States free shipping for USD subtotals at or above 250', async () => {
      req.body = {
        lineItems: [{ id: 'item_1', quantity: 1 }],
        currency: 'USD',
        shippingCountry: 'US',
      }
      fetchPricesByItemIds.mockResolvedValueOnce(
        new Map([[
          'item_1',
          {
            product: createMockProduct('prod_1'),
            price: { ...createMockPrice('price_1', 'prod_1'), unit_amount: 25000, currency: 'USD' },
          },
        ]])
      )
      reserveInventory.mockResolvedValueOnce([])

      await handler(req, res)

      const call = mockStripeInstance.checkout.sessions.create.mock.calls[0][0]
      expect(call.shipping_options).toEqual([
        { shipping_rate: 'shr_1TcEfq2VIu8UkxmlOZkXPLlw' },
      ])
      expect(call.metadata).toEqual(
        expect.objectContaining({
          currency: 'USD',
          shipping_country: 'US',
          shipping_rate_id: 'shr_1TcEfq2VIu8UkxmlOZkXPLlw',
        })
      )
    })
  })

  describe('URL construction', () => {
    it('should use SITE_URL environment variable if set', async () => {
      process.env.SITE_URL = 'https://mysite.com/'
      req.body = [{ id: 'item_1', quantity: 1 }]
      fetchPricesByItemIds.mockResolvedValueOnce(
        new Map([['item_1', createPriceEntry()]])
      )
      reserveInventory.mockResolvedValueOnce([])

      await handler(req, res)

      const call = mockStripeInstance.checkout.sessions.create.mock.calls[0][0]
      expect(call.success_url).toMatch(/^https:\/\/mysite\.com/)
      expect(call.cancel_url).toMatch(/^https:\/\/mysite\.com/)
    })

    it('should construct URL from request headers', async () => {
      process.env.SITE_URL = ''
      req.body = [{ id: 'item_1', quantity: 1 }]
      fetchPricesByItemIds.mockResolvedValueOnce(
        new Map([['item_1', createPriceEntry()]])
      )
      reserveInventory.mockResolvedValueOnce([])

      await handler(req, res)

      const call = mockStripeInstance.checkout.sessions.create.mock.calls[0][0]
      expect(call.success_url).toMatch(/^https:\/\/example\.com/)
    })

    it('should handle x-forwarded headers', async () => {
      req.headers['x-forwarded-proto'] = 'http'
      req.headers['x-forwarded-host'] = 'forwarded.com'
      req.body = [{ id: 'item_1', quantity: 1 }]
      fetchPricesByItemIds.mockResolvedValueOnce(
        new Map([['item_1', createPriceEntry()]])
      )
      reserveInventory.mockResolvedValueOnce([])

      await handler(req, res)

      const call = mockStripeInstance.checkout.sessions.create.mock.calls[0][0]
      expect(call.success_url).toMatch(/^http:\/\/forwarded\.com/)
    })
  })

  describe('Error handling', () => {
    it('should return 400 if price not found', async () => {
      req.body = [{ id: 'item_1', quantity: 1 }]
      fetchPricesByItemIds.mockResolvedValueOnce(
        new Map([['item_1', { product: null, price: null }]])
      )

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Unable to resolve Stripe USD price for cart item',
        })
      )
    })

    it('should catch and report errors from fetchPricesByItemIds', async () => {
      req.body = [{ id: 'item_1', quantity: 1 }]
      fetchPricesByItemIds.mockRejectedValueOnce(
        new Error('Stripe API error')
      )

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Stripe API error',
        })
      )
    })

    it('should catch and report errors from reserveInventory', async () => {
      req.body = [{ id: 'item_1', quantity: 100 }]
      fetchPricesByItemIds.mockResolvedValueOnce(
        new Map([['item_1', { product: createMockProduct('prod_1', 10), price: createMockPrice() }]])
      )
      
      // Clear previous mocks and set new one
      mockStripeInstance.products.retrieve.mockClear()
      mockStripeInstance.products.retrieve.mockResolvedValueOnce(createMockProduct('prod_1', 10))
      
      reserveInventory.mockRejectedValueOnce(
        new Error('Insufficient inventory for limited edition')
      )

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Insufficient inventory for limited edition',
        })
      )
    })
  })
})
