import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, Package, AlertTriangle, RefreshCw, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import { stockApi, warehouseApi } from '@/services/api'
import StatsCard from '@/components/ui/StatsCard'
import Modal from '@/components/ui/Modal'
import { formatNumber, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }

const STATUS_COLORS: Record<string, string> = {
  normal: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  low: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

function getStockStatus(qty: number, min: number): 'normal' | 'low' | 'critical' {
  if (min === 0) return 'normal'
  if (qty <= 0) return 'critical'
  if (qty <= min) return 'low'
  return 'normal'
}

interface StockForm {
  commodity_id: string
  warehouse_id: string
  quantity: string
  minimum_quantity: string
  batch_number: string
  cost_per_unit: string
  expiry_date: string
}

const emptyForm: StockForm = {
  commodity_id: '', warehouse_id: '', quantity: '0', minimum_quantity: '0',
  batch_number: '', cost_per_unit: '0', expiry_date: '',
}

export default function Stock() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [lowStockFilter, setLowStockFilter] = useState(false)
  const [warehouseFilter, setWarehouseFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAdjustModal, setShowAdjustModal] = useState<any>(null)
  const [form, setForm] = useState<StockForm>(emptyForm)
  const [adjustForm, setAdjustForm] = useState({ type: 'add', amount: '', notes: '' })

  const { data: items, isLoading } = useQuery({
    queryKey: ['stock-items', page, lowStockFilter, warehouseFilter],
    queryFn: () => stockApi.getItems({ page, limit: 20, low_stock: lowStockFilter, warehouse_id: warehouseFilter || undefined }),
  })
  const { data: commoditiesData } = useQuery({ queryKey: ['commodities'], queryFn: () => stockApi.getCommodities() })
  const commodities = Array.isArray(commoditiesData) ? commoditiesData : (commoditiesData as any)?.items ?? []
  const { data: warehouses } = useQuery({ queryKey: ['warehouses'], queryFn: () => warehouseApi.getAll() })

  const createMutation = useMutation({
    mutationFn: (data: any) => stockApi.createItem(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stock-items'] }); toast.success('Stock item added!'); setShowAddModal(false); setForm(emptyForm) },
    onError: () => toast.error('Failed to add stock item'),
  })

  const adjustMutation = useMutation({
    mutationFn: ({ id, data }: any) => stockApi.adjustStock(String(id), data.amount, data.notes ?? ''),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stock-items'] }); toast.success('Stock adjusted!'); setShowAdjustModal(null) },
    onError: () => toast.error('Failed to adjust stock'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => stockApi.deleteItem(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stock-items'] }); toast.success('Stock item deleted') },
    onError: () => toast.error('Failed to delete'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      commodity_id: parseInt(form.commodity_id),
      warehouse_id: form.warehouse_id ? parseInt(form.warehouse_id) : undefined,
      quantity: parseFloat(form.quantity),
      minimum_quantity: parseFloat(form.minimum_quantity),
      batch_number: form.batch_number || undefined,
      cost_per_unit: parseFloat(form.cost_per_unit),
      expiry_date: form.expiry_date || undefined,
    })
  }

  const handleAdjust = (e: React.FormEvent) => {
    e.preventDefault()
    adjustMutation.mutate({ id: showAdjustModal.id, data: { adjustment_type: adjustForm.type, amount: parseFloat(adjustForm.amount), notes: adjustForm.notes } })
  }

  const stockList: any[] = items?.items ?? []
  const totalItems = items?.total ?? 0
  const lowCount = stockList.filter((s) => getStockStatus(s.quantity, s.minimum_quantity) !== 'normal').length

  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Stock Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage inventory across warehouses and shops</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Stock
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Total Items" value={totalItems} icon={<Package className="w-5 h-5" />} color="green" />
        <StatsCard title="Low Stock Items" value={lowCount} icon={<AlertTriangle className="w-5 h-5" />} color={lowCount > 0 ? 'red' : 'green'} />
        <StatsCard title="Total Value" value={`₹${formatNumber(stockList.reduce((s, i) => s + i.quantity * (i.cost_per_unit ?? 0), 0))}`} icon={<RefreshCw className="w-5 h-5" />} color="blue" />
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            className="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
            value={warehouseFilter}
            onChange={(e) => { setWarehouseFilter(e.target.value); setPage(1) }}
          >
            <option value="">All Warehouses</option>
            {(warehouses?.items ?? []).map((w: any) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
            <input type="checkbox" className="rounded" checked={lowStockFilter} onChange={(e) => { setLowStockFilter(e.target.checked); setPage(1) }} />
            Low stock only
          </label>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                {['Commodity', 'Location', 'Quantity', 'Min. Qty', 'Status', 'Batch', 'Expiry', 'Cost/Unit', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-slate-700">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : stockList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>No stock items found</p>
                  </td>
                </tr>
              ) : stockList.map((item) => {
                const status = getStockStatus(item.quantity, item.minimum_quantity)
                return (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                      {item.commodity?.name ?? `Commodity #${item.commodity_id}`}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {item.warehouse_id ? `WH-${item.warehouse_id}` : item.shop_id ? `Shop-${item.shop_id}` : '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {formatNumber(item.quantity)} <span className="text-xs font-normal text-slate-500">{item.commodity?.unit ?? 'kg'}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatNumber(item.minimum_quantity)}</td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', STATUS_COLORS[status])}>{status}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs">{item.batch_number ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{item.expiry_date ? formatDate(item.expiry_date) : '—'}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">₹{item.cost_per_unit}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setShowAdjustModal(item); setAdjustForm({ type: 'add', amount: '', notes: '' }) }}
                          className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                        >
                          Adjust
                        </button>
                        <button
                          onClick={() => { if (window.confirm('Delete this stock item?')) deleteMutation.mutate(item.id) }}
                          className="text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2 py-1 rounded hover:bg-red-100 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {(items?.pages ?? 0) > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Page {page} of {items?.pages}
            </p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-600 rounded-lg disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Prev</button>
              <button disabled={page === items?.pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-600 rounded-lg disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Next</button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Add Stock Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Stock Item">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Commodity *</label>
              <select required className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={form.commodity_id} onChange={e => setForm(f => ({ ...f, commodity_id: e.target.value }))}>
                <option value="">Select commodity</option>
                {(commodities ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Warehouse</label>
              <select className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={form.warehouse_id} onChange={e => setForm(f => ({ ...f, warehouse_id: e.target.value }))}>
                <option value="">Select warehouse</option>
                {(warehouses?.items ?? []).map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Quantity *</label>
              <input required type="number" step="0.01" min="0" className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Min. Quantity</label>
              <input type="number" step="0.01" min="0" className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={form.minimum_quantity} onChange={e => setForm(f => ({ ...f, minimum_quantity: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Batch Number</label>
              <input type="text" className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={form.batch_number} onChange={e => setForm(f => ({ ...f, batch_number: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cost per Unit (₹)</label>
              <input type="number" step="0.01" min="0" className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={form.cost_per_unit} onChange={e => setForm(f => ({ ...f, cost_per_unit: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Expiry Date</label>
            <input type="date" className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-60">
              {createMutation.isPending ? 'Adding…' : 'Add Stock'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Adjust Modal */}
      <Modal isOpen={!!showAdjustModal} onClose={() => setShowAdjustModal(null)} title={`Adjust Stock — ${showAdjustModal?.commodity?.name ?? ''}`}>
        <form onSubmit={handleAdjust} className="space-y-4">
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-sm">
            Current quantity: <span className="font-bold">{formatNumber(showAdjustModal?.quantity ?? 0)} {showAdjustModal?.commodity?.unit ?? 'kg'}</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Adjustment Type</label>
            <select className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={adjustForm.type} onChange={e => setAdjustForm(f => ({ ...f, type: e.target.value }))}>
              <option value="add">Add to stock</option>
              <option value="subtract">Subtract from stock</option>
              <option value="set">Set exact quantity</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount *</label>
            <input required type="number" step="0.01" min="0" className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={adjustForm.amount} onChange={e => setAdjustForm(f => ({ ...f, amount: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notes</label>
            <textarea className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" rows={2} value={adjustForm.notes} onChange={e => setAdjustForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowAdjustModal(null)} className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancel</button>
            <button type="submit" disabled={adjustMutation.isPending} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-60">
              {adjustMutation.isPending ? 'Updating…' : 'Apply Adjustment'}
            </button>
          </div>
        </form>
      </Modal>
    </motion.div>
  )
}
