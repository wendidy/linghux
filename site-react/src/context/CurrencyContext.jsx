import { createContext, useContext, useState } from 'react'

const CurrencyContext = createContext(null)

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState(() => {
    const saved = localStorage.getItem('linghux_currency')
    return saved === 'CAD' ? 'CAD' : 'USD'
  })

  const handleCurrencyChange = (newCurrency) => {
    if (newCurrency === 'USD' || newCurrency === 'CAD') {
      setCurrency(newCurrency)
      localStorage.setItem('linghux_currency', newCurrency)
    }
  }

  const value = {
    currency,
    setCurrency: handleCurrencyChange,
  }

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider')
  }
  return context
}
