import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ShoppingBag, Clock, CheckCircle, Truck, XCircle, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { AxiosError } from 'axios'
import { adminOrdersApi } from '@/services/api'
import { StatsCard } from '@/components/ui/StatsCard'
import { formatNumber } from '@/lib/utils'

const STATUSES = ['pending', 'approved', 'ready', 'delivered', 'rejected'] as const
const CATEGORIES = ['APL', 'BPL', 'AAY', 'PHH'] as const

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  approved: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ready: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  delivered: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export default function Orders() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [category, setCategory] = useState('')
  const [q, setQ] = useState('')

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders', statusFilter, category, q],
    queryFn: () =>
      adminOrdersApi.getAll({
        status_filter: statusFilter || undefined,
        category: category || undefined,
        q: q || undefined,
      }),
    refetchInterval: 10000, // live updates (ponytail: poll, not websockets)
  })

  const mutate = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      adminOrdersApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      toast.success('Order updated')
    },
    onError: (err) => {
      const ax = err as AxiosError<{ detail: string }>
      toast.error(ax.response?.data?.detail ?? 'Update failed')
    },
  })

  const all = orders ?? []
  const count = (s: string) => all.filter((o) => o.status === s).length

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Customer Orders</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Review and process ration card orders. Updates live every 10s.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard title="Pending" value={count('pending')} icon={<Clock size={20} />} color="amber" />
        <StatsCard title="Approved" value={count('approved')} icon={<CheckCircle size={20} />} color="blue" />
        <StatsCard title="Delivered" value={count('delivered')} icon={<Truck size={20} />} color="green" />
        <StatsCard title="Total" value={all.length} icon={<ShoppingBag size={20} />} color="purple" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by Aadhaar or ration card number"
            className="w-full pl-10 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Ration Card</th>
              <th className="px-4 py-3 font-medium">Aadhaar</th>
              <th className="px-4 py-3 font-medium">Family</th>
              <th className="px-4 py-3 font-medium">Cat.</th>
              <th className="px-4 py-3 font-medium">Items</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {isLoading ? (
              <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-400">Loading…</td></tr>
            ) : all.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-400">
                <XCircle size={28} className="mx-auto mb-2" /> No orders found.
              </td></tr>
            ) : (
              all.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">{o.order_number}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{o.card_number ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{o.aadhaar_number ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{o.customer_name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{o.category ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {o.items.map((i) => `${i.commodity_name} ${formatNumber(i.quantity)}${i.unit}`).join(', ')}
                  </td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                    {new Date(o.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={'text-xs px-2 py-1 rounded-full font-medium ' + (STATUS_STYLE[o.status] ?? '')}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={o.status}
                      onChange={(e) => mutate.mutate({ id: o.id, status: e.target.value })}
                      disabled={mutate.isPending}
                      className="px-2 py-1 text-xs rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
