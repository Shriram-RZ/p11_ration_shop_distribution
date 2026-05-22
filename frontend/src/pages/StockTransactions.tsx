import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowUpCircle, ArrowDownCircle, RefreshCw, History } from 'lucide-react'
import { stockApi } from '@/services/api'
import { formatNumber, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

const TYPE_STYLES: Record<string, string> = {
  received:    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  distributed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  transferred: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  adjusted:    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  expired:     'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  returned:    'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
}

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }

export default function StockTransactions() {
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['stock-transactions', page, typeFilter],
    queryFn: () => stockApi.getTransactions({ page, limit: 25, transaction_type: typeFilter || undefined }),
  })

  const transactions: any[] = data?.items ?? []
  const inbound = transactions.filter(t => t.transaction_type === 'received').reduce((s, t) => s + t.quantity, 0)
  const outbound = transactions.filter(t => ['distributed', 'expired'].includes(t.transaction_type)).reduce((s, t) => s + t.quantity, 0)

  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Stock Transactions</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Complete audit trail of all stock movements</p>
        </div>
      </motion.div>

      {/* Summary cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Received', value: inbound, icon: <ArrowUpCircle className="w-5 h-5" />, color: 'text-green-600' },
          { label: 'Total Distributed/Expired', value: outbound, icon: <ArrowDownCircle className="w-5 h-5" />, color: 'text-red-500' },
          { label: 'Net Movement', value: inbound - outbound, icon: <RefreshCw className="w-5 h-5" />, color: 'text-blue-600' },
        ].map(c => (
          <div key={c.label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-card">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-slate-500 dark:text-slate-400">{c.label}</span>
              <span className={c.color}>{c.icon}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatNumber(c.value)}</p>
          </div>
        ))}
      </motion.div>

      {/* Filter */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <select
          className="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
          value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); setPage(1) }}
        >
          <option value="">All Types</option>
          {['received', 'distributed', 'transferred', 'adjusted', 'expired', 'returned'].map(t => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
      </motion.div>

      {/* Table */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                {['#', 'Date', 'Type', 'Quantity', 'Reference', 'Notes', 'Created By'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-slate-700">
                    {Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /></td>)}
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                  <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  No transactions found
                </td></tr>
              ) : transactions.map(tx => (
                <tr key={tx.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs">#{tx.id}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">{tx.created_at ? formatDate(tx.created_at) : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', TYPE_STYLES[tx.transaction_type] ?? '')}>{tx.transaction_type}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{formatNumber(tx.quantity)}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs">{tx.reference_id ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{tx.notes ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{tx.created_by ?? 'System'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(data?.pages ?? 0) > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500">Page {page} of {data?.pages}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-600 rounded-lg disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Prev</button>
              <button disabled={page === data?.pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-600 rounded-lg disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Next</button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
