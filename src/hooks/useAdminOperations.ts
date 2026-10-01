'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { AdminOrder, KitchenOrderStatus, WaiterCallAlert, StaffStreamEvent } from '@/types/admin';
import { playOrderChime, playWaiterAlert, playReadyChime, getSoundMuted, setSoundMuted } from '@/lib/sound';
import { getSupabaseClient } from '@/lib/supabaseClient';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export function useAdminOperations() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [waiterCalls, setWaiterCalls] = useState<WaiterCallAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [isOnline, setIsOnline] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [soundMuted, setSoundMutedState] = useState(false);
  const [printOrder, setPrintOrder] = useState<AdminOrder | null>(null);

  // Keep a ref to current orders for deduplication inside event callbacks
  const ordersRef = useRef<AdminOrder[]>([]);
  ordersRef.current = orders;

  // Initialize preferences from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedOnline = localStorage.getItem('restaurant_online_status');
      if (savedOnline !== null) {
        setIsOnline(savedOnline === 'true');
      }

      const savedView = localStorage.getItem('operations_view_mode') as 'kanban' | 'list';
      if (savedView === 'kanban' || savedView === 'list') {
        setViewMode(savedView);
      }

      setSoundMutedState(getSoundMuted());
    }
  }, []);

  const toggleOnline = useCallback(() => {
    setIsOnline((prev) => {
      const next = !prev;
      localStorage.setItem('restaurant_online_status', String(next));
      if (next) {
        toast.success('Restaurant is Online: Accepting live orders & service calls');
      } else {
        toast.warning('Restaurant is Offline: Incoming orders temporarily paused');
      }
      return next;
    });
  }, []);

  const toggleSound = useCallback(() => {
    setSoundMutedState((prev) => {
      const next = !prev;
      setSoundMuted(next);
      if (!next) {
        playOrderChime();
        toast.info('Audio chimes enabled');
      } else {
        toast.info('Audio alerts muted');
      }
      return next;
    });
  }, []);

  const changeViewMode = useCallback((mode: 'kanban' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('operations_view_mode', mode);
  }, []);

  // Fetch initial orders
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/orders`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setOrders(json.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch admin orders:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch initial service requests
  const fetchServiceRequests = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/service-requests`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setWaiterCalls(
            json.data.map((r: any) => ({
              id: r.id,
              tableId: r.tableId,
              tableNumber: r.tableNumber || `Table ${r.tableId?.substring(0, 4) || '??'}`,
              type: r.type,
              reason: r.reason,
              paymentMethod: r.paymentMethod,
              customNote: r.customNote,
              status: r.status,
              createdAt: r.createdAt,
            }))
          );
        }
      }
    } catch (err) {
      console.error('Failed to fetch service requests:', err);
    }
  }, []);

  // Handle incoming new order event
  const handleIncomingOrder = useCallback((rawOrder: any) => {
    const orderId = rawOrder.orderId || rawOrder.id;
    if (!orderId) return;

    // Check if already in list
    if (ordersRef.current.some((o) => o.id === orderId)) {
      return;
    }

    const newOrder: AdminOrder = {
      id: orderId,
      tableId: rawOrder.tableId || '',
      tableNumber: rawOrder.tableNumber || 'Takeaway',
      status: (rawOrder.status as KitchenOrderStatus) || 'pending',
      paymentStatus: rawOrder.paymentStatus || 'unpaid',
      paymentMethod: rawOrder.paymentMethod || null,
      subtotal: rawOrder.subtotal || rawOrder.totalAmount || 0,
      serviceCharge: rawOrder.serviceCharge || 0,
      tax: rawOrder.tax || 0,
      totalAmount: rawOrder.totalAmount || 0,
      estimatedMinutes: rawOrder.estimatedMinutes || 12,
      notes: rawOrder.notes || '',
      createdAt: rawOrder.createdAt || new Date().toISOString(),
      items: (rawOrder.items || []).map((it: any, idx: number) => ({
        id: it.id || `it-${idx}`,
        menuItemId: it.menuItemId,
        name: it.name || it.item?.name || 'Dish Item',
        quantity: it.quantity || 1,
        unitPrice: it.unitPrice || 0,
        totalPrice: it.totalPrice || (it.unitPrice || 0) * (it.quantity || 1),
        selectedModifiers: it.selectedModifiers || it.modifiers || [],
        notes: it.notes,
      })),
      statusHistory: [
        {
          id: `log-${Date.now()}`,
          orderId,
          status: 'pending',
          message: 'Order created via QR menu and received in kitchen',
          timestamp: new Date().toISOString(),
        },
      ],
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Audible chime
    playOrderChime();

    // Alert toast
    toast.info(`🔔 New Order #${orderId} from Table ${newOrder.tableNumber}`, {
      description: `${newOrder.items.length} item(s) • Total: Rs. ${newOrder.totalAmount}`,
      duration: 6000,
    });
  }, []);

  // Handle incoming waiter assistance event
  const handleIncomingWaiterCall = useCallback((payload: any) => {
    const callId = payload.requestId || payload.id || `sr-${Date.now()}`;
    const tableNum = payload.tableNumber || `Table ${payload.tableId?.substring(0, 4) || '??'}`;

    setWaiterCalls((prev) => {
      if (prev.some((c) => c.id === callId)) return prev;
      return [
        {
          id: callId,
          tableId: payload.tableId,
          tableNumber: tableNum,
          type: 'call_waiter',
          reason: payload.reason || 'General Assistance',
          customNote: payload.customNote,
          status: 'pending',
          createdAt: payload.timestamp || new Date().toISOString(),
        },
        ...prev,
      ];
    });

    playWaiterAlert();

    toast.warning(`🙋 [${tableNum}] Assistance Requested!`, {
      description: `Reason: ${payload.reason || 'General Assistance'} ${payload.customNote ? `• "${payload.customNote}"` : ''}`,
      duration: 8000,
    });
  }, []);

  // Handle incoming bill request event
  const handleIncomingBillRequest = useCallback((payload: any) => {
    const callId = payload.requestId || payload.id || `sr-${Date.now()}`;
    const tableNum = payload.tableNumber || `Table ${payload.tableId?.substring(0, 4) || '??'}`;

    setWaiterCalls((prev) => {
      if (prev.some((c) => c.id === callId)) return prev;
      return [
        {
          id: callId,
          tableId: payload.tableId,
          tableNumber: tableNum,
          type: 'bill_request',
          paymentMethod: payload.paymentMethod || 'cash',
          customNote: payload.customNote,
          status: 'pending',
          createdAt: payload.timestamp || new Date().toISOString(),
        },
        ...prev,
      ];
    });

    playWaiterAlert();

    toast.info(`💳 [${tableNum}] Bill Settlement Requested`, {
      description: `Payment: ${(payload.paymentMethod || 'cash').toUpperCase()} • Total: Rs. ${payload.tableTotal || ''}`,
      duration: 8000,
    });
  }, []);

  // Handle order status updated event
  const handleOrderStatusUpdated = useCallback((payload: any) => {
    const orderId = payload.orderId;
    if (!orderId) return;

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const updated = { ...o, status: payload.status as KitchenOrderStatus };
          if (payload.status === 'ready') {
            playReadyChime();
            toast.success(`🍽️ Order #${orderId} is READY to serve at Table ${o.tableNumber}!`);
          }
          return updated;
        }
        return o;
      })
    );
  }, []);

  // Setup Real-time connection (Supabase WebSockets + SSE fallback)
  useEffect(() => {
    let sseSource: EventSource | null = null;
    let isSubscribed = true;

    // 1. Primary: Supabase Realtime channel "pos_staff"
    try {
      const supabase = getSupabaseClient();
      const channel = supabase.channel('pos_staff', {
        config: { broadcast: { self: false } },
      });

      channel
        .on('broadcast', { event: 'order:new' }, (msg) => {
          if (isSubscribed) handleIncomingOrder(msg.payload);
        })
        .on('broadcast', { event: 'service:call_waiter' }, (msg) => {
          if (isSubscribed) handleIncomingWaiterCall(msg.payload);
        })
        .on('broadcast', { event: 'service:bill_request' }, (msg) => {
          if (isSubscribed) handleIncomingBillRequest(msg.payload);
        })
        .on('broadcast', { event: 'order:status_updated' }, (msg) => {
          if (isSubscribed) handleOrderStatusUpdated(msg.payload);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setConnectionStatus('connected');
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            setConnectionStatus('connecting');
          }
        });
    } catch (err) {
      console.warn('Supabase Realtime socket setup note:', err);
    }

    // 2. Dual / Fallback Stream: Fastify/NestJS Server-Sent Events
    try {
      sseSource = new EventSource(`${API_BASE}/admin/stream`);

      sseSource.onopen = () => {
        setConnectionStatus('connected');
      };

      sseSource.onmessage = (event) => {
        try {
          const parsed: StaffStreamEvent = JSON.parse(event.data);
          if (parsed && parsed.event) {
            if (parsed.event === 'order:new') {
              handleIncomingOrder(parsed.data);
            } else if (parsed.event === 'service:call_waiter') {
              handleIncomingWaiterCall(parsed.data);
            } else if (parsed.event === 'service:bill_request') {
              handleIncomingBillRequest(parsed.data);
            } else if (parsed.event === 'order:status_updated') {
              handleOrderStatusUpdated(parsed.data);
            }
          }
        } catch (e) {
          // ignore heartbeat / ping events
        }
      };

      sseSource.onerror = () => {
        // SSE will auto-retry
      };
    } catch (err) {
      console.warn('SSE client setup note:', err);
    }

    // Fetch initial data
    fetchOrders();
    fetchServiceRequests();

    return () => {
      isSubscribed = false;
      if (sseSource) {
        sseSource.close();
      }
    };
  }, [
    fetchOrders,
    fetchServiceRequests,
    handleIncomingOrder,
    handleIncomingWaiterCall,
    handleIncomingBillRequest,
    handleOrderStatusUpdated,
  ]);

  // Action Pipeline Methods

  // 1. Accept Order (Pending -> In Kitchen / Preparing)
  const acceptOrder = async (orderId: string) => {
    // Optimistic update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'preparing' as KitchenOrderStatus } : o))
    );

    try {
      const res = await fetch(`${API_BASE}/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'preparing',
          message: 'Kitchen accepted ticket and is preparing dishes on grill & stove',
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to accept order on server');
      }

      toast.success(`Order #${orderId} accepted and moved to In Kitchen!`);
    } catch (err) {
      toast.error(`Could not accept order #${orderId}. Please try again.`);
      fetchOrders();
    }
  };

  // 2. Reject Order (Pending -> Cancelled with Reason)
  const rejectOrder = async (orderId: string, reason: string) => {
    // Optimistic update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' as KitchenOrderStatus } : o))
    );

    try {
      const res = await fetch(`${API_BASE}/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'cancelled',
          message: `Order rejected by kitchen: ${reason}`,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to reject order on server');
      }

      toast.error(`Order #${orderId} rejected: ${reason}`);
    } catch (err) {
      toast.error(`Could not reject order #${orderId}`);
      fetchOrders();
    }
  };

  // 3. Mark Ready (In Kitchen -> Ready to Serve)
  const markReady = async (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'ready' as KitchenOrderStatus } : o))
    );

    try {
      const res = await fetch(`${API_BASE}/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'ready',
          message: 'Dishes are plated and ready at the pass counter for server pickup',
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to mark ready on server');
      }

      playReadyChime();
      toast.success(`Order #${orderId} marked READY to serve!`);
    } catch (err) {
      toast.error(`Could not update order #${orderId}`);
      fetchOrders();
    }
  };

  // 4. Mark Delivered / Served (Ready -> Served)
  const markServed = async (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'served' as KitchenOrderStatus } : o))
    );

    try {
      const res = await fetch(`${API_BASE}/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'served',
          message: 'Delivered hot to the table',
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to mark served on server');
      }

      toast.success(`Order #${orderId} delivered to table!`);
    } catch (err) {
      toast.error(`Could not update order #${orderId}`);
      fetchOrders();
    }
  };

  // 5. Dismiss / Handle Waiter Assistance Call
  const dismissWaiterCall = async (callId: string) => {
    setWaiterCalls((prev) => prev.filter((c) => c.id !== callId));

    try {
      await fetch(`${API_BASE}/admin/service-requests/${callId}/resolve`, {
        method: 'PATCH',
      });
      toast.success('Assistance request marked handled');
    } catch (err) {
      console.error('Failed to resolve service request:', err);
    }
  };

  // Computed count of active non-completed, non-cancelled orders
  const activeOrdersCount = orders.filter(
    (o) => o.status === 'pending' || o.status === 'accepted' || o.status === 'preparing' || o.status === 'ready'
  ).length;

  return {
    orders,
    waiterCalls,
    isLoading,
    connectionStatus,
    isOnline,
    toggleOnline,
    viewMode,
    changeViewMode,
    soundMuted,
    toggleSound,
    printOrder,
    setPrintOrder,
    activeOrdersCount,
    acceptOrder,
    rejectOrder,
    markReady,
    markServed,
    dismissWaiterCall,
    refreshOrders: fetchOrders,
  };
}
