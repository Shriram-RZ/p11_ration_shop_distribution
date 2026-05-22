import React from 'react'
import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  max?: number
  color?: 'green' | 'blue' | 'amber' | 'red' | 'purple'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

const colorMap = {
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
}

const sizeMap = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
}

export function ProgressBar({
  value,
  max = 100,
  color = 'green',
  size = 'md',
  showLabel = false,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  const autoColor =
    percentage < 25 ? 'red' : percentage < 50 ? 'amber' : color

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'flex-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden',
          sizeMap[size],
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            colorMap[autoColor],
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 w-10 text-right">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  )
}
