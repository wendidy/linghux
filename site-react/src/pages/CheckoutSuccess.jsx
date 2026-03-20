import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export default function CheckoutSuccess() {
  const { clearCart } = useCart()

  useEffect(() => {
    clearCart()
  }, [clearCart])

  return (
    <section className="cart-page">
      <div className="cart-wrap">
        <h2>Payment successful</h2>
        <p>Thank you for your order.</p>
        <Link to="/artwork" className="button">Back to artwork</Link>
      </div>
    </section>
  )
}
