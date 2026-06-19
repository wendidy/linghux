import { describe, it, expect, beforeEach, vi } from 'vitest'
import { reserveInventory, finalizeReservations, releaseReservations, cleanupExpiredReservations } from '../inventory.js'

// Mock db.js
vi.mock('../db.js', () => ({
  withClient: vi.fn(async (callback) => {
    const mockClient = {
      query: vi.fn(async (sql, params) => {
        if (sql.includes('INSERT INTO reservations')) {
          return { rows: [] }
        }
        if (sql.includes('UPDATE inventory')) {
          return { rows: [] }
        }
        if (sql.includes('SELECT cap, sold, reserved')) {
          // Return available inventory
          return {
            rows: [
              {
                cap: params[1] || 100,
                sold: 0,
                reserved: 0,
              },
            ],
          }
        }
        if (sql.includes('INSERT INTO inventory')) {
          return { rows: [] }
        }
        if (sql.includes('UPDATE reservations')) {
          return { rows: [] }
        }
        if (sql.includes('SELECT id')) {
          return { rows: [] }
        }
        return { rows: [] }
      }),
    }
    return callback(mockClient)
  }),
}))

import { withClient } from '../db.js'

describe('Inventory Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('reserveInventory', () => {
    it('should reserve inventory for products', async () => {
      const reservations = await reserveInventory([
        {
          productId: 'prod_1',
          quantity: 2,
          cap: 10,
        },
      ])

      expect(reservations).toHaveLength(1)
      expect(reservations[0]).toEqual({
        id: expect.any(String),
        productId: 'prod_1',
        quantity: 2,
      })
    })

    it('should generate unique reservation IDs', async () => {
      const reservations = await reserveInventory([
        { productId: 'prod_1', quantity: 1, cap: 10 },
        { productId: 'prod_2', quantity: 1, cap: 10 },
      ])

      expect(reservations[0].id).not.toBe(reservations[1].id)
    })

    it('should handle empty requests', async () => {
      const reservations = await reserveInventory([])

      expect(reservations).toEqual([])
    })

    it('should handle null requests', async () => {
      const reservations = await reserveInventory(null)

      expect(reservations).toEqual([])
    })

    it('should filter out invalid requests', async () => {
      const reservations = await reserveInventory([
        { productId: 'prod_1', quantity: 1, cap: 10 }, // Valid
        { productId: 'prod_2', quantity: 0, cap: 10 }, // Invalid quantity
        { productId: 'prod_3', quantity: 1, cap: -5 }, // Invalid cap
        null, // Invalid
      ])

      expect(reservations).toHaveLength(1)
      expect(reservations[0].productId).toBe('prod_1')
    })

    it('should reject float quantities', async () => {
      const reservations = await reserveInventory([
        { productId: 'prod_1', quantity: 2.5, cap: 10 },
      ])

      expect(reservations).toHaveLength(0)
    })

    it('should skip string quantities', async () => {
      const reservations = await reserveInventory([
        { productId: 'prod_1', quantity: '5', cap: 10 },
      ])

      expect(reservations).toHaveLength(0)
    })

    it('should use transaction for database operations', async () => {
      await reserveInventory([
        { productId: 'prod_1', quantity: 1, cap: 10 },
      ])

      expect(withClient).toHaveBeenCalledOnce()
      const callback = withClient.mock.calls[0][0]
      expect(typeof callback).toBe('function')
    })

    it('should handle insufficient inventory', async () => {
      // Mock the client to return insufficient inventory
      const { withClient: mockWithClient } = await import('../db.js')
      mockWithClient.mockImplementationOnce(async (callback) => {
        const mockClient = {
          query: vi.fn(async (sql) => {
            if (sql.includes('SELECT cap, sold, reserved')) {
              return {
                rows: [
                  {
                    cap: 10,
                    sold: 5,
                    reserved: 4, // Only 1 available
                  },
                ],
              }
            }
            if (sql.includes('BEGIN') || sql.includes('ROLLBACK')) {
              return { rows: [] }
            }
            return { rows: [] }
          }),
        }
        return callback(mockClient)
      })

      await expect(
        reserveInventory([{ productId: 'prod_1', quantity: 2, cap: 10 }])
      ).rejects.toThrow('Insufficient inventory for limited edition')
    })
  })

  describe('finalizeReservations', () => {
    it('should finalize reservations', async () => {
      await finalizeReservations(['res_1', 'res_2'])

      expect(withClient).toHaveBeenCalledOnce()
    })

    it('should handle empty IDs', async () => {
      await finalizeReservations([])

      expect(withClient).not.toHaveBeenCalled()
    })

    it('should handle null IDs', async () => {
      await finalizeReservations(null)

      expect(withClient).not.toHaveBeenCalled()
    })

    it('should deduplicate reservation IDs', async () => {
      await finalizeReservations(['res_1', 'res_1', 'res_2'])

      expect(withClient).toHaveBeenCalledOnce()
    })

    it('should filter out null/undefined IDs', async () => {
      await finalizeReservations(['res_1', null, undefined, 'res_2'])

      expect(withClient).toHaveBeenCalledOnce()
    })

    it('should finalize expired reservations without subtracting reserved twice', async () => {
      const inventoryUpdateParams = []
      const { withClient: mockWithClient } = await import('../db.js')
      mockWithClient.mockImplementationOnce(async (callback) => {
        const mockClient = {
          query: vi.fn(async (sql, params) => {
            if (sql.includes('WITH target')) {
              return {
                rows: [
                  {
                    product_id: 'prod_1',
                    quantity: 2,
                    previous_status: 'expired',
                  },
                ],
              }
            }
            if (sql.includes('UPDATE inventory AS i')) {
              inventoryUpdateParams.push(params)
            }
            return { rows: [] }
          }),
        }
        return callback(mockClient)
      })

      await finalizeReservations(['res_1'])

      expect(inventoryUpdateParams[0][0]).toEqual(['prod_1'])
      expect(inventoryUpdateParams[0][1]).toEqual([2])
      expect(inventoryUpdateParams[0][2]).toEqual([0])
    })
  })

  describe('releaseReservations', () => {
    it('should release reservations', async () => {
      await releaseReservations(['res_1', 'res_2'])

      expect(withClient).toHaveBeenCalledOnce()
    })

    it('should handle empty IDs', async () => {
      await releaseReservations([])

      expect(withClient).not.toHaveBeenCalled()
    })

    it('should handle null IDs', async () => {
      await releaseReservations(null)

      expect(withClient).not.toHaveBeenCalled()
    })

    it('should deduplicate reservation IDs', async () => {
      await releaseReservations(['res_1', 'res_1', 'res_2'])

      expect(withClient).toHaveBeenCalledOnce()
    })
  })

  describe('cleanupExpiredReservations', () => {
    it('should expire stale holds and release reserved counts', async () => {
      const inventoryUpdateParams = []
      const { withClient: mockWithClient } = await import('../db.js')
      mockWithClient.mockImplementationOnce(async (callback) => {
        const mockClient = {
          query: vi.fn(async (sql, params) => {
            if (sql.includes('UPDATE reservations')) {
              expect(params[0]).toBeGreaterThanOrEqual(31)
              return {
                rows: [
                  {
                    product_id: 'prod_1',
                    quantity: 1,
                  },
                ],
              }
            }
            if (sql.includes('UPDATE inventory AS i')) {
              inventoryUpdateParams.push(params)
            }
            return { rows: [] }
          }),
        }
        return callback(mockClient)
      })

      const released = await cleanupExpiredReservations()

      expect(released).toBe(1)
      expect(inventoryUpdateParams[0]).toEqual([['prod_1'], [1]])
    })
  })
})
