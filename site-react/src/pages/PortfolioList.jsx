import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { items } from '../data/portfolio'
import { useStripePrices } from '../hooks/useStripePrices'
import { useAvailability } from '../hooks/useAvailability'
import PriceText from '../components/PriceText'
import { ARTWORK_CATEGORIES, getArtworkBadgeLabel, getArtworkPath } from '../utils/artwork'

export default function PortfolioList({ category, heading = 'Artworks' }){
  const navigate = useNavigate()
  const [hoveredItemId, setHoveredItemId] = useState('')
  const isOriginalsPage = category === ARTWORK_CATEGORIES.originals
  const isLimitedEditionPage = category === ARTWORK_CATEGORIES.limitedEditionPrints
  const filteredItems = useMemo(
    () => (category ? items.filter((item) => item.category === category) : items),
    [category]
  )
  const itemIds = useMemo(
    () => filteredItems
      .flatMap((item) => (
        Array.isArray(item.variants) && item.variants.length > 0
          ? item.variants.map((variant) => variant.id)
          : [item.id]
      ))
      .filter(Boolean),
    [filteredItems]
  )
  const { priceById, loading: pricesLoading } = useStripePrices(itemIds)
  const { availabilityById } = useAvailability(itemIds)

  function handleCardKeyDown(event, path) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      navigate(path)
    }
  }

  return (
    <section id="work" className="main style3">
      <div className="gallery-div">
        <header>
          <h2 className="page-title">{heading}</h2>
          {isOriginalsPage && (
            <p className="page-intro">
              Painted in the field or by studio light, these are originals in the truest sense — one moment, one hand, one painting. Each piece is tagged so you know exactly where it began.
            </p>
          )}
          {isLimitedEditionPage && (
            <p className="page-intro">
              A limited edition print, produced on archival cotton paper and signed by hand.
              Once the edition is complete, it will never be released again.
            </p>
          )}
          {category === ARTWORK_CATEGORIES.openEditionPrints && (
            <p className="page-intro">
              The painting, faithfully reproduced and always available. Open edition prints for those who found a piece they couldn't leave behind.
            </p>
          )}
        </header>
        <div className="gallery product-grid">
          {filteredItems.map(item => {
            const path = getArtworkPath(item.slug || item.id, category)
            const badgeLabel = isOriginalsPage && item.type
              ? `${item.type} Original Watercolor`
              : getArtworkBadgeLabel(item)
            const galleryImages = Array.isArray(item.images)
              ? item.images.filter(Boolean)
              : (item.images ? [item.images] : [])
            const primaryImage = galleryImages[0] || item.image
            const hoverImage = galleryImages[1] || ''
            const isHovered = hoveredItemId === item.id && Boolean(hoverImage)
            const displayItemId = item.defaultVariantId || item.id
            const displaySize = Array.isArray(item.size) ? item.size.join(', ') : item.size
            const variants = Array.isArray(item.variants) ? item.variants : []
            const isSoldOut = variants.length > 0
              ? variants.every((variant) => availabilityById[variant.id]?.soldOut)
              : availabilityById[item.id]?.soldOut

            return (
              <article
                className="gallery-item product-card"
                key={`${item.category}:${item.id}`}
                role="link"
                tabIndex={0}
                onClick={() => navigate(path)}
                onKeyDown={(event) => handleCardKeyDown(event, path)}
                aria-label={`View ${item.title}`}
              >
                <div
                  className={`product-image-link${isHovered ? ' is-hovered' : ''}`}
                  onMouseEnter={() => hoverImage && setHoveredItemId(item.id)}
                  onMouseLeave={() => setHoveredItemId('')}
                >
                  <img
                    className="zoomable product-image product-image-primary"
                    src={primaryImage}
                    alt={item.title}
                  />
                  {hoverImage && (
                    <img
                      className="zoomable product-image product-image-hover"
                      src={hoverImage}
                      alt=""
                      aria-hidden="true"
                    />
                  )}
                </div>
                <div className="gallery-meta">
                  <div className="product-badge">
                    <span>{badgeLabel}</span>
                    {isSoldOut && (
                      <span className="sold-out-badge">{isOriginalsPage ? 'Sold' : 'Sold out'}</span>
                    )}
                  </div>
                  <h3 className="title">{item.title}</h3>
                  {item.location && (
                    <p className="card-location">
                      <i className="fas fa-map-marker-alt" aria-hidden="true" />
                      <span>{item.location}</span>
                    </p>
                  )}
                  <div className="meta-row">
                    <PriceText
                      className="price"
                      itemId={displayItemId}
                      price={priceById[displayItemId]}
                      loading={pricesLoading}
                    />
                    {displaySize && <span className="size">{displaySize}</span>}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
