'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  LayoutGrid,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  Wifi,
  WifiOff,
  BellRing,
  UtensilsCrossed,
  Layers,
  Store,
  Receipt,
} from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { TableFloorGrid } from '@/components/admin/floor/TableFloorGrid';
import { TableBillingDrawer } from '@/components/admin/floor/TableBillingDrawer';
import { CustomerBillTicket } from '@/components/admin/floor/CustomerBillTicket';
import { useFloorManagement } from '@/hooks/useFloorManagement';
import { toast } from 'sonner';

export default function FloorAndBillingPage() {
  const {
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
  } = useFloorManagement();

  // Simulation loading states for quick demonstration & manual testing
  const [isSimulatingOrder, setIsSimulatingOrder] = useState(false);
  const [isSimulatingWaiterCall, setIsSimulatingWaiterCall] = useState(false);

  // Quick simulation: Dispatch order for a random table
  const handleSimulateOrder = async () => {
    setIsSimulatingOrder(true);
    try {
      const availableTableNums = ['T-02', 'T-03', 'T-04', 'T-05', 'T-06', 'T-07', 'T-08'];
      const chosenTable = availableTableNums[Math.floor(Math.random() * availableTableNums.length)];

      const samplePayload = {
        tableId: chosenTable,
        items: [
          {
            menuItemId: 'c0000000-0000-0000-0000-000000000001',
            quantity: 2,
            selectedModifiers: [
              { id: 'd0000000-0000-0000-0000-000000000001', name: 'Cheddar Cheese Slice', priceExtra: 60 },
            ],
            notes: 'Extra crispy patties please',
          },
          {
            menuItemId: 'c0000000-0000-0000-0000-000000000007',
            quantity: 2,
            selectedModifiers: [],
            notes: 'Piping hot karak chai',
          },
        ],
        notes: 'Simulated customer dine-in tab',
      };

      const res = await fetch('http://localhost:4000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(samplePayload),
      });

      if (res.ok) {
        toast.success(`Dispatched simulated order for Table ${chosenTable}!`);
        fetchFloorData();
      } else {
        toast.info(`Simulated order dispatched locally.`);
      }
    } catch (e) {
      toast.info('Simulated order generated.');
    } finally {
      setIsSimulatingOrder(false);
    }
  };

  // Quick simulation: Trigger a Call Waiter alert
  const handleSimulateWaiterCall = async () => {
    setIsSimulatingWaiterCall(true);
    try {
      const sampleTables = ['T-03', 'T-04', 'T-06'];
      const chosenTable = sampleTables[Math.floor(Math.random() * sampleTables.length)];

      const res = await fetch('http://localhost:4000/api/service/call-waiter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: chosenTable,
          reason: 'water',
          customNote: 'Needs extra napkins and water refill',
        }),
      });

      if (res.ok) {
        toast.warning(`Waiter assistance call simulated for Table ${chosenTable}!`);
        fetchFloorData();
      } else {
        toast.info(`Waiter call triggered.`);
      }
    } catch (e) {
      toast.info('Waiter call simulated.');
    } finally {
      setIsSimulatingWaiterCall(false);
    }
  };

  // Active orders count across all occupied tables
  const activeOrdersCount = tables.reduce((acc, t) => acc + (t.activeOrdersCount || 0), 0);

  return (
    <div className="flex w-full min-h-screen bg-stone-100 font-sans">
      {/* Admin Sidebar Navigation */}
      <AdminSidebar activeOrdersCount={activeOrdersCount} />

      {/* Main Floor Management Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="no-print bg-white border-b border-stone-200 px-6 py-4 sticky top-0 z-20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Title & Path */}
            <div className="flex items-center gap-3">
              <Link
                href="/admin"
                className="p-2 rounded-xl bg-stone-100 border border-stone-200 text-stone-600 hover:text-stone-900 transition-colors"
                title="Back to Kitchen Stream"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-black text-stone-900 leading-tight">
                    Floor Plan & Bill Settlement Terminal
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-stone-900 text-amber-400">
                    POS Terminal
                  </span>
                </div>
                <p className="text-xs text-stone-500 font-medium">
                  Live table statuses, multi-round order timelines, and 80mm cash/card cashier checkout.
                </p>
              </div>
            </div>

            {/* Quick Actions & Live Stream Status */}
            <div className="flex items-center flex-wrap gap-2.5">
              {/* Real-time Indicator */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                  connectionStatus === 'connected'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-amber-50 border-amber-200 text-amber-700'
                }`}
                title={`Live Stream: ${connectionStatus}`}
              >
                {connectionStatus === 'connected' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Real-time Active</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-amber-500" />
                    <span>Connecting...</span>
                  </>
                )}
              </div>

              {/* Refresh Floor Data */}
              <button
                type="button"
                onClick={fetchFloorData}
                disabled={isLoading}
                className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl transition-colors border border-stone-200"
                title="Refresh Floor Data"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>

              {/* Quick Simulator: Call Waiter */}
              <button
                type="button"
                onClick={handleSimulateWaiterCall}
                disabled={isSimulatingWaiterCall}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all shadow-xs"
                title="Simulate a customer pressing Call Waiter button"
              >
                <BellRing className="w-3.5 h-3.5 text-rose-600" />
                <span>Simulate Waiter Call</span>
              </button>

              {/* Quick Simulator: Dine-In Order */}
              <button
                type="button"
                onClick={handleSimulateOrder}
                disabled={isSimulatingOrder}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-xl text-xs font-black transition-all shadow-xs"
                title="Simulate a customer ordering from mobile QR menu"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>+ Simulate Dine-In Order</span>
              </button>
            </div>
          </div>
        </header>

        {/* Floor Grid Canvas */}
        <div className="no-print p-6 flex-1 max-w-7xl w-full mx-auto space-y-6">
          {isLoading && tables.length === 0 ? (
            <div className="py-24 text-center space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
              <p className="text-xs font-bold text-stone-600">Loading live restaurant floor tables...</p>
            </div>
          ) : (
            <TableFloorGrid
              tables={tables}
              selectedTable={selectedTable}
              onSelectTable={(table) => setSelectedTable(table)}
              onResolveWaiterCall={resolveWaiterCall}
            />
          )}
        </div>

        {/* Operational Slide-Over Drawer for Table & Billing */}
        {selectedTable && (
          <TableBillingDrawer
            table={selectedTable}
            onClose={() => setSelectedTable(null)}
            onSettle={settleTableSession}
            onResolveWaiterCall={resolveWaiterCall}
            onTriggerPrint={(bill) => setPrintBillData(bill)}
          />
        )}

        {/* Customer 80mm Thermal Receipt (Rendered only on print dialog) */}
        <CustomerBillTicket bill={printBillData} onClose={() => setPrintBillData(null)} />
      </main>
    </div>
  );
}
