export type KitchenOrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'served'
  | 'completed'
  | 'cancelled';

export interface AdminOrderItem {
  id?: string;
  menuItemId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
  selectedModifiers?: Array<{
    id?: string;
    name: string;
    priceExtra?: number;
    price?: number;
  }>;
  notes?: string;
}

export interface AdminOrder {
  id: string;
  tableId: string;
  tableNumber: string;
  status: KitchenOrderStatus;
  paymentStatus?: 'unpaid' | 'paid' | 'refunded';
  paymentMethod?: string | null;
  items: AdminOrderItem[];
  subtotal: number;
  serviceCharge: number;
  tax: number;
  totalAmount: number;
  estimatedMinutes?: number;
  notes?: string;
  createdAt: string | number;
  statusHistory?: Array<{
    id?: string;
    orderId?: string;
    status: KitchenOrderStatus;
    message: string;
    timestamp: string | number;
  }>;
}

export interface WaiterCallAlert {
  id: string;
  tableId: string;
  tableNumber: string;
  type: 'call_waiter' | 'bill_request';
  reason?: string;
  paymentMethod?: string;
  customNote?: string;
  status: 'pending' | 'resolved';
  createdAt: string | number;
}

export interface StaffStreamEvent {
  event: 'order:new' | 'service:call_waiter' | 'service:bill_request' | 'order:status_updated' | 'table:settled';
  data: any;
  timestamp: number;
}

export type TableFloorStatus = 'available' | 'occupied' | 'bill_requested';

export interface OrderRound {
  roundIndex: number;
  orderId: string;
  createdAt: string | number;
  status: KitchenOrderStatus;
  items: AdminOrderItem[];
  subtotal: number;
  notes?: string;
}

export interface CustomOffMenuItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  price?: number;
  notes?: string;
}

export type DiscountType = 'flat' | 'percentage';

export interface FloorTable {
  id: string;
  tableNumber: string;
  qrSlug?: string;
  displayName?: string;
  capacity: number;
  status: TableFloorStatus;
  activeOrdersCount: number;
  runningTotal: number;
  firstOrderCreatedAt?: string | number | null;
  seatedDurationMinutes?: number;
  hasActiveWaiterCall: boolean;
  waiterCallReason?: string;
  waiterCallId?: string;
  billRequestedMethod?: string;
  billRequestId?: string;
  rounds: OrderRound[];
}

export interface BillSettlementDetails {
  tableId: string;
  tableNumber: string;
  paymentMethod: 'cash' | 'card' | 'upi/online';
  amountTendered: number;
  changeDue: number;
  itemsSubtotal: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  taxRatePercent: number;
  taxAmount: number;
  finalTotal: number;
  notes?: string;
  rounds: OrderRound[];
  customItems: CustomOffMenuItem[];
  settledAt: string | number;
}

// ----------------------------------------------------
// MENU CATALOG & 86-STOCK MANAGER TYPES
// ----------------------------------------------------
export interface AdminCategory {
  id: string;
  name: string;
  icon?: string;
  badge?: string;
  sortOrder: number;
  isActive: boolean;
  itemsCount?: number;
}

export interface AdminModifierOption {
  id?: string;
  name: string;
  priceExtra: number;
}

export interface AdminModifierGroup {
  id: string;
  name: string;
  rule: 'radio' | 'checkbox';
  required: boolean;
  options: AdminModifierOption[];
}

export interface AdminMenuItem {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  description: string;
  basePrice: number;
  price?: number;
  imageUrl: string;
  image?: string;
  isAvailable: boolean;
  isVegetarian: boolean;
  isBestseller: boolean;
  isChefSpecial: boolean;
  spicyLevel: number;
  preparationTime: string;
  sortOrder: number;
  createdAt?: string | number;
  modifiers?: Array<{ id: string; name: string; priceExtra: number }>;
  modifierGroups: AdminModifierGroup[];
}

export interface MenuCatalogStats {
  totalItems: number;
  inStockCount: number;
  outOfStockCount: number;
  categoriesCount: number;
}


