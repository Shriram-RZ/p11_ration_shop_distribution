import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ScrollText, Shield } from 'lucide-react'
import { auditApi } from '@/services/api'
import { formatDate } from '@/lib/utils'

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  UPDATE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  LOGIN:  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  LOGOUT: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
}

export default function AuditLogs() {
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, actionFilter],
    queryFn: () => auditApi.getLogs({ page, limit: 25, action: actionFilter || undefined }),
  })

  const logs: any[] = data?.items ?? []

  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Audit Logs</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Complete system activity trail</p>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-lg text-sm">
          <Shield className="w-4 h-4" /> Admin Only
        </div>
      </motion.div>

      {/* Filter */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <input
          className="border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm w-48"
          placeholder="Filter by action…"
          value={actionFilter}
          onChange={e => { setActionFilter(e.target.value); setPage(1) }}
        />
      </motion.div>

      {/* Table */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                {['Timestamp', 'User', 'Action', 'Resource', 'Resource ID', 'IP Address'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-700">
                  {Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /></td>)}
                </tr>
              )) : logs.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                  <ScrollText className="w-10 h-10 mx-auto mb-2 opacity-30" />No audit logs found
                </td></tr>
              ) : logs.map(log => {
                const actionKey = (log.action ?? '').toUpperCase().split('_')[0]
                return (
                  <tr key={log.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs">{log.created_at ? formatDate(log.created_at, 'MMM dd, yyyy HH:mm') : '—'}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white text-xs">{log.user_name ?? 'System'}</p>
                        {log.user_email && <p className="text-xs text-slate-400">{log.user_email}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${ACTION_COLORS[actionKey] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>{log.action}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 capitalize">{log.resource}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{log.resource_id ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{log.ip_address ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {(data?.pages ?? 0) > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500">Page {page} of {data?.pages} · {data?.total} logs</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-600 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors">Prev</button>
              <button disabled={page === data?.pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-600 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors">Next</button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
