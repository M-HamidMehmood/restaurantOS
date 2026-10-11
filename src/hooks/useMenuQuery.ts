'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { categories, menuItems, restaurantInfo } from '@/data/menuData';
import {
  Category,
  MenuItem,
  RestaurantInfo,
  OrderSubmissionPayload,
  ActiveOrder,
  WaiterReason,
  PaymentMethod,
} from '@/types/menu';

export interface MenuDataResponse {
  restaurant: RestaurantInfo;
  categories: Category[];
  items: MenuItem[];
}

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabaseClient';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Fetches menu data asynchronously from live backend API with fallback to menuData
async function fetchMenuData(): Promise<MenuDataResponse> {
  try {
    const res = await fetch(`${API_BASE}/admin/menu/all`, { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        const backendCategories: Category[] = (json.data.categories || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          icon: c.icon || 'Utensils',
          badge: c.badge || undefined,
        }));

        const backendItems: MenuItem[] = (json.data.items || []).map((i: any) => ({
          id: i.id,
          categoryId: i.categoryId,
          name: i.name,
          description: i.description || '',
          price: i.basePrice,
          image: i.imageUrl || i.image || '',
          isAvailable: i.isAvailable,
          isOutOfStock: !i.isAvailable,
          isVegetarian: i.isVegetarian || false,
          isBestseller: i.isBestseller || false,
          isChefSpecial: i.isChefSpecial || false,
          spicyLevel: i.spicyLevel || 0,
          preparationTime: i.preparationTime || '10-15 mins',
          modifierGroups: (i.modifierGroups || []).map((g: any) => ({
            id: g.id,
            name: g.name,
            minSelect: g.required ? 1 : 0,
            maxSelect: g.rule === 'radio' ? 1 : g.options.length,
            required: g.required,
            options: (g.options || []).map((o: any) => ({
              id: o.id || o.name,
              name: o.name,
              price: o.priceExtra || 0,
            })),
          })),
        }));

        return {
          restaurant: restaurantInfo,
          categories: backendCategories.length > 0 ? backendCategories : categories,
          items: backendItems.length > 0 ? backendItems : menuItems,
        };
      }
    }
  } catch (err) {
    console.warn('Backend menu fetch failed, falling back to static menu:', err);
  }

  return {
    restaurant: restaurantInfo,
    categories,
    items: menuItems,
  };
}

export function useMenuQuery() {
  const queryClient = useQueryClient();

  // Listen to 86 toggle updates via Realtime and SSE so customer QR menus update live without refreshing
  useEffect(() => {
    let sse: EventSource | null = null;
    try {
      sse = new EventSource(`${API_BASE}/admin/stream`);
      sse.addEventListener('menu:item_toggled', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          const { itemId, isAvailable } = payload;
          if (itemId !== undefined) {
            queryClient.setQueryData(['menuData'], (old: any) => {
              if (!old || !old.items) return old;
              return {
                ...old,
                items: old.items.map((it: any) =>
                  it.id === itemId
                    ? { ...it, isAvailable, isOutOfStock: !isAvailable }
                    : it
                ),
              };
            });
          }
        } catch (err) {
          console.error('Error handling SSE menu toggle:', err);
        }
      });
    } catch (err) {
      console.warn('SSE connection error:', err);
    }

    const supabase = getSupabaseClient();
    const channel = supabase
      .channel('pos_menu_customer_sync')
      .on('broadcast', { event: 'menu:item_toggled' }, (payload: any) => {
        const { itemId, isAvailable } = payload?.payload || {};
        if (itemId !== undefined) {
          queryClient.setQueryData(['menuData'], (old: any) => {
            if (!old || !old.items) return old;
            return {
              ...old,
              items: old.items.map((it: any) =>
                it.id === itemId
                  ? { ...it, isAvailable, isOutOfStock: !isAvailable }
                  : it
              ),
            };
          });
        }
      })
      .subscribe();

    return () => {
      if (sse) sse.close();
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['menuData'],
    queryFn: fetchMenuData,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}


// Mutation for sending orders to the kitchen with full payload: { tableId, items, totalAmount, notes }
export function useSubmitOrderMutation() {
  return useMutation({
    mutationFn: async ({
      tableId,
      items,
      totalAmount,
      notes,
    }: OrderSubmissionPayload): Promise<ActiveOrder> => {
      const payload = {
        tableId: tableId.trim(),
        notes: notes || undefined,
        totalAmount: Math.round(totalAmount),
        items: items.map((ci) => ({
          menuItemId: ci.item.id,
          name: ci.item.name,
          item: {
            id: ci.item.id,
            name: ci.item.name,
            price: ci.item.price,
          },
          quantity: ci.quantity,
          notes: ci.notes || undefined,
          cartItemId: ci.cartItemId,
          unitPrice: ci.unitPrice,
          totalPrice: ci.totalPrice,
          selectedModifiers: (ci.selectedModifiers || []).map((m) => ({
            id: m.optionId,
            optionId: m.optionId,
            name: m.optionName || 'Modifier',
            optionName: m.optionName || 'Modifier',
            priceExtra: m.price || 0,
            price: m.price || 0,
          })),
        })),
      };

      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to submit order to kitchen');
      }

      const resJson = await res.json();
      const serverData = resJson.data || resJson;
      const orderId = serverData.orderId || serverData.id || `ORD-${Date.now().toString().slice(-4)}`;
      const now = Date.now();

      const newOrder: ActiveOrder = {
        orderId,
        tableId: serverData.tableNumber || tableId,
        items,
        totalAmount: serverData.totalAmount || totalAmount,
        notes,
        status: 'received',
        createdAt: now,
        estimatedMinutes: serverData.estimatedMinutes || 12,
        statusHistory: [
          {
            status: 'received',
            timestamp: now,
            message: 'Order received by the cafe kitchen',
          },
        ],
      };

      return newOrder;
    },
  });
}

// Mutation for calling the waiter: POST /api/service-request
export function useCallWaiterMutation() {
  return useMutation({
    mutationFn: async ({
      tableId,
      reason,
      customNote,
    }: {
      tableId: string;
      reason: WaiterReason;
      customNote?: string;
    }) => {
      const res = await fetch(`${API_BASE}/service-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId,
          type: 'call_waiter',
          reason,
          customNote,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to call waiter');
      }

      const json = await res.json();
      return {
        success: true,
        tableId,
        reason,
        customNote,
        timestamp: Date.now(),
        ...json,
      };
    },
  });
}

// Mutation for requesting the bill: POST /api/service-request
export function useRequestBillMutation() {
  return useMutation({
    mutationFn: async ({
      tableId,
      paymentMethod,
      customNote,
    }: {
      tableId: string;
      paymentMethod: PaymentMethod;
      customNote?: string;
    }) => {
      const res = await fetch(`${API_BASE}/service-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId,
          type: 'bill_request',
          paymentMethod,
          customNote,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to request bill');
      }

      const json = await res.json();
      return {
        success: true,
        tableId,
        paymentMethod,
        customNote,
        timestamp: Date.now(),
        ...json,
      };
    },
  });
}
