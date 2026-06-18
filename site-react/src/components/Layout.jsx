import { useEffect, useLayoutEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'

const scrollTop = () => {
  if (typeof window === 'undefined') return
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual'
  }
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  document.body.scrollTop = 0
  document.documentElement.scrollTop = 0
  window.requestAnimationFrame(() => window.scrollTo(0, 0))
}

const trackPageView = (url) => {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  window.gtag('event', 'page_view', {
    page_path: url,
    page_location: window.location.href,
    page_title: document.title,
  })
}

export default function Layout(){
  const { pathname } = useLocation()

  useEffect(() => {
    scrollTop()
  }, [])

  useEffect(() => {
    trackPageView(pathname)
  }, [pathname])

  useLayoutEffect(() => {
    scrollTop()
  }, [pathname])

  return (
    <div className="app-shell">
      <Header />
      <main className="app-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
