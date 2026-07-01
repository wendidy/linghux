import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { clearPendingCheckoutSession } from '../utils/pendingCheckoutSession'
import Seo from '../components/Seo'

export default function CheckoutCancel() {
  const [searchParams] = useSearchParams()
  const [releaseMessage, setReleaseMessage] = useState('')
  const [isReleasing, setIsReleasing] = useState(false)

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    if (!sessionId) return

    setIsReleasing(true)
    setReleaseMessage('Releasing reserved inventory for your cancelled checkout...')

    fetch('/api/checkout-cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
      .then(async (res) => {
        const payload = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(payload?.error || 'Unable to release the reservation')
        }
        clearPendingCheckoutSession(sessionId)
        setReleaseMessage(payload?.message || 'Reserved inventory has been released.')
      })
      .catch((error) => {
        setReleaseMessage(error.message || 'Unable to release the reservation automatically. Please try again later.')
      })
      .finally(() => setIsReleasing(false))
  }, [searchParams])

  return (
    <>
      <Seo title="Checkout cancelled | linghux" description="Your linghux checkout was cancelled." robots="noindex, follow" />
      <section className="cart-page">
        <div className="cart-wrap">
          <h1>Checkout Cancelled for Your Artwork Order</h1>
          <p>Your payment was cancelled. Your cart is still saved.</p>
          {releaseMessage && (
            <p>{releaseMessage}</p>
          )}
          {isReleasing && <p>Checking reserved inventory status…</p>}
          <Link to="/cart" className="button">Return to cart</Link>
        </div>
      </section>
    </>
  )
}
