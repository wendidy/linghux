import React from 'react'
import { NavLink, Link } from 'react-router-dom'

export default function Header(){
  const linkClass = ({isActive}) => isActive ? 'active' : ''

  return (
    <header id="header">
      <h1><a href="/">linghux</a></h1>
      <nav>
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
              <li><Link to="/artwork/originals">Originals</Link></li>
              <li><Link to="/artwork/limited-edition-prints">Limited Edition Prints</Link></li>
              <li><Link to="/artwork/open-edition-prints">Open Edition Prints</Link></li>
            </ul>
          </li>
          <li><NavLink to="/about" className={linkClass}>About Me</NavLink></li>
          <li><NavLink to="/contact" className={linkClass}>Contact</NavLink></li>
        </ul>
      </nav>
    </header>
  )
}
