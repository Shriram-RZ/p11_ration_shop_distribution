import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Package, Truck, Users, CreditCard,
  Warehouse, Store, BarChart3, ScrollText, Bell, Settings,
  LogOut, ChevronLeft, ChevronRight, Shield, Wheat, FileText
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/utils'

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
  adminOnly?: boolean
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: 'OVERVIEW',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
    ],
  },
  {
    title: 'OPERATIONS',
    items: [
      { label: 'Stock', path: '/stock', icon: <Package size={18} /> },
      { label: 'Distributions', path: '/distributions', icon: <Truck size={18} /> },
      { label: 'Beneficiaries', path: '/beneficiaries', icon: <Users size={18} /> },
      { label: 'Ration Cards', path: '/ration-cards', icon: <CreditCard size={18} /> },
    ],
  },
  {
    title: 'MANAGEMENT',
    items: [
      { label: 'Warehouses', path: '/warehouses', icon: <Warehouse size={18} /> },
      { label: 'Shops', path: '/shops', icon: <Store size={18} /> },
    ],
  },
  {
    title: 'ANALYTICS',
    items: [
      { label: 'Reports', path: '/reports', icon: <BarChart3 size={18} /> },
      { label: 'Audit Logs', path: '/audit-logs', icon: <ScrollText size={18} /> },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { label: 'Notifications', path: '/notifications', icon: <Bell size={18} /> },
      { label: 'Settings', path: '/settings', icon: <Settings size={18} /> },
      { label: 'Users', path: '/users', icon: <Shield size={18} />, adminOnly: true },
    ],
  },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/')

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        'flex items-center h-16 px-4 border-b border-slate-200 dark:border-slate-700/60',
        collapsed ? 'justify-center' : 'gap-3'
      )}>
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
          <Wheat size={20} className="text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p className="font-bold text-lg gradient-text leading-none whitespace-nowrap">RationFlow</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 whitespace-nowrap">Distribution System</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navSections.map((section) => {
          const visibleItems = section.items.filter(
            (item) => !item.adminOnly || user?.role === 'admin'
          )
          if (visibleItems.length === 0) return null

          return (
            <div key={section.title} className="mb-2">
              <AnimatePresence>
                {!collapsed && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider px-3 mb-1.5"
                  >
                    {section.title}
                  </motion.p>
                )}
              </AnimatePresence>
              {visibleItems.map((item) => {
                const active = isActive(item.path)
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onMobileClose}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'flex items-center rounded-xl transition-all duration-150 relative group',
                      collapsed ? 'justify-center p-2.5 mx-1' : 'gap-3 px-3 py-2.5',
                      active
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-800 dark:hover:text-slate-200'
                    )}
                  >
                    {active && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-green-500 rounded-r-full"
                      />
                    )}
                    <span className={cn(
                      'flex-shrink-0 transition-colors',
                      active ? 'text-green-600 dark:text-green-400' : ''
                    )}>
                      {item.icon}
                    </span>
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          className="text-sm font-medium overflow-hidden whitespace-nowrap"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {collapsed && (
                      <div className="absolute left-full ml-3 px-2 py-1 bg-slate-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                        {item.label}
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* User info + logout */}
      <div className="border-t border-slate-200 dark:border-slate-700/60 p-3">
        <div className={cn(
          'flex items-center rounded-xl',
          collapsed ? 'justify-center p-2' : 'gap-3 p-2'
        )}>
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold">
            {user ? getInitials(user.full_name ?? user.name ?? "U") : 'U'}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="flex-1 overflow-hidden min-w-0"
              >
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{user?.name ?? 'User'}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 truncate capitalize">{user?.role ?? 'staff'}</p>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {!collapsed && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleLogout}
                title="Logout"
                className="flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut size={16} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        {collapsed && (
          <button
            onClick={handleLogout}
            title="Logout"
            className="mt-2 w-full flex justify-center p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut size={16} />
          </button>
        )}
      </div>

      {/* Collapse toggle (desktop) */}
      <div className="px-3 pb-3">
        <button
          onClick={onToggle}
          className={cn(
            'w-full flex items-center justify-center p-2 rounded-xl',
            'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300',
            'hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors'
          )}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && <span className="ml-2 text-xs">Collapse</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="hidden md:flex flex-col h-screen sticky top-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700/60 overflow-hidden z-30 flex-shrink-0"
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
              onClick={onMobileClose}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700/60 z-50 md:hidden overflow-hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
