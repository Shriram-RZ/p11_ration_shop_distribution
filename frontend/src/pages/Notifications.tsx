import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, CheckCheck, Trash2, Plus, Info, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { notificationApi } from '@/services/api'
import Modal from '@/components/ui/Modal'
import { formatRelative } from '@/lib/utils'
import { cn } from '@/lib/utils'

const TYPE_ICONS: Record<string, React.ReactNode> = {
  info:    <Info className="w-4 h-4" />,
  warning: <AlertTriangle className="w-4 h-4" />,
  error:   <XCircle className="w-4 h-4" />,
  success: <CheckCircle2 className="w-4 h-4" />,
}
const TYPE_STYLES: Record<string, string> = {
  info:    'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
  warning: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20',
  error:   'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
  success: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
}

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }

export default function Notifications() {
  const qc = useQueryClient()
  const [typeFilter, setTypeFilter] = useState('')
  const [readFilter, setReadFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newNotif, setNewNotif] = useState({ title: '', message: '', type: 'info', target_role: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', typeFilter, readFilter],
    queryFn: () => notificationApi.getAll({ type: typeFilter || undefined, is_read: readFilter === '' ? undefined : readFilter === 'read' }),
  })

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
  const markAllReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); toast.success('All marked as read') },
  })
  const deleteMutation = useMutation({
    mutationFn: (id: number) => notificationApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); toast.success('Deleted') },
  })
  const createMutation = useMutation({
    mutationFn: (d: any) => notificationApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); toast.success('Notification created!'); setShowAddModal(false); setNewNotif({ title: '', message: '', type: 'info', target_role: '' }) },
    onError: () => toast.error('Failed to create'),
  })

  const notifications: any[] = data?.items ?? []
  const unread = notifications.filter(n => !n.is_read).length

  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notifications</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{unread > 0 ? `${unread} unread notifications` : 'All caught up!'}</p>
        </div>
        <div className="flex gap-2">
          {unread > 0 && (
            <button onClick={() => markAllReadMutation.mutate()} disabled={markAllReadMutation.isPending} className="flex items-center gap-1.5 text-sm border border-slate-200 dark:border-slate-600 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <CheckCheck className="w-4 h-4" /> Mark all read
            </button>
          )}
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> New
          </button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex flex-wrap gap-3">
        <select className="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          {['info', 'warning', 'error', 'success'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
        <select className="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200" value={readFilter} onChange={e => setReadFilter(e.target.value)}>
          <option value="">All</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </select>
      </motion.div>

      {/* Notification list */}
      <motion.div variants={itemVariants} className="space-y-2">
        <AnimatePresence>
          {isLoading ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-2" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
            </div>
          )) : notifications.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 text-slate-500">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No notifications</p>
            </motion.div>
          ) : notifications.map(notif => (
            <motion.div
              key={notif.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={cn(
                'bg-white dark:bg-slate-800 rounded-xl border p-4 transition-colors',
                notif.is_read
                  ? 'border-slate-200 dark:border-slate-700'
                  : 'border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-900/10'
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', TYPE_STYLES[notif.type] ?? '')}>
                  {TYPE_ICONS[notif.type] ?? <Info className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h4 className={cn('font-medium text-sm', notif.is_read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white')}>{notif.title}</h4>
                    <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">{formatRelative(notif.created_at)}</span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{notif.message}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!notif.is_read && (
                    <button onClick={() => markReadMutation.mutate(notif.id)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-green-600 transition-colors" title="Mark as read">
                      <CheckCheck className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => deleteMutation.mutate(notif.id)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-red-600 transition-colors" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="New Notification">
        <form onSubmit={e => { e.preventDefault(); createMutation.mutate(newNotif) }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title *</label>
            <input required className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={newNotif.title} onChange={e => setNewNotif(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Message *</label>
            <textarea required rows={3} className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={newNotif.message} onChange={e => setNewNotif(f => ({ ...f, message: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
              <select className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={newNotif.type} onChange={e => setNewNotif(f => ({ ...f, type: e.target.value }))}>
                {['info', 'warning', 'error', 'success'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Target Role</label>
              <select className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={newNotif.target_role} onChange={e => setNewNotif(f => ({ ...f, target_role: e.target.value }))}>
                <option value="">All users</option>
                {['admin', 'shop_manager', 'distribution_staff'].map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-60">
              {createMutation.isPending ? 'Sending…' : 'Send Notification'}
            </button>
          </div>
        </form>
      </Modal>
    </motion.div>
  )
}
