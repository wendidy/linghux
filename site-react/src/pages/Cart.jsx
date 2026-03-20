import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAvailability } from '../hooks/useAvailability'
import PriceText from '../components/PriceText'
import { formatCurrency, PRICE_LABELS } from '../utils/stripePrices'
import { getEditionLabel, isLimitedEdition, isOpenEdition, isOriginal } from '../utils/artwork'

export default function Cart() {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    priceById,
    pricesLoading,
    pricesError,
  } = useCart()
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [error, setError] = useState('')
  const itemIds = useMemo(() => items.map((item) => item.id).filter(Boolean), [items])
  const {
    availabilityById,
    loading: availabilityLoading,
    error: availabilityError,
  } = useAvailability(itemIds)

  const priceForItem = useCallback(
    (item) => priceById[item.id] || null,
    [priceById]
  )

  const availabilityForItem = useCallback(
    (item) => availabilityById[item.id] || null,
    [availabilityById]
  )

  const cartCurrency = useMemo(() => {
    const match = items.find((item) => priceForItem(item)?.currency)
    if (!match) return 'USD'
    return priceForItem(match)?.currency || 'USD'
  }, [items, priceForItem])
  const hasMissingPrice = useMemo(() => {
    return items.some(
      (item) =>
        item.id &&
        (() => {
          const price = priceForItem(item)
          return !price || price.unit_amount == null
        })()
    )
  }, [items, priceForItem])

  const linePriceFor = (item) => {
    const price = priceForItem(item)
    if (!price || typeof price.unit_amount !== 'number') return null
    return { ...price, unit_amount: price.unit_amount * item.quantity }
  }

  const availabilityLabelForItem = (item) => {
    return getEditionLabel(item, availabilityForItem(item))
  }

  const canIncreaseQuantity = (item) => {
    if (isOpenEdition(item)) return true
    if (!isLimitedEdition(item)) return false
    if (availabilityLoading) return false

    const availability = availabilityForItem(item)
    if (!availability || typeof availability.available !== 'number') return false
    return item.quantity < availability.available
  }

  const checkout = async () => {
    setError('')
    setIsCheckingOut(true)

    try {
      const missing = items.find(
        (item) => !item.id
      )
      if (missing) {
        throw new Error(`Missing Stripe item ID for ${missing.title}`)
      }

      const lineItems = items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
      }))

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lineItems),
      })

      if (!res.ok) {
        throw new Error('Unable to start checkout')
      }

      const data = await res.json()
      window.location.href = data.url
    } catch (e) {
      setError(e.message || 'Checkout failed')
      setIsCheckingOut(false)
    }
  }

  return (
    <section className="cart-page">
      <div className="cart-wrap">
        <header>
          <h2>Your Basket</h2>
        </header>

        {items.length === 0 ? (
          <div className="cart-empty">
            <p>Your basket is empty.</p>
            <Link to="/artwork" className="button">Browse artwork</Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-main">
              <div className="cart-list">
              {items.map((item) => (
                <article className="cart-item-row" key={item.id}>
                  <img src={item.image} alt={item.title} className="cart-item-image" />
                  <div className="cart-item-body">
                    <h3>{item.title}</h3>
                    {isLimitedEdition(item) && (
                      <p className="cart-item-detail">{availabilityLabelForItem(item)}</p>
                    )}
                    {isOriginal(item) ? (
                      <div className="cart-qty">
                        <span>Qty: {item.quantity}</span>
                      </div>
                    ) : (
                      <div className="cart-qty">
                        <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={!canIncreaseQuantity(item)}
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="cart-item-prices">
                    <span className="cart-item-unit-price">
                      <PriceText
                        itemId={item.id}
                        price={priceForItem(item)}
                        loading={pricesLoading}
                      />
                    </span>
                    <strong className="cart-item-line-price">
                      <PriceText
                        itemId={item.id}
                        price={linePriceFor(item)}
                        loading={pricesLoading}
                        missingLabel="—"
                      />
                    </strong>
                    <button type="button" className="cart-remove" onClick={() => removeItem(item.id)}>Remove</button>
                  </div>
                </article>
              ))}
              </div>
              <div className="cart-list-actions">
                <button type="button" className="link-subtle" onClick={clearCart}>Clear basket</button>
              </div>
            </div>

            <aside className="cart-summary">
              <h3>Summary</h3>
              <div className="cart-notice">
                Items in your basket are not reserved. Complete checkout to secure your artwork.
              </div>
              <div className="cart-summary-row">
                <span>Subtotal</span>
                <strong>
                  {pricesLoading
                    ? 'Loading…'
                    : (hasMissingPrice ? PRICE_LABELS.unavailable : formatCurrency(subtotal, cartCurrency))}
                </strong>
              </div>
              <div className="cart-summary-actions">
                <button type="button" className="checkout-primary" onClick={checkout} disabled={isCheckingOut}>
                  {isCheckingOut ? 'Redirecting…' : 'Proceed to Secure Checkout'}
                </button>
              </div>
              <div className="trust-badges">
                <span className="trust-badge">Secure checkout</span>
                {/* <span className="trust-badge">Insured shipping</span> */}
                <span className="trust-badge">Certificate of authenticity included</span>
              </div>
              {pricesError && <p className="cart-error">{pricesError}</p>}
              {availabilityError && <p className="cart-error">{availabilityError}</p>}
              {error && <p className="cart-error">{error}</p>}
            </aside>
          </div>
        )}
      </div>
    </section>
  )
}
