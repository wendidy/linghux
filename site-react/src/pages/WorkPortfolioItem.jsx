import React, { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { items } from '../data/portfolio'
import { useCart } from '../context/CartContext'

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

  useEffect(() => {
    setActiveImage(galleryImages[0] || '')
  }, [galleryImages])

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
            {item.price}
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
            onClick={() =>
              addItem({
                id: item.id,
                title: item.title,
                image: item.image,
                unitAmount: Math.round(Number(String(item.price).replace(/[^0-9.]/g, '')) * 100),
                priceId: item.stripePriceId,
              })
            }
          >
            Add to Basket
          </button>
          <p className="shipping-line">
            <i className="fas fa-truck entry-icon" aria-hidden="true" />
            Free US and Canada shipping
          </p>
        </aside>
      </div>
    </section>
  )
}
