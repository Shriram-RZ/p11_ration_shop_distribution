import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { ShoppingCart, Store, Package, LogOut, Wheat } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import { cn, getInitials } from '@/lib/utils'

export default function CustomerLayout() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const count = useCartStore((s) => s.totalItems())

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItem = (to: string, label: string, icon: React.ReactNode) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          isActive
            ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
        )
      }
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </NavLink>
  )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-800/90 backdrop-blur border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
              <Wheat size={18} className="text-white" />
            </div>
            <div className="leading-tight">
              <p className="font-bold text-slate-800 dark:text-slate-100">RationFlow</p>
              <p className="text-[11px] text-slate-400 -mt-0.5">Store</p>
            </div>
          </div>

          <nav className="flex items-center gap-1">
            {navItem('/shop', 'Shop', <Store size={16} />)}
            {navItem('/orders', 'My Orders', <Package size={16} />)}
            <NavLink
              to="/cart"
              className={({ isActive }) =>
                cn(
                  'relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                )
              }
            >
              <ShoppingCart size={16} />
              <span className="hidden sm:inline">Cart</span>
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                  {count}
                </span>
              )}
            </NavLink>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-600 text-white text-xs font-semibold flex items-center justify-center">
                {user ? getInitials(user.full_name ?? 'U') : 'U'}
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-300 max-w-[120px] truncate">
                {user?.full_name}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 transition-colors"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
