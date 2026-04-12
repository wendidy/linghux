import { describe, it, expect, beforeEach, vi } from 'vitest'
import handler from '../prices.js'

// Mock stripeProducts
vi.mock('../stripeProducts.js', () => ({
  fetchPricesByItemIds: vi.fn(),
  normalizeItemIds: vi.fn((ids) => {
    const arr = Array.isArray(ids) ? ids : []
    return [...new Set(arr.filter(Boolean))]
  }),
  serializePrice: vi.fn((itemId, price) => {
    if (!price?.id) return null
    return {
      item_id: itemId,
      id: price.id,
      unit_amount: price.unit_amount,
      currency: price.currency,
    }
  }),
}))

import { fetchPricesByItemIds, serializePrice } from '../stripeProducts.js'

describe('Prices API Handler', () => {
  let req, res

  beforeEach(() => {
    vi.clearAllMocks()

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

  const mockPrice = (id = 'price_1', amount = 10000) => ({
    id,
    unit_amount: amount,
    currency: 'USD',
    product: 'prod_1',
  })

  describe('Method validation', () => {
    it('should reject GET requests', async () => {
      req.method = 'GET'

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(405)
      expect(res.send).toHaveBeenCalledWith('Method not allowed')
    })

    it('should reject PUT requests', async () => {
      req.method = 'PUT'

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(405)
    })

    it('should accept POST requests', async () => {
      req.body = { itemIds: ['item_1'] }
      fetchPricesByItemIds.mockResolvedValueOnce(
        new Map([['item_1', { price: mockPrice() }]])
      )

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
    })
  })

  describe('Input validation', () => {
    it('should return 400 for empty item IDs', async () => {
      req.body = { itemIds: [] }

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'No item IDs provided' })
      )
    })

    it('should return 400 for missing itemIds', async () => {
      req.body = {}

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('should return 400 for null itemIds', async () => {
      req.body = { itemIds: null }

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('should handle malformed request body', async () => {
      req.body = 'invalid'

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe('Price fetching', () => {
    it('should fetch prices for valid item IDs', async () => {
      req.body = { itemIds: ['item_1', 'item_2'] }
      const priceMap = new Map([
        ['item_1', { price: mockPrice('price_1', 5000) }],
        ['item_2', { price: mockPrice('price_2', 10000) }],
      ])
      fetchPricesByItemIds.mockResolvedValueOnce(priceMap)
      serializePrice.mockImplementation((itemId, price) => price)

      await handler(req, res)

      expect(fetchPricesByItemIds).toHaveBeenCalledOnce()
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          prices: expect.arrayContaining([
            expect.objectContaining({ id: 'price_1' }),
            expect.objectContaining({ id: 'price_2' }),
          ]),
        })
      )
    })

    it('should filter out null serialized prices', async () => {
      req.body = { itemIds: ['item_1', 'item_2'] }
      const priceMap = new Map([
        ['item_1', { price: mockPrice() }],
        ['item_2', { price: null }], // Will serialize to null
      ])
      fetchPricesByItemIds.mockResolvedValueOnce(priceMap)
      serializePrice.mockImplementation((itemId, price) => {
        return price ? price : null
      })

      await handler(req, res)

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          prices: expect.arrayContaining([
            expect.objectContaining({ id: expect.any(String) }),
          ]),
        })
      )
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

    it('should return generic error message if no error message', async () => {
      req.body = { itemIds: ['item_1'] }
      fetchPricesByItemIds.mockRejectedValueOnce(new Error())

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Failed to fetch prices' })
      )
    })

    it('should handle unexpected errors', async () => {
      req.body = { itemIds: ['item_1'] }
      fetchPricesByItemIds.mockRejectedValueOnce(
        new Error('Network timeout')
      )

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Network timeout' })
      )
    })
  })

  describe('Response format', () => {
    it('should return prices in correct format', async () => {
      req.body = { itemIds: ['item_1'] }
      const priceMap = new Map([
        ['item_1', { price: mockPrice('price_1', 10000) }],
      ])
      fetchPricesByItemIds.mockResolvedValueOnce(priceMap)
      serializePrice.mockImplementation((itemId, price) => price)

      await handler(req, res)

      const call = res.json.mock.calls[0][0]
      expect(call).toHaveProperty('prices')
      expect(Array.isArray(call.prices)).toBe(true)
    })

    it('should handle empty price list', async () => {
      req.body = { itemIds: ['non_existent'] }
      fetchPricesByItemIds.mockResolvedValueOnce(new Map([]))

      await handler(req, res)

      expect(res.json).toHaveBeenCalledWith({
        prices: [],
      })
    })
  })
})
