import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  trend?: number | { value: number; label: string; positive: boolean }
  trendLabel?: string
  color?: 'green' | 'blue' | 'amber' | 'red' | 'purple' | 'cyan' | 'teal' | 'orange'
  loading?: boolean
  className?: string
}

const colorMap = {
  green: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    icon: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400',
    value: 'text-green-700 dark:text-green-400',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    icon: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
    value: 'text-blue-700 dark:text-blue-400',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    icon: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
    value: 'text-amber-700 dark:text-amber-400',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    icon: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
    value: 'text-red-700 dark:text-red-400',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    icon: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400',
    value: 'text-purple-700 dark:text-purple-400',
  },
  cyan: {
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    icon: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400',
    value: 'text-cyan-700 dark:text-cyan-400',
  },
  teal: {
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    icon: 'bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400',
    value: 'text-teal-700 dark:text-teal-400',
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    icon: 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400',
    value: 'text-orange-700 dark:text-orange-400',
  },
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendLabel,
  color = 'green',
  loading = false,
  className,
}: StatsCardProps) {
  const colors = colorMap[color as keyof typeof colorMap] ?? colorMap.green
  const trendNum = typeof trend === 'object' ? trend?.value : trend
  const trendIsPositive = trendNum !== undefined && trendNum > 0
  const trendIsNegative = trendNum !== undefined && trendNum < 0
  const trendIsNeutral = trendNum !== undefined && trendNum === 0
  const trendLabel2 = trendLabel ?? (typeof trend === 'object' ? trend?.label : undefined)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700',
        'p-5 shadow-card hover:shadow-card-hover transition-shadow duration-200',
        className,
      )}
    >
      {loading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
          <div className="h-7 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {title}
              </p>
              <p className={cn('text-2xl font-bold mt-1.5', colors.value)}>
                {value}
              </p>
              {subtitle && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>
              )}
            </div>
            <div className={cn('p-2.5 rounded-xl flex-shrink-0', colors.icon)}>
              {icon}
            </div>
          </div>

          {trendNum !== undefined && (
            <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
              {trendIsPositive && <TrendingUp size={14} className="text-green-500" />}
              {trendIsNegative && <TrendingDown size={14} className="text-red-500" />}
              {trendIsNeutral && <Minus size={14} className="text-slate-400" />}
              <span className={cn('text-xs font-medium', trendIsPositive && 'text-green-600 dark:text-green-400', trendIsNegative && 'text-red-500 dark:text-red-400', trendIsNeutral && 'text-slate-400')}>
                {(trendNum ?? 0) > 0 ? '+' : ''}{trendNum}%
              </span>
              {trendLabel2 && (
                <span className="text-xs text-slate-400 dark:text-slate-500">{trendLabel2}</span>
              )}
            </div>
          )}
        </>
      )}
    </motion.div>
  )
}
export default StatsCard
