import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, Minus, Plus, ShoppingCart, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { AxiosError } from 'axios'
import { storeApi } from '@/services/api'
import { useCartStore } from '@/store/cartStore'
import { formatNumber } from '@/lib/utils'

export default function Cart() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { items, setQuantity, removeItem, clear, totalAmount } = useCartStore()
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')

  const checkout = useMutation({
    mutationFn: () =>
      storeApi.createOrder({
        items: items.map((i) => ({ commodity_id: i.commodity_id, quantity: i.quantity })),
        delivery_address: address || undefined,
        contact_phone: phone || undefined,
      }),
    onSuccess: (order) => {
      clear()
      queryClient.invalidateQueries({ queryKey: ['my-orders'] })
      queryClient.invalidateQueries({ queryKey: ['store-products'] })
      queryClient.invalidateQueries({ queryKey: ['my-card'] })
      toast.success(`Order ${order.order_number} placed!`)
      navigate('/my-orders')
    },
    onError: (err) => {
      const ax = err as AxiosError<{ detail: string }>
      toast.error(ax.response?.data?.detail ?? 'Checkout failed. Please try again.')
    },
  })

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <ShoppingCart size={48} className="mx-auto mb-4 text-slate-300" />
        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Your cart is empty</h2>
        <p className="text-sm text-slate-400 mb-6">Add some products to get started.</p>
        <button
          onClick={() => navigate('/shop')}
          className="px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold"
        >
          Browse products
        </button>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">Your Cart</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((i) => (
            <div
              key={i.commodity_id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-4"
            >
              <div className="flex-1">
                <p className="font-semibold text-slate-800 dark:text-slate-100">{i.name}</p>
                <p className="text-xs text-slate-400">
                  ₹{formatNumber(i.price)} / {i.unit} · {formatNumber(i.available_quantity)} {i.unit} available
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                <button
                  onClick={() => setQuantity(i.commodity_id, i.quantity - 1)}
                  className="w-7 h-7 rounded-md bg-white dark:bg-slate-600 flex items-center justify-center hover:bg-slate-50"
                >
                  <Minus size={14} />
                </button>
                <input
                  type="number"
                  value={i.quantity}
                  min={1}
                  max={i.available_quantity}
                  onChange={(e) => setQuantity(i.commodity_id, Number(e.target.value))}
                  className="w-12 text-center bg-transparent text-sm font-semibold focus:outline-none"
                />
                <button
                  onClick={() => setQuantity(i.commodity_id, i.quantity + 1)}
                  className="w-7 h-7 rounded-md bg-white dark:bg-slate-600 flex items-center justify-center hover:bg-slate-50"
                >
                  <Plus size={14} />
                </button>
              </div>

              <p className="w-24 text-right font-bold text-slate-800 dark:text-slate-100">
                ₹{formatNumber(i.price * i.quantity)}
              </p>

              <button
                onClick={() => removeItem(i.commodity_id)}
                className="text-slate-400 hover:text-red-600"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 h-fit space-y-4">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">Order Summary</h2>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-500">Delivery address (optional)</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              placeholder="House no, street, city…"
              className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <label className="block text-xs font-medium text-slate-500">Contact phone (optional)</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
              className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-3">
            <span className="text-slate-500">Total</span>
            <span className="text-2xl font-bold text-green-600">₹{formatNumber(totalAmount())}</span>
          </div>

          <button
            disabled={checkout.isPending}
            onClick={() => checkout.mutate()}
            className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {checkout.isPending ? 'Placing order…' : <>Place Order <ArrowRight size={16} /></>}
          </button>
        </div>
      </div>
    </div>
  )
}
