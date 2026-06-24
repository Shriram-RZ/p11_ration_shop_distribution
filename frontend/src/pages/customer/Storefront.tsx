import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ShoppingCart, Package, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { storeApi } from '@/services/api'
import { useCartStore } from '@/store/cartStore'
import { formatNumber } from '@/lib/utils'
import type { Product } from '@/types'

const ICONS: Record<string, string> = {
  Rice: '🍚', Wheat: '🌾', Sugar: '🧂', 'Edible Oil': '🛢️',
  Kerosene: '⛽', 'Dal (Lentils)': '🫘',
}

export default function Storefront() {
  const { data: products, isLoading } = useQuery({
    queryKey: ['store-products'],
    queryFn: storeApi.getProducts,
  })
  const addItem = useCartStore((s) => s.addItem)
  const items = useCartStore((s) => s.items)

  const inCart = (id: number) => items.some((i) => i.commodity_id === id)

  // Effective ceiling is the smaller of stock on hand and remaining monthly quota.
  const maxQty = (p: Product) => Math.min(p.available_quantity, p.remaining_quota)

  const handleAdd = (p: Product) => {
    // Cap the cart to the quota/stock ceiling by overriding available_quantity.
    addItem({ ...p, available_quantity: maxQty(p) }, 1)
    toast.success(`${p.name} added to cart`)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Shop</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Browse available commodities and add them to your cart.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products?.map((p, idx) => {
            const max = maxQty(p)
            const out = max <= 0
            const noQuota = p.remaining_quota <= 0 && p.available_quantity > 0
            return (
              <motion.div
                key={p.commodity_id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-2xl">
                    {ICONS[p.name] ?? '📦'}
                  </div>
                  <span
                    className={
                      'text-xs px-2 py-1 rounded-full font-medium ' +
                      (out
                        ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400')
                    }
                  >
                    {noQuota
                      ? 'Quota used up'
                      : out
                      ? 'Out of stock'
                      : `${formatNumber(max)} ${p.unit} left`}
                  </span>
                </div>

                <h3 className="mt-4 font-semibold text-slate-800 dark:text-slate-100">{p.name}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 min-h-[32px]">{p.description}</p>

                <div className="mt-3 flex items-center justify-between">
                  <p className="text-lg font-bold text-green-600">
                    ₹{formatNumber(p.price)}
                    <span className="text-xs font-normal text-slate-400"> / {p.unit}</span>
                  </p>
                  <p className="text-xs text-slate-400">
                    Quota: {formatNumber(p.remaining_quota)}/{formatNumber(p.allocated_quota)} {p.unit}
                  </p>
                </div>

                <button
                  disabled={out}
                  onClick={() => handleAdd(p)}
                  className="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-green-600 hover:bg-green-700 text-white"
                >
                  {inCart(p.commodity_id) ? (
                    <><Check size={16} /> Add more</>
                  ) : (
                    <><ShoppingCart size={16} /> Add to cart</>
                  )}
                </button>
              </motion.div>
            )
          })}
        </div>
      )}

      {!isLoading && (!products || products.length === 0) && (
        <div className="text-center py-16 text-slate-400">
          <Package size={40} className="mx-auto mb-3" />
          No products available right now.
        </div>
      )}
    </div>
  )
}
