import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, Truck, CheckCircle, Clock, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { distributionApi, rationCardApi, shopApi } from '@/services/api'
import StatsCard from '@/components/ui/StatsCard'
import Modal from '@/components/ui/Modal'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  pending:   'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  partial:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }

interface DistForm {
  card_number: string; shop_id: string; distribution_month: string; distribution_year: string
  rice_quantity: string; wheat_quantity: string; sugar_quantity: string; oil_quantity: string; notes: string
}
const emptyForm: DistForm = {
  card_number: '', shop_id: '', distribution_month: String(new Date().getMonth() + 1),
  distribution_year: String(new Date().getFullYear()),
  rice_quantity: '0', wheat_quantity: '0', sugar_quantity: '0', oil_quantity: '0', notes: '',
}

export default function Distributions() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState(String(new Date().getMonth() + 1))
  const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()))
  const [showAddModal, setShowAddModal] = useState(false)
  const [form, setForm] = useState<DistForm>(emptyForm)
  const [cardInfo, setCardInfo] = useState<any>(null)
  const [cardLoading, setCardLoading] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['distributions', page, statusFilter, monthFilter, yearFilter],
    queryFn: () => distributionApi.getAll({ page, limit: 20, status: statusFilter || undefined, month: parseInt(monthFilter), year: parseInt(yearFilter) }),
  })
  const { data: shops } = useQuery({ queryKey: ['shops-list'], queryFn: () => shopApi.getAll() })

  const createMutation = useMutation({
    mutationFn: (d: any) => distributionApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['distributions'] }); toast.success('Distribution recorded!'); setShowAddModal(false); setForm(emptyForm); setCardInfo(null) },
    onError: () => toast.error('Failed to record distribution'),
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => distributionApi.updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['distributions'] }); toast.success('Status updated') },
    onError: () => toast.error('Failed to update status'),
  })

  const lookupCard = async () => {
    if (!form.card_number.trim()) return
    setCardLoading(true)
    try {
      const card = await rationCardApi.search(form.card_number)
      setCardInfo(card)
      setForm(f => ({
        ...f,
        rice_quantity: String(card.monthly_entitlement_rice ?? 0),
        wheat_quantity: String(card.monthly_entitlement_wheat ?? 0),
        sugar_quantity: String(card.monthly_entitlement_sugar ?? 0),
        oil_quantity: String(card.monthly_entitlement_oil ?? 0),
        shop_id: String(card.shop_id ?? ''),
      }))
    } catch {
      toast.error('Card not found')
      setCardInfo(null)
    } finally {
      setCardLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!cardInfo) return toast.error('Please lookup a valid card first')
    createMutation.mutate({
      card_id: cardInfo.id,
      shop_id: parseInt(form.shop_id),
      distribution_month: parseInt(form.distribution_month),
      distribution_year: parseInt(form.distribution_year),
      rice_quantity: parseFloat(form.rice_quantity),
      wheat_quantity: parseFloat(form.wheat_quantity),
      sugar_quantity: parseFloat(form.sugar_quantity),
      oil_quantity: parseFloat(form.oil_quantity),
      notes: form.notes,
      status: 'completed',
    })
  }

  const items: any[] = data?.items ?? []
  const completed = items.filter(d => d.status === 'completed').length
  const pending = items.filter(d => d.status === 'pending').length

  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Distributions</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Monthly ration distribution tracking</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          <Plus className="w-4 h-4" /> New Distribution
        </button>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Total This View" value={data?.total ?? 0} icon={<Truck className="w-5 h-5" />} color="blue" />
        <StatsCard title="Completed" value={completed} icon={<CheckCircle className="w-5 h-5" />} color="green" />
        <StatsCard title="Pending" value={pending} icon={<Clock className="w-5 h-5" />} color="orange" />
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex flex-wrap gap-3 items-center">
        <select className="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200" value={monthFilter} onChange={e => { setMonthFilter(e.target.value); setPage(1) }}>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleString('default', { month: 'long' })}</option>
          ))}
        </select>
        <select className="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200" value={yearFilter} onChange={e => { setYearFilter(e.target.value); setPage(1) }}>
          {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select className="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
          <option value="">All Statuses</option>
          {['completed', 'pending', 'partial', 'cancelled'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </motion.div>

      {/* Table */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                {['Card #', 'Month/Year', 'Rice', 'Wheat', 'Sugar', 'Oil', 'Status', 'Date', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-700">
                  {Array.from({ length: 9 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /></td>)}
                </tr>
              )) : items.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                  <Truck className="w-10 h-10 mx-auto mb-2 opacity-30" />No distributions found
                </td></tr>
              ) : items.map(dist => (
                <tr key={dist.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">{dist.card_id}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{new Date(2000, dist.distribution_month - 1).toLocaleString('default', { month: 'short' })} {dist.distribution_year}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{dist.rice_quantity} kg</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{dist.wheat_quantity} kg</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{dist.sugar_quantity} kg</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{dist.oil_quantity} L</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', STATUS_STYLES[dist.status] ?? '')}>{dist.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(dist.created_at)}</td>
                  <td className="px-4 py-3">
                    {dist.status === 'pending' && (
                      <button onClick={() => updateStatusMutation.mutate({ id: dist.id, status: 'completed' })} className="text-xs bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-2 py-1 rounded hover:bg-green-100 transition-colors">
                        Complete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(data?.pages ?? 0) > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500">Page {page} of {data?.pages}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-600 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors">Prev</button>
              <button disabled={page === data?.pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-600 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors">Next</button>
            </div>
          </div>
        )}
      </motion.div>

      {/* New Distribution Modal */}
      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); setCardInfo(null); setForm(emptyForm) }} title="New Distribution" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Card lookup */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ration Card Number *</label>
            <div className="flex gap-2">
              <input
                type="text" placeholder="e.g. RF-2024-0001"
                className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                value={form.card_number} onChange={e => setForm(f => ({ ...f, card_number: e.target.value }))}
              />
              <button type="button" onClick={lookupCard} disabled={cardLoading} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-60 transition-colors">
                {cardLoading ? '…' : 'Lookup'}
              </button>
            </div>
          </div>
          {cardInfo && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm">
              <p className="font-semibold text-green-800 dark:text-green-300">{cardInfo.holder?.full_name ?? 'Beneficiary'}</p>
              <p className="text-green-600 dark:text-green-400">Category: {cardInfo.holder?.category} · Family: {cardInfo.family_size}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Month</label>
              <select className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={form.distribution_month} onChange={e => setForm(f => ({ ...f, distribution_month: e.target.value }))}>
                {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleString('default', { month: 'long' })}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Year</label>
              <select className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={form.distribution_year} onChange={e => setForm(f => ({ ...f, distribution_year: e.target.value }))}>
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Shop *</label>
            <select required className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={form.shop_id} onChange={e => setForm(f => ({ ...f, shop_id: e.target.value }))}>
              <option value="">Select shop</option>
              {(shops?.items ?? []).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'rice_quantity', label: 'Rice (kg)' }, { key: 'wheat_quantity', label: 'Wheat (kg)' },
              { key: 'sugar_quantity', label: 'Sugar (kg)' }, { key: 'oil_quantity', label: 'Oil (L)' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{f.label}</label>
                <input type="number" step="0.1" min="0" className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={(form as any)[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notes</label>
            <textarea className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setShowAddModal(false); setCardInfo(null); setForm(emptyForm) }} className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancel</button>
            <button type="submit" disabled={createMutation.isPending || !cardInfo} className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-60">
              {createMutation.isPending ? 'Recording…' : 'Record Distribution'}
            </button>
          </div>
        </form>
      </Modal>
    </motion.div>
  )
}
