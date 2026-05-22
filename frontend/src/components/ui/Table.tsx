import React from 'react'
import { cn } from '@/lib/utils'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {}

export function Table({ className, children, ...props }: TableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
      <table
        className={cn('w-full text-sm border-collapse', className)}
        {...props}
      >
        {children}
      </table>
    </div>
  )
}

interface TableHeadProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export function TableHead({ className, children, ...props }: TableHeadProps) {
  return (
    <thead
      className={cn(
        'bg-slate-50 dark:bg-slate-900/50 text-left',
        className,
      )}
      {...props}
    >
      {children}
    </thead>
  )
}

interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export function TableBody({ className, children, ...props }: TableBodyProps) {
  return (
    <tbody
      className={cn('divide-y divide-slate-100 dark:divide-slate-800', className)}
      {...props}
    >
      {children}
    </tbody>
  )
}

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  hoverable?: boolean
}

export function TableRow({ className, hoverable = true, children, ...props }: TableRowProps) {
  return (
    <tr
      className={cn(
        'bg-white dark:bg-slate-800 transition-colors',
        hoverable && 'hover:bg-slate-50 dark:hover:bg-slate-700/50',
        className,
      )}
      {...props}
    >
      {children}
    </tr>
  )
}

interface ThProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean
  sortDirection?: 'asc' | 'desc' | null
  onSort?: () => void
}

export function Th({ className, sortable, sortDirection, onSort, children, ...props }: ThProps) {
  return (
    <th
      className={cn(
        'px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider',
        sortable && 'cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-200',
        className,
      )}
      onClick={sortable ? onSort : undefined}
      {...props}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortable && (
          <span className="text-slate-400">
            {sortDirection === 'asc' ? (
              <ChevronUp size={14} />
            ) : sortDirection === 'desc' ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronsUpDown size={14} />
            )}
          </span>
        )}
      </div>
    </th>
  )
}

interface TdProps extends React.TdHTMLAttributes<HTMLTableCellElement> {}

export function Td({ className, children, ...props }: TdProps) {
  return (
    <td
      className={cn(
        'px-4 py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap',
        className,
      )}
      {...props}
    >
      {children}
    </td>
  )
}

// Empty state row
export function TableEmpty({
  colSpan,
  message = 'No data found.',
}: {
  colSpan: number
  message?: string
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-4 py-12 text-center text-sm text-slate-400 dark:text-slate-500"
      >
        {message}
      </td>
    </tr>
  )
}
