import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, Warehouse as WarehouseIcon, MapPin, Edit2, Trash2, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import { warehouseApi } from '@/services/api'
import Modal from '@/components/ui/Modal'
import { formatNumber } from '@/lib/utils'

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }

const emptyForm = { name: '', location: '', capacity: '0', phone: '', district: '', state: '' }

export default function Warehouses() {
  const qc = useQueryClient()
  const [showAddModal, setShowAddModal] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [form, setForm] = useState({ ...emptyForm })

  const { data, isLoading } = useQuery({ queryKey: ['warehouses'], queryFn: () => warehouseApi.getAll() })

  const createMutation = useMutation({
    mutationFn: (d: any) => warehouseApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['warehouses'] }); toast.success('Warehouse created!'); setShowAddModal(false); setForm({ ...emptyForm }) },
    onError: () => toast.error('Failed to create warehouse'),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => warehouseApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['warehouses'] }); toast.success('Warehouse updated!'); setEditItem(null) },
    onError: () => toast.error('Failed to update'),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: number) => warehouseApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['warehouses'] }); toast.success('Warehouse deleted') },
    onError: () => toast.error('Failed to delete'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { ...form, capacity: parseFloat(form.capacity) }
    if (editItem) updateMutation.mutate({ id: editItem.id, data: payload })
    else createMutation.mutate(payload)
  }

  const openEdit = (item: any) => {
    setEditItem(item)
    setForm({ name: item.name, location: item.location, capacity: String(item.capacity), phone: item.phone ?? '', district: item.district ?? '', state: item.state ?? '' })
  }

  const warehouses: any[] = data?.items ?? []

  const WarehouseForm = () => (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name *</label>
        <input required className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Location *</label>
        <input required className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Capacity (kg)</label>
          <input type="number" step="100" min="0" className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
          <input className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">District</label>
          <input className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">State</label>
          <input className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={() => { setShowAddModal(false); setEditItem(null) }} className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancel</button>
        <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-60">
          {(createMutation.isPending || updateMutation.isPending) ? 'Saving…' : editItem ? 'Update' : 'Create Warehouse'}
        </button>
      </div>
    </form>
  )

  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Warehouses</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage storage locations</p>
        </div>
        <button onClick={() => { setShowAddModal(true); setForm({ ...emptyForm }) }} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Warehouse
        </button>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-3" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : warehouses.length === 0 ? (
        <motion.div variants={itemVariants} className="text-center py-16 text-slate-500 dark:text-slate-400">
          <WarehouseIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No warehouses yet</p>
          <p className="text-sm mt-1">Add your first warehouse to start tracking stock.</p>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouses.map(wh => (
            <motion.div key={wh.id} whileHover={{ y: -2 }} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-card hover:shadow-card-hover transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <WarehouseIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{wh.name}</h3>
                    <span className={`text-xs ${wh.is_active ? 'text-green-600 dark:text-green-400' : 'text-slate-500'}`}>{wh.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(wh)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-green-600 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => { if (window.confirm('Delete this warehouse?')) deleteMutation.mutate(wh.id) }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <MapPin className="w-3.5 h-3.5" /><span className="truncate">{wh.location}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Package className="w-3.5 h-3.5" /><span>Capacity: {formatNumber(wh.capacity)} kg</span>
                </div>
                {wh.phone && <p className="text-slate-500 dark:text-slate-400">{wh.phone}</p>}
                {wh.district && <p className="text-slate-500 dark:text-slate-400">{wh.district}, {wh.state}</p>}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Warehouse"><WarehouseForm /></Modal>
      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Edit Warehouse"><WarehouseForm /></Modal>
    </motion.div>
  )
}
