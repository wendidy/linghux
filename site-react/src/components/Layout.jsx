import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'

export default function Layout(){
  return (
    <div>
      <Header />
      <main style={{minHeight: '60vh'}}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
