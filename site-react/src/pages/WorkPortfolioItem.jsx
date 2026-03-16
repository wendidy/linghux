import React, { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { items } from '../data/portfolio'
import { useCart } from '../context/CartContext'
import { useStripePrices } from '../hooks/useStripePrices'
import PriceText from '../components/PriceText'
import { PRICE_LABELS } from '../utils/stripePrices'
import {
  fallbackLookupKeyForItem,
  lookupKeysForItem,
  primaryLookupKeyForItem,
  resolvePriceForItem,
} from '../data/stripePriceKeys'

export default function WorkPortfolioItem({ category }) {
  const { workId } = useParams()
  const id = workId?.startsWith('work-') ? workId : `work-${workId}`
  const item = items.find((i) => i.id === id && (!category || i.category === category))
  const backPath = category ? `/artwork/${category}` : '/artwork'
  const galleryImages = useMemo(() => {
    if (!item) return []
    if (Array.isArray(item.images) && item.images.length > 0) return item.images
    return [item.image]
  }, [item])
  const [activeImage, setActiveImage] = useState('')
  const { addItem } = useCart()
  const lookupKeys = useMemo(() => lookupKeysForItem(item), [item])
  const { priceByKey, loading: priceLoading, error: priceError } = useStripePrices(lookupKeys)
  const priceInfo = resolvePriceForItem(item, priceByKey)

  const canPurchase = Boolean(lookupKeys.length > 0 && priceInfo)
  const buttonLabel = lookupKeys.length === 0
    ? 'Unavailable'
    : (priceInfo ? 'Add to Basket' : (priceLoading ? PRICE_LABELS.loading : PRICE_LABELS.unavailable))

  useEffect(() => {
    // Reset active image when the item changes.
    if (item) setActiveImage(galleryImages[0] || '')
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
        </div>
        <aside className="work-item-meta">
          <h1>{item.title}</h1>
          <p className="price">
            <i className="fas fa-tag entry-icon" aria-hidden="true" />
            <PriceText
              lookupKey={primaryLookupKeyForItem(item) || fallbackLookupKeyForItem(item)}
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
            disabled={!canPurchase}
            onClick={() =>
              addItem({
                id: item.id,
                title: item.title,
                image: item.image,
                category: item.category,
                size: item.size,
                priceLookupKey: primaryLookupKeyForItem(item),
                fallbackPriceLookupKey: fallbackLookupKeyForItem(item),
              })
            }
          >
            {buttonLabel}
          </button>
          {priceError && <p className="meta-line">{priceError}</p>}
          <p className="shipping-line">
            <i className="fas fa-truck entry-icon" aria-hidden="true" />
            Free US and Canada shipping
          </p>
        </aside>
      </div>
    </section>
  )
}
