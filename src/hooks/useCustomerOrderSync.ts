'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useMenuStore } from '@/store/useMenuStore';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { OrderStatus } from '@/types/menu';
import { toast } from 'sonner';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

/**
 * Normalizes table number/id (e.g. "4", "t-04", "Table 04" -> "T-04")
 */
function normalizeTable(id?: string): string {
  if (!id) return '';
  const clean = id.toUpperCase().trim();
  const match = clean.match(/^T?-?0*(\d+)$/i);
  if (match) {
    return `T-${match[1].padStart(2, '0')}`;
  }
  return clean;
}

/**
 * Maps database/backend status to customer OrderStatus
 */
function mapServerStatusToCustomer(status: string): OrderStatus {
  const s = status.toLowerCase();
  if (s === 'cancelled' || s === 'rejected' || s === 'void') {
    return 'cancelled';
  }
  if (s === 'preparing') {
    return 'preparing';
  }
  if (s === 'ready' || s === 'served' || s === 'completed') {
    return 'served';
  }
  return 'received';
}

/**
 * Hook that keeps customer mobile active orders 100% in sync with the backend
 * via real-time WebSockets (Supabase channel "pos_staff"), SSE fallback,
 * and on-mount / page reload order verification.
 */
export function useCustomerOrderSync() {
  const tableId = useMenuStore((state) => state.tableId);
  const activeOrders = useMenuStore((state) => state.activeOrders);
  const updateOrderStatus = useMenuStore((state) => state.updateOrderStatus);
  const setSelectedActiveOrderId = useMenuStore((state) => state.setSelectedActiveOrderId);
  const setIsActiveOrderOpen = useMenuStore((state) => state.setIsActiveOrderOpen);

  // Keep ref to avoid stale closure in event handlers
  const activeOrdersRef = useRef(activeOrders);
  activeOrdersRef.current = activeOrders;

  const processedEventsRef = useRef<Map<string, number>>(new Map());

  const isDuplicate = useCallback((key: string): boolean => {
    const now = Date.now();
    const last = processedEventsRef.current.get(key);
    if (last && now - last < 4000) return true;
    processedEventsRef.current.set(key, now);
    if (processedEventsRef.current.size > 100) {
      for (const [k, t] of processedEventsRef.current.entries()) {
        if (now - t > 30000) processedEventsRef.current.delete(k);
      }
    }
    return false;
  }, []);

  // 1. Sync active orders from server on mount & window focus / reload
  const syncOrdersFromServer = useCallback(async () => {
    const currentOrders = activeOrdersRef.current;
    if (currentOrders.length === 0) return;

    for (const ord of currentOrders) {
      try {
        const cleanId = ord.orderId.replace(/^#/, '').trim();
        const res = await fetch(`${API_BASE}/orders/${cleanId}`);
        if (!res.ok) continue;

        const resJson = await res.json();
        const serverOrder = resJson.data || resJson;
        if (!serverOrder || !serverOrder.status) continue;

        const mappedStatus = mapServerStatusToCustomer(serverOrder.status);
        const latestHistory = Array.isArray(serverOrder.statusHistory)
          ? serverOrder.statusHistory[0]
          : null;
        const message = latestHistory?.message || '';

        // Check if status in store is outdated or needs updated cancellation message
        const lastEntry = ord.statusHistory && ord.statusHistory.length > 0
          ? ord.statusHistory[ord.statusHistory.length - 1]
          : null;

        const statusChanged = ord.status !== mappedStatus;
        const messageNeedsUpdate =
          mappedStatus === 'cancelled' && (!lastEntry?.message || lastEntry.message.includes('confirmed'));

        if (statusChanged || messageNeedsUpdate) {
          updateOrderStatus(ord.orderId, mappedStatus, message);

          if (mappedStatus === 'cancelled') {
            toast.error(`❌ Order #${ord.orderId} Rejected by Kitchen`, {
              description: message || 'Your order was cancelled or rejected by staff.',
              duration: 12000,
              id: `sync-reject-${ord.orderId}`,
            });
          }
        }
      } catch (err) {
        // silent fallback
      }
    }
  }, [updateOrderStatus]);

  // Initial fetch on mount & window focus
  useEffect(() => {
    syncOrdersFromServer();

    const handleFocus = () => {
      syncOrdersFromServer();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleFocus);

    // Regular fallback poll every 10 seconds
    const interval = setInterval(syncOrdersFromServer, 10000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleFocus);
      clearInterval(interval);
    };
  }, [syncOrdersFromServer]);

  // 2. Real-Time WebSockets Subscription (Supabase Realtime on "pos_staff")
  useEffect(() => {
    const supabase = getSupabaseClient();
    const normalized = normalizeTable(tableId);

    // Subscribe to primary pos_staff channel where all order events are broadcast
    const channel = supabase.channel('pos_staff', {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'order:status_updated' }, (msg) => {
        const payload = msg.payload;
        if (!payload || !payload.orderId) return;

        const orderId = payload.orderId;
        const rawStatus = payload.status || '';
        const message = payload.message || '';
        const dedupeKey = `${orderId}:${rawStatus}:${payload.timestamp || Date.now()}`;

        if (isDuplicate(dedupeKey)) return;

        // Check if this order is tracked by customer
        const currentOrders = activeOrdersRef.current;
        const targetClean = orderId.replace(/^#/, '').trim().toLowerCase();
        const matchingOrder = currentOrders.find(
          (o) => o.orderId.replace(/^#/, '').trim().toLowerCase() === targetClean
        );

        if (matchingOrder) {
          const mappedStatus = mapServerStatusToCustomer(rawStatus);
          updateOrderStatus(orderId, mappedStatus, message);

          if (mappedStatus === 'cancelled') {
            toast.error(`❌ Order #${orderId} Rejected by Kitchen`, {
              description: message || 'The kitchen was unable to accept this order.',
              duration: 15000,
              id: `reject-${orderId}`,
            });
            // Automatically select and pop up the active order screen with rejection details
            setSelectedActiveOrderId(matchingOrder.orderId);
            setIsActiveOrderOpen(true);
          } else if (mappedStatus === 'preparing') {
            toast.info(`👨‍🍳 Order #${orderId} is now being cooked in the kitchen!`, {
              id: `status-${orderId}`,
            });
          } else if (mappedStatus === 'served') {
            toast.success(`🍽️ Order #${orderId} has been served to your table!`, {
              id: `status-${orderId}`,
            });
          }
        }
      })
      .on('broadcast', { event: 'table:settled' }, (msg) => {
        const payload = msg.payload;
        if (!payload) return;
        const eventTable = normalizeTable(payload.tableNumber || payload.tableId);
        if (normalized && eventTable === normalized) {
          toast.info('Table bill settled with floor staff. Thank you for dining with us!', {
            duration: 8000,
          });
        }
      })
      .subscribe();

    // 3. Dual SSE Stream Fallback
    let sseSource: EventSource | null = null;
    try {
      sseSource = new EventSource(`${API_BASE}/admin/stream`);
      sseSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed && parsed.event === 'order:status_updated' && parsed.data) {
            const payload = parsed.data;
            const orderId = payload.orderId;
            const rawStatus = payload.status || '';
            const message = payload.message || '';
            const dedupeKey = `sse:${orderId}:${rawStatus}:${payload.timestamp || Date.now()}`;

            if (isDuplicate(dedupeKey)) return;

            const currentOrders = activeOrdersRef.current;
            const targetClean = orderId.replace(/^#/, '').trim().toLowerCase();
            const matchingOrder = currentOrders.find(
              (o) => o.orderId.replace(/^#/, '').trim().toLowerCase() === targetClean
            );

            if (matchingOrder) {
              const mappedStatus = mapServerStatusToCustomer(rawStatus);
              updateOrderStatus(orderId, mappedStatus, message);

              if (mappedStatus === 'cancelled') {
                toast.error(`❌ Order #${orderId} Rejected by Kitchen`, {
                  description: message || 'The kitchen was unable to accept this order.',
                  duration: 15000,
                  id: `reject-${orderId}`,
                });
                setSelectedActiveOrderId(matchingOrder.orderId);
                setIsActiveOrderOpen(true);
              }
            }
          }
        } catch {
          // ignore heartbeat
        }
      };
    } catch {
      // SSE fallback ignored if fails
    }

    return () => {
      supabase.removeChannel(channel);
      if (sseSource) sseSource.close();
    };
  }, [
    tableId,
    updateOrderStatus,
    setSelectedActiveOrderId,
    setIsActiveOrderOpen,
    isDuplicate,
  ]);
}
