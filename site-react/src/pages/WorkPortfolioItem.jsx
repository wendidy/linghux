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
  const variants = useMemo(() => {
    if (!item) return []
    if (Array.isArray(item.variants) && item.variants.length > 0) return item.variants
    return [{ id: item.id, size: item.size, framedSize: item.framedSize }]
  }, [item])
  const initialVariantId = useMemo(() => {
    if (!item) return ''
    if (variants.some((variant) => variant.id === workId)) return workId
    return item.defaultVariantId || variants[0]?.id || item.id
  }, [item, variants, workId])
  const [selectedVariantId, setSelectedVariantId] = useState('')
  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId) || variants[0] || null
  const selectedItemId = selectedVariant?.id || item?.id || ''
  const itemIds = useMemo(() => variants.map((variant) => variant.id).filter(Boolean), [variants])
  const { priceById, loading: priceLoading, error: priceError } = useStripePrices(itemIds)
  const { availabilityById, loading: availabilityLoading, error: availabilityError } = useAvailability(itemIds)
  const priceInfo = selectedItemId ? priceById[selectedItemId] : null
  const availability = selectedItemId ? availabilityById[selectedItemId] : null

  const cartItem = cartItems.find((cartItem) => cartItem.id === selectedItemId)
  const cartQuantity = cartItem?.quantity || 0
  const original = isOriginal(item)
  const limitedEdition = isLimitedEdition(item)
  const isAlreadyInCart = original && cartItems.some((cartItem) => cartItem.id === selectedItemId)
  const isSoldOut = Boolean(availability?.soldOut)
  const hasAvailabilityInfo = !limitedEdition || (!availabilityLoading && Boolean(availability))
  const limitReachedInCart = limitedEdition &&
    !availabilityLoading &&
    typeof availability?.available === 'number' &&
    cartQuantity >= availability.available
  const canPurchase = Boolean(selectedItemId && priceInfo && hasAvailabilityInfo)
  const buttonLabel = !selectedItemId
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

  useEffect(() => {
    setSelectedVariantId(initialVariantId)
    setCartNotice('')
  }, [initialVariantId])

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
              itemId={selectedItemId}
              price={priceInfo}
              loading={priceLoading}
            />
          </p>
          {variants.length > 1 && (
            <div className="size-selector" aria-label="Select print size">
              {variants.map((variant) => {
                const variantAvailability = availabilityById[variant.id]
                const variantSoldOut = Boolean(variantAvailability?.soldOut)
                return (
                  <button
                    key={variant.id}
                    type="button"
                    className={`size-option${variant.id === selectedItemId ? ' is-active' : ''}`}
                    onClick={() => setSelectedVariantId(variant.id)}
                    aria-pressed={variant.id === selectedItemId}
                  >
                    <span>{variant.size}</span>
                    {variantSoldOut && <small>Sold out</small>}
                  </button>
                )
              })}
            </div>
          )}
          <p className="meta-line meta-line-framed">
            <span className="meta-main">
              <i className="fas fa-ruler-combined entry-icon" aria-hidden="true" />
              Framed size: {selectedVariant?.framedSize || item.framedSize}
              <span className="info-tip" aria-label="Framing information" tabIndex={0}>
                <i className="fas fa-info-circle" aria-hidden="true" />
                <span className="info-bubble">
                  Framed: This artwork is framed by hand to order. Unframed artwork size: {selectedVariant?.size || item.size}
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
                id: selectedItemId,
                title: item.title,
                image: item.image,
                category: item.category,
                size: selectedVariant?.size || item.size,
                framedSize: selectedVariant?.framedSize || item.framedSize,
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
