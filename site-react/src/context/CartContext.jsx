import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useStripePrices } from '../hooks/useStripePrices'
import { items as catalogItems } from '../data/portfolio'

const STORAGE_KEY = 'linghux_cart_v1'
const CartContext = createContext(null)
const catalogItemById = new Map(catalogItems.map((item) => [item.id, item]))

function normalizeCartItem(item) {
  if (!item || typeof item !== 'object') return item
  const catalogItem = catalogItemById.get(item.id)
  const category = item.category || catalogItem?.category
  const size = item.size || catalogItem?.size
  const quantity = category === 'originals'
    ? 1
    : (Number.isInteger(item.quantity) && item.quantity > 0 ? item.quantity : 1)
  return {
    ...item,
    category,
    size,
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

  const itemIds = useMemo(() => {
    const ids = items.map((item) => item.id).filter(Boolean)
    return [...new Set(ids)]
  }, [items])

  const {
    priceById,
    loading: pricesLoading,
    error: pricesError,
  } = useStripePrices(itemIds)

  const addItem = (item) => {
    const maxQuantity = item?.category === 'limited-edition-prints' && Number.isInteger(item.maxQuantity)
      ? item.maxQuantity
      : null
    const existing = items.find((existingItem) => existingItem.id === item?.id)

    if (item?.category === 'originals') {
      if (existing) {
        return { added: false, reason: 'already_in_cart' }
      }
    }

    if (maxQuantity !== null) {
      if (maxQuantity <= 0) {
        return { added: false, reason: 'sold_out' }
      }
      if (existing && existing.quantity >= maxQuantity) {
        return { added: false, reason: 'limit_reached' }
      }
    }

    setItems((prev) => {
      const found = prev.find((p) => p.id === item.id)
      if (found) {
        if (item?.category === 'originals') {
          return prev
        }
        return prev.map((p) =>
          p.id === item.id
            ? {
                ...p,
                quantity: maxQuantity === null
                  ? p.quantity + 1
                  : Math.min(p.quantity + 1, maxQuantity),
              }
            : p
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
      const unitAmount = priceById[item.id]?.unit_amount
      if (typeof unitAmount !== 'number') return sum
      return sum + unitAmount * item.quantity
    }, 0)
  }, [items, priceById])

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        subtotal,
        priceById,
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
