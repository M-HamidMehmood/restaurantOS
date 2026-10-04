'use client';

import React, { useState } from 'react';
import {
  Flame,
  PlusCircle,
  Filter,
  CheckCircle,
  Inbox,
  Volume2,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { useAdminOperations } from '@/hooks/useAdminOperations';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopBar } from './AdminTopBar';
import { WaiterAlertBanner } from './WaiterAlertBanner';
import { KanbanBoard } from './KanbanBoard';
import { CompactListView } from './CompactListView';
import { KotThermalTicket } from './KotThermalTicket';
import { RejectOrderModal } from './RejectOrderModal';
import { AdminOrder } from '@/types/admin';
import { toast } from 'sonner';

export function OperationsDashboard() {
  const {
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
    refreshOrders,
  } = useAdminOperations();

  // Selected order for rejection prompt modal
  const [rejectingOrder, setRejectingOrder] = useState<AdminOrder | null>(null);

  // Status Filter for Compact List view
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'preparing' | 'ready' | 'served'>('all');

  // Quick test simulation order (creates a realistic live order for demonstration & test purposes)
  const [isSimulating, setIsSimulating] = useState(false);
  const handleSimulateOrder = async () => {
    setIsSimulating(true);
    try {
      // Pick available tables that are not in billing finalization
      const safeTables = ['T-01', 'T-02', 'T-04', 'T-05', 'T-06', 'T-07', 'T-08'];
      const chosenTable = safeTables[Math.floor(Math.random() * safeTables.length)];

      const samplePayload = {
        tableId: chosenTable,
        items: [
          {
            menuItemId: 'c0000000-0000-0000-0000-000000000001',
            quantity: Math.floor(Math.random() * 2) + 1,
            selectedModifiers: [
              { id: 'd0000000-0000-0000-0000-000000000001', name: 'Cheddar Cheese Slice', priceExtra: 60 },
            ],
            notes: 'Extra crispy shami patty please',
          },
          {
            menuItemId: 'c0000000-0000-0000-0000-000000000007',
            quantity: 2,
            selectedModifiers: [],
            notes: 'Serve piping hot with jaggery',
          },
        ],
        notes: 'Table guest simulation test order',
      };

      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const res = await fetch(`${apiBase}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(samplePayload),
      });

      if (res.ok) {
        const data = await res.json().catch(() => null);
        const orderId = data?.data?.orderId || data?.orderId || '';
        toast.success(`Dispatched simulated order ${orderId ? `#${orderId} ` : ''}for Table ${chosenTable}! Live stream received.`);
        await refreshOrders();
      } else {
        const errorData = await res.json().catch(() => null);
        toast.error(errorData?.message || `Failed to dispatch order for Table ${chosenTable}`);
      }
    } catch (e: any) {
      toast.error(e?.message || 'Network error simulating order.');
    } finally {
      setIsSimulating(false);
    }
  };

  // Filtered orders for list view
  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') {
      return o.status === 'pending' || o.status === 'accepted' || o.status === 'preparing' || o.status === 'ready';
    }
    if (statusFilter === 'preparing') {
      return o.status === 'preparing' || o.status === 'accepted';
    }
    return o.status === statusFilter;
  });

  return (
    <div className="flex w-full min-h-screen">
      {/* Sidebar Navigation */}
      <AdminSidebar activeOrdersCount={activeOrdersCount} />

      {/* Main Operations Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-stone-100">
        {/* Top Status Bar */}
        <AdminTopBar
          isOnline={isOnline}
          onToggleOnline={toggleOnline}
          connectionStatus={connectionStatus}
          activeOrdersCount={activeOrdersCount}
          viewMode={viewMode}
          onChangeViewMode={changeViewMode}
          soundMuted={soundMuted}
          onToggleSound={toggleSound}
          onRefresh={refreshOrders}
          isLoading={isLoading}
        />

        {/* Dashboard Body */}
        <div className="p-6 md:p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
          {/* Active Waiter Call Alert Banner */}
          <WaiterAlertBanner calls={waiterCalls} onDismiss={dismissWaiterCall} />

          {/* Subheader: Feed Title, Filters, and Quick Simulation Trigger */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-stone-900 tracking-tight">
                  Live Orders & Kitchen Stream
                </h1>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium mt-0.5">
                Real-time incoming QR orders, kitchen ticket progression, and thermal KOT printing.
              </p>
            </div>

            {/* Quick Demo Simulator & Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {viewMode === 'list' && (
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-stone-200 text-xs font-semibold">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                      statusFilter === 'all' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    All ({orders.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('active')}
                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                      statusFilter === 'active' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    Active ({activeOrdersCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter('pending')}
                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                      statusFilter === 'pending' ? 'bg-amber-100 text-amber-900 font-bold' : 'text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => setStatusFilter('preparing')}
                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                      statusFilter === 'preparing' ? 'bg-indigo-100 text-indigo-900 font-bold' : 'text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    Cooking
                  </button>
                  <button
                    onClick={() => setStatusFilter('ready')}
                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                      statusFilter === 'ready' ? 'bg-emerald-100 text-emerald-900 font-bold' : 'text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    Ready
                  </button>
                </div>
              )}

              {/* Simulation button for pairing & end-to-end testing */}
              <button
                onClick={handleSimulateOrder}
                disabled={isSimulating}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-amber-50 text-stone-700 hover:text-amber-900 border border-stone-200 hover:border-amber-300 rounded-xl text-xs font-bold shadow-2xs transition-all active:scale-95 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Simulate Order</span>
              </button>
            </div>
          </div>

          {/* Offline Warning Banner if restaurant toggled offline */}
          {!isOnline && (
            <div className="p-4 bg-stone-800 text-white rounded-2xl flex items-center justify-between border border-stone-700">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <div>
                  <p className="font-bold text-xs">Kitchen Is Currently Offline</p>
                  <p className="text-[11px] text-stone-400">
                    New customer orders are temporarily disabled on customer mobile screens.
                  </p>
                </div>
              </div>
              <button
                onClick={toggleOnline}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-stone-950 text-xs font-bold rounded-xl transition-colors"
              >
                Go Online
              </button>
            </div>
          )}

          {/* Stream Views: Kanban Board or Compact List */}
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((col) => (
                <div key={col} className="bg-stone-100/60 rounded-2xl p-4 border border-stone-200 min-h-[400px] animate-pulse">
                  <div className="h-6 bg-stone-200 rounded-lg w-1/3 mb-4" />
                  <div className="space-y-3">
                    <div className="h-32 bg-stone-200 rounded-xl" />
                    <div className="h-32 bg-stone-200 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : viewMode === 'kanban' ? (
            <KanbanBoard
              orders={orders}
              onAccept={acceptOrder}
              onRejectPrompt={(order) => setRejectingOrder(order)}
              onMarkReady={markReady}
              onMarkServed={markServed}
              onPrintKot={(order) => setPrintOrder(order)}
            />
          ) : (
            <CompactListView
              orders={filteredOrders}
              onAccept={acceptOrder}
              onRejectPrompt={(order) => setRejectingOrder(order)}
              onMarkReady={markReady}
              onMarkServed={markServed}
              onPrintKot={(order) => setPrintOrder(order)}
            />
          )}
        </div>
      </main>

      {/* 80mm Thermal KOT Print Preview Modal */}
      <KotThermalTicket
        order={printOrder}
        isOpen={Boolean(printOrder)}
        onClose={() => setPrintOrder(null)}
      />

      {/* Reject Order Reason Prompt Modal */}
      <RejectOrderModal
        order={rejectingOrder}
        isOpen={Boolean(rejectingOrder)}
        onClose={() => setRejectingOrder(null)}
        onConfirm={rejectOrder}
      />
    </div>
  );
}
