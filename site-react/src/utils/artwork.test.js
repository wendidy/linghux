import { describe, expect, it } from 'vitest'
import { getCanonicalArtworkPath } from './artwork'

describe('getCanonicalArtworkPath', () => {
  it('uses the category-specific route when artwork belongs to a collection', () => {
    expect(getCanonicalArtworkPath({ id: 'sunset', category: 'originals' })).toBe('/artwork/originals/sunset')
  })

  it('uses the generic detail route when there is no category', () => {
    expect(getCanonicalArtworkPath({ id: 'sunset' })).toBe('/artwork/work/sunset')
  })
})
