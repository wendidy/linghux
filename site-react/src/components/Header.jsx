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
            <NavLink to="/portfolio" className={linkClass}>Artworks</NavLink>
            <ul className="artworks-menu">
              <li><Link to="/portfolio?category=originals">Originals</Link></li>
              <li><Link to="/portfolio?category=limited-edition-prints">Limited Edition Prints</Link></li>
              <li><Link to="/portfolio?category=open-edition-prints">Open Edition Prints</Link></li>
            </ul>
          </li>
          <li><NavLink to="/about" className={linkClass}>About Me</NavLink></li>
          <li><NavLink to="/contact" className={linkClass}>Contact</NavLink></li>
        </ul>
      </nav>
    </header>
  )
}
