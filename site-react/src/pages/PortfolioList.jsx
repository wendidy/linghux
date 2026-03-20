import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { items } from '../data/portfolio'
import { useStripePrices } from '../hooks/useStripePrices'
import { useAvailability } from '../hooks/useAvailability'
import PriceText from '../components/PriceText'

export default function PortfolioList({ category, heading = 'Artworks' }){
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

  const makeItemPath = (itemId) => {
    return category ? `/artwork/${category}/${itemId}` : `/artwork/work/${itemId}`
  }

  const badgeLabelFor = (item) => {
    if (item.category === 'originals') return 'Original Watercolor'
    if (item.category === 'limited-edition-prints') return 'Limited Edition'
    return 'Open Edition Print'
  }

  const editionLabelFor = (item) => {
    if (item.category !== 'limited-edition-prints') return ''
    const cap = availabilityById[item.id]?.cap
    return typeof cap === 'number' ? `Edition Size: ${cap}` : 'Limited edition'
  }

  return (
    <section id="work" className="main style3">
      <div className="gallery-div">
        <header>
          <h2 className="page-title">{heading}</h2>
        </header>
        <div className="gallery product-grid">
          {filteredItems.map(item => (
            <article className="gallery-item product-card" key={item.id}>
              <Link to={makeItemPath(item.id)} className="product-image-link">
                <img className="zoomable product-image" src={item.image} alt={item.title} />
              </Link>
              <div className="gallery-meta">
                <div className="product-badge">
                  <span>{badgeLabelFor(item)}</span>
                  {availabilityById[item.id]?.soldOut && (
                    <span className="sold-out-badge">Sold out</span>
                  )}
                </div>
                <h3 className="title product-title">{item.title}</h3>
                {item.category === 'limited-edition-prints' && (
                  <div className="edition-info">
                    <span>{editionLabelFor(item)}</span>
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
          ))}
        </div>
      </div>
    </section>
  )
}
