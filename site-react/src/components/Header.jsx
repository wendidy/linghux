import { useMemo, useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useCurrency } from '../context/CurrencyContext'
import { ARTWORK_NAV_ITEMS } from '../utils/artwork'

export default function Header(){
  const linkClass = ({isActive}) => isActive ? 'active' : ''
  const closeArtworkDropdown = (e) => e.currentTarget.blur()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobileArtworkOpen, setIsMobileArtworkOpen] = useState(false)
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false)
  const { items } = useCart()
  const { currency, setCurrency } = useCurrency()
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
      <div className="site-announcement">Complimentary shipping on qualifying orders across Canada & US - <Link to="/shipping">more info</Link></div>
      <header id="header">
        <div className="site-logo"><Link to="/">linghux</Link></div>
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
                {ARTWORK_NAV_ITEMS.map((item) => (
                  <li key={item.category}>
                    <Link to={`/artwork/${item.category}`} onClick={closeArtworkDropdown}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </li>
            <li><NavLink to="/about" className={linkClass}>About Me</NavLink></li>
            <li><NavLink to="/contact" className={linkClass}>Contact</NavLink></li>
            <li className="artworks-dropdown">
              <a
                href="#"
                className="artworks-trigger"
                onClick={(e) => {
                  e.preventDefault()
                  e.currentTarget.blur()
                  setIsCurrencyOpen((prev) => !prev)
                }}
              >
                {currency} <i className="fas fa-chevron-down artworks-arrow" aria-hidden="true" />
              </a>
              {isCurrencyOpen && (
                <ul className="artworks-menu" style={{ display: 'block' }}>
                  <li>
                    <a
                      type="button"
                      className={`currency-option${currency === 'USD' ? ' is-active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setCurrency('USD')
                        setIsCurrencyOpen(false)
                      }}
                    >
                      USD
                    </a>
                  </li>
                  <li>
                    <a
                      className={`currency-option${currency === 'CAD' ? ' is-active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setCurrency('CAD')
                        setIsCurrencyOpen(false)
                      }}
                    >
                      CAD
                    </a>
                  </li>
                </ul>
              )}
            </li>
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
                {ARTWORK_NAV_ITEMS.map((item) => (
                  <li key={item.category}>
                    <Link to={`/artwork/${item.category}`} onClick={() => setIsMobileMenuOpen(false)}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </li>
            <li><NavLink to="/about" className={linkClass} onClick={() => setIsMobileMenuOpen(false)}>About Me</NavLink></li>
            <li><NavLink to="/contact" className={linkClass} onClick={() => setIsMobileMenuOpen(false)}>Contact</NavLink></li>
            <li>
              <div className="mobile-currency-icons">
                <button
                  type="button"
                  className={`mobile-currency-button${currency === 'USD' ? ' is-active' : ''}`}
                  onClick={() => setCurrency('USD')}
                >
                  🇺🇸
                </button>
                <button
                  type="button"
                  className={`mobile-currency-button${currency === 'CAD' ? ' is-active' : ''}`}
                  onClick={() => setCurrency('CAD')}
                >
                  🇨🇦
                </button>
              </div>
            </li>
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
