import axios, { AxiosError } from 'axios'
import type {
  User,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  Product,
  Order,
  CardInfo,
  AdminOrder,
  ChangePasswordRequest,
  RationCardHolder,
  RationCard,
  Commodity,
  StockItem,
  StockTransaction,
  StockAlert,
  Distribution,
  MonthlySummary,
  Warehouse,
  Shop,
  Notification,
  AuditLog,
  DashboardStats,
  PaginatedResponse,
  FilterParams,
} from '@/types'

// ─── Axios Instance ────────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

// Request interceptor – attach JWT
api.interceptors.request.use((config) => {
  // Zustand persist stores state under the key 'rationflow-auth'
  try {
    const stored = localStorage.getItem('rationflow-auth')
    if (stored) {
      const parsed = JSON.parse(stored)
      const token = parsed?.state?.token
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
  } catch (_) {
    // ignore parse errors
  }
  return config
})

// Response interceptor – handle 401
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

// ─── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<LoginResponse>('/auth/login', data).then((r) => r.data),

  register: (data: RegisterRequest) =>
    api.post<LoginResponse>('/auth/register', data).then((r) => r.data),

  logout: () =>
    api.post('/auth/logout').then((r) => r.data),

  getMe: () =>
    api.get<User>('/auth/me').then((r) => r.data),

  changePassword: (data: ChangePasswordRequest) =>
    api.post('/auth/change-password', data).then((r) => r.data),

  refreshToken: () =>
    api.post<LoginResponse>('/auth/refresh').then((r) => r.data),
}

// ─── Storefront (customer side) ──────────────────────────────────────────────

export const storeApi = {
  getProducts: () =>
    api.get<Product[]>('/store/products').then((r) => r.data),

  createOrder: (data: {
    items: { commodity_id: number; quantity: number }[]
    delivery_address?: string
    contact_phone?: string
  }) => api.post<Order>('/store/orders', data).then((r) => r.data),

  getMyOrders: () =>
    api.get<Order[]>('/store/orders').then((r) => r.data),

  getMyCard: () =>
    api.get<CardInfo>('/store/me/card').then((r) => r.data),
}

// ─── Admin Orders ────────────────────────────────────────────────────────────

export const adminOrdersApi = {
  getAll: (params?: { status_filter?: string; category?: string; q?: string }) =>
    api.get<AdminOrder[]>('/orders', { params }).then((r) => r.data),

  updateStatus: (id: number, status: string) =>
    api.patch<AdminOrder>(`/orders/${id}/status`, { status }).then((r) => r.data),
}

// ─── Users ─────────────────────────────────────────────────────────────────────

export const usersApi = {
  getAll: (params?: FilterParams) =>
    api.get<PaginatedResponse<User>>('/users', { params }).then((r) => r.data),

  getById: (id: string) =>
    api.get<User>(`/users/${id}`).then((r) => r.data),

  create: (data: Partial<User> & { password: string }) =>
    api.post<User>('/users', data).then((r) => r.data),

  update: (id: string, data: Partial<User>) =>
    api.put<User>(`/users/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/users/${id}`).then((r) => r.data),

  toggleActive: (id: string) =>
    api.patch<User>(`/users/${id}/toggle-active`).then((r) => r.data),
}

// ─── Beneficiaries ─────────────────────────────────────────────────────────────

export const beneficiariesApi = {
  getAll: (params?: FilterParams) =>
    api
      .get<PaginatedResponse<RationCardHolder>>('/beneficiaries', { params })
      .then((r) => r.data),

  getById: (id: string) =>
    api.get<RationCardHolder>(`/beneficiaries/${id}`).then((r) => r.data),

  create: (data: Partial<RationCardHolder>) =>
    api.post<RationCardHolder>('/beneficiaries', data).then((r) => r.data),

  update: (id: string, data: Partial<RationCardHolder>) =>
    api.put<RationCardHolder>(`/beneficiaries/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/beneficiaries/${id}`).then((r) => r.data),

  getHistory: (id: string) =>
    api
      .get<Distribution[]>(`/beneficiaries/${id}/history`)
      .then((r) => r.data),

  search: (query: string) =>
    api
      .get<RationCardHolder[]>('/beneficiaries/search', { params: { q: query } })
      .then((r) => r.data),
}

// ─── Ration Cards ──────────────────────────────────────────────────────────────

export const rationCardsApi = {
  getAll: (params?: FilterParams) =>
    api
      .get<PaginatedResponse<RationCard>>('/ration-cards', { params })
      .then((r) => r.data),

  getById: (id: string) =>
    api.get<RationCard>(`/ration-cards/${id}`).then((r) => r.data),

  create: (data: Partial<RationCard>) =>
    api.post<RationCard>('/ration-cards', data).then((r) => r.data),

  update: (id: string, data: Partial<RationCard>) =>
    api.put<RationCard>(`/ration-cards/${id}`, data).then((r) => r.data),

  updateStatus: (id: string, status: string, reason?: string) =>
    api
      .patch(`/ration-cards/${id}/status`, { status, reason })
      .then((r) => r.data),

  search: (cardNumber: string) =>
    api
      .get<RationCard>(`/ration-cards/search/${encodeURIComponent(cardNumber)}`)
      .then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/ration-cards/${id}`).then((r) => r.data),
}

// ─── Stock ─────────────────────────────────────────────────────────────────────

export const stockApi = {
  getItems: (params?: FilterParams) =>
    api
      .get<PaginatedResponse<StockItem>>('/stock/items', { params })
      .then((r) => r.data),

  createItem: (data: Partial<StockItem>) =>
    api.post<StockItem>('/stock/items', data).then((r) => r.data),

  updateItem: (id: string, data: Partial<StockItem>) =>
    api.put<StockItem>(`/stock/items/${id}`, data).then((r) => r.data),

  deleteItem: (id: number) =>
    api.delete(`/stock/items/${id}`).then((r) => r.data),

  adjustStock: (id: string, amount: number, notes: string) =>
    api
      .post<StockItem>(`/stock/items/${id}/adjust`, { quantity: amount, notes, transaction_type: 'adjusted' })
      .then((r) => r.data),

  getTransactions: (params?: FilterParams) =>
    api
      .get<PaginatedResponse<StockTransaction>>('/stock/transactions', { params })
      .then((r) => r.data),

  createTransaction: (data: Partial<StockTransaction>) =>
    api
      .post<StockTransaction>('/stock/transactions', data)
      .then((r) => r.data),

  getLowAlerts: () =>
    api.get<StockAlert[]>('/stock/low-alerts').then((r) => r.data),

  getCommodities: (params?: FilterParams) =>
    api
      .get<Commodity[]>('/stock/commodities', { params })
      .then((r) => r.data),

  createCommodity: (data: Partial<Commodity>) =>
    api.post<Commodity>('/stock/commodities', data).then((r) => r.data),

  updateCommodity: (id: string, data: Partial<Commodity>) =>
    api.put<Commodity>(`/stock/commodities/${id}`, data).then((r) => r.data),
}

// ─── Distributions ─────────────────────────────────────────────────────────────

export const distributionsApi = {
  getAll: (params?: FilterParams) =>
    api
      .get<PaginatedResponse<Distribution>>('/distributions', { params })
      .then((r) => r.data),

  getById: (id: string) =>
    api.get<Distribution>(`/distributions/${id}`).then((r) => r.data),

  create: (data: Partial<Distribution>) =>
    api.post<Distribution>('/distributions', data).then((r) => r.data),

  updateStatus: (id: string, status: string, remarks?: string) =>
    api
      .patch<Distribution>(`/distributions/${id}/status`, { status, remarks })
      .then((r) => r.data),

  getMonthlySummary: (month: number, year: number) =>
    api
      .get<MonthlySummary>('/distributions/summary', { params: { month, year } })
      .then((r) => r.data),

  getByShop: (shopId: string, params?: FilterParams) =>
    api
      .get<PaginatedResponse<Distribution>>(`/shops/${shopId}/distributions`, { params })
      .then((r) => r.data),
}

// ─── Warehouses ────────────────────────────────────────────────────────────────

export const warehousesApi = {
  getAll: (params?: FilterParams) =>
    api
      .get<PaginatedResponse<Warehouse>>('/warehouses', { params })
      .then((r) => r.data),

  getById: (id: string) =>
    api.get<Warehouse>(`/warehouses/${id}`).then((r) => r.data),

  create: (data: Partial<Warehouse>) =>
    api.post<Warehouse>('/warehouses', data).then((r) => r.data),

  update: (id: string, data: Partial<Warehouse>) =>
    api.put<Warehouse>(`/warehouses/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/warehouses/${id}`).then((r) => r.data),

  getStock: (id: string) =>
    api.get<StockItem[]>(`/warehouses/${id}/stock`).then((r) => r.data),
}

// ─── Shops ─────────────────────────────────────────────────────────────────────

export const shopsApi = {
  getAll: (params?: FilterParams) =>
    api
      .get<PaginatedResponse<Shop>>('/shops', { params })
      .then((r) => r.data),

  getById: (id: string) =>
    api.get<Shop>(`/shops/${id}`).then((r) => r.data),

  create: (data: Partial<Shop>) =>
    api.post<Shop>('/shops', data).then((r) => r.data),

  update: (id: string, data: Partial<Shop>) =>
    api.put<Shop>(`/shops/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/shops/${id}`).then((r) => r.data),

  getStock: (id: string) =>
    api.get<StockItem[]>(`/shops/${id}/stock`).then((r) => r.data),

  getBeneficiaries: (id: string, params?: FilterParams) =>
    api
      .get<PaginatedResponse<RationCardHolder>>(`/shops/${id}/beneficiaries`, { params })
      .then((r) => r.data),
}

// ─── Notifications ─────────────────────────────────────────────────────────────

export const notificationsApi = {
  getAll: (params?: FilterParams) =>
    api
      .get<PaginatedResponse<Notification>>('/notifications', { params })
      .then((r) => r.data),

  create: (data: Partial<Notification>) =>
    api.post<Notification>('/notifications', data).then((r) => r.data),

  markRead: (id: string) =>
    api.patch(`/notifications/${id}/read`).then((r) => r.data),

  markAllRead: () =>
    api.post('/notifications/mark-all-read').then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/notifications/${id}`).then((r) => r.data),

  getUnreadCount: () =>
    api.get<{ count: number }>('/notifications/unread-count').then((r) => r.data),
}

// ─── Reports ───────────────────────────────────────────────────────────────────

export const reportsApi = {
  getDashboardStats: () =>
    api.get<DashboardStats>('/reports/dashboard-stats').then((r) => r.data),

  getStockSummary: (params?: FilterParams) =>
    api.get('/reports/stock-summary', { params }).then((r) => r.data),

  getDistributionSummary: (params?: FilterParams) =>
    api.get('/reports/distribution-summary', { params }).then((r) => r.data),

  exportCSV: (resource: string, params?: FilterParams) =>
    api
      .get(`/reports/export/csv`, {
        params: { resource, ...params },
        responseType: 'blob',
      })
      .then((r) => r.data),

  generateMonthly: (month: number, year: number) =>
    api
      .post('/reports/generate-monthly', { month, year })
      .then((r) => r.data),
}

// ─── Audit Logs ────────────────────────────────────────────────────────────────

export const auditLogsApi = {
  getAll: (params?: FilterParams) =>
    api
      .get<PaginatedResponse<AuditLog>>('/audit/logs', { params })
      .then((r) => r.data),
}

// ─── Unified api object (convenience) ─────────────────────────────────────────
export const apiService = {
  auth: authApi,
  users: usersApi,
  beneficiaries: beneficiariesApi,
  rationCards: rationCardsApi,
  stock: stockApi,
  distributions: distributionsApi,
  warehouses: warehousesApi,
  shops: shopsApi,
  notifications: notificationsApi,
  reports: reportsApi,
  auditLogs: auditLogsApi,
}

export default api

// ─── Aliases for page imports ──────────────────────────────────────────────────

// Named convenience re-exports matching page import expectations
export const warehouseApi = {
  getAll: (params?: any) => warehousesApi.getAll(params),
  getById: (id: number) => warehousesApi.getById(String(id)),
  create: (data: any) => warehousesApi.create(data),
  update: (id: number, data: any) => warehousesApi.update(String(id), data),
  delete: (id: number) => warehousesApi.delete(String(id)),
  getStock: (id: number) => warehousesApi.getStock(String(id)),
}

export const shopApi = {
  getAll: (params?: any) => shopsApi.getAll(params),
  getById: (id: number) => shopsApi.getById(String(id)),
  create: (data: any) => shopsApi.create(data),
  update: (id: number, data: any) => shopsApi.update(String(id), data),
  delete: (id: number) => shopsApi.delete(String(id)),
}

export const beneficiaryApi = {
  getAll: (params?: any) => beneficiariesApi.getAll(params),
  getById: (id: number) => beneficiariesApi.getById(String(id)),
  create: (data: any) => beneficiariesApi.create(data),
  update: (id: number, data: any) => beneficiariesApi.update(String(id), data),
  delete: (id: number) => beneficiariesApi.delete(String(id)),
}

export const rationCardApi = {
  getAll: (params?: any) => rationCardsApi.getAll(params),
  getById: (id: number) => rationCardsApi.getById(String(id)),
  create: (data: any) => rationCardsApi.create(data),
  update: (id: number, data: any) => rationCardsApi.update(String(id), data),
  delete: (id: number) => rationCardsApi.delete(String(id)),
  search: (cardNumber: string) => rationCardsApi.search(cardNumber),
}

export const distributionApi = {
  getAll: (params?: any) => distributionsApi.getAll(params),
  getById: (id: number) => distributionsApi.getById(String(id)),
  create: (data: any) => distributionsApi.create(data),
  updateStatus: (id: number, status: string) => distributionsApi.updateStatus(String(id), status),
}

export const notificationApi = {
  getAll: (params?: any) => notificationsApi.getAll(params),
  create: (data: any) => notificationsApi.create(data),
  markRead: (id: number) => notificationsApi.markRead(String(id)),
  markAllRead: () => notificationsApi.markAllRead(),
  delete: (id: number) => notificationsApi.delete(String(id)),
}

export const reportApi = {
  getDashboardStats: () => reportsApi.getDashboardStats(),
  getStockSummary: () => reportsApi.getStockSummary(),
  getDistributionSummary: (month: number, year: number) => reportsApi.getDistributionSummary({ month, year }),
  exportCSV: (resource: string) => reportsApi.exportCSV(resource).then((data: any) => new Blob([data], { type: 'text/csv' })),
}

export const userApi = {
  getAll: (params?: any) => usersApi.getAll(params),
  create: (data: any) => usersApi.create(data),
  update: (id: number, data: any) => usersApi.update(String(id), data),
  delete: (id: number) => usersApi.delete(String(id)),
}

export const auditApi = {
  getLogs: (params?: any) => auditLogsApi.getAll(params),
}
