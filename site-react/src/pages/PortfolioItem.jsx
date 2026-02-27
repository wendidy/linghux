import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { items } from '../data/portfolio'

export default function PortfolioItem(){
  const { id } = useParams()
  const item = items.find(i => i.id === id)

  if (!item) return (
    <div className="portfolio-item">
      <p>Item not found. <Link to="/portfolio">Back to portfolio</Link></p>
    </div>
  )

  return (
    <div className="portfolio-item">
      <div className="item-grid">
        <div className="item-image">
          <img src={item.image} alt={item.title} />
        </div>
        <aside className="item-details">
          <h2>{item.title}</h2>
          <p className="price">{item.price}</p>
          <p className="meta"><strong>Size:</strong> {item.size}</p>
          <p className="meta"><strong>Date:</strong> {item.date}</p>
          <p className="description">Placeholder description for {item.title}.</p>
          <button className="button primary">Add to Basket</button>
        </aside>
      </div>
    </div>
  )
}
