import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, Product } from '@/types'

interface CartState {
  items: CartItem[]
  addItem: (product: Product, quantity?: number) => void
  removeItem: (commodityId: number) => void
  setQuantity: (commodityId: number, quantity: number) => void
  clear: () => void
  totalItems: () => number
  totalAmount: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity = 1) => {
        const items = [...get().items]
        const existing = items.find((i) => i.commodity_id === product.commodity_id)
        if (existing) {
          existing.quantity = Math.min(
            existing.quantity + quantity,
            product.available_quantity
          )
        } else {
          items.push({
            commodity_id: product.commodity_id,
            name: product.name,
            unit: product.unit,
            price: product.price,
            quantity: Math.min(quantity, product.available_quantity),
            available_quantity: product.available_quantity,
          })
        }
        set({ items })
      },

      removeItem: (commodityId) =>
        set({ items: get().items.filter((i) => i.commodity_id !== commodityId) }),

      setQuantity: (commodityId, quantity) => {
        const items = get().items
          .map((i) =>
            i.commodity_id === commodityId
              ? { ...i, quantity: Math.max(0, Math.min(quantity, i.available_quantity)) }
              : i
          )
          .filter((i) => i.quantity > 0)
        set({ items })
      },

      clear: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalAmount: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: 'rationflow-cart' }
  )
)
