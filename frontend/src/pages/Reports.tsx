import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  Tooltip, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts'
import { BarChart3, Download, FileText, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { reportApi } from '@/services/api'
import { formatNumber } from '@/lib/utils'

const COLORS = ['#16a34a', '#2563eb', '#f59e0b', '#ef4444', '#8b5cf6', '#0891b2']

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'stock', label: 'Stock Report' },
  { id: 'distribution', label: 'Distribution Report' },
]

export default function Reports() {
  const [activeTab, setActiveTab] = useState('overview')
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())

  const { data: stats } = useQuery({ queryKey: ['dashboard-stats'], queryFn: reportApi.getDashboardStats })
  const { data: stockSummary } = useQuery({ queryKey: ['stock-summary'], queryFn: reportApi.getStockSummary, enabled: activeTab === 'stock' })
  const { data: distSummary } = useQuery({
    queryKey: ['distribution-summary', month, year],
    queryFn: () => reportApi.getDistributionSummary(month, year),
    enabled: activeTab === 'distribution',
  })

  const handleExport = async (resource: string) => {
    try {
      const blob = await reportApi.exportCSV(resource)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `${resource}-export.csv`; a.click()
      URL.revokeObjectURL(url)
      toast.success(`${resource} exported!`)
    } catch {
      toast.error('Export failed')
    }
  }

  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Insights and data exports</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleExport('distributions')} className="flex items-center gap-1.5 text-sm border border-slate-200 dark:border-slate-600 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <Download className="w-4 h-4" /> Distributions CSV
          </button>
          <button onClick={() => handleExport('beneficiaries')} className="flex items-center gap-1.5 text-sm border border-slate-200 dark:border-slate-600 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <Download className="w-4 h-4" /> Beneficiaries CSV
          </button>
          <button onClick={() => handleExport('stock')} className="flex items-center gap-1.5 text-sm border border-slate-200 dark:border-slate-600 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <Download className="w-4 h-4" /> Stock CSV
          </button>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants} className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <motion.div variants={itemVariants} className="space-y-6">
          {/* Key stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Beneficiaries', value: stats?.total_beneficiaries ?? 0, color: 'text-blue-600 dark:text-blue-400' },
              { label: 'Active Cards', value: stats?.active_ration_cards ?? 0, color: 'text-green-600 dark:text-green-400' },
              { label: 'This Month Distributions', value: stats?.distributions_this_month ?? 0, color: 'text-teal-600 dark:text-teal-400' },
              { label: 'Low Stock Alerts', value: stats?.low_stock_alerts ?? 0, color: 'text-red-600 dark:text-red-400' },
            ].map(s => (
              <div key={s.label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
                <p className={`text-2xl font-bold mt-1 ${s.color}`}>{formatNumber(s.value)}</p>
              </div>
            ))}
          </div>

          {/* Distribution trend chart */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold text-slate-900 dark:text-white">6-Month Distribution Trend</h3>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={stats?.monthly_trend ?? []}>
                <defs>
                  {['colorRice', 'colorWheat', 'colorSugar'].map((id, i) => (
                    <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS[i]} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS[i]} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, color: '#f8fafc' }} />
                <Legend />
                <Area type="monotone" dataKey="rice" name="Rice" stroke={COLORS[0]} fill="url(#colorRice)" strokeWidth={2} />
                <Area type="monotone" dataKey="wheat" name="Wheat" stroke={COLORS[1]} fill="url(#colorWheat)" strokeWidth={2} />
                <Area type="monotone" dataKey="sugar" name="Sugar" stroke={COLORS[2]} fill="url(#colorSugar)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Stock overview */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-slate-900 dark:text-white">Stock by Commodity</h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats?.stock_by_commodity ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, color: '#f8fafc' }} />
                {(stats?.stock_by_commodity ?? []).map((_: any, i: number) => null)}
                <Bar dataKey="quantity" fill="#16a34a" radius={[4, 4, 0, 0]}>
                  {(stats?.stock_by_commodity ?? []).map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Stock Tab */}
      {activeTab === 'stock' && (
        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-card overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" />
            <h3 className="font-semibold text-slate-800 dark:text-white">Stock Summary Report</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                  {['Commodity', 'Unit', 'Total Qty', 'Low Stock Items', 'Value'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(stockSummary?.items ?? []).map((item: any) => (
                  <tr key={item.commodity_name} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{item.commodity_name}</td>
                    <td className="px-4 py-3 text-slate-500">{item.unit}</td>
                    <td className="px-4 py-3 font-semibold">{formatNumber(item.total_quantity)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${item.low_stock_count > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{item.low_stock_count}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">—</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 dark:bg-slate-700/50 border-t border-slate-200 dark:border-slate-700">
                  <td colSpan={4} className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Total Value</td>
                  <td className="px-4 py-3 font-bold text-green-600">₹{formatNumber(stockSummary?.total_value ?? 0)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </motion.div>
      )}

      {/* Distribution Tab */}
      {activeTab === 'distribution' && (
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex gap-3">
            <select className="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200" value={month} onChange={e => setMonth(parseInt(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleString('default', { month: 'long' })}</option>)}
            </select>
            <select className="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200" value={year} onChange={e => setYear(parseInt(e.target.value))}>
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          {distSummary && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Distributions', value: distSummary.total_distributions },
                { label: 'Completed', value: distSummary.completed },
                { label: 'Rice Distributed (kg)', value: distSummary.total_rice },
                { label: 'Wheat Distributed (kg)', value: distSummary.total_wheat },
              ].map(s => (
                <div key={s.label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                  <p className="text-xs text-slate-500">{s.label}</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatNumber(s.value ?? 0)}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
