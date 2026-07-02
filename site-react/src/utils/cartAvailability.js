export function isCartItemUnavailable(item, availability, { suppress = false } = {}) {
  if (suppress || !availability) return false
  if (Boolean(availability.soldOut)) return true
  return typeof availability.available === 'number' && item.quantity > availability.available
}
