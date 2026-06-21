import { Link } from 'react-router-dom'
import { ARTWORK_CATEGORIES } from '../utils/artwork'

export default function Footer(){
  return (
    <footer className="footer">
      <div className="footer-content">
        <nav className="footer-nav" aria-label="Footer navigation">
          <Link to={`/artwork/${ARTWORK_CATEGORIES.originals}`}>Originals</Link>
          <Link to={`/artwork/${ARTWORK_CATEGORIES.limitedEditionPrints}`}>Limited Edition Prints</Link>
          <Link to={`/artwork/${ARTWORK_CATEGORIES.openEditionPrints}`}>Open Edition Prints</Link>
          <Link to="/about">About Wendy Zhang</Link>
          <Link to="/shipping">Shipping</Link>
          <Link to="/contact">Contact</Link>
        </nav>
        <p>&copy; 2026 linghux - Wendy Zhang</p>
      </div>
    </footer>
  )
}
