import React from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'secondary'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  secondary: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}

// Status-specific helper badges
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    active: { variant: 'success', label: 'Active' },
    inactive: { variant: 'secondary', label: 'Inactive' },
    suspended: { variant: 'warning', label: 'Suspended' },
    cancelled: { variant: 'danger', label: 'Cancelled' },
    pending: { variant: 'info', label: 'Pending' },
    completed: { variant: 'success', label: 'Completed' },
    in_progress: { variant: 'info', label: 'In Progress' },
    scheduled: { variant: 'default', label: 'Scheduled' },
  }

  const config = map[status] ?? { variant: 'default' as BadgeVariant, label: status }
  return <Badge variant={config.variant}>{config.label}</Badge>
}

export function CategoryBadge({ category }: { category: string }) {
  const map: Record<string, BadgeVariant> = {
    APL: 'default',
    BPL: 'warning',
    AAY: 'danger',
    PHH: 'info',
  }

  return (
    <Badge variant={map[category] ?? 'default'}>
      {category}
    </Badge>
  )
}
