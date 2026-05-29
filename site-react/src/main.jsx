import { createRoot } from 'react-dom/client'
import App from './App'
import { CartProvider } from './context/CartContext'
import { CurrencyProvider } from './context/CurrencyContext'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <CurrencyProvider>
    <CartProvider>
      <App />
    </CartProvider>
  </CurrencyProvider>
)
