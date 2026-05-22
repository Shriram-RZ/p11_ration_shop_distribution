import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, Users as UsersIcon, Edit2, Trash2, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { userApi, shopApi } from '@/services/api'
import Modal from '@/components/ui/Modal'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

const ROLE_STYLES: Record<string, string> = {
  admin:               'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  shop_manager:        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  distribution_staff:  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }

const emptyForm = { email: '', full_name: '', role: 'distribution_staff', shop_id: '', phone: '', password: '', is_active: true }

export default function Users() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [form, setForm] = useState({ ...emptyForm })

  const { data, isLoading } = useQuery({
    queryKey: ['users', page],
    queryFn: () => userApi.getAll({ page, limit: 20 }),
  })
  const { data: shops } = useQuery({ queryKey: ['shops-list'], queryFn: () => shopApi.getAll() })

  const createMutation = useMutation({
    mutationFn: (d: any) => userApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('User created!'); setShowAddModal(false); setForm({ ...emptyForm }) },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? 'Failed to create user'),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => userApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('User updated!'); setEditItem(null) },
    onError: () => toast.error('Failed to update'),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: number) => userApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('User deleted') },
    onError: () => toast.error('Failed to delete'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: any = {
      email: form.email,
      full_name: form.full_name,
      role: form.role,
      phone: form.phone || undefined,
      shop_id: form.shop_id ? parseInt(form.shop_id) : undefined,
      is_active: form.is_active,
    }
    if (!editItem) payload.password = form.password
    else if (form.password) payload.password = form.password
    if (editItem) updateMutation.mutate({ id: editItem.id, data: payload })
    else createMutation.mutate(payload)
  }

  const openEdit = (item: any) => {
    setEditItem(item)
    setForm({ email: item.email, full_name: item.full_name, role: item.role, shop_id: item.shop_id ? String(item.shop_id) : '', phone: item.phone ?? '', password: '', is_active: item.is_active })
  }

  const users: any[] = data?.items ?? []

  const UserForm = () => (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
          <input required className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email *</label>
          <input required type="email" className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
          <input className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role *</label>
          <select required className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
            {['admin', 'shop_manager', 'distribution_staff'].map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Shop</label>
          <select className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={form.shop_id} onChange={e => setForm(f => ({ ...f, shop_id: e.target.value }))}>
            <option value="">No shop</option>
            {(shops?.items ?? []).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{editItem ? 'New Password (leave blank to keep)' : 'Password *'}</label>
          <input required={!editItem} type="password" className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
        </div>
        <div className="col-span-2 flex items-center gap-2">
          <input type="checkbox" id="is_active" className="rounded" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
          <label htmlFor="is_active" className="text-sm text-slate-700 dark:text-slate-300">Active</label>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={() => { setShowAddModal(false); setEditItem(null) }} className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancel</button>
        <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-60">
          {(createMutation.isPending || updateMutation.isPending) ? 'Saving…' : editItem ? 'Update User' : 'Create User'}
        </button>
      </div>
    </form>
  )

  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">User Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage system users and permissions</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 px-3 py-1.5 rounded-lg text-sm">
            <Shield className="w-4 h-4" /> Admin Only
          </div>
          <button onClick={() => { setShowAddModal(true); setForm({ ...emptyForm }) }} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            <Plus className="w-4 h-4" /> Add User
          </button>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                {['Name', 'Email', 'Role', 'Phone', 'Status', 'Last Login', 'Created', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-700">
                  {Array.from({ length: 8 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /></td>)}
                </tr>
              )) : users.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                  <UsersIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />No users found
                </td></tr>
              ) : users.map(user => (
                <tr key={user.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{user.full_name}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', ROLE_STYLES[user.role] ?? '')}>{user.role?.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{user.phone ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', user.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500')}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">{user.last_login ? formatDate(user.last_login) : '—'}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">{formatDate(user.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(user)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-green-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => { if (window.confirm('Delete this user?')) deleteMutation.mutate(user.id) }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
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

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add User" size="lg"><UserForm /></Modal>
      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Edit User" size="lg"><UserForm /></Modal>
    </motion.div>
  )
}
