import React, { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import PriceText from '../components/PriceText'
import { formatCurrency, PRICE_LABELS } from '../utils/stripePrices'

export default function Cart() {
  const {
    items,
    removeItem,
    clearCart,
    subtotal,
    priceById,
    pricesLoading,
    pricesError,
  } = useCart()
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [error, setError] = useState('')

  const priceForItem = useCallback(
    (item) => priceById[item.id] || null,
    [priceById]
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
          <h2>Shopping Cart</h2>
        </header>

        {items.length === 0 ? (
          <div className="cart-empty">
            <p>Your basket is empty.</p>
            <Link to="/artwork" className="button">Browse artwork</Link>
          </div>
        ) : (
          <>
            <div className="cart-list">
              {items.map((item) => (
                <article className="cart-item-row" key={item.id}>
                  <img src={item.image} alt={item.title} className="cart-item-image" />
                  <div className="cart-item-body">
                    <h3>{item.title}</h3>
                    <p>
                      <PriceText
                        itemId={item.id}
                        price={priceForItem(item)}
                        loading={pricesLoading}
                      />
                    </p>
                    <div className="cart-qty">
                      <span>Qty: {item.quantity}</span>
                    </div>
                  </div>
                  <div className="cart-item-actions">
                    <strong>
                      <PriceText
                        itemId={item.id}
                        price={linePriceFor(item)}
                        loading={pricesLoading}
                        missingLabel="—"
                      />
                    </strong>
                    <button type="button" onClick={() => removeItem(item.id)}>Remove</button>
                  </div>
                </article>
              ))}
            </div>

            <div className="cart-summary">
              <p>
                <strong>Subtotal:</strong>{' '}
                {pricesLoading
                  ? 'Loading…'
                  : (hasMissingPrice ? PRICE_LABELS.unavailable : formatCurrency(subtotal, cartCurrency))}
              </p>
              <div className="cart-summary-actions">
                <button type="button" className="button" onClick={clearCart}>Clear cart</button>
                <button type="button" className="button primary" onClick={checkout} disabled={isCheckingOut}>
                  {isCheckingOut ? 'Redirecting…' : 'Checkout with Stripe'}
                </button>
              </div>
              {pricesError && <p className="cart-error">{pricesError}</p>}
              {error && <p className="cart-error">{error}</p>}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
