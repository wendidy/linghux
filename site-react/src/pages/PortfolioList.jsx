import React from 'react'
import { Link } from 'react-router-dom'
import { items } from '../data/portfolio'

export default function PortfolioList(){
  return (
    <section id="work" className="main style3">
      <div className="gallery-div">
        <header>
          <h2>Portfolio</h2>
        </header>
        <div className="gallery">
          {items.map(item => (
            <div className="gallery-item" key={item.id}>
              <Link to={`/portfolio/work/${item.id.replace('work-', '')}`}>
                <img className="zoomable" src={item.image} alt={item.title} />
              </Link>
              <div className="gallery-meta">
                <h3 className="title">{item.title}</h3>
                <div className="meta-row"><span className="price">{item.price}</span> — <span className="size">{item.size}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
