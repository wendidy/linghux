import React from 'react'
import { Link } from 'react-router-dom'

export default function CheckoutCancel() {
  return (
    <section className="cart-page">
      <div className="cart-wrap">
        <h2>Checkout cancelled</h2>
        <p>Your payment was cancelled. Your cart is still saved.</p>
        <Link to="/cart" className="button">Return to cart</Link>
      </div>
    </section>
  )
}

