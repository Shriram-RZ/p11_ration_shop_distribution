// ─── Auth & Users ───────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'shop_manager' | 'distribution_staff' | 'supervisor' | 'shopkeeper' | 'inspector' | 'customer'

export interface RegisterRequest {
  aadhaar_number: string
  card_number: string
  phone: string
  password: string
}

// ─── Storefront (customer side) ───────────────────────────────────────────────

export interface Product {
  commodity_id: number
  name: string
  unit: string
  description?: string
  price: number
  available_quantity: number
  allocated_quota: number
  remaining_quota: number
}

export interface QuotaLine {
  commodity_id: number
  name: string
  unit: string
  allocated: number
  used: number
  remaining: number
}

export interface CardInfo {
  card_number: string
  aadhaar_number: string
  family_name: string
  family_members: number
  category: RationCardCategory
  status: RationCardStatus
  district: string
  state: string
  quota: QuotaLine[]
}

export interface AdminOrder {
  id: number
  order_number: string
  customer_name: string
  card_number?: string
  aadhaar_number?: string
  category?: RationCardCategory
  total_amount: number
  total_quantity: number
  status: string
  created_at: string
  items: OrderItem[]
}

export interface CartItem {
  commodity_id: number
  name: string
  unit: string
  price: number
  quantity: number
  available_quantity: number
}

export interface OrderItem {
  commodity_id: number | null
  commodity_name: string
  unit: string
  quantity: number
  unit_price: number
  subtotal: number
}

export interface Order {
  id: number
  order_number: string
  customer_id: number
  total_amount: number
  status: string
  delivery_address?: string
  contact_phone?: string
  created_at: string
  items: OrderItem[]
}

export interface User {
  id: number | string
  name?: string
  full_name?: string
  email: string
  role: UserRole
  phone?: string
  shopId?: string
  shop_id?: number
  warehouseId?: string
  isActive?: boolean
  is_active?: boolean
  createdAt?: string
  created_at?: string
  updatedAt?: string
  updated_at?: string
  lastLogin?: string
  last_login?: string
  avatar?: string
}

export interface LoginRequest {
  identifier: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user_id: number
  email?: string
  full_name: string
  role: UserRole
  card_number?: string
  category?: RationCardCategory
}

export interface ChangePasswordRequest {
  current_password: string
  new_password: string
}

// ─── Ration Cards & Beneficiaries ────────────────────────────────────────────

export type RationCardCategory = 'APL' | 'BPL' | 'AAY' | 'PHH'
export type RationCardStatus = 'active' | 'suspended' | 'cancelled' | 'pending'

export interface FamilyMember {
  id: string
  name: string
  age: number
  gender: 'male' | 'female' | 'other'
  relation: string
  aadharNumber?: string
}

export interface RationCardHolder {
  id: number | string
  name?: string
  full_name?: string
  rationCardNumber?: string
  aadhaar_number?: string
  category: RationCardCategory
  status?: RationCardStatus
  is_active?: boolean
  phone?: string
  email?: string
  address: string
  district: string
  state: string
  pincode: string
  aadharNumber?: string
  familyMembers?: FamilyMember[]
  familySize?: number
  shopId?: string
  shopName?: string
  monthlyEntitlement?: Record<string, number>
  createdAt?: string
  created_at?: string
  updatedAt?: string
  updated_at?: string
}

export interface RationCard {
  id: number | string
  cardNumber?: string
  card_number?: string
  holderId?: string
  holder_id?: number
  holderName?: string
  holder?: RationCardHolder
  shop_id?: number
  shopId?: string
  category?: RationCardCategory
  status?: RationCardStatus
  issueDate?: string
  issued_date?: string
  expiryDate?: string
  expiry_date?: string
  family_size?: number
  familySize?: number
  monthly_entitlement_rice?: number
  monthly_entitlement_wheat?: number
  monthly_entitlement_sugar?: number
  monthly_entitlement_oil?: number
  lastUpdated?: string
  created_at?: string
  updated_at?: string
}

// ─── Commodities & Stock ─────────────────────────────────────────────────────

export type CommodityUnit = 'kg' | 'litre' | 'unit' | 'quintal'

export interface Commodity {
  id: string
  name: string
  code: string
  unit: CommodityUnit
  category: 'grain' | 'pulses' | 'oil' | 'sugar' | 'other'
  pricePerUnit: number
  description?: string
  isActive: boolean
  createdAt: string
}

export interface StockItem {
  id: string
  commodityId: string
  commodityName: string
  commodityCode: string
  unit: CommodityUnit
  warehouseId?: string
  shopId?: string
  currentQuantity: number
  minThreshold: number
  maxCapacity: number
  lastUpdated: string
  batchNumber?: string
  expiryDate?: string
  pricePerUnit: number
}

export type TransactionType = 'inward' | 'outward' | 'adjustment' | 'transfer' | 'damage' | 'return'

export interface StockTransaction {
  id: string
  commodityId: string
  commodityName: string
  transactionType: TransactionType
  quantity: number
  unit: CommodityUnit
  warehouseId?: string
  warehouseName?: string
  shopId?: string
  shopName?: string
  referenceNumber?: string
  remarks?: string
  performedBy: string
  performedByName?: string
  createdAt: string
  previousQuantity: number
  newQuantity: number
}

export interface StockAlert {
  id: string
  commodityId: string
  commodityName: string
  shopId?: string
  shopName?: string
  warehouseId?: string
  warehouseName?: string
  currentQuantity: number
  minThreshold: number
  alertType: 'low_stock' | 'out_of_stock' | 'expiry_soon'
  severity: 'critical' | 'warning' | 'info'
  createdAt: string
}

// ─── Distributions ────────────────────────────────────────────────────────────

export type DistributionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'

export interface DistributionItem {
  commodityId: string
  commodityName: string
  unit: CommodityUnit
  plannedQuantity: number
  distributedQuantity: number
  pricePerUnit: number
}

export interface Distribution {
  id: string
  month: number
  year: number
  shopId: string
  shopName: string
  status: DistributionStatus
  items: DistributionItem[]
  totalBeneficiaries: number
  servedBeneficiaries: number
  scheduledDate: string
  completedDate?: string
  createdBy: string
  createdByName?: string
  createdAt: string
  updatedAt: string
  remarks?: string
}

export interface MonthlySummary {
  month: number
  year: number
  totalDistributions: number
  completedDistributions: number
  totalBeneficiaries: number
  totalQuantityDistributed: Record<string, number>
  totalValue: number
}

// ─── Warehouses ───────────────────────────────────────────────────────────────

export interface Warehouse {
  id: string
  name: string
  code: string
  address: string
  district: string
  state: string
  pincode: string
  contactPerson: string
  phone: string
  email?: string
  capacity: number
  currentUtilization: number
  isActive: boolean
  managerId?: string
  managerName?: string
  createdAt: string
  updatedAt: string
}

// ─── Shops ────────────────────────────────────────────────────────────────────

export type ShopStatus = 'active' | 'inactive' | 'suspended'

export interface Shop {
  id: string
  name: string
  shopNumber: string
  address: string
  district: string
  state: string
  pincode: string
  contactPerson: string
  phone: string
  email?: string
  warehouseId: string
  warehouseName?: string
  shopkeeperId?: string
  shopkeeperName?: string
  status: ShopStatus
  totalBeneficiaries: number
  createdAt: string
  updatedAt: string
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationType =
  | 'low_stock'
  | 'distribution_reminder'
  | 'system_alert'
  | 'new_beneficiary'
  | 'card_expiry'
  | 'audit_alert'
  | 'general'

export interface Notification {
  id: string
  title: string
  message: string
  type: NotificationType
  isRead: boolean
  createdAt: string
  userId?: string
  relatedId?: string
  relatedType?: string
  priority: 'high' | 'medium' | 'low'
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string
  userId: string
  userName: string
  userRole: UserRole
  action: string
  module: string
  entityId?: string
  entityType?: string
  oldValue?: Record<string, unknown>
  newValue?: Record<string, unknown>
  ipAddress: string
  userAgent?: string
  createdAt: string
  status: 'success' | 'failure'
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export interface DashboardStats {
  // snake_case from backend
  total_beneficiaries: number
  total_ration_cards: number
  active_ration_cards: number
  total_shops: number
  active_shops: number
  total_warehouses: number
  total_stock_items: number
  low_stock_alerts: number
  distributions_this_month: number
  total_rice_distributed_this_month: number
  total_wheat_distributed_this_month: number
  total_sugar_distributed_this_month: number
  total_oil_distributed_this_month: number
  total_users: number
  unread_notifications: number
  monthly_trend: MonthlyTrendData[]
  stock_by_commodity: CommodityBreakdown[]
  // camelCase aliases for compat
  totalBeneficiaries?: number
  activeShops?: number
  totalShops?: number
  totalWarehouses?: number
  lowStockAlerts?: number
  monthlyTrend?: MonthlyTrendData[]
  totalDistributionsThisMonth?: number
}

export interface MonthlyTrendData {
  month: string
  distributions: number
  beneficiaries: number
  value: number
}

export interface CommodityBreakdown {
  name: string
  quantity: number
  percentage: number
  unit: string
}

export interface ShopStatusBreakdown {
  status: string
  count: number
  percentage: number
}

// ─── API Helpers ──────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  pages: number
  // legacy compat
  data?: T[]
  pageSize?: number
  totalPages?: number
}

export interface ApiError {
  message: string
  detail?: string
  statusCode: number
  errors?: Record<string, string[]>
}

export interface FilterParams {
  page?: number
  pageSize?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  [key: string]: string | number | boolean | undefined
}
