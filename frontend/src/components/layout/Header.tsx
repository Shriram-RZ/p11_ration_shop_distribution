import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, Search, Sun, Moon, ChevronDown,
  User, Settings, LogOut, Menu
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { cn, getInitials } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { notificationsApi } from '@/services/api'

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/stock': 'Stock Management',
  '/stock/transactions': 'Stock Transactions',
  '/distributions': 'Distributions',
  '/beneficiaries': 'Beneficiaries',
  '/ration-cards': 'Ration Cards',
  '/warehouses': 'Warehouses',
  '/shops': 'Shops',
  '/reports': 'Reports & Analytics',
  '/audit-logs': 'Audit Logs',
  '/notifications': 'Notifications',
  '/settings': 'Settings',
  '/users': 'User Management',
}

function getBreadcrumbs(pathname: string) {
  const parts = pathname.split('/').filter(Boolean)
  const crumbs: { label: string; path: string }[] = [{ label: 'Home', path: '/dashboard' }]
  let current = ''
  for (const part of parts) {
    current += '/' + part
    const label = routeTitles[current] ?? part.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    crumbs.push({ label, path: current })
  }
  return crumbs
}

interface HeaderProps {
  onMobileMenuToggle: () => void
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, isDarkMode, toggleDarkMode } = useAuthStore()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  const title = routeTitles[location.pathname] ?? 'RationFlow'
  const breadcrumbs = getBreadcrumbs(location.pathname)

  const { data: unreadCount } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: () => notificationsApi.getUnreadCount(),
    refetchInterval: 30_000,
  })

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700/60 flex items-center gap-4 px-4 md:px-6">
      {/* Mobile menu button */}
      <button
        onClick={onMobileMenuToggle}
        className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <Menu size={20} />
      </button>

      {/* Title + Breadcrumb */}
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-slate-800 dark:text-slate-100 truncate">{title}</h1>
        <nav className="hidden sm:flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.path} className="flex items-center gap-1">
              {i > 0 && <span>/</span>}
              {i === breadcrumbs.length - 1 ? (
                <span className="text-slate-600 dark:text-slate-300">{crumb.label}</span>
              ) : (
                <button
                  onClick={() => navigate(crumb.path)}
                  className="hover:text-green-600 dark:hover:text-green-400 transition-colors"
                >
                  {crumb.label}
                </button>
              )}
            </span>
          ))}
        </nav>
      </div>

      {/* Search */}
      <div className="relative hidden md:block">
        <AnimatePresence>
          {searchOpen ? (
            <motion.div
              initial={{ width: 40, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 40, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => { setSearchOpen(false); setSearchQuery('') }}
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-800 dark:text-slate-200 placeholder-slate-400"
              />
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </motion.div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Search size={18} />
            </button>
          )}
        </AnimatePresence>
      </div>

      {/* Notifications */}
      <button
        onClick={() => navigate('/notifications')}
        className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <Bell size={18} />
        {(unreadCount?.count ?? 0) > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center"
          >
            {unreadCount!.count > 9 ? '9+' : unreadCount!.count}
          </motion.span>
        )}
      </button>

      {/* Dark mode toggle */}
      <button
        onClick={toggleDarkMode}
        className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        title={isDarkMode ? 'Light mode' : 'Dark mode'}
      >
        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Profile dropdown */}
      <div ref={profileRef} className="relative">
        <button
          onClick={() => setProfileOpen((v) => !v)}
          className={cn(
            'flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl transition-colors',
            'hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user ? getInitials(user.full_name ?? user.name ?? "U") : 'U'}
          </div>
          <div className="hidden lg:block text-left min-w-0">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate max-w-[120px]">{user?.name ?? 'User'}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 capitalize">{user?.role}</p>
          </div>
          <ChevronDown size={14} className={cn('text-slate-400 transition-transform', profileOpen && 'rotate-180')} />
        </button>

        <AnimatePresence>
          {profileOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 overflow-hidden z-50"
            >
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{user?.name}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{user?.email}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => { setProfileOpen(false); navigate('/settings') }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <User size={15} />
                  Profile
                </button>
                <button
                  onClick={() => { setProfileOpen(false); navigate('/settings') }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <Settings size={15} />
                  Settings
                </button>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-700 py-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut size={15} />
                  Logout
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
