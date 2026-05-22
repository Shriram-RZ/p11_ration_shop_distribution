import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, Search, Users, Eye, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { beneficiaryApi } from '@/services/api'
import StatsCard from '@/components/ui/StatsCard'
import Modal from '@/components/ui/Modal'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

const CAT_COLORS: Record<string, string> = {
  BPL: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  APL: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  AAY: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  PHH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
}

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }

const emptyForm = { aadhaar_number: '', full_name: '', phone: '', email: '', address: '', district: '', state: '', pincode: '', category: 'APL' }

export default function Beneficiaries() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [viewItem, setViewItem] = useState<any>(null)
  const [form, setForm] = useState({ ...emptyForm })

  const { data, isLoading } = useQuery({
    queryKey: ['beneficiaries', page, search, catFilter],
    queryFn: () => beneficiaryApi.getAll({ page, limit: 20, search: search || undefined, category: catFilter || undefined }),
  })

  const createMutation = useMutation({
    mutationFn: (d: any) => beneficiaryApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['beneficiaries'] }); toast.success('Beneficiary added!'); setShowAddModal(false); setForm({ ...emptyForm }) },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? 'Failed to add beneficiary'),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => beneficiaryApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['beneficiaries'] }); toast.success('Updated!'); setEditItem(null) },
    onError: () => toast.error('Failed to update'),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: number) => beneficiaryApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['beneficiaries'] }); toast.success('Deleted') },
    onError: () => toast.error('Failed to delete'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data: form })
    } else {
      createMutation.mutate(form)
    }
  }

  const openEdit = (item: any) => {
    setEditItem(item)
    setForm({ aadhaar_number: item.aadhaar_number, full_name: item.full_name, phone: item.phone ?? '', email: item.email ?? '', address: item.address, district: item.district, state: item.state, pincode: item.pincode, category: item.category })
  }

  const items: any[] = data?.items ?? []
  const bpl = items.filter(h => h.category === 'BPL').length
  const apl = items.filter(h => h.category === 'APL').length

  const FormBody = () => (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
          <input required className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Aadhaar *</label>
          <input required maxLength={12} className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm font-mono" value={form.aadhaar_number} onChange={e => setForm(f => ({ ...f, aadhaar_number: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
          <input className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
          <input type="email" className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category *</label>
          <select required className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
            {['APL', 'BPL', 'AAY', 'PHH'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
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
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={() => { setShowAddModal(false); setEditItem(null) }} className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancel</button>
        <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-60">
          {(createMutation.isPending || updateMutation.isPending) ? 'Saving…' : editItem ? 'Update' : 'Add Beneficiary'}
        </button>
      </div>
    </form>
  )

  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Beneficiaries</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage ration card holders</p>
        </div>
        <button onClick={() => { setShowAddModal(true); setForm({ ...emptyForm }) }} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Beneficiary
        </button>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard title="Total" value={data?.total ?? 0} icon={<Users className="w-5 h-5" />} color="blue" />
        <StatsCard title="Active" value={items.filter(h => h.is_active).length} icon={<Users className="w-5 h-5" />} color="green" />
        <StatsCard title="BPL" value={bpl} icon={<Users className="w-5 h-5" />} color="red" />
        <StatsCard title="APL" value={apl} icon={<Users className="w-5 h-5" />} color="teal" />
      </motion.div>

      {/* Search + Filter */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="w-full pl-9 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
            placeholder="Search by name, Aadhaar, phone…"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select className="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200" value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1) }}>
          <option value="">All Categories</option>
          {['APL', 'BPL', 'AAY', 'PHH'].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </motion.div>

      {/* Table */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                {['Name', 'Aadhaar', 'Phone', 'Category', 'District', 'Status', 'Registered', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-700">
                  {Array.from({ length: 8 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /></td>)}
                </tr>
              )) : items.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />No beneficiaries found
                </td></tr>
              ) : items.map(holder => (
                <tr key={holder.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{holder.full_name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                    {holder.aadhaar_number ? `****${holder.aadhaar_number.slice(-4)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{holder.phone ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', CAT_COLORS[holder.category] ?? '')}>{holder.category}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{holder.district}</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', holder.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500')}>
                      {holder.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(holder.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setViewItem(holder)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-blue-600 transition-colors"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => openEdit(holder)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-green-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => { if (window.confirm('Delete this beneficiary?')) deleteMutation.mutate(holder.id) }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(data?.pages ?? 0) > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500">Page {page} of {data?.pages} · {data?.total} total</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-600 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors">Prev</button>
              <button disabled={page === data?.pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-600 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors">Next</button>
            </div>
          </div>
        )}
      </motion.div>

      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false) }} title="Add Beneficiary" size="lg"><FormBody /></Modal>
      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Edit Beneficiary" size="lg"><FormBody /></Modal>

      {/* View Modal */}
      <Modal isOpen={!!viewItem} onClose={() => setViewItem(null)} title="Beneficiary Details">
        {viewItem && (
          <div className="space-y-3 text-sm">
            {[
              ['Full Name', viewItem.full_name], ['Aadhaar', viewItem.aadhaar_number],
              ['Phone', viewItem.phone ?? '—'], ['Email', viewItem.email ?? '—'],
              ['Category', viewItem.category], ['Address', viewItem.address],
              ['District', viewItem.district], ['State', viewItem.state],
              ['Pincode', viewItem.pincode], ['Status', viewItem.is_active ? 'Active' : 'Inactive'],
              ['Registered', formatDate(viewItem.created_at)],
            ].map(([label, val]) => (
              <div key={label as string} className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700 last:border-0">
                <span className="text-slate-500 dark:text-slate-400">{label}</span>
                <span className="font-medium text-slate-800 dark:text-slate-100">{val as string}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </motion.div>
  )
}
