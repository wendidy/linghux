import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useStripePrices } from '../hooks/useStripePrices'
import {
  fallbackLookupKeyFromCategorySize,
  lookupKeyFromItemId,
  resolvePriceByLookupKeys,
} from '../data/stripePriceKeys'

const STORAGE_KEY = 'linghux_cart_v1'
const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        const normalized = parsed.map((item) => {
          if (!item || typeof item !== 'object') return item
          const priceLookupKey = item.priceLookupKey || lookupKeyFromItemId(item.id)
          const fallbackPriceLookupKey =
            item.fallbackPriceLookupKey ||
            fallbackLookupKeyFromCategorySize(item.category, item.size)
          return {
            ...item,
            priceLookupKey,
            fallbackPriceLookupKey,
          }
        })
        setItems(normalized)
      }
    } catch {
      setItems([])
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const lookupKeys = useMemo(() => {
    const keys = items.flatMap((item) => [
      item.priceLookupKey,
      item.fallbackPriceLookupKey,
    ]).filter(Boolean)
    return [...new Set(keys)]
  }, [items])

  const {
    priceByKey,
    loading: pricesLoading,
    error: pricesError,
  } = useStripePrices(lookupKeys)

  const addItem = (item) => {
    setItems((prev) => {
      const found = prev.find((p) => p.id === item.id)
      if (found) {
        return prev.map((p) =>
          p.id === item.id ? { ...p, quantity: p.quantity + 1 } : p
        )
      }
      const priceLookupKey = item.priceLookupKey || lookupKeyFromItemId(item.id)
      const fallbackPriceLookupKey =
        item.fallbackPriceLookupKey ||
        fallbackLookupKeyFromCategorySize(item.category, item.size)
      return [...prev, { ...item, priceLookupKey, fallbackPriceLookupKey, quantity: 1 }]
    })
  }

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.id !== id))
      return
    }
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    )
  }

  const removeItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const clearCart = () => setItems([])

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const price = resolvePriceByLookupKeys(
        item.priceLookupKey,
        item.fallbackPriceLookupKey,
        priceByKey
      )
      const unitAmount = price?.unit_amount
      if (typeof unitAmount !== 'number') return sum
      return sum + unitAmount * item.quantity
    }, 0)
  }, [items, priceByKey])

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        subtotal,
        priceByKey,
        pricesLoading,
        pricesError,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used inside CartProvider')
  return context
}
