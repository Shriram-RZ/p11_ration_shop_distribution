import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, CreditCard, Search, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { rationCardApi, beneficiaryApi, shopApi } from '@/services/api'
import Modal from '@/components/ui/Modal'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<string, string> = {
  active:    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  suspended: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }

const emptyForm = {
  card_number: '', holder_id: '', shop_id: '', family_size: '1',
  monthly_entitlement_rice: '0', monthly_entitlement_wheat: '0',
  monthly_entitlement_sugar: '0', monthly_entitlement_oil: '0',
  status: 'active', issued_date: new Date().toISOString().slice(0, 10), expiry_date: '',
}

export default function RationCards() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [form, setForm] = useState({ ...emptyForm })

  const { data, isLoading } = useQuery({
    queryKey: ['ration-cards', page, search, statusFilter],
    queryFn: () => rationCardApi.getAll({ page, limit: 20, search: search || undefined, status: statusFilter || undefined }),
  })
  const { data: beneficiaries } = useQuery({ queryKey: ['beneficiaries-list'], queryFn: () => beneficiaryApi.getAll({ page: 1, limit: 100 }) })
  const { data: shops } = useQuery({ queryKey: ['shops-list'], queryFn: () => shopApi.getAll() })

  const createMutation = useMutation({
    mutationFn: (d: any) => rationCardApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ration-cards'] }); toast.success('Ration card issued!'); setShowAddModal(false); setForm({ ...emptyForm }) },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? 'Failed to create card'),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => rationCardApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ration-cards'] }); toast.success('Card updated!'); setEditItem(null) },
    onError: () => toast.error('Failed to update'),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: number) => rationCardApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ration-cards'] }); toast.success('Card deleted') },
    onError: () => toast.error('Failed to delete'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      card_number: form.card_number,
      holder_id: parseInt(form.holder_id),
      shop_id: parseInt(form.shop_id),
      family_size: parseInt(form.family_size),
      monthly_entitlement_rice: parseFloat(form.monthly_entitlement_rice),
      monthly_entitlement_wheat: parseFloat(form.monthly_entitlement_wheat),
      monthly_entitlement_sugar: parseFloat(form.monthly_entitlement_sugar),
      monthly_entitlement_oil: parseFloat(form.monthly_entitlement_oil),
      status: form.status,
      issued_date: form.issued_date,
      expiry_date: form.expiry_date || undefined,
    }
    if (editItem) updateMutation.mutate({ id: editItem.id, data: payload })
    else createMutation.mutate(payload)
  }

  const openEdit = (item: any) => {
    setEditItem(item)
    setForm({
      card_number: item.card_number, holder_id: String(item.holder_id), shop_id: String(item.shop_id),
      family_size: String(item.family_size), monthly_entitlement_rice: String(item.monthly_entitlement_rice),
      monthly_entitlement_wheat: String(item.monthly_entitlement_wheat), monthly_entitlement_sugar: String(item.monthly_entitlement_sugar),
      monthly_entitlement_oil: String(item.monthly_entitlement_oil), status: item.status,
      issued_date: item.issued_date, expiry_date: item.expiry_date ?? '',
    })
  }

  const items: any[] = data?.items ?? []

  const CardForm = () => (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Card Number *</label>
          <input required className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm font-mono" value={form.card_number} onChange={e => setForm(f => ({ ...f, card_number: e.target.value }))} placeholder="RF-2024-0001" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Card Holder *</label>
          <select required className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={form.holder_id} onChange={e => setForm(f => ({ ...f, holder_id: e.target.value }))}>
            <option value="">Select beneficiary</option>
            {(beneficiaries?.items ?? []).map((b: any) => <option key={b.id} value={b.id}>{b.full_name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Shop *</label>
          <select required className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={form.shop_id} onChange={e => setForm(f => ({ ...f, shop_id: e.target.value }))}>
            <option value="">Select shop</option>
            {(shops?.items ?? []).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Family Size</label>
          <input type="number" min="1" className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={form.family_size} onChange={e => setForm(f => ({ ...f, family_size: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
          <select className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            {['active', 'suspended', 'cancelled'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
      </div>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-2">Monthly Entitlements</p>
      <div className="grid grid-cols-2 gap-3">
        {[
          { key: 'monthly_entitlement_rice', label: 'Rice (kg)' }, { key: 'monthly_entitlement_wheat', label: 'Wheat (kg)' },
          { key: 'monthly_entitlement_sugar', label: 'Sugar (kg)' }, { key: 'monthly_entitlement_oil', label: 'Oil (L)' },
        ].map(f => (
          <div key={f.key}>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{f.label}</label>
            <input type="number" step="0.5" min="0" className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={(form as any)[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Issued Date *</label>
          <input required type="date" className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={form.issued_date} onChange={e => setForm(f => ({ ...f, issued_date: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Expiry Date</label>
          <input type="date" className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={() => { setShowAddModal(false); setEditItem(null) }} className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancel</button>
        <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-60">
          {(createMutation.isPending || updateMutation.isPending) ? 'Saving…' : editItem ? 'Update Card' : 'Issue Card'}
        </button>
      </div>
    </form>
  )

  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Ration Cards</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Issue and manage ration cards</p>
        </div>
        <button onClick={() => { setShowAddModal(true); setForm({ ...emptyForm }) }} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          <Plus className="w-4 h-4" /> Issue Card
        </button>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="w-full pl-9 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" placeholder="Search by card number…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <select className="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
          <option value="">All Statuses</option>
          {['active', 'suspended', 'cancelled'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </motion.div>

      {/* Table */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                {['Card #', 'Holder', 'Category', 'Shop', 'Family', 'Rice', 'Wheat', 'Status', 'Issued', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-700">
                  {Array.from({ length: 10 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /></td>)}
                </tr>
              )) : items.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-slate-500">
                  <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-30" />No ration cards found
                </td></tr>
              ) : items.map(card => (
                <tr key={card.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">{card.card_number}</td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{card.holder?.full_name ?? '—'}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs">{card.holder?.category ?? '—'}</span></td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs">Shop #{card.shop_id}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{card.family_size}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{card.monthly_entitlement_rice} kg</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{card.monthly_entitlement_wheat} kg</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', STATUS_STYLES[card.status] ?? '')}>{card.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{card.issued_date ? formatDate(card.issued_date) : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(card)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-green-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => { if (window.confirm('Delete this card?')) deleteMutation.mutate(card.id) }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
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

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Issue Ration Card" size="lg"><CardForm /></Modal>
      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Edit Ration Card" size="lg"><CardForm /></Modal>
    </motion.div>
  )
}
