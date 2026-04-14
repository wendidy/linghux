import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fetchPricesByItemIds } from '../stripeProducts.js'

describe('Stripe Products', () => {
  let mockStripe

  beforeEach(() => {
    mockStripe = {
      products: {
        search: vi.fn(),
      },
      prices: {
        retrieve: vi.fn(),
        list: vi.fn(),
      },
    }
  })

  const mockProduct = (id = 'prod_test_1') => ({
    id,
    name: 'Test Artwork',
    active: true,
    default_price: 'price_test_1',
    metadata: {
      edition_cap: '10',
    },
  })

  const mockPrice = (id = 'price_test_1') => ({
    id,
    unit_amount: 10000,
    currency: 'USD',
    nickname: 'Test Price',
    product: 'prod_test_1',
  })

  describe('fetchPricesByItemIds', () => {
    it('should fetch products and prices by item IDs', async () => {
      const product = mockProduct('prod_test_1')
      mockStripe.products.search.mockResolvedValueOnce({
        data: [product],
      })
      mockStripe.prices.retrieve.mockResolvedValueOnce(mockPrice())

      const result = await fetchPricesByItemIds(mockStripe, ['item-1'])

      expect(result.get('item-1')).toEqual({
        product: expect.any(Object),
        price: expect.any(Object),
      })
    })

    it('should return empty map for empty item IDs', async () => {
      const result = await fetchPricesByItemIds(mockStripe, [])

      expect(result).toBeInstanceOf(Map)
      expect(result.size).toBe(0)
      expect(mockStripe.products.search).not.toHaveBeenCalled()
    })

    it('should handle null item IDs', async () => {
      const result = await fetchPricesByItemIds(mockStripe, [null, undefined, ''])

      expect(result.size).toBe(0)
    })

    it('should deduplicate item IDs', async () => {
      const product = mockProduct()
      mockStripe.products.search.mockResolvedValueOnce({
        data: [product],
      })
      mockStripe.prices.retrieve.mockResolvedValueOnce(mockPrice())

      await fetchPricesByItemIds(mockStripe, ['item-1', 'item-1', 'item-1'])

      expect(mockStripe.products.search).toHaveBeenCalledOnce()
    })

    it('should escape search values', async () => {
      mockStripe.products.search.mockResolvedValueOnce({
        data: [],
      })

      await fetchPricesByItemIds(mockStripe, ['item"with"quotes', 'item\\with\\backslash'])

      const calls = mockStripe.products.search.mock.calls
      expect(calls[0][0].query).toContain('item\\"with\\"quotes')
      expect(calls[1][0].query).toContain('item\\\\with\\\\backslash')
    })

    it('should handle products not found', async () => {
      mockStripe.products.search.mockResolvedValueOnce({
        data: [],
      })

      const result = await fetchPricesByItemIds(mockStripe, ['non-existent'])

      expect(result.get('non-existent')).toEqual({
        product: null,
        price: null,
      })
    })

    it('should resolve price from default_price object', async () => {
      const price = mockPrice()
      const product = {
        ...mockProduct(),
        default_price: price,
      }
      mockStripe.products.search.mockResolvedValueOnce({
        data: [product],
      })

      const result = await fetchPricesByItemIds(mockStripe, ['item-1'])

      expect(result.get('item-1').price).toEqual(price)
      expect(mockStripe.prices.retrieve).not.toHaveBeenCalled()
    })

    it('should retrieve price by default_price string ID', async () => {
      const product = mockProduct()
      const price = mockPrice()
      mockStripe.products.search.mockResolvedValueOnce({
        data: [product],
      })
      mockStripe.prices.retrieve.mockResolvedValueOnce(price)

      const result = await fetchPricesByItemIds(mockStripe, ['item-1'])

      expect(mockStripe.prices.retrieve).toHaveBeenCalledWith('price_test_1')
      expect(result.get('item-1').price).toEqual(price)
    })

    it('should list prices when no default_price', async () => {
      const product = {
        ...mockProduct(),
        default_price: null,
      }
      const price = mockPrice()
      mockStripe.products.search.mockResolvedValueOnce({
        data: [product],
      })
      mockStripe.prices.list.mockResolvedValueOnce({
        data: [price],
      })

      const result = await fetchPricesByItemIds(mockStripe, ['item-1'])

      expect(mockStripe.prices.list).toHaveBeenCalledWith({
        product: 'prod_test_1',
        active: true,
        limit: 1,
      })
      expect(result.get('item-1').price).toEqual(price)
    })

    it('should handle empty price list', async () => {
      const product = {
        ...mockProduct(),
        default_price: null,
      }
      mockStripe.products.search.mockResolvedValueOnce({
        data: [product],
      })
      mockStripe.prices.list.mockResolvedValueOnce({
        data: [],
      })

      const result = await fetchPricesByItemIds(mockStripe, ['item-1'])

      expect(result.get('item-1').price).toBeNull()
    })

    it('should handle search errors', async () => {
      mockStripe.products.search.mockRejectedValueOnce(
        new Error('Stripe API error')
      )

      await expect(
        fetchPricesByItemIds(mockStripe, ['item-1'])
      ).rejects.toThrow('Stripe API error')
    })

    it('should handle price retrieval errors', async () => {
      const product = mockProduct()
      mockStripe.products.search.mockResolvedValueOnce({
        data: [product],
      })
      mockStripe.prices.retrieve.mockRejectedValueOnce(
        new Error('Price not found')
      )

      await expect(
        fetchPricesByItemIds(mockStripe, ['item-1'])
      ).rejects.toThrow('Price not found')
    })

    it('should handle multiple products', async () => {
      mockStripe.products.search
        .mockResolvedValueOnce({
          data: [mockProduct('prod_1')],
        })
        .mockResolvedValueOnce({
          data: [mockProduct('prod_2')],
        })
      mockStripe.prices.retrieve
        .mockResolvedValueOnce(mockPrice('price_1'))
        .mockResolvedValueOnce(mockPrice('price_2'))

      const result = await fetchPricesByItemIds(mockStripe, ['item-1', 'item-2'])

      expect(result.size).toBe(2)
      expect(result.get('item-1')).toBeDefined()
      expect(result.get('item-2')).toBeDefined()
    })

    it('should use product metadata in results', async () => {
      const product = {
        ...mockProduct(),
        metadata: {
          collection: 'Spring 2024',
          edition_cap: '50',
        },
      }
      mockStripe.products.search.mockResolvedValueOnce({
        data: [product],
      })
      mockStripe.prices.retrieve.mockResolvedValueOnce(mockPrice())

      const result = await fetchPricesByItemIds(mockStripe, ['item-1'])

      expect(result.get('item-1').product.metadata).toEqual({
        collection: 'Spring 2024',
        edition_cap: '50',
      })
    })
  })
})
