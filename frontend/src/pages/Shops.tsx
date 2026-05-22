import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, Store, MapPin, Edit2, Trash2, Hash } from 'lucide-react'
import toast from 'react-hot-toast'
import { shopApi } from '@/services/api'
import Modal from '@/components/ui/Modal'

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }

const emptyForm = { name: '', shop_code: '', address: '', district: '', state: '', pincode: '', phone: '', license_number: '' }

export default function Shops() {
  const qc = useQueryClient()
  const [showAddModal, setShowAddModal] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [form, setForm] = useState({ ...emptyForm })

  const { data, isLoading } = useQuery({ queryKey: ['shops'], queryFn: () => shopApi.getAll() })

  const createMutation = useMutation({
    mutationFn: (d: any) => shopApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shops'] }); toast.success('Shop created!'); setShowAddModal(false); setForm({ ...emptyForm }) },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? 'Failed to create shop'),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => shopApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shops'] }); toast.success('Shop updated!'); setEditItem(null) },
    onError: () => toast.error('Failed to update'),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: number) => shopApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shops'] }); toast.success('Shop deleted') },
    onError: () => toast.error('Failed to delete'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editItem) updateMutation.mutate({ id: editItem.id, data: form })
    else createMutation.mutate(form)
  }

  const openEdit = (item: any) => {
    setEditItem(item)
    setForm({ name: item.name, shop_code: item.shop_code, address: item.address, district: item.district, state: item.state, pincode: item.pincode, phone: item.phone ?? '', license_number: item.license_number ?? '' })
  }

  const shops: any[] = data?.items ?? []

  const ShopForm = () => (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Shop Name *</label>
          <input required className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Shop Code *</label>
          <input required className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm font-mono" value={form.shop_code} onChange={e => setForm(f => ({ ...f, shop_code: e.target.value }))} placeholder="FPS-001" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
          <input className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Address *</label>
          <input required className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">District *</label>
          <input required className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">State *</label>
          <input required className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pincode *</label>
          <input required className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">License Number</label>
          <input className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={form.license_number} onChange={e => setForm(f => ({ ...f, license_number: e.target.value }))} />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={() => { setShowAddModal(false); setEditItem(null) }} className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancel</button>
        <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-60">
          {(createMutation.isPending || updateMutation.isPending) ? 'Saving…' : editItem ? 'Update' : 'Create Shop'}
        </button>
      </div>
    </form>
  )

  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Ration Shops</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage fair price shops</p>
        </div>
        <button onClick={() => { setShowAddModal(true); setForm({ ...emptyForm }) }} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Shop
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
      ) : shops.length === 0 ? (
        <motion.div variants={itemVariants} className="text-center py-16 text-slate-500">
          <Store className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No shops yet</p>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shops.map(shop => (
            <motion.div key={shop.id} whileHover={{ y: -2 }} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-card hover:shadow-card-hover transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Store className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm leading-tight">{shop.name}</h3>
                    <span className={`text-xs ${shop.is_active ? 'text-green-600 dark:text-green-400' : 'text-slate-500'}`}>{shop.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(shop)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-green-600 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => { if (window.confirm('Delete this shop?')) deleteMutation.mutate(shop.id) }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Hash className="w-3.5 h-3.5" /><span className="font-mono">{shop.shop_code}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <MapPin className="w-3.5 h-3.5" /><span className="truncate">{shop.district}, {shop.state}</span>
                </div>
                {shop.phone && <p className="text-slate-500 dark:text-slate-400">{shop.phone}</p>}
                {shop.license_number && <p className="text-xs font-mono text-slate-400 dark:text-slate-500">{shop.license_number}</p>}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Shop" size="lg"><ShopForm /></Modal>
      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Edit Shop" size="lg"><ShopForm /></Modal>
    </motion.div>
  )
}
