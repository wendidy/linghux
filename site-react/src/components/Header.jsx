import React from 'react'
import { NavLink } from 'react-router-dom'

export default function Header(){
  const linkClass = ({isActive}) => isActive ? 'active' : ''

  return (
    <header id="header">
      <h1><a href="/">linghux</a></h1>
      <nav>
        <ul>
          <li><NavLink to="/" className={linkClass}>Home</NavLink></li>
          <li><NavLink to="/portfolio" className={linkClass}>Portfolio</NavLink></li>
          <li><NavLink to="/about" className={linkClass}>About Me</NavLink></li>
          <li><NavLink to="/contact" className={linkClass}>Contact</NavLink></li>
        </ul>
      </nav>
    </header>
  )
}
