import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { clearPendingCheckoutSession } from '../utils/pendingCheckoutSession'
import Seo from '../components/Seo'

export default function CheckoutSuccess() {
  const { clearCart } = useCart()

  useEffect(() => {
    clearCart()
    clearPendingCheckoutSession()
  }, [clearCart])

  return (
    <>
      <Seo title="Payment successful | linghux" description="Your linghux order was placed successfully." robots="noindex, follow" />
      <section className="cart-page">
        <div className="cart-wrap">
          <h1>Payment Successful for Your Artwork Order</h1>
          <p>Thank you for your order, please check your email for order confirmation.</p>
          <Link to="/artwork/originals" className="button">Back to artwork</Link>
        </div>
      </section>
    </>
  )
}
