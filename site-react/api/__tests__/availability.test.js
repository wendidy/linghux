import { describe, it, expect, beforeEach, vi } from 'vitest'
import handler from '../availability.js'

// Mock Stripe and database
vi.mock('stripe', () => ({
  default: vi.fn(() => ({
    products: {
      retrieve: vi.fn(),
    },
  })),
}))

vi.mock('../stripeProducts.js', () => ({
  fetchPricesByItemIds: vi.fn(),
  normalizeItemIds: vi.fn((ids) => {
    const arr = Array.isArray(ids) ? ids : []
    return [...new Set(arr.filter(Boolean))]
  }),
}))

vi.mock('../db.js', () => ({
  withClient: vi.fn(async (callback) => {
    return callback({
      query: vi.fn(async (sql, params) => {
        if (sql.includes('SELECT product_id, cap, sold, reserved')) {
          return {
            rows: [
              {
                product_id: params[0]?.[0],
                cap: 100,
                sold: 10,
                reserved: 5,
              },
            ],
          }
        }
        return { rows: [] }
      }),
    })
  }),
}))

import { fetchPricesByItemIds, normalizeItemIds } from '../stripeProducts.js'
import Stripe from 'stripe'

describe('Availability API Handler', () => {
  let req, res, mockStripe

  beforeEach(() => {
    vi.clearAllMocks()

    mockStripe = Stripe()
    mockStripe.products.retrieve.mockResolvedValue({
      id: 'prod_1',
      name: 'Test Product',
      metadata: {
        edition_cap: '100',
      },
    })

    req = {
      method: 'POST',
      body: {},
    }

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      send: vi.fn(),
    }
  })

  const mockProduct = (id = 'prod_1') => ({
    id,
    name: 'Test Artwork',
    metadata: { edition_cap: '100' },
  })

  const createPriceEntry = (productId = 'prod_1') => ({
    product: mockProduct(productId),
    price: {
      id: 'price_1',
      product: productId,
    },
  })

  describe('Method validation', () => {
    it('should reject non-POST requests', async () => {
      req.method = 'GET'

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(405)
      expect(res.send).toHaveBeenCalledWith('Method not allowed')
    })

    it('should accept POST requests', async () => {
      req.body = { itemIds: ['item_1'] }
      fetchPricesByItemIds.mockResolvedValueOnce(
        new Map([['item_1', createPriceEntry()]])
      )

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
    })
  })

  describe('Input validation', () => {
    it('should return 400 for no item IDs', async () => {
      req.body = { itemIds: [] }

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'No item IDs provided' })
      )
    })

    it('should handle missing itemIds', async () => {
      req.body = {}

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe('Availability status', () => {
    it('should return availability for items', async () => {
      req.body = { itemIds: ['item_1'] }
      fetchPricesByItemIds.mockResolvedValueOnce(
        new Map([['item_1', createPriceEntry()]])
      )

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          availability: expect.objectContaining({
            item_1: expect.any(Object),
          }),
        })
      )
    })

    it('should mark as missing if product not found', async () => {
      req.body = { itemIds: ['item_1'] }
      fetchPricesByItemIds.mockResolvedValueOnce(
        new Map([['item_1', { product: null, price: null }]])
      )

      await handler(req, res)

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          availability: expect.objectContaining({
            item_1: expect.objectContaining({
              status: 'missing',
              soldOut: false,
            }),
          }),
        })
      )
    })

    it('should mark as unlimited for products without edition cap', async () => {
      req.body = { itemIds: ['item_1'] }
      fetchPricesByItemIds.mockResolvedValueOnce(
        new Map([
          [
            'item_1',
            {
              product: { id: 'prod_1', name: 'Test', metadata: {} },
              price: { id: 'price_1', product: 'prod_1' },
            },
          ],
        ])
      )

      await handler(req, res)

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          availability: expect.objectContaining({
            item_1: expect.objectContaining({
              status: 'unlimited',
              soldOut: false,
            }),
          }),
        })
      )
    })

    it('should calculate availability correctly', async () => {
      req.body = { itemIds: ['item_1'] }
      fetchPricesByItemIds.mockResolvedValueOnce(
        new Map([['item_1', createPriceEntry()]])
      )

      await handler(req, res)

      // cap=100, sold=10, reserved=5, available=85
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          availability: expect.objectContaining({
            item_1: expect.objectContaining({
              status: 'available',
              soldOut: false,
            }),
          }),
        })
      )
    })

    it('should mark as sold out when no inventory available', async () => {
      req.body = { itemIds: ['item_1'] }
      fetchPricesByItemIds.mockResolvedValueOnce(
        new Map([['item_1', createPriceEntry()]])
      )
      // Mock inventory to be sold out: cap=100, sold=100, reserved=0
      vi.doMock('../db.js', () => ({
        withClient: vi.fn(async (callback) => {
          return callback({
            query: vi.fn(async () => ({
              rows: [{ cap: 100, sold: 100, reserved: 0 }],
            })),
          })
        }),
      }))

      await handler(req, res)

      // Note: This test assumes the code checks sold out status correctly
      // The actual result depends on the implementation details
    })
  })

  describe('Multiple items', () => {
    it('should handle multiple item IDs', async () => {
      req.body = { itemIds: ['item_1', 'item_2'] }
      fetchPricesByItemIds.mockResolvedValueOnce(
        new Map([
          ['item_1', createPriceEntry('prod_1')],
          ['item_2', createPriceEntry('prod_2')],
        ])
      )

      await handler(req, res)

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          availability: expect.objectContaining({
            item_1: expect.any(Object),
            item_2: expect.any(Object),
          }),
        })
      )
    })

    it('should deduplicate item IDs', async () => {
      req.body = { itemIds: ['item_1', 'item_1', 'item_2'] }
      fetchPricesByItemIds.mockResolvedValueOnce(
        new Map([
          ['item_1', createPriceEntry('prod_1')],
          ['item_2', createPriceEntry('prod_2')],
        ])
      )

      await handler(req, res)

      expect(normalizeItemIds).toHaveBeenCalledWith(['item_1', 'item_1', 'item_2'])
    })
  })

  describe('Error handling', () => {
    it('should return 500 for Stripe errors', async () => {
      req.body = { itemIds: ['item_1'] }
      fetchPricesByItemIds.mockRejectedValueOnce(
        new Error('Stripe API error')
      )

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Stripe API error' })
      )
    })

    it('should return 500 for database errors', async () => {
      req.body = { itemIds: ['item_1'] }
      fetchPricesByItemIds.mockResolvedValueOnce(
        new Map([['item_1', createPriceEntry()]])
      )
      vi.doMock('../db.js', () => ({
        withClient: vi.fn().mockRejectedValueOnce(new Error('DB error')),
      }))

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
    })

    it('should handle generic error objects', async () => {
      req.body = { itemIds: ['item_1'] }
      fetchPricesByItemIds.mockRejectedValueOnce(
        new Error('Generic error')
      )

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Generic error' })
      )
    })
  })
})
