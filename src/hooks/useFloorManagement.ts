'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  FloorTable,
  TableFloorStatus,
  OrderRound,
  AdminOrder,
  AdminOrderItem,
  WaiterCallAlert,
  BillSettlementDetails,
  StaffStreamEvent,
} from '@/types/admin';
import {
  playOrderChime,
  playWaiterAlert,
  playSettlementChime,
} from '@/lib/sound';
import { getSupabaseClient } from '@/lib/supabaseClient';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export function useFloorManagement() {
  const [tables, setTables] = useState<FloorTable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [selectedTable, setSelectedTable] = useState<FloorTable | null>(null);
  const [printBillData, setPrintBillData] = useState<BillSettlementDetails | null>(null);

  // Keep a ref to current tables for event synchronization
  const tablesRef = useRef<FloorTable[]>([]);
  tablesRef.current = tables;

  // Normalized helper to compare table numbers e.g. "T-01" vs "T-1" vs "table-1"
  const normalizeTableNo = (numOrSlug?: string): string => {
    if (!numOrSlug) return '';
    const clean = numOrSlug.toUpperCase().trim();
    const match = clean.match(/^T?-?0*(\d+)$/i);
    if (match) {
      return `T-${match[1].padStart(2, '0')}`;
    }
    return clean;
  };

  // Fetch all tables, active orders, and service requests to compute floor state
  const fetchFloorData = useCallback(async () => {
    try {
      // 1. Fetch tables
      const tablesRes = await fetch(`${API_BASE}/tables`);
      if (!tablesRes.ok) throw new Error('Failed to load tables');
      const tablesJson = await tablesRes.json();
      const rawTables: any[] = tablesJson.tables || [];

      // 2. Fetch active orders
      let activeOrders: AdminOrder[] = [];
      try {
        const ordersRes = await fetch(`${API_BASE}/admin/orders?active=true`);
        if (ordersRes.ok) {
          const ordersJson = await ordersRes.json();
          if (ordersJson.success && Array.isArray(ordersJson.data)) {
            activeOrders = ordersJson.data;
          }
        }
      } catch (err) {
        console.warn('Could not fetch active orders:', err);
      }

      // 3. Fetch active service requests
      let activeRequests: any[] = [];
      try {
        const reqRes = await fetch(`${API_BASE}/admin/service-requests`);
        if (reqRes.ok) {
          const reqJson = await reqRes.json();
          if (reqJson.success && Array.isArray(reqJson.data)) {
            activeRequests = reqJson.data;
          }
        }
      } catch (err) {
        console.warn('Could not fetch active service requests:', err);
      }

      // Group active orders by table
      const ordersByTable = new Map<string, AdminOrder[]>();
      for (const ord of activeOrders) {
        const key = normalizeTableNo(ord.tableNumber || ord.tableId);
        if (!ordersByTable.has(key)) {
          ordersByTable.set(key, []);
        }
        ordersByTable.get(key)!.push(ord);
      }

      // Map service requests by table
      const waiterCallsByTable = new Map<string, any>();
      const billRequestsByTable = new Map<string, any>();
      for (const req of activeRequests) {
        if (req.status === 'pending') {
          const key = normalizeTableNo(req.tableNumber || req.tableId);
          if (req.type === 'call_waiter') {
            waiterCallsByTable.set(key, req);
          } else if (req.type === 'bill_request') {
            billRequestsByTable.set(key, req);
          }
        }
      }

      // Build enriched FloorTable objects
      const enrichedTables: FloorTable[] = rawTables.map((tbl) => {
        const tableKey = normalizeTableNo(tbl.tableNumber);
        const tableOrders = ordersByTable.get(tableKey) || [];

        // Sort orders chronologically to establish distinct Round 1, Round 2...
        tableOrders.sort((a, b) => {
          const timeA = new Date(a.createdAt).getTime();
          const timeB = new Date(b.createdAt).getTime();
          return timeA - timeB;
        });

        // Convert orders into OrderRounds
        const rounds: OrderRound[] = tableOrders.map((ord, idx) => ({
          roundIndex: idx + 1,
          orderId: ord.id,
          createdAt: ord.createdAt,
          status: ord.status,
          items: ord.items || [],
          subtotal: ord.subtotal || ord.totalAmount,
          notes: ord.notes,
        }));

        // Running total across all active rounds
        const runningTotal = tableOrders.reduce((acc, ord) => acc + (ord.totalAmount || ord.subtotal || 0), 0);

        // Seated duration calculation
        const firstOrderTime = tableOrders.length > 0 ? tableOrders[0].createdAt : null;
        let seatedDurationMinutes = 0;
        if (firstOrderTime) {
          const elapsedMs = Math.max(0, Date.now() - new Date(firstOrderTime).getTime());
          seatedDurationMinutes = Math.floor(elapsedMs / (1000 * 60));
        }

        // Waiter call status (Red border flag)
        const waiterReq = waiterCallsByTable.get(tableKey);
        const billReq = billRequestsByTable.get(tableKey);

        // Determine live status
        let computedStatus: TableFloorStatus = 'available';
        if (tbl.status === 'bill_requested' || billReq) {
          computedStatus = 'bill_requested';
        } else if (tableOrders.length > 0 || tbl.status === 'occupied') {
          computedStatus = 'occupied';
        }

        return {
          id: tbl.id,
          tableNumber: tbl.tableNumber,
          qrSlug: tbl.qrSlug,
          displayName: tbl.displayName || `Table ${tbl.tableNumber.replace('T-', '')}`,
          capacity: tbl.capacity || 4,
          status: computedStatus,
          activeOrdersCount: tableOrders.length,
          runningTotal,
          firstOrderCreatedAt: firstOrderTime,
          seatedDurationMinutes,
          hasActiveWaiterCall: Boolean(waiterReq),
          waiterCallReason: waiterReq ? waiterReq.reason || waiterReq.customNote || 'Assistance requested' : undefined,
          waiterCallId: waiterReq ? waiterReq.id : undefined,
          billRequestedMethod: billReq ? billReq.paymentMethod || 'cash' : undefined,
          billRequestId: billReq ? billReq.id : undefined,
          rounds,
        };
      });

      setTables(enrichedTables);

      // Keep selectedTable in sync if drawer is open
      setSelectedTable((prev) => {
        if (!prev) return null;
        const updated = enrichedTables.find((t) => t.id === prev.id || t.tableNumber === prev.tableNumber);
        return updated || prev;
      });
    } catch (err) {
      console.error('Error fetching floor management data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Real-time synchronization via Supabase Realtime & SSE fallback
  useEffect(() => {
    fetchFloorData();

    let sseSource: EventSource | null = null;
    let realtimeChannel: any = null;

    // 1. Supabase Realtime Channel
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        realtimeChannel = supabase.channel('pos_staff', {
          config: { broadcast: { self: true } },
        });

        realtimeChannel
          .on('broadcast', { event: 'order:new' }, (payload: any) => {
            const data = payload.payload || payload.data;
            playOrderChime();
            toast.info(`New round ordered for Table ${data.tableNumber || data.tableId}!`, {
              icon: '🍲',
            });
            fetchFloorData();
          })
          .on('broadcast', { event: 'service:call_waiter' }, (payload: any) => {
            const data = payload.payload || payload.data;
            playWaiterAlert();
            toast.warning(`Table ${data.tableNumber || data.tableId} called waiter!`, {
              icon: '🔔',
            });
            fetchFloorData();
          })
          .on('broadcast', { event: 'service:bill_request' }, (payload: any) => {
            const data = payload.payload || payload.data;
            playOrderChime();
            toast.info(`Table ${data.tableNumber || data.tableId} requested bill settlement!`, {
              icon: '🧾',
            });
            fetchFloorData();
          })
          .on('broadcast', { event: 'table:settled' }, (payload: any) => {
            const data = payload.payload || payload.data;
            toast.success(`Table ${data.tableNumber} bill settled successfully!`, {
              icon: '✅',
            });
            fetchFloorData();
          })
          .subscribe((status: string) => {
            if (status === 'SUBSCRIBED') {
              setConnectionStatus('connected');
            } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
              setConnectionStatus('disconnected');
            }
          });
      }
    } catch (err) {
      console.warn('Supabase Realtime not available, falling back to SSE:', err);
    }

    // 2. Server-Sent Events (SSE) Stream
    try {
      sseSource = new EventSource(`${API_BASE}/admin/stream`);

      sseSource.onopen = () => {
        setConnectionStatus('connected');
      };

      sseSource.addEventListener('order:new', () => {
        playOrderChime();
        fetchFloorData();
      });

      sseSource.addEventListener('service:call_waiter', () => {
        playWaiterAlert();
        fetchFloorData();
      });

      sseSource.addEventListener('service:bill_request', () => {
        playOrderChime();
        fetchFloorData();
      });

      sseSource.addEventListener('table:settled', () => {
        fetchFloorData();
      });

      sseSource.onerror = () => {
        // SSE error or reconnection
        if (!realtimeChannel) {
          setConnectionStatus('disconnected');
        }
      };
    } catch (err) {
      console.warn('SSE fallback error:', err);
    }

    // Interval to refresh seated durations every 30 seconds
    const intervalTimer = setInterval(() => {
      setTables((prev) =>
        prev.map((t) => {
          if (!t.firstOrderCreatedAt) return t;
          const elapsedMs = Math.max(0, Date.now() - new Date(t.firstOrderCreatedAt).getTime());
          return {
            ...t,
            seatedDurationMinutes: Math.floor(elapsedMs / (1000 * 60)),
          };
        })
      );
    }, 30000);

    return () => {
      clearInterval(intervalTimer);
      if (sseSource) sseSource.close();
      if (realtimeChannel) {
        const supabase = getSupabaseClient();
        if (supabase) supabase.removeChannel(realtimeChannel);
      }
    };
  }, [fetchFloorData]);

  // Resolve pending waiter assistance call
  const resolveWaiterCall = useCallback(
    async (requestId: string, tableNumber?: string) => {
      try {
        const res = await fetch(`${API_BASE}/admin/service-requests/${requestId}/resolve`, {
          method: 'PATCH',
        });
        if (res.ok) {
          toast.success(`Waiter call for ${tableNumber || 'Table'} resolved`);
          setTables((prev) =>
            prev.map((t) =>
              t.waiterCallId === requestId
                ? { ...t, hasActiveWaiterCall: false, waiterCallId: undefined, waiterCallReason: undefined }
                : t
            )
          );
          if (selectedTable?.waiterCallId === requestId) {
            setSelectedTable((prev) =>
              prev ? { ...prev, hasActiveWaiterCall: false, waiterCallId: undefined, waiterCallReason: undefined } : null
            );
          }
        }
      } catch (err) {
        toast.error('Failed to resolve waiter call');
      }
    },
    [selectedTable]
  );

  // Settle table bill at POS & reset table to Available
  const settleTableSession = useCallback(
    async (settlement: BillSettlementDetails): Promise<boolean> => {
      try {
        const res = await fetch(`${API_BASE}/admin/tables/${settlement.tableId}/settle`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentMethod: settlement.paymentMethod,
            notes: settlement.notes
              ? `${settlement.notes} | Subtotal: Rs. ${settlement.itemsSubtotal}, Disc: Rs. ${settlement.discountAmount}, Tax: Rs. ${settlement.taxAmount}, Total: Rs. ${settlement.finalTotal}`
              : `Subtotal: Rs. ${settlement.itemsSubtotal}, Disc: Rs. ${settlement.discountAmount}, Tax: Rs. ${settlement.taxAmount}, Total: Rs. ${settlement.finalTotal}`,
          }),
        });

        if (res.ok) {
          playSettlementChime();
          toast.success(
            `Table ${settlement.tableNumber} bill settled: Rs. ${settlement.finalTotal.toLocaleString()} (${settlement.paymentMethod.toUpperCase()})`,
            { icon: '🧾' }
          );

          // Optimistically reset table to available in local state
          setTables((prev) =>
            prev.map((tbl) =>
              tbl.id === settlement.tableId || tbl.tableNumber === settlement.tableNumber
                ? {
                    ...tbl,
                    status: 'available',
                    activeOrdersCount: 0,
                    runningTotal: 0,
                    firstOrderCreatedAt: null,
                    seatedDurationMinutes: 0,
                    hasActiveWaiterCall: false,
                    waiterCallId: undefined,
                    waiterCallReason: undefined,
                    billRequestedMethod: undefined,
                    billRequestId: undefined,
                    rounds: [],
                  }
                : tbl
            )
          );

          // Re-fetch to ensure remote consistency
          setTimeout(() => {
            fetchFloorData();
          }, 800);

          return true;
        } else {
          const errData = await res.json().catch(() => ({}));
          toast.error(errData.message || 'Settlement failed. Please try again.');
          return false;
        }
      } catch (err) {
        console.error('Error settling table:', err);
        toast.error('Connection error while settling table.');
        return false;
      }
    },
    [fetchFloorData]
  );

  return {
    tables,
    isLoading,
    connectionStatus,
    selectedTable,
    setSelectedTable,
    printBillData,
    setPrintBillData,
    fetchFloorData,
    resolveWaiterCall,
    settleTableSession,
  };
}
