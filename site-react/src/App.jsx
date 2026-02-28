import React from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import PortfolioList from './pages/PortfolioList'
import PortfolioItem from './pages/PortfolioItem'
import WorkPortfolioItem from './pages/WorkPortfolioItem'
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
          <Route path="portfolio" element={<PortfolioList />} />
          <Route path="portfolio/work/:workId" element={<WorkPortfolioItem />} />
          <Route path="portfolio/:id" element={<PortfolioItem />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
