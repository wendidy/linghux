import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { items } from '../data/portfolio'
import { useCart } from '../context/CartContext'
import { useStripePrices } from '../hooks/useStripePrices'
import { useAvailability } from '../hooks/useAvailability'
import PriceText from '../components/PriceText'
import Seo from '../components/Seo'
import { PRICE_LABELS } from '../utils/stripePrices'
import { findArtwork, getArtworkPath, isLimitedEdition, isOpenEdition, isOriginal } from '../utils/artwork'
import {
  buildBreadcrumbJsonLd,
  buildImageAlt,
  buildProductJsonLd,
  buildProductPageDescription,
  SITE_NAME,
} from '../utils/seo'

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
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomOrigin, setZoomOrigin] = useState('50% 50%')
  const { addItem, items: cartItems } = useCart()
  const [shippingOpen, setShippingOpen] = useState(false)
  const [selectedQuantity, setSelectedQuantity] = useState(1)
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
  const openEdition = isOpenEdition(item)
  const isPrint = limitedEdition || openEdition
  const tracksInventory = original || limitedEdition
  const isAlreadyInCart = original && cartItems.some((cartItem) => cartItem.id === selectedItemId)
  const isSoldOut = tracksInventory && Boolean(availability?.soldOut)
  const hasAvailabilityInfo = !tracksInventory || (!availabilityLoading && Boolean(availability))
  const inventoryInfoMissing = tracksInventory && !availabilityLoading && !availability
  const maxSelectableQuantity = limitedEdition &&
    typeof availability?.available === 'number'
      ? Math.max(availability.available - cartQuantity, 0)
      : null
  const limitReachedInCart = limitedEdition &&
    !availabilityLoading &&
    typeof availability?.available === 'number' &&
    cartQuantity >= availability.available
  const canPurchase = Boolean(selectedItemId && priceInfo && hasAvailabilityInfo)
  const canSelectPrintQuantity = isPrint && !isSoldOut && !limitReachedInCart
  const canIncreaseSelectedQuantity = openEdition ||
    (limitedEdition && (maxSelectableQuantity === null || selectedQuantity < maxSelectableQuantity))
  const buttonLabel = !selectedItemId
    ? 'Unavailable'
    : (
        (priceLoading || (tracksInventory && availabilityLoading))
          ? PRICE_LABELS.loading
          : (isSoldOut
              ? (original ? 'Sold' : 'Sold out')
              : (original && isAlreadyInCart
                  ? 'In Basket'
                  : (limitReachedInCart
                      ? 'Limit reached'
                      : (inventoryInfoMissing
                          ? 'Unavailable'
                          : (priceInfo ? 'Add to Basket' : PRICE_LABELS.unavailable)))))
      )

  useEffect(() => {
    // Reset active image when the item changes.
    if (item) setActiveImage(galleryImages[0] || '')
  }, [item, galleryImages])

  useEffect(() => {
    if (isFullscreenOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isFullscreenOpen])

  useEffect(() => {
    setSelectedVariantId(initialVariantId)
  }, [initialVariantId])

  useEffect(() => {
    setSelectedQuantity(1)
  }, [selectedItemId])

  useEffect(() => {
    setSelectedQuantity((quantity) => {
      const normalizedQuantity = Math.max(1, quantity)
      if (!limitedEdition || maxSelectableQuantity === null) return normalizedQuantity
      return Math.min(normalizedQuantity, Math.max(1, maxSelectableQuantity))
    })
  }, [limitedEdition, maxSelectableQuantity])

  if (!item) {
    return (
      <div className="portfolio-item">
        <p>
          Item not found. <Link to={backPath}>Back to portfolio</Link>
        </p>
      </div>
    )
  }

  const collectionLabel = original
    ? 'Originals'
    : limitedEdition
      ? 'Limited Edition Prints'
      : 'Open Edition Prints'
  const productKind = original
    ? 'original watercolor painting'
    : limitedEdition
      ? 'limited edition watercolor print'
      : 'open edition watercolor print'
  const canonicalPath = getArtworkPath(item.slug || item.id, item.category)
  const pageTitle = `${item.title} | ${productKind} by Wendy Zhang | ${SITE_NAME}`
  const pageDescription = buildProductPageDescription(item)
  const imageAlt = buildImageAlt(item)
  const galleryAlt = (index) => [item.title, `alternate view ${index + 1}`, item.location, item.medium].filter(Boolean).join(' — ')
  const jsonLd = [
    buildProductJsonLd({
      item,
      url: canonicalPath,
      images: galleryImages,
      description: pageDescription,
      priceInfo,
      availability,
      selectedVariant,
    }),
    buildBreadcrumbJsonLd([
      { name: 'Home', url: '/' },
      { name: 'Artwork', url: '/artwork' },
      { name: collectionLabel, url: `/artwork/${item.category}` },
      { name: item.title, url: canonicalPath },
    ]),
  ]

  return (
    <>
      <Seo
        title={pageTitle}
        description={pageDescription}
        url={canonicalPath}
        image={galleryImages[0] || item.image}
        type="product"
        jsonLd={jsonLd}
      />
      <section className="work-item-page">
        <div className="work-item-grid">
        <div className="work-item-visual">
          <div
            className="work-item-image"
            role="button"
            tabIndex={0}
            onClick={() => {
              setIsFullscreenOpen(true)
              setIsZoomed(false)
              setZoomOrigin('50% 50%')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setIsFullscreenOpen(true)
                setIsZoomed(false)
                setZoomOrigin('50% 50%')
              }
            }}
            aria-label="Open image in full screen"
          >
            <img loading="lazy" src={activeImage || item.image} alt={imageAlt} />
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
                  <img loading="lazy" src={src} alt={galleryAlt(index)} />
                </button>
              ))}
            </div>
          )}
        </div>
        <aside className="work-item-meta">
          <h1>{item.title}</h1>
          <p className="price">
            <i aria-hidden="true" />
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
                    <small className="size-option-price">
                      <PriceText
                        itemId={variant.id}
                        price={priceById[variant.id]}
                        loading={priceLoading}
                      />
                    </small>
                    {variantSoldOut && <small>Sold out</small>}
                  </button>
                )
              })}
            </div>
          )}
          {!isPrint && (
            <p className="meta-line meta-line-framed">
              <span className="meta-main">
                <i className="fas fa-ruler-combined entry-icon" aria-hidden="true" />
                Size: {selectedVariant?.size || item.size}
                <span className="info-tip" aria-label="Framing information" tabIndex={0}>
                  <i className="fas fa-info-circle" aria-hidden="true" />
                  <span className="info-bubble">
                    Framed: This artwork is framed by hand. Framed artwork size: {selectedVariant?.framedSize || item.framedSize}
                  </span>
                </span>
              </span>
            </p>
          )}
          {item.location && (
            <p className="meta-line meta-line-location">
              <i className="fas fa-map-marker-alt entry-icon" aria-hidden="true" />
              Location: {item.location}
            </p>
          )}
          <p className="meta-line">
            <i className="fas fa-calendar-alt entry-icon" aria-hidden="true" />
            Date: {item.date}
          </p>
          {item.medium && (
            <p className="meta-line">
              <i className="fas fa-palette entry-icon" aria-hidden="true" />
              Medium: {item.medium}
            </p>
          )}
          <p className="meta-line">
            <i className="fas fa-certificate entry-icon" aria-hidden="true" />
            Signed authenticity certificate
          </p>
          {item.note && (
            <p className="meta-line">
              <i className="fas fa-sticky-note entry-icon" aria-hidden="true" />
              <span>{item.note}</span>
            </p>
          )}
          <p className="description">{item.description}</p>
          <div className="work-item-actions">
            {canSelectPrintQuantity && (
              <div className="cart-qty work-item-qty" aria-label="Select quantity">
                <button
                  type="button"
                  onClick={() => setSelectedQuantity((quantity) => Math.max(1, quantity - 1))}
                  disabled={selectedQuantity <= 1}
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span>{selectedQuantity}</span>
                <button
                  type="button"
                  onClick={() => setSelectedQuantity((quantity) => quantity + 1)}
                  disabled={!canIncreaseSelectedQuantity}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            )}
            <button
              type="button"
              className="basket-button"
              disabled={!canPurchase || isSoldOut || limitReachedInCart || (original && isAlreadyInCart)}
              onClick={() => {
                if (isSoldOut || limitReachedInCart || (original && isAlreadyInCart)) return
                addItem({
                  id: selectedItemId,
                  title: item.title,
                  image: item.image,
                  category: item.category,
                  size: selectedVariant?.size || item.size,
                  framedSize: selectedVariant?.framedSize || item.framedSize,
                  quantity: isPrint ? selectedQuantity : 1,
                  maxQuantity: limitedEdition ? availability?.available : undefined,
                })
              }}
            >
              {buttonLabel}
            </button>
          </div>
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
              <p className="meta-line">Carefully packaged by Wendy and shipped from Canada with tracked delivery.</p>
              <p className="meta-line">Flat-rate shipping: 
                <ul>
                  <li>Canada — CAD $20</li>
                  <li>United States — USD $25</li>
                </ul>
              </p>
              <p className="meta-line">Complimentary shipping is available on qualifying orders: 
                <ul>
                  <li>Canada — orders over CAD $300</li>
                  <li>United States — orders over USD $250</li>
                </ul>
              </p>
              <p className="meta-line"><Link to="/shipping">Learn more</Link></p>
            </div>
          </div>
        </aside>
      </div>
      {isFullscreenOpen && (
        <div
          className="fullscreen-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Full screen artwork preview"
          onClick={() => {
            setIsFullscreenOpen(false)
            setIsZoomed(false)
          }}
        >
          <div className="fullscreen-image-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={activeImage || item.image}
              alt={imageAlt}
              className={isZoomed ? 'is-zoomed' : ''}
              style={{ transformOrigin: zoomOrigin }}
              onClick={(e) => {
                e.stopPropagation()
                if (isZoomed) {
                  setIsZoomed(false)
                  return
                }
                const rect = e.currentTarget.getBoundingClientRect()
                const x = ((e.clientX - rect.left) / rect.width) * 100
                const y = ((e.clientY - rect.top) / rect.height) * 100
                setZoomOrigin(`${x}% ${y}%`)
                setIsZoomed(true)
              }}
            />
          </div>
        </div>
      )}
      </section>
    </>
  )

}
