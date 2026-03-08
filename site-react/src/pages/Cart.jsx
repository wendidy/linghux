import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'

function formatUsd(cents) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

export default function Cart() {
  const { items, updateQuantity, removeItem, clearCart, subtotal } = useCart()
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [error, setError] = useState('')

  const checkout = async () => {
    setError('')
    setIsCheckingOut(true)

    try {
      const missing = items.find((item) => !item.priceId)
      if (missing) {
        throw new Error(`Missing Stripe price ID for ${missing.title}`)
      }

      const lineItems = items.map((item) => ({
        price: item.priceId,
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
                    <p>{formatUsd(item.unitAmount)}</p>
                    <div className="cart-qty">
                      <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                    </div>
                  </div>
                  <div className="cart-item-actions">
                    <strong>{formatUsd(item.unitAmount * item.quantity)}</strong>
                    <button type="button" onClick={() => removeItem(item.id)}>Remove</button>
                  </div>
                </article>
              ))}
            </div>

            <div className="cart-summary">
              <p><strong>Subtotal:</strong> {formatUsd(subtotal)}</p>
              <div className="cart-summary-actions">
                <button type="button" className="button" onClick={clearCart}>Clear cart</button>
                <button type="button" className="button primary" onClick={checkout} disabled={isCheckingOut}>
                  {isCheckingOut ? 'Redirecting…' : 'Checkout with Stripe'}
                </button>
              </div>
              {error && <p className="cart-error">{error}</p>}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

