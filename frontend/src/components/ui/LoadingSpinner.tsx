import React from 'react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-slate-200 border-t-green-600',
        sizeMap[size],
        className,
      )}
    />
  )
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64 w-full">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
      </div>
    </div>
  )
}

export function FullPageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-green-600" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading RationFlow…</p>
      </div>
    </div>
  )
}
