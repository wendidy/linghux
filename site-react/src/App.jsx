import { BrowserRouter, Routes, Route } from 'react-router-dom'
import PortfolioList from './pages/PortfolioList'
import WorkPortfolioItem from './pages/WorkPortfolioItem'
import Cart from './pages/Cart'
import CheckoutSuccess from './pages/CheckoutSuccess'
import CheckoutCancel from './pages/CheckoutCancel'
import Home from './pages/Home'
import About from './pages/About'
import Contact from './pages/Contact'
import Shipping from './pages/Shipping'
import Layout from './components/Layout'
import { ARTWORK_NAV_ITEMS } from './utils/artwork'

const artworkRoutes = [
  { category: null, heading: 'Artworks' },
  ...ARTWORK_NAV_ITEMS.map((item) => ({ category: item.category, heading: item.label })),
]

export default function App(){
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="shipping" element={<Shipping />} />
          <Route path="cart" element={<Cart />} />
          <Route path="success" element={<CheckoutSuccess />} />
          <Route path="cancel" element={<CheckoutCancel />} />
          {artworkRoutes.map((route) => (
            <Route
              key={route.category || 'all'}
              path={route.category ? `artwork/${route.category}` : 'artwork'}
              element={
                <PortfolioList
                  key={route.category || 'all'}
                  category={route.category || undefined}
                  heading={route.heading}
                />
              }
            />
          ))}
          <Route path="artwork/work/:workId" element={<WorkPortfolioItem />} />
          {ARTWORK_NAV_ITEMS.map((item) => (
            <Route
              key={`${item.category}-detail`}
              path={`artwork/${item.category}/:workId`}
              element={<WorkPortfolioItem category={item.category} />}
            />
          ))}
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
