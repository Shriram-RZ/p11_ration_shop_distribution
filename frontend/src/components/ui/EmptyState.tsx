import React from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        className,
      )}
    >
      {icon && (
        <div className="mb-4 text-slate-300 dark:text-slate-600">{icon}</div>
      )}
      <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-slate-400 dark:text-slate-500 max-w-sm mb-4">
          {description}
        </p>
      )}
      {action}
    </div>
  )
}
