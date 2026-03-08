import React from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import PortfolioList from './pages/PortfolioList'
import WorkPortfolioItem from './pages/WorkPortfolioItem'
import Cart from './pages/Cart'
import CheckoutSuccess from './pages/CheckoutSuccess'
import CheckoutCancel from './pages/CheckoutCancel'
import Home from './pages/Home'
import About from './pages/About'
import Contact from './pages/Contact'
import Layout from './components/Layout'

export default function App(){
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="cart" element={<Cart />} />
          <Route path="success" element={<CheckoutSuccess />} />
          <Route path="cancel" element={<CheckoutCancel />} />
          <Route path="artwork" element={<PortfolioList />} />
          <Route path="artwork/originals" element={<PortfolioList category="originals" heading="Originals" />} />
          <Route
            path="artwork/limited-edition-prints"
            element={<PortfolioList category="limited-edition-prints" heading="Limited Edition Prints" />}
          />
          <Route
            path="artwork/open-edition-prints"
            element={<PortfolioList category="open-edition-prints" heading="Open Edition Prints" />}
          />
          <Route path="artwork/work/:workId" element={<WorkPortfolioItem />} />
          <Route path="artwork/originals/:workId" element={<WorkPortfolioItem category="originals" />} />
          <Route
            path="artwork/limited-edition-prints/:workId"
            element={<WorkPortfolioItem category="limited-edition-prints" />}
          />
          <Route
            path="artwork/open-edition-prints/:workId"
            element={<WorkPortfolioItem category="open-edition-prints" />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
