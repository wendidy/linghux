import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useCurrency } from '../context/CurrencyContext'
import { useAvailability } from '../hooks/useAvailability'
import PriceText from '../components/PriceText'
import Seo from '../components/Seo'
import { formatCurrency, PRICE_LABELS } from '../utils/stripePrices'
import { getEditionLabel, isLimitedEdition, isOpenEdition, isOriginal } from '../utils/artwork'
import {
  clearPendingCheckoutSession,
  readPendingCheckoutSession,
  rememberPendingCheckoutSession,
} from '../utils/pendingCheckoutSession'

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
  const { currency, setCurrency } = useCurrency()
  const [shippingCountry, setShippingCountry] = useState(() => (currency === 'CAD' ? 'CA' : 'US'))
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [error, setError] = useState('')
  const itemIds = useMemo(() => items.map((item) => item.priceId || item.id).filter(Boolean), [items])
  const {
    availabilityById,
    loading: availabilityLoading,
    error: availabilityError,
  } = useAvailability(itemIds)

  const priceForItem = useCallback(
    (item) => priceById[item.priceId || item.id] || null,
    [priceById]
  )

  useEffect(() => {
    setShippingCountry(currency === 'CAD' ? 'CA' : 'US')
  }, [currency])

  useEffect(() => {
    const pending = readPendingCheckoutSession()
    if (!pending?.sessionId) return undefined

    const controller = new AbortController()
    fetch('/api/checkout-cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: pending.sessionId }),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}))
          throw new Error(payload?.error || 'Unable to release the previous checkout reservation')
        }
        clearPendingCheckoutSession(pending.sessionId)
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return
        setError('Your previous checkout was not completed. Its reserved items will be released automatically soon.')
      })

    return () => controller.abort()
  }, [])

  const availabilityForItem = useCallback(
    (item) => availabilityById[item.priceId || item.id] || null,
    [availabilityById]
  )

  const isItemUnavailable = (item) => {
    const availability = availabilityForItem(item)
    if (!availability) return false
    if (Boolean(availability.soldOut)) return true
    if (typeof availability.available === 'number' && item.quantity > availability.available) return true
    return false
  }

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

  const resolveCheckoutErrorMessage = (message) => {
    if (!message || typeof message !== 'string') return 'Unable to start checkout. Please refresh and try again.'
    if (/Insufficient inventory/i.test(message)) {
      return 'Some items are no longer available. Please refresh the page and remove unavailable items from your cart before checking out.'
    }
    if (/Unable to resolve Stripe .* price/i.test(message)) {
      return 'A price could not be resolved for one or more items. Refresh the page or remove the affected item from your cart.'
    }
    if (/Shipping is only available within Canada and the United States/i.test(message)) {
      return 'Shipping is available only to Canada and the United States. Choose a supported shipping country.'
    }
    if (/Cart is empty/i.test(message)) {
      return 'Your cart is empty. Add items before checking out.'
    }
    if (/No item IDs provided/i.test(message)) {
      return 'One or more items in your cart are invalid. Please refresh the page and remove the affected items.'
    }
    return message
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

      const unavailable = items.find((item) => isItemUnavailable(item))
      if (unavailable) {
        throw new Error('One or more items in your cart are unavailable. Please remove unavailable items before checking out.')
      }

      const lineItems = items.map((item) => ({
        id: item.priceId || item.id,
        quantity: item.quantity,
        itemId: item.id,
        title: item.title,
        category: item.category,
      }))

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lineItems, currency, shippingCountry }),
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        throw new Error(resolveCheckoutErrorMessage(payload?.error || 'Unable to start checkout'))
      }

      const data = await res.json()
      rememberPendingCheckoutSession(data.sessionId)
      window.location.href = data.url
    } catch (e) {
      setError(resolveCheckoutErrorMessage(e.message))
      setIsCheckingOut(false)
    }
  }

  return (
    <>
      <Seo
        title="Your basket | linghux"
        description="Review artwork in your linghux basket before secure checkout."
        robots="noindex, follow"
      />
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
                  <div className="cart-item-image-wrap">
                    <img src={item.image} alt={item.title} className="cart-item-image" />
                    {isItemUnavailable(item) && (
                      <p className="cart-unavailable">This item is unavailable, please remove it from your cart</p>
                    )}
                  </div>
                  <div className="cart-item-body">
                    <h3>{item.title}</h3>
                    {item.size && (
                      <p className="cart-item-detail">Size: {item.size}</p>
                    )}
                    {isLimitedEdition(item) && (
                      <p className="cart-item-detail">{availabilityLabelForItem(item)}</p>
                    )}
                    {!isOriginal(item) && (
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
              <label className="cart-shipping-country">
                <span>Ship to</span>
                <select
                  value={shippingCountry}
                  onChange={(event) => {
                    const country = event.target.value
                    setShippingCountry(country)
                    setCurrency(country === 'CA' ? 'CAD' : 'USD')
                  }}
                >
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                </select>
              </label>
              <div className="cart-summary-actions">
                <button
                  type="button"
                  className="checkout-primary"
                  onClick={checkout}
                  disabled={isCheckingOut || items.some((it) => isItemUnavailable(it))}
                >
                  {isCheckingOut ? 'Redirecting…' : 'Proceed to Secure Checkout'}
                </button>
              </div>
              <div className="trust-badges">
                <span className="trust-badge">Secure checkout</span>
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
    </>
  )
}
