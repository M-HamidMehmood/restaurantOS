export type DietaryType = 'all' | 'veg' | 'non-veg' | 'bestseller' | 'spicy';

export interface ModifierOption {
  id: string;
  name: string;
  price: number; // In PKR: 0 = free, >0 = additional cost
  isDefault?: boolean;
  description?: string;
}

export interface ModifierGroup {
  id: string;
  name: string;
  description?: string;
  minSelect: number; // 1 for required, 0 for optional
  maxSelect: number; // 1 for radio (single), >1 for checkboxes (multi)
  required?: boolean;
  options: ModifierOption[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  categoryId: string;
  isVegetarian: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  spicyLevel?: 0 | 1 | 2 | 3; // 0 = not spicy, 3 = very spicy
  isOutOfStock: boolean;
  isChefSpecial?: boolean;
  isBestseller?: boolean;
  calories?: number;
  preparationTime?: string;
  allergens?: string[];
  tags?: string[];
  modifierGroups?: ModifierGroup[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  badge?: string;
}

export interface SelectedModifier {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  price: number;
}

export interface CartItem {
  cartItemId: string; // Unique id for customized item
  item: MenuItem;
  quantity: number;
  selectedModifiers: SelectedModifier[];
  notes?: string;
  unitPrice: number; // Base price + modifiers
  totalPrice: number; // unitPrice * quantity
}

export type PaymentMethod = 'card' | 'cash' | 'contactless' | 'apple_pay' | 'split';

export type WaiterReason = 'water' | 'cutlery' | 'general' | 'clean_table' | 'order_help';

export interface ServiceRequest {
  id: string;
  type: 'call_waiter' | 'request_bill';
  tableId: string;
  timestamp: number;
  status: 'sent' | 'attending' | 'completed';
  details?: {
    reason?: WaiterReason;
    paymentMethod?: PaymentMethod;
    customNote?: string;
  };
}

export interface RestaurantInfo {
  name: string;
  tagline: string;
  currencySymbol: string;
  wifiName?: string;
  wifiPassword?: string;
  serviceChargePercent?: number;
  taxPercent?: number;
}

export type OrderStatus = 'received' | 'preparing' | 'served' | 'cancelled';

export interface OrderStatusHistoryEntry {
  status: OrderStatus;
  timestamp: number;
  message: string;
}

export interface ActiveOrder {
  orderId: string;
  tableId: string;
  items: CartItem[];
  totalAmount: number;
  notes?: string;
  status: OrderStatus;
  createdAt: number;
  estimatedMinutes?: number;
  statusHistory: OrderStatusHistoryEntry[];
}

export interface OrderSubmissionPayload {
  tableId: string;
  items: CartItem[];
  totalAmount: number;
  notes?: string;
}
