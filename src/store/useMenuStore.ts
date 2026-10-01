import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  CartItem,
  MenuItem,
  SelectedModifier,
  DietaryType,
  ServiceRequest,
  WaiterReason,
  PaymentMethod,
  ActiveOrder,
  OrderStatus,
} from '@/types/menu';
import { toast } from 'sonner';

export function generateCartItemId(
  itemId: string,
  modifiers: SelectedModifier[],
  notes: string = ''
): string {
  const sortedMods = [...modifiers]
    .map((m) => `${m.groupId}:${m.optionId}`)
    .sort()
    .join('|');
  const cleanNotes = notes.trim().toLowerCase();
  return `${itemId}_[${sortedMods}]_[${cleanNotes}]`;
}

interface MenuState {
  tableId: string;
  setTableId: (id: string) => void;
  getFormattedTable: () => string;

  // Cart
  cart: CartItem[];
  addToCart: (item: MenuItem) => void;
  addCustomizedItemToCart: (
    item: MenuItem,
    selectedModifiers: SelectedModifier[],
    notes?: string,
    quantity?: number
  ) => void;
  updateCartItemQuantity: (cartItemId: string, delta: number) => void;
  removeCartItem: (cartItemId: string) => void;
  removeFromCart: (itemId: string) => void;
  getItemQuantity: (itemId: string) => number;
  clearCart: () => void;
  totalCartCount: () => number;
  totalCartPrice: () => number;

  // Customization Modal
  isCustomizationOpen: boolean;
  customizingItem: MenuItem | null;
  openCustomization: (item: MenuItem) => void;
  closeCustomization: () => void;

  // Active Orders & Real-time Live Tracking
  activeOrders: ActiveOrder[];
  selectedActiveOrderId: string | null;
  isActiveOrderOpen: boolean;
  setIsActiveOrderOpen: (open: boolean) => void;
  setSelectedActiveOrderId: (orderId: string | null) => void;
  recordSubmittedOrder: (order: ActiveOrder) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus, message?: string) => void;
  getActiveOrder: () => ActiveOrder | undefined;

  // Search & Filter
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedDietary: DietaryType;
  setSelectedDietary: (filter: DietaryType) => void;

  // Category navigation
  activeCategoryId: string;
  setActiveCategoryId: (id: string) => void;

  // Modal dialog states
  isWaiterOpen: boolean;
  setIsWaiterOpen: (open: boolean) => void;
  isBillOpen: boolean;
  setIsBillOpen: (open: boolean) => void;
  isTableOpen: boolean;
  setIsTableOpen: (open: boolean) => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;

  // Quick Service actions & Cooldown
  waiterCooldownUntil: number | null;
  isWaiterOnCooldown: () => boolean;
  getWaiterRemainingSeconds: () => number;
  isBillRequested: boolean;
  setIsBillRequested: (requested: boolean) => void;
  serviceRequests: ServiceRequest[];
  callWaiter: (reason?: WaiterReason, customNote?: string) => boolean;
  requestBill: (paymentMethod?: PaymentMethod, customNote?: string) => void;
}

export const useMenuStore = create<MenuState>()(
  persist(
    (set, get) => ({
      tableId: 'T-04',
      setTableId: (id) => {
        const clean = id.trim().toUpperCase();
        if (!clean) return;
        set({ tableId: clean });
        toast.info(`Table updated to ${clean}`);
      },
      getFormattedTable: () => {
        const tableId = get().tableId;
        const raw = tableId.replace(/^T-?0*/i, '');
        const num = parseInt(raw, 10);
        if (!isNaN(num)) {
          return `Table ${num.toString().padStart(2, '0')}`;
        }
        return `Table ${tableId.toUpperCase()}`;
      },

      cart: [],

      // Customization modal controls
      isCustomizationOpen: false,
      customizingItem: null,
      openCustomization: (item) => {
        if (item.isOutOfStock) {
          toast.warning(`${item.name} is currently out of stock`);
          return;
        }
        set({ isCustomizationOpen: true, customizingItem: item });
      },
      closeCustomization: () => {
        set({ isCustomizationOpen: false, customizingItem: null });
      },

      addToCart: (item) => {
        if (item.isOutOfStock) {
          toast.warning(`${item.name} is currently out of stock`);
          return;
        }
        if (item.modifierGroups && item.modifierGroups.length > 0) {
          get().openCustomization(item);
          return;
        }
        get().addCustomizedItemToCart(item, [], '', 1);
      },

      addCustomizedItemToCart: (item, selectedModifiers, notes = '', quantity = 1) => {
        if (item.isOutOfStock) {
          toast.warning(`${item.name} is currently out of stock`);
          return;
        }

        const modifierTotal = selectedModifiers.reduce((sum, m) => sum + m.price, 0);
        const unitPrice = item.price + modifierTotal;
        const cartItemId = generateCartItemId(item.id, selectedModifiers, notes);

        set((state) => {
          const existingIndex = state.cart.findIndex((ci) => ci.cartItemId === cartItemId);
          if (existingIndex > -1) {
            const updated = [...state.cart];
            const existing = updated[existingIndex];
            const newQty = existing.quantity + quantity;
            updated[existingIndex] = {
              ...existing,
              quantity: newQty,
              totalPrice: existing.unitPrice * newQty,
            };
            return {
              cart: updated,
              isCustomizationOpen: false,
              customizingItem: null,
            };
          }

          const newCartItem: CartItem = {
            cartItemId,
            item,
            quantity,
            selectedModifiers,
            notes: notes.trim() || undefined,
            unitPrice,
            totalPrice: unitPrice * quantity,
          };

          return {
            cart: [...state.cart, newCartItem],
            isCustomizationOpen: false,
            customizingItem: null,
          };
        });

        toast.success(`Added ${quantity > 1 ? `${quantity}x ` : ''}${item.name} to order`, {
          description:
            selectedModifiers.length > 0
              ? selectedModifiers.map((m) => m.optionName).join(', ')
              : undefined,
        });
      },

      updateCartItemQuantity: (cartItemId, delta) => {
        set((state) => {
          const item = state.cart.find((ci) => ci.cartItemId === cartItemId);
          if (!item) return state;

          const newQty = item.quantity + delta;
          if (newQty <= 0) {
            return { cart: state.cart.filter((ci) => ci.cartItemId !== cartItemId) };
          }

          return {
            cart: state.cart.map((ci) =>
              ci.cartItemId === cartItemId
                ? { ...ci, quantity: newQty, totalPrice: ci.unitPrice * newQty }
                : ci
            ),
          };
        });
      },

      removeCartItem: (cartItemId) => {
        set((state) => ({
          cart: state.cart.filter((ci) => ci.cartItemId !== cartItemId),
        }));
        toast.info('Item removed from order');
      },

      removeFromCart: (itemId) => {
        set((state) => {
          const matching = state.cart.find((ci) => ci.item.id === itemId);
          if (!matching) return state;
          if (matching.quantity <= 1) {
            return { cart: state.cart.filter((ci) => ci.cartItemId !== matching.cartItemId) };
          }
          const newQty = matching.quantity - 1;
          return {
            cart: state.cart.map((ci) =>
              ci.cartItemId === matching.cartItemId
                ? { ...ci, quantity: newQty, totalPrice: ci.unitPrice * newQty }
                : ci
            ),
          };
        });
      },

      getItemQuantity: (itemId) => {
        return get().cart
          .filter((ci) => ci.item.id === itemId)
          .reduce((sum, ci) => sum + ci.quantity, 0);
      },

      clearCart: () => {
        set({ cart: [] });
      },

      totalCartCount: () => {
        return get().cart.reduce((acc, curr) => acc + curr.quantity, 0);
      },

      totalCartPrice: () => {
        return get().cart.reduce((acc, curr) => acc + curr.unitPrice * curr.quantity, 0);
      },

      // Active Orders & Real-time Tracking
      activeOrders: [],
      selectedActiveOrderId: null,
      isActiveOrderOpen: false,
      setIsActiveOrderOpen: (isActiveOrderOpen) => set({ isActiveOrderOpen }),
      setSelectedActiveOrderId: (selectedActiveOrderId) => set({ selectedActiveOrderId }),

      recordSubmittedOrder: (order) => {
        set((state) => ({
          activeOrders: [order, ...state.activeOrders],
          selectedActiveOrderId: order.orderId,
          isActiveOrderOpen: true,
          cart: [],
        }));
      },

      updateOrderStatus: (orderId, newStatus, message) => {
        set((state) => {
          const defaultMessages: Record<OrderStatus, string> = {
            received: 'Order confirmed by cafe kitchen',
            preparing: 'Chef is cooking your fresh dishes in the kitchen',
            served: 'Dishes served at your table. Enjoy your meal!',
            cancelled: 'Order was cancelled by staff',
          };

          return {
            activeOrders: state.activeOrders.map((ord) => {
              if (ord.orderId !== orderId) return ord;
              const historyEntry = {
                status: newStatus,
                timestamp: Date.now(),
                message: message || defaultMessages[newStatus],
              };
              return {
                ...ord,
                status: newStatus,
                statusHistory: [...ord.statusHistory, historyEntry],
              };
            }),
          };
        });
      },

      getActiveOrder: () => {
        const { activeOrders, selectedActiveOrderId } = get();
        if (selectedActiveOrderId) {
          const match = activeOrders.find((o) => o.orderId === selectedActiveOrderId);
          if (match) return match;
        }
        return activeOrders[0];
      },

      searchQuery: '',
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      selectedDietary: 'all',
      setSelectedDietary: (selectedDietary) => set({ selectedDietary }),

      activeCategoryId: 'burgers',
      setActiveCategoryId: (activeCategoryId) => set({ activeCategoryId }),

      isWaiterOpen: false,
      setIsWaiterOpen: (isWaiterOpen) => set({ isWaiterOpen }),
      isBillOpen: false,
      setIsBillOpen: (isBillOpen) => set({ isBillOpen }),
      isTableOpen: false,
      setIsTableOpen: (isTableOpen) => set({ isTableOpen }),
      isCartOpen: false,
      setIsCartOpen: (isCartOpen) => set({ isCartOpen }),

      // Quick Service & Waiter Cooldown (2 minutes anti-spam)
      waiterCooldownUntil: null,
      isWaiterOnCooldown: () => {
        const cooldown = get().waiterCooldownUntil;
        if (!cooldown) return false;
        return Date.now() < cooldown;
      },
      getWaiterRemainingSeconds: () => {
        const cooldown = get().waiterCooldownUntil;
        if (!cooldown) return 0;
        const diff = Math.ceil((cooldown - Date.now()) / 1000);
        return diff > 0 ? diff : 0;
      },

      isBillRequested: false,
      setIsBillRequested: (isBillRequested) => set({ isBillRequested }),

      serviceRequests: [],

      callWaiter: (reason = 'general', customNote) => {
        if (get().isWaiterOnCooldown()) {
          const rem = get().getWaiterRemainingSeconds();
          const mins = Math.floor(rem / 60);
          const secs = rem % 60;
          toast.warning(`Please wait ${mins}:${secs.toString().padStart(2, '0')} before calling staff again.`);
          return false;
        }

        const tableId = get().tableId;
        const formatted = get().getFormattedTable();
        const twoMinutesFromNow = Date.now() + 120_000;

        const newRequest: ServiceRequest = {
          id: `call-${Date.now()}`,
          type: 'call_waiter',
          tableId,
          timestamp: Date.now(),
          status: 'sent',
          details: { reason, customNote },
        };

        set((state) => ({
          serviceRequests: [newRequest, ...state.serviceRequests],
          waiterCooldownUntil: twoMinutesFromNow,
          isWaiterOpen: false,
        }));

        // Exact requirement toast
        toast.success('Server notified, someone will be with you shortly', {
          description: `Dispatched to ${formatted} (anti-spam cooldown: 2 mins)`,
        });
        return true;
      },

      requestBill: (paymentMethod = 'card', customNote) => {
        const tableId = get().tableId;
        const formatted = get().getFormattedTable();
        const newRequest: ServiceRequest = {
          id: `bill-${Date.now()}`,
          type: 'request_bill',
          tableId,
          timestamp: Date.now(),
          status: 'sent',
          details: { paymentMethod, customNote },
        };

        set((state) => ({
          serviceRequests: [newRequest, ...state.serviceRequests],
          isBillRequested: true,
          isBillOpen: false,
        }));

        toast.success(`POS alerted: Bill requested for ${formatted}.`, {
          description: 'A server will bring your invoice and machine shortly.',
        });
      },
    }),
    {
      name: 'resturantos_menu_storage_v4',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        tableId: state.tableId,
        cart: state.cart,
        activeOrders: state.activeOrders,
        selectedActiveOrderId: state.selectedActiveOrderId,
        waiterCooldownUntil: state.waiterCooldownUntil,
        isBillRequested: state.isBillRequested,
      }),
    }
  )
);
