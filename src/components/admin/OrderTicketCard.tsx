'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Printer,
  CheckCircle2,
  ChefHat,
  Check,
  X,
  AlertTriangle,
  Flame,
  MessageSquare,
} from 'lucide-react';
import { AdminOrder } from '@/types/admin';

interface OrderTicketCardProps {
  order: AdminOrder;
  onAccept: (orderId: string) => void;
  onRejectPrompt: (order: AdminOrder) => void;
  onMarkReady: (orderId: string) => void;
  onMarkServed: (orderId: string) => void;
  onPrintKot: (order: AdminOrder) => void;
}

export function OrderTicketCard({
  order,
  onAccept,
  onRejectPrompt,
  onMarkReady,
  onMarkServed,
  onPrintKot,
}: OrderTicketCardProps) {
  // Live elapsed time counter
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  useEffect(() => {
    const calculateElapsed = () => {
      const created = new Date(order.createdAt).getTime();
      const now = Date.now();
      const diffMinutes = Math.max(0, Math.floor((now - created) / 60000));
      setElapsedMinutes(diffMinutes);
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, [order.createdAt]);

  const isDelayed = elapsedMinutes >= 15;
  const isWarning = elapsedMinutes >= 10 && elapsedMinutes < 15;

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md flex flex-col justify-between ${
        isDelayed
          ? 'border-rose-300 ring-2 ring-rose-500/20 shadow-rose-100'
          : isWarning
          ? 'border-amber-300'
          : 'border-stone-200'
      }`}
    >
      {/* Ticket Header */}
      <div className="p-3.5 bg-stone-50 border-b border-stone-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Table Badge */}
          <span className="px-2.5 py-1 bg-stone-900 text-white font-black text-xs rounded-lg tracking-wide uppercase shadow-xs">
            {order.tableNumber}
          </span>
          <span className="text-xs font-mono font-bold text-stone-500">#{order.id}</span>
        </div>

        {/* Elapsed Timer & Total */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
              isDelayed
                ? 'bg-rose-600 text-white animate-pulse'
                : isWarning
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-stone-200/80 text-stone-700'
            }`}
          >
            {isDelayed ? (
              <AlertTriangle className="w-3 h-3 text-white" />
            ) : (
              <Clock className="w-3 h-3" />
            )}
            <span>{elapsedMinutes}m ago</span>
          </div>

          <span className="font-extrabold text-xs text-stone-900 bg-white px-2 py-0.5 rounded-md border border-stone-200">
            Rs. {order.totalAmount}
          </span>
        </div>
      </div>

      {/* Ticket Body: Line Items & Modifiers */}
      <div className="p-3.5 space-y-2.5 flex-1">
        <div className="space-y-2">
          {order.items.map((item, idx) => (
            <div key={idx} className="border-b border-stone-100 pb-2 last:border-0 last:pb-0">
              <div className="flex items-start justify-between text-xs font-bold text-stone-900">
                <div className="flex items-start gap-1.5">
                  <span className="bg-amber-100 text-amber-900 font-extrabold px-1.5 py-0.5 rounded-md text-[11px] min-w-[22px] text-center">
                    {item.quantity}x
                  </span>
                  <span>{item.name}</span>
                </div>
                <span className="text-stone-500 font-medium text-[11px]">
                  Rs. {item.totalPrice || item.unitPrice * item.quantity}
                </span>
              </div>

              {/* Modifier Tags */}
              {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1 pl-6">
                  {item.selectedModifiers.map((mod, mIdx) => (
                    <span
                      key={mIdx}
                      className="inline-block text-[10px] font-semibold bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded-md border border-stone-200"
                    >
                      + {mod.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Line Item Notes */}
              {item.notes && (
                <p className="mt-1 pl-6 text-[11px] text-amber-800 italic font-medium flex items-center gap-1">
                  <MessageSquare className="w-2.5 h-2.5 shrink-0" />
                  &quot;{item.notes}&quot;
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Highlighted Order Level Special Instructions */}
        {order.notes && (
          <div className="mt-2 p-2 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 font-semibold flex items-start gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold uppercase text-[10px] tracking-wider block text-amber-800">
                Special Request:
              </span>
              <span>{order.notes}</span>
            </div>
          </div>
        )}
      </div>

      {/* Ticket Action Pipeline Footer */}
      <div className="p-3 bg-stone-50/80 border-t border-stone-100 flex items-center justify-between gap-2">
        {/* Dedicated Print KOT Action */}
        <button
          onClick={() => onPrintKot(order)}
          title="Print Kitchen Order Ticket (80mm)"
          className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-200/70 rounded-xl border border-stone-200 transition-colors flex items-center gap-1 text-xs font-semibold"
        >
          <Printer className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">KOT</span>
        </button>

        {/* Status Pipeline Actions */}
        <div className="flex items-center gap-1.5 flex-1 justify-end">
          {order.status === 'pending' && (
            <>
              <button
                onClick={() => onRejectPrompt(order)}
                className="px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-all"
              >
                Reject
              </button>
              <button
                onClick={() => onAccept(order.id)}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold rounded-xl shadow-xs flex items-center gap-1 transition-all active:scale-95"
              >
                <ChefHat className="w-3.5 h-3.5" />
                Accept Order
              </button>
            </>
          )}

          {order.status === 'preparing' && (
            <button
              onClick={() => onMarkReady(order.id)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Mark Ready
            </button>
          )}

          {order.status === 'ready' && (
            <button
              onClick={() => onMarkServed(order.id)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-95 animate-pulse"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              Mark Delivered
            </button>
          )}

          {order.status === 'served' && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl">
              Delivered
            </span>
          )}

          {order.status === 'cancelled' && (
            <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-xl">
              Cancelled / Void
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
