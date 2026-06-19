import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { clearPendingCheckoutSession } from '../utils/pendingCheckoutSession'

export default function CheckoutSuccess() {
  const { clearCart } = useCart()

  useEffect(() => {
    clearCart()
    clearPendingCheckoutSession()
  }, [clearCart])

  return (
    <section className="cart-page">
      <div className="cart-wrap">
        <h2>Payment successful</h2>
        <p>Thank you for your order, please check your email for order confirmation.</p>
        <Link to="/artwork/originals" className="button">Back to artwork</Link>
      </div>
    </section>
  )
}
