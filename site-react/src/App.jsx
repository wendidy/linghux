import React from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import PortfolioList from './pages/PortfolioList'
import PortfolioItem from './pages/PortfolioItem'
import Layout from './components/Layout'

export default function App(){
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/portfolio" replace />} />
          <Route path="portfolio" element={<PortfolioList />} />
          <Route path="portfolio/:id" element={<PortfolioItem />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
