import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, parseISO } from 'date-fns'

/** Merge Tailwind class names, resolving conflicts. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

function toDate(value: string | Date): Date {
  return typeof value === 'string' ? parseISO(value) : value
}

/** Format a date (string or Date) using a date-fns pattern. */
export function formatDate(
  value: string | Date,
  pattern = 'MMM dd, yyyy'
): string {
  try {
    return format(toDate(value), pattern)
  } catch {
    return '—'
  }
}

/** Human-friendly relative time, e.g. "3 hours ago". */
export function formatRelative(value: string | Date): string {
  try {
    return formatDistanceToNow(toDate(value), { addSuffix: true })
  } catch {
    return '—'
  }
}

/** Format a number with locale grouping separators. */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '0'
  return value.toLocaleString('en-IN')
}

/** Derive up-to-two-letter initials from a full name. */
export function getInitials(name: string): string {
  if (!name) return 'U'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
