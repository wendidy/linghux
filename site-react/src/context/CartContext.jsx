import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useStripePrices } from '../hooks/useStripePrices'
import {
  fallbackLookupKeyForItem,
  primaryLookupKeyForItem,
  resolvePriceByLookupKeys,
} from '../data/stripePriceKeys'
import { items as catalogItems } from '../data/portfolio'

const STORAGE_KEY = 'linghux_cart_v1'
const CartContext = createContext(null)

function normalizeCartItem(item) {
  if (!item || typeof item !== 'object') return item
  const catalogItem = catalogItems.find((catalogEntry) => catalogEntry.id === item.id)
  const category = item.category || catalogItem?.category
  const size = item.size || catalogItem?.size
  const normalizedItem = {
    ...item,
    category,
    size,
  }
  const priceLookupKey = item.priceLookupKey || primaryLookupKeyForItem(normalizedItem)
  const fallbackPriceLookupKey =
    item.fallbackPriceLookupKey || fallbackLookupKeyForItem(normalizedItem)
  const quantity = category === 'originals'
    ? 1
    : (Number.isInteger(item.quantity) && item.quantity > 0 ? item.quantity : 1)
  return {
    ...normalizedItem,
    priceLookupKey,
    fallbackPriceLookupKey,
    quantity,
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        const normalized = parsed.map((item) => normalizeCartItem(item))
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
    if (item?.category === 'originals') {
      const exists = items.some((existing) => existing.id === item.id)
      if (exists) {
        return { added: false, reason: 'already_in_cart' }
      }
    }
    setItems((prev) => {
      const found = prev.find((p) => p.id === item.id)
      if (found) {
        if (item?.category === 'originals') {
          return prev
        }
        return prev.map((p) =>
          p.id === item.id ? { ...p, quantity: p.quantity + 1 } : p
        )
      }
      return [...prev, normalizeCartItem(item)]
    })
    return { added: true }
  }

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.id !== id))
      return
    }
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: item.category === 'originals' ? 1 : quantity }
          : item
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
