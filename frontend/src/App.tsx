import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'

import Layout from '@/components/layout/Layout'
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import Dashboard from '@/pages/Dashboard'
import Stock from '@/pages/Stock'
import StockTransactions from '@/pages/StockTransactions'
import Distributions from '@/pages/Distributions'
import Beneficiaries from '@/pages/Beneficiaries'
import RationCards from '@/pages/RationCards'
import Warehouses from '@/pages/Warehouses'
import Shops from '@/pages/Shops'
import Notifications from '@/pages/Notifications'
import Reports from '@/pages/Reports'
import AuditLogs from '@/pages/AuditLogs'
import Users from '@/pages/Users'
import Settings from '@/pages/Settings'

import CustomerLayout from '@/pages/customer/CustomerLayout'
import Storefront from '@/pages/customer/Storefront'
import Cart from '@/pages/customer/Cart'
import MyOrders from '@/pages/customer/MyOrders'

function homeFor(role?: string) {
  return role === 'customer' ? '/shop' : '/dashboard'
}

// Sends an authenticated user to their role's home, otherwise to login.
function RoleHome() {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Navigate to={homeFor(user?.role)} replace />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore()
  if (isAuthenticated) return <Navigate to={homeFor(user?.role)} replace />
  return <>{children}</>
}

// Staff/admin-only area.
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role === 'customer') return <Navigate to="/shop" replace />
  return <>{children}</>
}

// Customer-only storefront area.
function CustomerRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'customer') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  const { initialize, isDarkMode } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  return (
    <BrowserRouter>
      <AnimatePresence mode="wait">
        <Routes>
          {/* Public landing page */}
          <Route path="/" element={<LandingPage />} />

          {/* Public */}
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

          {/* Customer storefront */}
          <Route
            element={
              <CustomerRoute>
                <CustomerLayout />
              </CustomerRoute>
            }
          >
            <Route path="/shop" element={<Storefront />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/orders" element={<MyOrders />} />
          </Route>

          {/* Admin / staff */}
          <Route
            element={
              <AdminRoute>
                <Layout />
              </AdminRoute>
            }
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="stock" element={<Stock />} />
            <Route path="stock/transactions" element={<StockTransactions />} />
            <Route path="distributions" element={<Distributions />} />
            <Route path="beneficiaries" element={<Beneficiaries />} />
            <Route path="ration-cards" element={<RationCards />} />
            <Route path="warehouses" element={<Warehouses />} />
            <Route path="shops" element={<Shops />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="reports" element={<Reports />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="users" element={<Users />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<RoleHome />} />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  )
}
