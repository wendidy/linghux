import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { items } from '../data/portfolio'
import { useCart } from '../context/CartContext'
import { useStripePrices } from '../hooks/useStripePrices'
import { useAvailability } from '../hooks/useAvailability'
import PriceText from '../components/PriceText'
import { PRICE_LABELS } from '../utils/stripePrices'
import { findArtwork, isLimitedEdition, isOriginal } from '../utils/artwork'

export default function WorkPortfolioItem({ category }) {
  const { workId } = useParams()
  const item = findArtwork(items, workId, category)
  const backPath = category ? `/artwork/${category}` : '/artwork'
  const galleryImages = useMemo(() => {
    if (!item) return []
    if (Array.isArray(item.images) && item.images.length > 0) return item.images
    if (typeof item.images === 'string' && item.images) return [item.images]
    return item.image ? [item.image] : []
  }, [item])
  const [activeImage, setActiveImage] = useState('')
  const { addItem, items: cartItems } = useCart()
  const [cartNotice, setCartNotice] = useState('')
  const [shippingOpen, setShippingOpen] = useState(false)
  const itemIds = useMemo(() => (item?.id ? [item.id] : []), [item])
  const { priceById, loading: priceLoading, error: priceError } = useStripePrices(itemIds)
  const { availabilityById, loading: availabilityLoading, error: availabilityError } = useAvailability(itemIds)
  const priceInfo = item?.id ? priceById[item.id] : null
  const availability = item?.id ? availabilityById[item.id] : null

  const cartItem = cartItems.find((cartItem) => cartItem.id === item?.id)
  const cartQuantity = cartItem?.quantity || 0
  const original = isOriginal(item)
  const limitedEdition = isLimitedEdition(item)
  const isAlreadyInCart = original && cartItems.some((cartItem) => cartItem.id === item?.id)
  const isSoldOut = Boolean(availability?.soldOut)
  const hasAvailabilityInfo = !limitedEdition || (!availabilityLoading && Boolean(availability))
  const limitReachedInCart = limitedEdition &&
    !availabilityLoading &&
    typeof availability?.available === 'number' &&
    cartQuantity >= availability.available
  const canPurchase = Boolean(item?.id && priceInfo && hasAvailabilityInfo)
  const buttonLabel = !item?.id
    ? 'Unavailable'
    : (
        isSoldOut
          ? 'Sold out'
          : (limitReachedInCart
              ? 'Limit reached'
              : (priceInfo ? 'Add to Basket' : (priceLoading ? PRICE_LABELS.loading : PRICE_LABELS.unavailable)))
      )

  useEffect(() => {
    // Reset active image when the item changes.
    if (item) setActiveImage(galleryImages[0] || '')
    setCartNotice('')
  }, [item, galleryImages])

  if (!item) {
    return (
      <div className="portfolio-item">
        <p>
          Item not found. <Link to={backPath}>Back to portfolio</Link>
        </p>
      </div>
    )
  }

  return (
    <section className="work-item-page">
      <div className="work-item-grid">
        <div className="work-item-visual">
          <div className="work-item-image">
            <img src={activeImage || item.image} alt={item.title} />
          </div>
          {galleryImages.length > 1 && (
            <div className="work-item-gallery">
              {galleryImages.map((src, index) => (
                <button
                  key={`${src}-${index}`}
                  type="button"
                  className={`work-thumb${src === activeImage ? ' is-active' : ''}`}
                  onClick={() => setActiveImage(src)}
                  aria-label={`Show image ${index + 1}`}
                >
                  <img src={src} alt={`${item.title} view ${index + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>
        <aside className="work-item-meta">
          <h1>{item.title}</h1>
          <p className="price">
            <i className="fas fa-tag entry-icon" aria-hidden="true" />
            <PriceText
              itemId={item.id}
              price={priceInfo}
              loading={priceLoading}
            />
          </p>
          <p className="meta-line meta-line-framed">
            <span className="meta-main">
              <i className="fas fa-ruler-combined entry-icon" aria-hidden="true" />
              Framed size: {item.framedSize}
              <span className="info-tip" aria-label="Framing information" tabIndex={0}>
                <i className="fas fa-info-circle" aria-hidden="true" />
                <span className="info-bubble">
                  Framed: This artwork is framed by hand to order. Unframed artwork size: {item.size}
                </span>
              </span>
            </span>
          </p>
          <p className="meta-line">
            <i className="fas fa-calendar-alt entry-icon" aria-hidden="true" />
            Date: {item.date}
          </p>
          <p className="meta-line">
            <i className="fas fa-certificate entry-icon" aria-hidden="true" />
            Signed authenticity certificate
          </p>
          <p className="description">{item.description}</p>
          <button
            type="button"
            className="basket-button"
            disabled={!canPurchase || isSoldOut || limitReachedInCart}
            onClick={() => {
              if (isSoldOut || limitReachedInCart) return
              if (original && isAlreadyInCart) {
                setCartNotice('This work has already been added to your cart.')
                return
              }
              const result = addItem({
                id: item.id,
                title: item.title,
                image: item.image,
                category: item.category,
                size: item.size,
                maxQuantity: limitedEdition ? availability?.available : undefined,
              })
              if (result?.added) {
                setCartNotice('')
              } else if (result?.reason === 'already_in_cart') {
                setCartNotice('This work has already been added to your cart.')
              } else if (result?.reason === 'limit_reached') {
                setCartNotice('Maximum available quantity is already in your cart.')
              } else if (result?.reason === 'sold_out') {
                setCartNotice('This work is sold out.')
              }
            }}
          >
            {buttonLabel}
          </button>
          {limitReachedInCart && <p className="meta-line">Maximum available quantity is already in your cart.</p>}
          {cartNotice && <p className="meta-line">{cartNotice}</p>}
          {priceError && <p className="meta-line">{priceError}</p>}
          {availabilityError && <p className="meta-line">{availabilityError}</p>}
          <div className="shipping-block">
            <button
              type="button"
              className="shipping-summary"
              aria-expanded={shippingOpen}
              onClick={() => setShippingOpen((s) => !s)}
            >
              <i className="fas fa-truck entry-icon" aria-hidden="true" />
              Shipping &amp; Delivery
              <span className={`shipping-chevron${shippingOpen ? ' is-open' : ''}`} aria-hidden="true" />
            </button>

            <div className={`shipping-details${shippingOpen ? ' is-open' : ''}`} aria-hidden={!shippingOpen}>
              <p className="meta-line">Ships from Canada.</p>
              <p className="meta-line">Prints ship within 3-7 business days with tracked delivery.</p>
              <p className="meta-line">Original artworks are carefully packed and fully insured. Shipping for originals is calculated separately after purchase.</p>
              <p className="meta-line"><Link to="/shipping">Learn more</Link></p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
