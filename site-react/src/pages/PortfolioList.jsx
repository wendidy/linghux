import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { items } from '../data/portfolio'
import { useStripePrices } from '../hooks/useStripePrices'
import { useAvailability } from '../hooks/useAvailability'
import PriceText from '../components/PriceText'
import { getArtworkBadgeLabel, getArtworkPath, getEditionLabel } from '../utils/artwork'

export default function PortfolioList({ category, heading = 'Artworks' }){
  const navigate = useNavigate()
  const filteredItems = useMemo(
    () => (category ? items.filter((item) => item.category === category) : items),
    [category]
  )
  const itemIds = useMemo(
    () => filteredItems.map((item) => item.id).filter(Boolean),
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
        </header>
        <div className="gallery product-grid">
          {filteredItems.map(item => {
            const path = getArtworkPath(item.id, category)
            const editionLabel = getEditionLabel(item, availabilityById[item.id])

            return (
              <article
                className="gallery-item product-card"
                key={item.id}
                role="link"
                tabIndex={0}
                onClick={() => navigate(path)}
                onKeyDown={(event) => handleCardKeyDown(event, path)}
                aria-label={`View ${item.title}`}
              >
                <div className="product-image-link">
                  <img className="zoomable product-image" src={item.image} alt={item.title} />
                </div>
                <div className="gallery-meta">
                  <div className="product-badge">
                    <span>{getArtworkBadgeLabel(item)}</span>
                    {availabilityById[item.id]?.soldOut && (
                      <span className="sold-out-badge">Sold out</span>
                    )}
                  </div>
                  <h3 className="title">{item.title}</h3>
                  {editionLabel && (
                    <div className="edition-info">
                      <span>{editionLabel}</span>
                    </div>
                  )}
                  <div className="meta-row">
                    <PriceText
                      className="price"
                      itemId={item.id}
                      price={priceById[item.id]}
                      loading={pricesLoading}
                    />
                    <span className="size">{item.size}</span>
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
