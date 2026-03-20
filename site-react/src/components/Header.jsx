import React, { useMemo, useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export default function Header(){
  const linkClass = ({isActive}) => isActive ? 'active' : ''
  const closeArtworkDropdown = (e) => e.currentTarget.blur()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobileArtworkOpen, setIsMobileArtworkOpen] = useState(false)
  const { items } = useCart()
  const cartCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  )
  const cartLabel = (
    <span className="cart-link-label" aria-label={`Basket${cartCount > 0 ? `, ${cartCount} items` : ''}`}>
      <i className="fas fa-shopping-basket" aria-hidden="true" />
      {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
    </span>
  )

  return (
    <div className="site-header-stack">
      <div className="site-announcement">Free shipping to Canada and USA</div>
      <header id="header">
        <h1><a href="/">linghux</a></h1>
        <nav className="desktop-nav">
          <ul>
            <li><NavLink to="/" className={linkClass}>Home</NavLink></li>
            <li className="artworks-dropdown">
              <a
                href="/artwork"
                className="artworks-trigger"
                onClick={(e) => {
                  e.preventDefault()
                  e.currentTarget.blur()
                }}
              >
                Artwork <i className="fas fa-chevron-down artworks-arrow" aria-hidden="true" />
              </a>
              <ul className="artworks-menu">
                <li><Link to="/artwork/originals" onClick={closeArtworkDropdown}>Originals</Link></li>
                <li><Link to="/artwork/limited-edition-prints" onClick={closeArtworkDropdown}>Limited Edition Prints</Link></li>
                <li><Link to="/artwork/open-edition-prints" onClick={closeArtworkDropdown}>Open Edition Prints</Link></li>
              </ul>
            </li>
            <li><NavLink to="/about" className={linkClass}>About Me</NavLink></li>
            <li><NavLink to="/contact" className={linkClass}>Contact</NavLink></li>
            <li><NavLink to="/cart" className={linkClass}>{cartLabel}</NavLink></li>
          </ul>
        </nav>
        <button
          type="button"
          className="mobile-menu-button"
          aria-expanded={isMobileMenuOpen}
          aria-label="Toggle menu"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
        >
          <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'}`} aria-hidden="true" />
        </button>
        <div className={`mobile-menu${isMobileMenuOpen ? ' is-open' : ''}`}>
          <ul>
            <li><NavLink to="/" className={linkClass} onClick={() => setIsMobileMenuOpen(false)}>Home</NavLink></li>
            <li className="mobile-artworks-group">
              <button
                type="button"
                className="mobile-artworks-trigger"
                onClick={() => setIsMobileArtworkOpen((prev) => !prev)}
                aria-expanded={isMobileArtworkOpen}
              >
                Artwork
                <i className={`fas fa-chevron-${isMobileArtworkOpen ? 'up' : 'down'}`} aria-hidden="true" />
              </button>
              <ul className={`mobile-artworks-submenu${isMobileArtworkOpen ? ' is-open' : ''}`}>
                <li><Link to="/artwork/originals" onClick={() => setIsMobileMenuOpen(false)}>Originals</Link></li>
                <li><Link to="/artwork/limited-edition-prints" onClick={() => setIsMobileMenuOpen(false)}>Limited Edition Prints</Link></li>
                <li><Link to="/artwork/open-edition-prints" onClick={() => setIsMobileMenuOpen(false)}>Open Edition Prints</Link></li>
              </ul>
            </li>
            <li><NavLink to="/about" className={linkClass} onClick={() => setIsMobileMenuOpen(false)}>About Me</NavLink></li>
            <li><NavLink to="/contact" className={linkClass} onClick={() => setIsMobileMenuOpen(false)}>Contact</NavLink></li>
            <li>
              <NavLink
                to="/cart"
                className={linkClass}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {cartLabel}
              </NavLink>
            </li>
          </ul>
        </div>
      </header>
    </div>
  )
}
