import { describe, expect, it } from 'vitest'
import { isCartItemUnavailable } from './cartAvailability'

describe('isCartItemUnavailable', () => {
  it('suppresses stale sold-out data while the shopper reservation is being released', () => {
    expect(
      isCartItemUnavailable(
        { quantity: 1 },
        { soldOut: true, available: 0 },
        { suppress: true }
      )
    ).toBe(false)
  })

  it('marks an item unavailable after refreshed inventory confirms it is sold out', () => {
    expect(
      isCartItemUnavailable(
        { quantity: 1 },
        { soldOut: true, available: 0 }
      )
    ).toBe(true)
  })

  it('marks quantities above refreshed availability as unavailable', () => {
    expect(
      isCartItemUnavailable(
        { quantity: 2 },
        { soldOut: false, available: 1 }
      )
    ).toBe(true)
  })
})
