import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts'
import {
  Users, Package, Truck, AlertTriangle, TrendingUp,
  CheckCircle, Clock, Wheat,
} from 'lucide-react'
import { reportApi } from '@/services/api'
import StatsCard from '@/components/ui/StatsCard'
import { formatNumber } from '@/lib/utils'

const COLORS = ['#16a34a', '#2563eb', '#f59e0b', '#ef4444', '#8b5cf6', '#0891b2']

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: reportApi.getDashboardStats,
    refetchInterval: 30000,
  })

  const statsCards = [
    {
      title: 'Total Beneficiaries',
      value: stats?.total_beneficiaries ?? 0,
      subtitle: `${stats?.active_ration_cards ?? 0} active cards`,
      icon: <Users className="w-5 h-5" />,
      color: 'blue' as const,
      trend: { value: 12, label: 'vs last month', positive: true },
    },
    {
      title: 'Stock Items',
      value: stats?.total_stock_items ?? 0,
      subtitle: `${stats?.low_stock_alerts ?? 0} low stock alerts`,
      icon: <Package className="w-5 h-5" />,
      color: 'green' as const,
      trend: { value: 3, label: 'items added', positive: true },
    },
    {
      title: 'This Month Distributions',
      value: stats?.distributions_this_month ?? 0,
      subtitle: 'Completed this month',
      icon: <Truck className="w-5 h-5" />,
      color: 'teal' as const,
      trend: { value: 8, label: 'vs last month', positive: true },
    },
    {
      title: 'Low Stock Alerts',
      value: stats?.low_stock_alerts ?? 0,
      subtitle: 'Items below minimum',
      icon: <AlertTriangle className="w-5 h-5" />,
      color: stats?.low_stock_alerts && stats.low_stock_alerts > 0 ? 'red' as const : 'green' as const,
      trend: { value: 2, label: 'need restocking', positive: false },
    },
  ]

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Page header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Welcome back! Here's what's happening with your distribution system.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-lg text-sm font-medium">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          System Operational
        </div>
      </motion.div>

      {/* Stats cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card) => (
          <StatsCard key={card.title} {...card} loading={isLoading} />
        ))}
      </motion.div>

      {/* Charts row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly distribution trend */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Distribution Trend</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Monthly commodity distribution (last 6 months)</p>
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats?.monthly_trend ?? []}>
              <defs>
                <linearGradient id="colorRice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorWheat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSugar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, color: '#f8fafc' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Legend />
              <Area type="monotone" dataKey="rice" name="Rice (kg)" stroke="#16a34a" fill="url(#colorRice)" strokeWidth={2} />
              <Area type="monotone" dataKey="wheat" name="Wheat (kg)" stroke="#2563eb" fill="url(#colorWheat)" strokeWidth={2} />
              <Area type="monotone" dataKey="sugar" name="Sugar (kg)" stroke="#f59e0b" fill="url(#colorSugar)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Stock by commodity */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Stock Overview</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">By commodity</p>
            </div>
            <Wheat className="w-5 h-5 text-green-500" />
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={stats?.stock_by_commodity ?? []}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                dataKey="quantity"
                nameKey="name"
              >
                {(stats?.stock_by_commodity ?? []).map((_: any, index: number) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, color: '#f8fafc' }}
                formatter={(val: number, name: string) => [`${formatNumber(val)} kg`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1.5">
            {(stats?.stock_by_commodity ?? []).map((item: any, i: number) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-slate-600 dark:text-slate-300">{item.name}</span>
                </div>
                <span className="font-medium text-slate-900 dark:text-white">
                  {formatNumber(item.quantity)} {item.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Bottom row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* This month summary */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 dark:text-white">This Month's Distribution</h3>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Rice', value: stats?.total_rice_distributed_this_month ?? 0, unit: 'kg', color: 'bg-green-500' },
              { label: 'Wheat', value: stats?.total_wheat_distributed_this_month ?? 0, unit: 'kg', color: 'bg-blue-500' },
              { label: 'Sugar', value: stats?.total_sugar_distributed_this_month ?? 0, unit: 'kg', color: 'bg-amber-500' },
              { label: 'Oil', value: stats?.total_oil_distributed_this_month ?? 0, unit: 'L', color: 'bg-purple-500' },
            ].map((item) => (
              <div key={item.label} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className="text-xs text-slate-500 dark:text-slate-400">{item.label}</span>
                </div>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {formatNumber(item.value)}
                  <span className="text-xs font-normal text-slate-500 ml-1">{item.unit}</span>
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* System stats */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 dark:text-white">System Overview</h3>
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          <div className="space-y-3">
            {[
              { label: 'Total Shops', value: stats?.total_shops ?? 0, sub: `${stats?.active_shops ?? 0} active` },
              { label: 'Warehouses', value: stats?.total_warehouses ?? 0, sub: 'storage locations' },
              { label: 'Staff Users', value: stats?.total_users ?? 0, sub: 'system users' },
              { label: 'Notifications', value: stats?.unread_notifications ?? 0, sub: 'unread' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{item.sub}</p>
                </div>
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {formatNumber(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
