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

  return (
    <section id="work" className="main style3">
      <div className="gallery-div">
        <header>
          <h2>{heading}</h2>
        </header>
        <div className="gallery">
          {filteredItems.map(item => (
            <div className="gallery-item" key={item.id}>
              <Link to={makeItemPath(item.id)}>
                <img className="zoomable" src={item.image} alt={item.title} />
              </Link>
              <div className="gallery-meta">
                <h3 className="title">{item.title}</h3>
                <div className="meta-row">
                  <PriceText
                    className="price"
                    itemId={item.id}
                    price={priceById[item.id]}
                    loading={pricesLoading}
                  />{' '}
                  {availabilityById[item.id]?.soldOut && (
                    <span className="sold-out-badge">Sold out</span>
                  )}{' '}
                  — <span className="size">{item.size}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
