'use client';

import React from 'react';
import { ChefHat, Clock, CheckCircle2, Inbox } from 'lucide-react';
import { AdminOrder } from '@/types/admin';
import { OrderTicketCard } from './OrderTicketCard';

interface KanbanBoardProps {
  orders: AdminOrder[];
  onAccept: (orderId: string) => void;
  onRejectPrompt: (order: AdminOrder) => void;
  onMarkReady: (orderId: string) => void;
  onMarkServed: (orderId: string) => void;
  onPrintKot: (order: AdminOrder) => void;
}

export function KanbanBoard({
  orders,
  onAccept,
  onRejectPrompt,
  onMarkReady,
  onMarkServed,
  onPrintKot,
}: KanbanBoardProps) {
  // Partition orders by status
  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const inKitchenOrders = orders.filter((o) => o.status === 'accepted' || o.status === 'preparing');
  const readyOrders = orders.filter((o) => o.status === 'ready');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Column 1: Pending */}
      <div className="bg-stone-100/80 rounded-2xl p-4 border border-stone-200/80 flex flex-col min-h-[500px]">
        {/* Column Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <h2 className="font-extrabold text-sm text-stone-900 tracking-tight">Pending Review</h2>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-stone-950 font-black text-xs shadow-2xs">
            {pendingOrders.length}
          </span>
        </div>

        {/* Tickets List */}
        <div className="space-y-3.5 flex-1">
          {pendingOrders.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-stone-400">
              <Inbox className="w-8 h-8 stroke-1 mb-2 text-stone-300" />
              <p className="text-xs font-semibold text-stone-500">No pending orders</p>
              <p className="text-[11px] text-stone-400">Incoming QR orders will appear here</p>
            </div>
          ) : (
            pendingOrders.map((order) => (
              <OrderTicketCard
                key={order.id}
                order={order}
                onAccept={onAccept}
                onRejectPrompt={onRejectPrompt}
                onMarkReady={onMarkReady}
                onMarkServed={onMarkServed}
                onPrintKot={onPrintKot}
              />
            ))
          )}
        </div>
      </div>

      {/* Column 2: In Kitchen */}
      <div className="bg-stone-100/80 rounded-2xl p-4 border border-stone-200/80 flex flex-col min-h-[500px]">
        {/* Column Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <ChefHat className="w-4 h-4 text-indigo-600" />
            <h2 className="font-extrabold text-sm text-stone-900 tracking-tight">In Kitchen</h2>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white font-black text-xs shadow-2xs">
            {inKitchenOrders.length}
          </span>
        </div>

        {/* Tickets List */}
        <div className="space-y-3.5 flex-1">
          {inKitchenOrders.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-stone-400">
              <ChefHat className="w-8 h-8 stroke-1 mb-2 text-stone-300" />
              <p className="text-xs font-semibold text-stone-500">Kitchen is clear</p>
              <p className="text-[11px] text-stone-400">Accepted orders cooking on grill</p>
            </div>
          ) : (
            inKitchenOrders.map((order) => (
              <OrderTicketCard
                key={order.id}
                order={order}
                onAccept={onAccept}
                onRejectPrompt={onRejectPrompt}
                onMarkReady={onMarkReady}
                onMarkServed={onMarkServed}
                onPrintKot={onPrintKot}
              />
            ))
          )}
        </div>
      </div>

      {/* Column 3: Ready to Serve */}
      <div className="bg-stone-100/80 rounded-2xl p-4 border border-stone-200/80 flex flex-col min-h-[500px]">
        {/* Column Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h2 className="font-extrabold text-sm text-stone-900 tracking-tight">Ready to Serve</h2>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-black text-xs shadow-2xs">
            {readyOrders.length}
          </span>
        </div>

        {/* Tickets List */}
        <div className="space-y-3.5 flex-1">
          {readyOrders.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-stone-400">
              <CheckCircle2 className="w-8 h-8 stroke-1 mb-2 text-stone-300" />
              <p className="text-xs font-semibold text-stone-500">Pass counter is clear</p>
              <p className="text-[11px] text-stone-400">Plated dishes waiting for runner pickup</p>
            </div>
          ) : (
            readyOrders.map((order) => (
              <OrderTicketCard
                key={order.id}
                order={order}
                onAccept={onAccept}
                onRejectPrompt={onRejectPrompt}
                onMarkReady={onMarkReady}
                onMarkServed={onMarkServed}
                onPrintKot={onPrintKot}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
