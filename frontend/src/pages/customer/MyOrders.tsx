import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Package, ShoppingBag } from 'lucide-react'
import { storeApi } from '@/services/api'
import { formatNumber, formatDate } from '@/lib/utils'

const STATUS_STYLES: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export default function MyOrders() {
  const navigate = useNavigate()
  const { data: orders, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: storeApi.getMyOrders,
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">My Orders</h1>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : orders && orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((o) => (
            <div
              key={o.id}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
                    <ShoppingBag size={18} className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{o.order_number}</p>
                    <p className="text-xs text-slate-400">{formatDate(o.created_at, 'MMM dd, yyyy HH:mm')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={'text-xs px-2.5 py-1 rounded-full font-medium capitalize ' + (STATUS_STYLES[o.status] ?? 'bg-slate-100 text-slate-600')}>
                    {o.status}
                  </span>
                  <span className="font-bold text-green-600">₹{formatNumber(o.total_amount)}</span>
                </div>
              </div>

              <div className="mt-4 border-t border-slate-100 dark:border-slate-700 pt-3 space-y-1">
                {o.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                    <span>{it.commodity_name} × {formatNumber(it.quantity)} {it.unit}</span>
                    <span>₹{formatNumber(it.subtotal)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Package size={48} className="mx-auto mb-4 text-slate-300" />
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">No orders yet</h2>
          <p className="text-sm text-slate-400 mb-6">Your placed orders will appear here.</p>
          <button
            onClick={() => navigate('/shop')}
            className="px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold"
          >
            Start shopping
          </button>
        </div>
      )}
    </div>
  )
}
